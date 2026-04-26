import { Component, signal } from '@angular/core';
import {
  UIDropdownComponent,
  UIDropdownItemComponent,
  UIDropdownSeparatorComponent,
  UIDropdownLabelComponent,
  UIDropdownGroupComponent
} from './ui-dropdown.component';

/**
 * Example 1: Basic Dropdown Menu
 */
@Component({
  selector: 'wn-basic-dropdown-example',
  standalone: true,
  imports: [
    UIDropdownComponent,
    UIDropdownItemComponent,
    UIDropdownSeparatorComponent,
    UIDropdownLabelComponent,
    UIDropdownGroupComponent
  ],
  template: `
    <ui-dropdown [triggerText]="'Open Menu'">
      <ui-dropdown-label>My Account</ui-dropdown-label>
      <ui-dropdown-separator />

      <ui-dropdown-group>
        <ui-dropdown-item
          [icon]="'👤'"
          [shortcut]="'⇧⌘P'"
          (selected)="handleProfile()"
        >
          Profile
        </ui-dropdown-item>

        <ui-dropdown-item [icon]="'⚙️'" (selected)="handleSettings()">
          Settings
        </ui-dropdown-item>

        <ui-dropdown-item [icon]="'💳'" (selected)="handleBilling()">
          Billing
        </ui-dropdown-item>
      </ui-dropdown-group>

      <ui-dropdown-separator />

      <ui-dropdown-item [variant]="'destructive'" (selected)="handleLogout()">
        Log out
      </ui-dropdown-item>
    </ui-dropdown>
  `
})
export class BasicDropdownExample {
  handleProfile() {
    console.log('Profile clicked');
  }

  handleSettings() {
    console.log('Settings clicked');
  }

  handleBilling() {
    console.log('Billing clicked');
  }

  handleLogout() {
    console.log('Logout clicked');
  }
}

/**
 * Example 2: Dropdown with State (Checkboxes)
 */
@Component({
  selector: 'wn-stateful-dropdown-example',
  standalone: true,
  imports: [
    UIDropdownComponent,
    UIDropdownItemComponent,
    UIDropdownSeparatorComponent,
    UIDropdownLabelComponent,
    UIDropdownGroupComponent
  ],
  template: `
    <ui-dropdown [triggerText]="'Appearance'">
      <ui-dropdown-label>Settings</ui-dropdown-label>

      <ui-dropdown-group>
        <ui-dropdown-item (selected)="toggleStatusBar()">
          {{ statusBar() ? '✓' : '○' }} Status Bar
        </ui-dropdown-item>

        <ui-dropdown-item (selected)="toggleActivityBar()">
          {{ activityBar() ? '✓' : '○' }} Activity Bar
        </ui-dropdown-item>

        <ui-dropdown-item (selected)="togglePanel()">
          {{ panel() ? '✓' : '○' }} Panel
        </ui-dropdown-item>
      </ui-dropdown-group>

      <ui-dropdown-separator />

      <ui-dropdown-item (selected)="reset()"> 🔄 Reset </ui-dropdown-item>
    </ui-dropdown>
  `
})
export class StatefulDropdownExample {
  statusBar = signal(true);
  activityBar = signal(false);
  panel = signal(false);

  toggleStatusBar() {
    this.statusBar.update((v) => !v);
  }

  toggleActivityBar() {
    this.activityBar.update((v) => !v);
  }

  togglePanel() {
    this.panel.update((v) => !v);
  }

  reset() {
    this.statusBar.set(false);
    this.activityBar.set(false);
    this.panel.set(false);
  }
}

/**
 * Example 3: Aligned Dropdown
 */
@Component({
  selector: 'wn-aligned-dropdown-example',
  standalone: true,
  imports: [UIDropdownComponent, UIDropdownItemComponent],
  template: `
    <div class="flex gap-4 justify-between w-full">
      <!-- Left aligned -->
      <ui-dropdown [triggerText]="'Left'" [align]="'start'">
        <ui-dropdown-item>Option 1</ui-dropdown-item>
        <ui-dropdown-item>Option 2</ui-dropdown-item>
      </ui-dropdown>

      <!-- Center aligned -->
      <ui-dropdown [triggerText]="'Center'" [align]="'center'">
        <ui-dropdown-item>Option 1</ui-dropdown-item>
        <ui-dropdown-item>Option 2</ui-dropdown-item>
      </ui-dropdown>

      <!-- Right aligned -->
      <ui-dropdown [triggerText]="'Right'" [align]="'end'">
        <ui-dropdown-item>Option 1</ui-dropdown-item>
        <ui-dropdown-item>Option 2</ui-dropdown-item>
      </ui-dropdown>
    </div>
  `
})
export class AlignedDropdownExample {}

/**
 * Example 4: Contextual Actions Dropdown
 */
@Component({
  selector: 'wn-actions-dropdown-example',
  standalone: true,
  imports: [
    UIDropdownComponent,
    UIDropdownItemComponent,
    UIDropdownSeparatorComponent,
    UIDropdownGroupComponent
  ],
  template: `
    <ui-dropdown [triggerText]="'Actions'">
      <ui-dropdown-group>
        <ui-dropdown-item [icon]="'✏️'" (selected)="handleEdit()">
          Edit
        </ui-dropdown-item>

        <ui-dropdown-item [icon]="'📋'" (selected)="handleDuplicate()">
          Duplicate
        </ui-dropdown-item>

        <ui-dropdown-item [icon]="'📤'" (selected)="handleShare()">
          Share
        </ui-dropdown-item>
      </ui-dropdown-group>

      <ui-dropdown-separator />

      <ui-dropdown-item
        [variant]="'destructive'"
        [icon]="'🗑️'"
        (selected)="handleDelete()"
      >
        Delete
      </ui-dropdown-item>
    </ui-dropdown>
  `
})
export class ActionsDropdownExample {
  handleEdit() {
    console.log('Edit clicked');
  }

  handleDuplicate() {
    console.log('Duplicate clicked');
  }

  handleShare() {
    console.log('Share clicked');
  }

  handleDelete() {
    console.log('Delete clicked');
  }
}

/**
 * Example 5: Full Featured Dropdown
 */
@Component({
  selector: 'wn-full-dropdown-example',
  standalone: true,
  imports: [
    UIDropdownComponent,
    UIDropdownItemComponent,
    UIDropdownSeparatorComponent,
    UIDropdownLabelComponent,
    UIDropdownGroupComponent
  ],
  template: `
    <ui-dropdown
      [triggerText]="'Menu'"
      [align]="'start'"
      (opened)="onMenuOpened()"
      (closed)="onMenuClosed()"
    >
      <ui-dropdown-label>Account</ui-dropdown-label>

      <ui-dropdown-group>
        <ui-dropdown-item
          [icon]="'👤'"
          [shortcut]="'⌘P'"
          (selected)="viewProfile()"
        >
          Profile
        </ui-dropdown-item>

        <ui-dropdown-item
          [icon]="'⚙️'"
          [shortcut]="'⌘S'"
          (selected)="openSettings()"
        >
          Settings
        </ui-dropdown-item>
      </ui-dropdown-group>

      <ui-dropdown-separator />

      <ui-dropdown-label>Team</ui-dropdown-label>

      <ui-dropdown-group>
        <ui-dropdown-item [icon]="'👥'" (selected)="viewTeam()">
          Team Members
        </ui-dropdown-item>

        <ui-dropdown-item [icon]="'➕'" (selected)="inviteUsers()">
          Invite Users
        </ui-dropdown-item>
      </ui-dropdown-group>

      <ui-dropdown-separator />

      <ui-dropdown-label>Danger Zone</ui-dropdown-label>

      <ui-dropdown-item
        [variant]="'destructive'"
        [icon]="'🚪'"
        (selected)="logout()"
      >
        Log out
      </ui-dropdown-item>
    </ui-dropdown>
  `
})
export class FullDropdownExample {
  onMenuOpened() {
    console.log('Menu opened');
  }

  onMenuClosed() {
    console.log('Menu closed');
  }

  viewProfile() {
    console.log('View profile');
  }

  openSettings() {
    console.log('Open settings');
  }

  viewTeam() {
    console.log('View team');
  }

  inviteUsers() {
    console.log('Invite users');
  }

  logout() {
    console.log('Logout');
  }
}

/**
 * Example 6: Using Native Spartan Components (When uiLibrary: 'spartan')
 *
 * Note: This requires Spartan to be installed and configured
 */
/*
import { Component } from '@angular/core';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  selector: 'wn-native-spartan-dropdown',
  standalone: true,
  imports: [HlmDropdownMenuImports, HlmButtonImports],
  template: `
    <button hlmBtn variant="outline" [hlmDropdownMenuTrigger]="menu">
      Open
    </button>

    <ng-template #menu>
      <hlm-dropdown-menu class="w-56">
        <hlm-dropdown-menu-label>My Account</hlm-dropdown-menu-label>
        <hlm-dropdown-menu-separator />
        
        <hlm-dropdown-menu-group>
          <button hlmDropdownMenuItem>
            Profile
            <hlm-dropdown-menu-shortcut>⇧⌘P</hlm-dropdown-menu-shortcut>
          </button>
          
          <button hlmDropdownMenuItem>
            Settings
            <hlm-dropdown-menu-shortcut>⌘S</hlm-dropdown-menu-shortcut>
          </button>
        </hlm-dropdown-menu-group>
        
        <hlm-dropdown-menu-separator />
        
        <button hlmDropdownMenuItem variant="destructive">
          Log out
        </button>
      </hlm-dropdown-menu>
    </ng-template>
  `
})
export class NativeSpartanDropdownExample {}
*/
