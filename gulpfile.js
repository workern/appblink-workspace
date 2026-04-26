const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const ROOT = path.resolve(__dirname);
const APPS_DIR = path.join(ROOT, 'angular/apps');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch (e) {
    return false;
  }
}

async function copyDir(src, dest) {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      // skip common large folders
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === '.git'
      )
        continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } else {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }
}

async function getNgApps() {
  const entries = await fs.readdir(APPS_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

function transformPaths(obj, appName) {
  if (typeof obj === 'string') {
    return obj
      .replace(new RegExp(`angular/apps/${appName}/`, 'g'), '')
      .replace(new RegExp(`angular/apps/${appName}`, 'g'), '');
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformPaths(item, appName));
  }

  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = transformPaths(value, appName);
    }
    return result;
  }

  return obj;
}

async function transformTsConfig(appName, destRoot) {
  const tsconfigPath = path.join(destRoot, 'tsconfig.json');

  if (await exists(tsconfigPath)) {
  const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, 'utf8'));

    // Update baseUrl to current directory
    if (tsconfig.compilerOptions) {
      tsconfig.compilerOptions.baseUrl = '.';

      // Update paths
      if (tsconfig.compilerOptions.paths) {
        const paths = tsconfig.compilerOptions.paths;

        // Replace @/* path
        if (paths['@/*']) {
          paths['@/*'] = ['./*'];
        }

        // Update @workern/* paths to use local libs folder
        for (const [key, value] of Object.entries(paths)) {
          if (key.startsWith('@workern/')) {
            paths[key] = value.map((p) =>
              p
                .replace('libs/', './libs/')
                .replace('angular/packages/', './angular/packages/')
            );
          }
        }
      }
    }

    await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
  }
}

async function generatePackageJson(appName, destRoot) {
  // Read root package.json
  const rootPackageJsonPath = path.join(ROOT, 'package.json');
  const rootPackageJson = JSON.parse(
    await fs.readFile(rootPackageJsonPath, 'utf8')
  );

  // Extract the short name (remove ng- prefix)
  const shortName = appName.replace(/^ng-/, '');

  // Get port for this app
  // const port = getPortForApp(appName);

  // Create package.json for the app
  const appPackageJson = {
    name: shortName,
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: `ng serve`,
      build: 'ng build',
      preview: 'ng serve --configuration=production',
      'serve:ssr:app': 'node dist/server/server.mjs'
    },
    dependencies: rootPackageJson.dependencies,
    devDependencies: {
      '@types/express': rootPackageJson.devDependencies['@types/express'],
      '@types/node': rootPackageJson.devDependencies['@types/node'],
      typescript: rootPackageJson.devDependencies['typescript'],
      vite: rootPackageJson.devDependencies['vite'],
      '@tailwindcss/postcss':
        rootPackageJson.devDependencies['@tailwindcss/postcss']
    }
  };

  const packageJsonPath = path.join(destRoot, 'package.json');
  await fs.writeFile(
    packageJsonPath,
    JSON.stringify(appPackageJson, null, 2),
    'utf8'
  );
}

async function buildApp(appName) {
  const appRoot = path.join(APPS_DIR, appName);
  const destRoot = path.join('builds', appName);

  console.log(`Building ${appName} -> ${destRoot}`);
  // remove dest if exists
  try {
    await fs.rm(destRoot, { recursive: true, force: true });
  } catch (e) {
    console.error(e);
  }

  // copy app contents (excluding node_modules/dist/.git)
  await copyDir(appRoot, destRoot);

  // ensure we didn't copy an inner dist or node_modules
  try {
    await fs.rm(path.join(destRoot, 'dist'), { recursive: true, force: true });
  } catch (e) {
    console.error(e);
  }
  try {
    await fs.rm(path.join(destRoot, 'node_modules'), {
      recursive: true,
      force: true
    });
  } catch (e) {
    console.error(e);
  }

  // copy root libs into the app dist
  const libsSrc = path.join(ROOT, 'libs');
  const libsDest = path.join(destRoot, 'libs');
  if (await exists(libsSrc)) {
    await copyDir(libsSrc, libsDest);
  }
  const angularPackagesSrc = path.join(ROOT, 'angular/packages');
  const angularPackagesDest = path.join(destRoot, 'angular/packages');
  if (await exists(angularPackagesSrc)) {
    await copyDir(angularPackagesSrc, angularPackagesDest);
  }

  // Convert project.json -> angular.json with path replacements
  const projectJsonSrc = path.join(appRoot, 'project.json');
  const projectJsonDest = path.join(destRoot, 'project.json');
  const angularJsonDest = path.join(destRoot, 'angular.json');

  if (await exists(projectJsonSrc)) {
    const projectJson = JSON.parse(await fs.readFile(projectJsonSrc, 'utf8'));

    // Transform Nx project.json to Angular CLI angular.json format
    const angularJson = {
      $schema: './node_modules/@angular/cli/lib/config/schema.json',
      version: 1,
      newProjectRoot: '',
      projects: {
        app: {
          projectType: projectJson.projectType || 'application',
          root: '',
          sourceRoot: 'src',
          prefix: projectJson.prefix || 'app',
          architect: {}
        }
      }
    };

    // Transform targets to architect
    if (projectJson.targets) {
      for (const [targetName, targetConfig] of Object.entries(
        projectJson.targets
      )) {
        const architectConfig = { ...targetConfig };

        // Replace executor with builder
        if (architectConfig.executor) {
          architectConfig.builder = architectConfig.executor;
          delete architectConfig.executor;
        }

        // Update all path references in options
        if (architectConfig.options) {
          architectConfig.options = transformPaths(
            architectConfig.options,
            appName
          );
        }

        // Update all path references in configurations
        if (architectConfig.configurations) {
          for (const [configName, configOptions] of Object.entries(
            architectConfig.configurations
          )) {
            architectConfig.configurations[configName] = transformPaths(
              configOptions,
              appName
            );
          }
        }

        // Update buildTarget references for serve/test targets
        if (architectConfig.configurations) {
          for (const config of Object.values(architectConfig.configurations)) {
            if (config.buildTarget) {
              config.buildTarget = config.buildTarget.replace(
                new RegExp(`^${projectJson.name}:`, 'g'),
                'app:'
              );
            }
          }
        }

        // Remove outputs field (not needed in angular.json)
        delete architectConfig.outputs;

        angularJson.projects.app.architect[targetName] = architectConfig;
      }
    }

    await fs.writeFile(
      angularJsonDest,
      JSON.stringify(angularJson, null, 2),
      'utf8'
    );

    // remove project.json from the dist copy if present
    if (await exists(projectJsonDest)) {
      try {
        await fs.rm(projectJsonDest, { force: true });
      } catch (e) {
        console.error(e);
      }
    }
  } else if (await exists(projectJsonDest)) {
    // If project.json was copied but no source project.json detected
    const projectJson = JSON.parse(await fs.readFile(projectJsonDest, 'utf8'));

    // Transform Nx project.json to Angular CLI angular.json format
    const angularJson = {
      $schema: './node_modules/@angular/cli/lib/config/schema.json',
      version: 1,
      newProjectRoot: '',
      projects: {
        app: {
          projectType: projectJson.projectType || 'application',
          root: '',
          sourceRoot: 'src',
          prefix: projectJson.prefix || 'app',
          architect: {}
        }
      }
    };

    // Transform targets to architect
    if (projectJson.targets) {
      for (const [targetName, targetConfig] of Object.entries(
        projectJson.targets
      )) {
        const architectConfig = { ...targetConfig };

        // Replace executor with builder
        if (architectConfig.executor) {
          architectConfig.builder = architectConfig.executor;
          delete architectConfig.executor;
        }

        // Update all path references in options
        if (architectConfig.options) {
          architectConfig.options = transformPaths(
            architectConfig.options,
            appName
          );
        }

        // Update all path references in configurations
        if (architectConfig.configurations) {
          for (const [configName, configOptions] of Object.entries(
            architectConfig.configurations
          )) {
            architectConfig.configurations[configName] = transformPaths(
              configOptions,
              appName
            );
          }
        }

        // Update buildTarget references for serve/test targets
        if (architectConfig.configurations) {
          for (const config of Object.values(architectConfig.configurations)) {
            if (config.buildTarget) {
              config.buildTarget = config.buildTarget.replace(
                new RegExp(`^${projectJson.name}:`, 'g'),
                'app:'
              );
            }
          }
        }

        // Remove outputs field (not needed in angular.json)
        delete architectConfig.outputs;

        angularJson.projects.app.architect[targetName] = architectConfig;
      }
    }

    await fs.writeFile(
      angularJsonDest,
      JSON.stringify(angularJson, null, 2),
      'utf8'
    );
    try {
      await fs.rm(projectJsonDest, { force: true });
    } catch (e) {
      console.error(e);
    }
  }

  // Generate package.json
  await generatePackageJson(appName, destRoot);

  // Transform tsconfig.json paths
  await transformTsConfig(appName, destRoot);

  console.log(`Finished building ${appName}`);
}

function getNgAppsSync() {
  try {
    return fsSync
      .readdirSync(APPS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch (e) {
    return [];
  }
}

async function buildAllNg() {
  const apps = await getNgApps();
  for (const app of apps) {
    await buildApp(app);
  }
}

function killPort(port, done) {
  exec(`lsof -t -i:${port} | xargs kill -9`, (err, stdout, stderr) => {
    if (err) {
      console.log(`Error killing port ${port}: ${stderr}`);
      done(err);
    } else {
      done();
    }
  });
}

exports['kill-ports'] = (done) => {
  const ports = [9100, 5001, 8081, 9001, 5003, 4002]; // Add the ports you want to kill here

  // Run the killPort function for each port
  ports.forEach((port) => {
    killPort(port, (err) => {
      if (err) {
        console.error(`Failed to kill processes on port ${port}`);
      }
    });
  });
  done();
};

// Analyze Flutter apps and packages for syntax errors
async function analyzeFlutter() {
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  console.log('🔍 Analyzing Flutter packages and apps...\n');

  // Dynamically discover all Flutter packages
  const packagesDir = path.join(ROOT, 'flutter/packages');
  const appsDir = path.join(ROOT, 'flutter/apps');

  const flutterDirs = [];

  // Add all packages
  if (await exists(packagesDir)) {
    const packages = await fs.readdir(packagesDir, { withFileTypes: true });
    for (const pkg of packages) {
      if (pkg.isDirectory() && !pkg.name.startsWith('.')) {
        flutterDirs.push(`flutter/packages/${pkg.name}`);
      }
    }
  }

  // Add all apps
  if (await exists(appsDir)) {
    const apps = await fs.readdir(appsDir, { withFileTypes: true });
    for (const app of apps) {
      if (app.isDirectory() && !app.name.startsWith('.')) {
        flutterDirs.push(`flutter/apps/${app.name}`);
      }
    }
  }

  let hasErrors = false;

  for (const dir of flutterDirs) {
    const fullPath = path.join(ROOT, dir);
    if (await exists(fullPath)) {
      console.log(`📦 Analyzing ${dir}...`);
      try {
        const { stdout, stderr } = await execAsync(
          'flutter analyze --no-fatal-infos --no-fatal-warnings',
          { cwd: fullPath }
        );
        if (stdout) console.log(stdout);
        if (stderr && stderr.includes('error')) {
          console.error(stderr);
          hasErrors = true;
        }
      } catch (error) {
        console.error(`❌ Errors found in ${dir}`);
        console.error(error.stdout || error.message);
        hasErrors = true;
      }
      console.log('');
    }
  }

  if (hasErrors) {
    throw new Error('Flutter analysis found errors');
  } else {
    console.log('✅ All Flutter packages and apps passed analysis');
  }
}

exports['analyze:flutter'] = analyzeFlutter;
exports['build:ng'] = buildAllNg;

// Auto-register a build:ng-{appName} task for every folder in angular/apps/
for (const app of getNgAppsSync()) {
  exports[`build:ng-${app}`] = () => buildApp(app);
}

exports.default = async function defaultTask() {
  const apps = getNgAppsSync();
  console.log('Available build tasks:');
  for (const app of apps) {
    console.log(`  gulp build:ng-${app}`);
  }
  console.log('  gulp build:ng  (builds all ng apps)');
};
