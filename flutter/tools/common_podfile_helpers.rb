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
#     end
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
    else
      config.build_settings['SWIFT_COMPILATION_MODE'] = 'wholemodule'
    end

    config.build_settings['HEADER_SEARCH_PATHS'] ||= ['$(inherited)']
    config.build_settings['HEADER_SEARCH_PATHS'] << '"$(PODS_ROOT)/abseil"'
    config.build_settings['HEADER_SEARCH_PATHS'] << '"$(PODS_ROOT)/gRPC-Core/include"'
    config.build_settings['HEADER_SEARCH_PATHS'] << '"$(PODS_ROOT)/gRPC-C++/include"'
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
