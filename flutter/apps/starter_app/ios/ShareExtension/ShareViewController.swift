import UIKit

/// ShareViewController for Starter App.
/// Subclasses FSIShareViewController which handles storing shared content
/// in the App Group UserDefaults and redirecting back to the main app.
///
/// NOTE: Before this works you must:
/// 1. In Xcode → File → New → Target → Share Extension (name it "ShareExtension")
/// 2. Add App Groups capability to BOTH Runner and ShareExtension targets
///    - Group name: group.com.workern.starterApp  (or your bundle ID variant)
/// 3. Add User-Defined build setting CUSTOM_GROUP_ID = group.com.workern.starterApp
///    in BOTH targets
/// 4. Replace the generated ShareViewController.swift with this file
class ShareViewController: FSIShareViewController {
    override func isContentValid() -> Bool {
        return true
    }
}
