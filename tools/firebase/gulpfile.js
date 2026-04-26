const gulp = require("gulp");
var argv = require("yargs").argv;
var exec = require("child_process").exec;
const execSync = require("child_process").execSync;
gulp.task(
    "default",
    gulp.series(createModule, getModelTasks, getComponentTasks)
);

gulp.task("update-rtdb", gulp.series(getRtdbTasks));

async function getRtdbTasks() {
    const rtdbFolder = "./rtdb_data/metadata/";
    const fs = require("fs");
    let pathsToUpdate = [];
    fs.readdirSync(rtdbFolder).forEach((file) => {
        if (file.indexOf(".json") > -1) pathsToUpdate.push("metadata/" + file);
        else {
            fs.readdirSync(rtdbFolder + file + "/").forEach((subFile) => {
                if (subFile.indexOf(".json"))
                    pathsToUpdate.push("metadata/" + file + "/" + subFile);
            });
        }
    });
    console.log(__dirname);
    pathsToUpdate.map((path) => {
        let command =
            "firebase database:set /" +
            path.substring(0, path.indexOf(".json")) +
            " " +
            "./rtdb_data/" +
            path +
            " --confirm --debug";
        console.log(command);
        return exec(command, function(err, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);

            return true;
        });
    });
}

function getModelTasks() {
    let projectTypeName = argv["name"];
    if (projectTypeName != null) {
        return exec(
            "ng generate class " +
            projectTypeName +
            "Project /models --skipTests=true",
            function(err, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);

                return true;
            }
        );
    }
}

function createModule() {
    let projectTypeName2 = argv["name"];
    if (projectTypeName2 != null) {
        return exec(
            "ng g m project-types/" + projectTypeName2 + " --routing",
            function(err, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);
                return true;
            }
        );
    }
}

function executeCommand(command) {
    try {
        execSync(command, { stdio: "inherit" });
    } catch (error) {
        console.log(error);
    }
}

async function getComponentTasks(projectTypeName) {
    let projectTypeName3 = argv["name"];
    if (projectTypeName3 != null) {
        var components = ["project-creator", "details", "editor", "viewer", "work"];
        return components.forEach((name) =>
            exec(
                "ng g c project-types/" +
                projectTypeName3 +
                "/" +
                projectTypeName3 +
                "-" +
                name,
                function(err, stdout, stderr) {
                    console.log(stdout);
                    console.log(stderr);
                    return true;
                }
            )
        );
    }
}

function startEmulators(cb) {
    execSync(
        "firebase emulators:start --only functions,ui --import ./fbase_emulators_data --export-on-exit ./fbase_emulators_data", { stdio: "inherit" }
    );
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
  

gulp.task('kill-ports', (done) => {
    const ports = [9100, 5001, 8081,9001,5003,4002];  // Add the ports you want to kill here
  
    // Run the killPort function for each port
    ports.forEach((port) => {
      killPort(port, (err) => {
        if (err) {
          console.error(`Failed to kill processes on port ${port}`);
        } 
      });
    });
  
    done();
  });
