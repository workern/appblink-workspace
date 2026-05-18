# Shared Podfile helpers for all Workern Flutter apps.
# Usage in each app's Podfile post_install block:
#
#   require File.expand_path('../../../tools/common_podfile_helpers', __FILE__)
#
#   post_install do |installer|
#     installer.pods_project.targets.each do |target|
#       flutter_additional_ios_build_settings(target)
#       workern_apply_common_build_settings(target)
#       workern_apply_firebase_functions_fix(target)
#       workern_apply_ccache(target)
#     end
#     workern_fix_script_phase_warnings(installer)
#   end

# Apply common build settings to every pod target.
def workern_apply_common_build_settings(target)
  target.build_configurations.each do |config|
    config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
    config.build_settings['APPLICATION_EXTENSION_API_ONLY'] = 'NO'
    config.build_settings['COMPILER_INDEX_STORE_ENABLE'] = 'NO'
    config.build_settings['ALWAYS_SEARCH_USER_PATHS'] = 'NO'
    config.build_settings['SWIFT_ENABLE_BATCH_MODE'] = 'YES'
    config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'NO'
    # Xcode 15+ sandboxes Run Script phases by default, adding per-script overhead.
    # Pod script phases don't need sandboxing — they run in the build system context.
    config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'

    if config.name == 'Debug'
      config.build_settings['DEBUG_INFORMATION_FORMAT'] = 'dwarf'
      config.build_settings['SWIFT_COMPILATION_MODE'] = 'incremental'
      config.build_settings['SWIFT_OPTIMIZATION_LEVEL'] = '-Onone'
      # Don't embed DWARF debug info inside precompiled module (.pcm) files.
      # Speeds up module cache validation on incremental builds.
      # Per Apple's incremental build guide: reduce compiler workload each cycle.
      config.build_settings['CLANG_ENABLE_MODULE_DEBUGGING'] = 'NO'
      # Only compile for the active arch in Debug — no multi-arch fat binary needed for dev.
      config.build_settings['ONLY_ACTIVE_ARCH'] = 'YES'
      # Skip C/ObjC optimisation passes in Debug — reduces compile time noticeably for
      # pods with heavy ObjC/C code (e.g. SDWebImage, Realm, RxSwift).
      config.build_settings['GCC_OPTIMIZATION_LEVEL'] = '0'
    else
      config.build_settings['SWIFT_COMPILATION_MODE'] = 'wholemodule'
    end

    config.build_settings['HEADER_SEARCH_PATHS'] ||= ['$(inherited)']
    config.build_settings['HEADER_SEARCH_PATHS'] << '"$(PODS_ROOT)/abseil"'
  end
end

# Fix pod script phases that declare no outputs, causing Xcode to re-run them on every
# incremental build. Per Apple's guide: scripts without declared outputs are always re-run.
# We append a `touch` to the script body and register a sentinel as its output so Xcode
# can skip the script when neither its inputs (Manifest.lock) nor its outputs have changed.
#
# Affected pods: abseil, BoringSSL-GRPC, gRPC-Core, gRPC-C++ — all have a
# 'Create Symlinks to Header Folders' phase with zero declared outputs.
WORKERN_SYMLINK_PHASE_TARGETS = %w[abseil BoringSSL-GRPC gRPC-Core gRPC-C++].freeze

def workern_fix_script_phase_warnings(installer)
  installer.pods_project.targets.each do |target|
    next unless WORKERN_SYMLINK_PHASE_TARGETS.include?(target.name)

    target.build_phases.each do |phase|
      next unless phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
      next unless phase.name == 'Create Symlinks to Header Folders'
      next unless phase.output_paths.empty?

      sentinel = "$(DERIVED_FILE_DIR)/#{target.name}-symlinks-sentinel"
      # Register Manifest.lock as input so the script re-runs after `pod install`.
      phase.input_paths = ['$(PODS_ROOT)/Manifest.lock'] if phase.input_paths.empty?
      phase.output_paths = [sentinel]
      # Append sentinel creation so Xcode finds the declared output after the script runs.
      phase.shell_script = phase.shell_script.to_s +
        "\ntouch \"${DERIVED_FILE_DIR}/#{target.name}-symlinks-sentinel\"\n"

      puts "Fixed 'Create Symlinks to Header Folders' for #{target.name} (incremental build skip)."
    end
  end
end

# Workaround for FirebaseFunctions release-build crash (Swift async let teardown regression).
# HTTPSCallable.call() crashes under -O wholemodule optimization in FirebaseFunctions 12.8–12.11.
# Fixed upstream in Firebase iOS SDK 12.12.0. Remove this once FlutterFire ships that version.
# See: https://github.com/firebase/firebase-ios-sdk/pull/15974
def workern_apply_firebase_functions_fix(target)
  return unless target.name == 'FirebaseFunctions'

  target.build_configurations.each do |config|
    next unless config.name == 'Release'

    config.build_settings['SWIFT_OPTIMIZATION_LEVEL'] = '-Onone'
    puts "Applied -Onone fix to #{target.name} for Swift async let regression."
  end
end

# Use precompiled Firestore XCFrameworks instead of building ~500k lines of C++ from source.
# Reduces cold Xcode build time from ~240s → ~45s locally and ~551s → ~174s on CI.
# See: https://github.com/invertase/firestore-ios-sdk-frameworks
#
# Version is auto-detected: pubspec.lock → firebase_core pub cache → firebase_sdk_version!
# Tag is resolved to a commit SHA and cached in .firestore_commit_cache so CocoaPods uses
# :commit => instead of :tag =>, making subsequent pod installs fully offline/instant.
# (The invertase repo uses annotated tags; CocoaPods can't dereference them without a fetch.)

FIREBASE_IOS_SDK_VERSION_FALLBACK = '12.12.0'.freeze
FIRESTORE_GIT_URL = 'https://github.com/invertase/firestore-ios-sdk-frameworks.git'.freeze
# Stored next to this file so all apps in the monorepo share the resolved SHAs.
FIRESTORE_COMMIT_CACHE_PATH = File.join(__dir__, '.firestore_commit_cache').freeze

def workern_detect_firebase_sdk_version
  # Podfiles live at <app>/ios/Podfile.
  # With a melos workspace the lock is at the workspace root (flutter/pubspec.lock),
  # three levels up from ios/. Fall back to the app-level lock for non-workspace setups.
  workspace_lock_path = File.expand_path('../../../pubspec.lock', Dir.pwd)
  app_lock_path       = File.expand_path('../pubspec.lock', Dir.pwd)
  pubspec_lock_path   = File.exist?(workspace_lock_path) ? workspace_lock_path : app_lock_path

  unless File.exist?(pubspec_lock_path)
    warn "[workern] pubspec.lock not found, using fallback #{FIREBASE_IOS_SDK_VERSION_FALLBACK}"
    return FIREBASE_IOS_SDK_VERSION_FALLBACK
  end

  content = File.read(pubspec_lock_path)
  match = content.match(/^  firebase_core:\n(?:.*\n)*?.*version: "([^"]+)"/)
  unless match
    warn "[workern] firebase_core not found in pubspec.lock, using fallback #{FIREBASE_IOS_SDK_VERSION_FALLBACK}"
    return FIREBASE_IOS_SDK_VERSION_FALLBACK
  end
  firebase_core_version = match[1]

  pub_cache = ENV.fetch('PUB_CACHE', File.join(Dir.home, '.pub-cache'))
  sdk_version_rb = File.join(pub_cache, 'hosted', 'pub.dev',
                             "firebase_core-#{firebase_core_version}",
                             'ios', 'firebase_sdk_version.rb')

  unless File.exist?(sdk_version_rb)
    warn "[workern] #{sdk_version_rb} not found, using fallback #{FIREBASE_IOS_SDK_VERSION_FALLBACK}"
    return FIREBASE_IOS_SDK_VERSION_FALLBACK
  end

  require sdk_version_rb
  version = firebase_sdk_version!
  puts "[workern] Detected Firebase iOS SDK #{version} (firebase_core #{firebase_core_version})"
  version
rescue => e
  warn "[workern] Could not detect Firebase iOS SDK version (#{e.message}), using fallback"
  FIREBASE_IOS_SDK_VERSION_FALLBACK
end

def workern_load_commit_cache
  return {} unless File.exist?(FIRESTORE_COMMIT_CACHE_PATH)

  File.read(FIRESTORE_COMMIT_CACHE_PATH).lines.each_with_object({}) do |line, h|
    tag, sha = line.strip.split(':', 2)
    h[tag] = sha if tag && sha =~ /\A[a-f0-9]{40}\z/
  end
end

def workern_save_commit_cache(cache)
  File.write(FIRESTORE_COMMIT_CACHE_PATH,
             cache.map { |k, v| "#{k}:#{v}" }.sort.join("\n") + "\n")
rescue => e
  warn "[workern] Could not write commit cache: #{e.message}"
end

def workern_resolve_firestore_commit(version)
  cache = workern_load_commit_cache
  return cache[version] if cache.key?(version)

  # Dereference the annotated tag to its underlying commit SHA.
  # refs/tags/TAG^{} peels the tag object to the commit it wraps.
  # This is a single lightweight ls-remote call (~200ms), not a full clone.
  puts "[workern] Resolving #{version} → commit SHA (one-time per version)..."
  sha = `git ls-remote --quiet "#{FIRESTORE_GIT_URL}" "refs/tags/#{version}^{}" 2>/dev/null`.split.first
  # Fallback for lightweight tags (not annotated)
  sha = `git ls-remote --quiet "#{FIRESTORE_GIT_URL}" "refs/tags/#{version}" 2>/dev/null`.split.first \
    if sha.nil? || sha.empty?

  return nil if sha.nil? || sha.empty?

  cache[version] = sha
  workern_save_commit_cache(cache)
  puts "[workern] Cached #{version} → #{sha[0..7]}... (future installs will be offline)"
  sha
rescue => e
  warn "[workern] Commit resolution failed: #{e.message}"
  nil
end

def workern_install_firestore_binary
  version = workern_detect_firebase_sdk_version
  commit  = workern_resolve_firestore_commit(version)

  if commit && !commit.empty?
    # :commit => locks the exact SHA — CocoaPods uses the pod cache offline on all future runs.
    pod 'FirebaseFirestore', :git => FIRESTORE_GIT_URL, :commit => commit
  else
    # Network unavailable or tag unresolvable — fall back to :tag (will re-fetch each time).
    warn "[workern] Falling back to :tag => '#{version}' (commit resolution failed)"
    pod 'FirebaseFirestore', :git => FIRESTORE_GIT_URL, :tag => version
  end
end

# Route C/C++ compilation through ccache so compiled object files are cached on disk.
# On repeat cold builds (after flutter clean, DerivedData wipe, or CI), gRPC-C++,
# abseil, and BoringSSL are served from cache instead of recompiled from source.
# Expected impact: cold build drops from ~15–20 min → ~2–3 min once cache is warm.
#
# Prerequisites: `brew install ccache` on the machine running the build.
# Cache location: ~/.ccache (default, ~5GB max by default)
# Support both Intel (/usr/local) and Apple Silicon (/opt/homebrew) Homebrew paths.
CCACHE_PATH = ['/opt/homebrew/opt/ccache/libexec', '/usr/local/opt/ccache/libexec']
              .find { |p| File.exist?("#{p}/clang") }

def workern_apply_ccache(target)
  return unless CCACHE_PATH

  ccache_cc  = "#{CCACHE_PATH}/clang"
  ccache_cxx = "#{CCACHE_PATH}/clang++"

  target.build_configurations.each do |config|
    config.build_settings['CC']   = ccache_cc
    config.build_settings['CXX']  = ccache_cxx
    # Route Objective-C / Objective-C++ through ccache too (most pod sources are .m)
    config.build_settings['OBJC']    = ccache_cc
    config.build_settings['OBJCXX']  = ccache_cxx
    # Do NOT set LD/LDPLUSPLUS — ccache is a compiler cache, not a linker wrapper

    # Xcode 15+ explicit modules require libclang.dylib to be co-located with CC.
    # When CC is ccache's clang shim, Xcode can't find libclang.dylib and emits
    # "could not resolve libclang.dylib" once per source file across all 124 targets,
    # then falls back to implicit modules anyway. Ccache and explicit modules are
    # fundamentally incompatible (ccache hashes the full command line; explicit modules
    # change it on every run). Disabling explicit modules eliminates the per-file
    # warnings and avoids the failed-resolution overhead.
    config.build_settings['CLANG_ENABLE_EXPLICIT_MODULES'] = 'NO'
  end
end
