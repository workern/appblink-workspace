fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios archive

```sh
[bundle exec] fastlane ios archive
```

Build archive only (slow, first time - compiles all pods)

### ios flutter_archive

```sh
[bundle exec] fastlane ios flutter_archive
```

Rebuild archive with Flutter (fast, for code changes)

### ios export

```sh
[bundle exec] fastlane ios export
```

Export IPA from existing archive (fast)

### ios build

```sh
[bundle exec] fastlane ios build
```

Build iOS IPA (does both archive + export)

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Upload to TestFlight

### ios beta_with_metadata_fast

```sh
[bundle exec] fastlane ios beta_with_metadata_fast
```

Upload to TestFlight with Metadata (fast, uses existing archive)

### ios release

```sh
[bundle exec] fastlane ios release
```

Upload to App Store for Review

### ios release_fast

```sh
[bundle exec] fastlane ios release_fast
```

Upload to App Store for Review (fast, uses existing archive)

### ios release_with_metadata

```sh
[bundle exec] fastlane ios release_with_metadata
```

Upload to App Store for Review with Metadata

### ios release_with_metadata_fast

```sh
[bundle exec] fastlane ios release_with_metadata_fast
```

Upload to App Store for Review with Metadata (fast, uses existing archive)

### ios production

```sh
[bundle exec] fastlane ios production
```

Upload to App Store and Auto-Release

### ios production_fast

```sh
[bundle exec] fastlane ios production_fast
```

Upload to App Store and Auto-Release (fast, uses existing archive)

### ios production_with_metadata

```sh
[bundle exec] fastlane ios production_with_metadata
```

Upload to App Store and Auto-Release with Metadata

### ios production_with_metadata_fast

```sh
[bundle exec] fastlane ios production_with_metadata_fast
```

Upload to App Store and Auto-Release with Metadata (fast, uses existing archive)

### ios upload

```sh
[bundle exec] fastlane ios upload
```

Just upload IPA without building

### ios screenshots

```sh
[bundle exec] fastlane ios screenshots
```

Capture iOS screenshots from simulators using Snapshot

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
