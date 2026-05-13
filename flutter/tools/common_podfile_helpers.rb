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

    if config.name == 'Debug'
      config.build_settings['DEBUG_INFORMATION_FORMAT'] = 'dwarf'
      config.build_settings['SWIFT_COMPILATION_MODE'] = 'incremental'
      config.build_settings['SWIFT_OPTIMIZATION_LEVEL'] = '-Onone'
      # Don't embed DWARF debug info inside precompiled module (.pcm) files.
      # Speeds up module cache validation on incremental builds.
      # Per Apple's incremental build guide: reduce compiler workload each cycle.
      config.build_settings['CLANG_ENABLE_MODULE_DEBUGGING'] = 'NO'
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

# Route C/C++ compilation through ccache so compiled object files are cached on disk.
# On repeat cold builds (after flutter clean, DerivedData wipe, or CI), gRPC-C++,
# abseil, and BoringSSL are served from cache instead of recompiled from source.
# Expected impact: cold build drops from ~15–20 min → ~2–3 min once cache is warm.
#
# Prerequisites: `brew install ccache` on the machine running the build.
# Cache location: ~/.ccache (default, ~5GB max by default)
CCACHE_PATH = '/usr/local/opt/ccache/libexec'.freeze

def workern_apply_ccache(target)
  ccache_cc  = "#{CCACHE_PATH}/clang"
  ccache_cxx = "#{CCACHE_PATH}/clang++"
  return unless File.exist?(ccache_cc)

  target.build_configurations.each do |config|
    config.build_settings['CC']  = ccache_cc
    config.build_settings['CXX'] = ccache_cxx
    config.build_settings['LD']  = ccache_cc
    config.build_settings['LDPLUSPLUS'] = ccache_cxx
  end
end
