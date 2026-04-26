import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  computed,
  signal,
  TemplateRef,
  ViewChild,
  contentChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalManagerService, UIAdapterService } from '@workern/services';

/**
 * Universal Dropdown Menu Component
 *
 * This component automatically adapts to the UI library configured in GlobalManagerService.
 *
 * Supported Libraries:
 * - Spartan: Uses HlmDropdownMenu directives
 * - Material: Uses MatMenu
 * - PrimeNG: Uses p-menu
 * - Custom: Uses Tailwind-based dropdown
 *
 * Usage:
 * ```html
 * <ui-dropdown [triggerText]="'Open Menu'">
 *   <ui-dropdown-item (selected)="handleProfile()">
 *     Profile
 *   </ui-dropdown-item>
 *   <ui-dropdown-separator />
 *   <ui-dropdown-item (selected)="handleSettings()">
 *     Settings
 *   </ui-dropdown-item>
 * </ui-dropdown>
 * ```
 *
 * Advanced Usage with Custom Trigger:
 * ```html
 * <ui-dropdown>
 *   <button trigger-button>Custom Trigger</button>
 *   <ui-dropdown-item>Menu Item</ui-dropdown-item>
 * </ui-dropdown>
 * ```
 */
@Component({
  selector: 'wn-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (library()) {
      @case ('spartan') {
        <!-- Spartan Dropdown Implementation -->
        <button [class]="triggerClasses()" [attr.data-dropdown-trigger]="true">
          <ng-container
            *ngTemplateOutlet="customTrigger() || defaultTrigger"
          ></ng-container>
        </button>

        <ng-template #defaultTrigger>
          {{ triggerText() }}
        </ng-template>

        <!-- Menu Content -->
        <div [class]="menuClasses()" [hidden]="!isOpen()">
          <ng-content></ng-content>
        </div>
      }

      @case ('material') {
        <!-- Material Dropdown Implementation -->
        <button [class]="triggerClasses()">
          <ng-container
            *ngTemplateOutlet="customTrigger() || defaultTrigger"
          ></ng-container>
        </button>

        <ng-template #defaultTrigger>
          {{ triggerText() }}
        </ng-template>

        <div [class]="menuClasses()">
          <ng-content></ng-content>
        </div>
      }

      @default {
        <!-- Custom Tailwind Dropdown -->
        <div class="relative inline-block text-left">
          <button
            [class]="triggerClasses()"
            (click)="toggleMenu()"
            type="button"
          >
            <ng-container
              *ngTemplateOutlet="customTrigger() || defaultTrigger"
            ></ng-container>
          </button>

          <ng-template #defaultTrigger>
            {{ triggerText() }}
            <svg
              class="-mr-1 ml-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </ng-template>

          @if (isOpen()) {
            <ul
              [class]="menuClasses()"
              role="menu"
              tabindex="0"
              (click)="handleMenuClick($event)"
              (keydown)="handleMenuKeydown($event)"
            >
              <ng-content></ng-content>
            </ul>
          }
        </div>
      }
    }
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UIDropdownComponent {
  // Inputs
  triggerText = input<string>('Menu');
  align = input<'start' | 'end' | 'center'>('start');
  side = input<'top' | 'bottom' | 'left' | 'right'>('bottom');
  disabled = input<boolean>(false);

  // Outputs
  opened = output<void>();
  closed = output<void>();

  // Content projection
  customTrigger = contentChild<TemplateRef<any>>('triggerContent');

  // Services
  private gms = inject(GlobalManagerService);
  private uiAdapter = inject(UIAdapterService);

  // State
  protected isOpen = signal(false);
  protected library = computed(() => this.gms.uiLibrary());

  // Computed classes
  protected triggerClasses = computed(() => {
    const library = this.library();
    const classes: string[] = [];

    switch (library) {
      case 'spartan':
        classes.push(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors'
        );
        classes.push(
          'hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2'
        );
        break;
      case 'material':
        classes.push('mat-button');
        break;
      case 'primeng':
        classes.push('p-button p-button-text');
        break;
      case 'custom':
      default:
        classes.push(
          'inline-flex items-center justify-center w-full rounded-md border border-gray-300'
        );
        classes.push('bg-white px-4 py-2 text-sm font-medium text-gray-700');
        classes.push(
          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
        );
    }

    if (this.disabled()) {
      classes.push('opacity-50 cursor-not-allowed');
    }

    return classes.join(' ');
  });

  protected menuClasses = computed(() => {
    const library = this.library();
    const classes: string[] = [];

    switch (library) {
      case 'spartan':
        classes.push(
          'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md'
        );
        break;
      case 'material':
        classes.push('mat-menu-panel');
        break;
      case 'primeng':
        classes.push('p-menu p-component');
        break;
      case 'custom':
      default:
        classes.push(
          'absolute z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5'
        );
        classes.push('focus:outline-none');

        // Alignment
        switch (this.align()) {
          case 'end':
            classes.push('right-0');
            break;
          case 'center':
            classes.push('left-1/2 -translate-x-1/2');
            break;
          default:
            classes.push('left-0');
        }
    }

    return classes.join(' ');
  });

  toggleMenu() {
    if (this.disabled()) return;

    this.isOpen.update((v) => !v);

    if (this.isOpen()) {
      this.opened.emit();
    } else {
      this.closed.emit();
    }
  }

  closeMenu() {
    this.isOpen.set(false);
    this.closed.emit();
  }

  handleMenuClick(event: MouseEvent) {
    // Close menu when item is clicked (for custom implementation)
    const target = event.target as HTMLElement;
    if (target.hasAttribute('data-dropdown-item')) {
      this.closeMenu();
    }
  }

  handleMenuKeydown(event: KeyboardEvent) {
    // Close menu on Escape key
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMenu();
    }
  }
}

/**
 * Dropdown Menu Item Component
 */
@Component({
  selector: 'wn-dropdown-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="itemClasses()"
      [disabled]="disabled()"
      [attr.data-dropdown-item]="true"
      (click)="handleClick($event)"
      type="button"
    >
      @if (icon()) {
        <span class="mr-2">{{ icon() }}</span>
      }
      <ng-content></ng-content>
      @if (shortcut()) {
        <span [class]="shortcutClasses()">{{ shortcut() }}</span>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UIDropdownItemComponent {
  // Inputs
  disabled = input<boolean>(false);
  icon = input<string>('');
  shortcut = input<string>('');
  variant = input<'default' | 'destructive'>('default');
  inset = input<boolean>(false);

  // Outputs
  selected = output<void>();

  // Services
  private gms = inject(GlobalManagerService);

  protected itemClasses = computed(() => {
    const library = this.gms.uiLibrary();
    const classes: string[] = [];

    switch (library) {
      case 'spartan':
        classes.push(
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none'
        );
        classes.push(
          'transition-colors focus:bg-accent focus:text-accent-foreground'
        );
        classes.push(
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
        );

        if (this.variant() === 'destructive') {
          classes.push('text-destructive focus:text-destructive');
        }

        if (this.inset()) {
          classes.push('pl-8');
        }
        break;

      case 'custom':
      default:
        classes.push('w-full text-left px-4 py-2 text-sm text-gray-700');
        classes.push('hover:bg-gray-100 hover:text-gray-900');
        classes.push('flex items-center justify-between');

        if (this.variant() === 'destructive') {
          classes.push('text-red-600 hover:bg-red-50');
        }

        if (this.disabled()) {
          classes.push('opacity-50 cursor-not-allowed');
        }
    }

    return classes.join(' ');
  });

  protected shortcutClasses = computed(() => {
    const library = this.gms.uiLibrary();

    switch (library) {
      case 'spartan':
        return 'ml-auto text-xs tracking-widest opacity-60';
      default:
        return 'ml-auto text-xs text-gray-500';
    }
  });

  handleClick(event: MouseEvent) {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.selected.emit();
  }
}

/**
 * Dropdown Menu Separator Component
 */
@Component({
  selector: 'wn-dropdown-separator',
  standalone: true,
  imports: [CommonModule],
  template: `<div [class]="separatorClasses()"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UIDropdownSeparatorComponent {
  private gms = inject(GlobalManagerService);

  protected separatorClasses = computed(() => {
    const library = this.gms.uiLibrary();

    switch (library) {
      case 'spartan':
        return '-mx-1 my-1 h-px bg-muted';
      case 'custom':
      default:
        return 'my-1 h-px bg-gray-200';
    }
  });
}

/**
 * Dropdown Menu Label Component
 */
@Component({
  selector: 'wn-dropdown-label',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="labelClasses()">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UIDropdownLabelComponent {
  inset = input<boolean>(false);

  private gms = inject(GlobalManagerService);

  protected labelClasses = computed(() => {
    const library = this.gms.uiLibrary();
    const classes: string[] = [];

    switch (library) {
      case 'spartan':
        classes.push('px-2 py-1.5 text-sm font-semibold');
        if (this.inset()) {
          classes.push('pl-8');
        }
        break;
      case 'custom':
      default:
        classes.push(
          'px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider'
        );
    }

    return classes.join(' ');
  });
}

/**
 * Dropdown Menu Group Component
 */
@Component({
  selector: 'wn-dropdown-group',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="groupClasses()">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UIDropdownGroupComponent {
  private gms = inject(GlobalManagerService);

  protected groupClasses = computed(() => {
    const library = this.gms.uiLibrary();

    switch (library) {
      case 'spartan':
        return 'p-1';
      case 'custom':
      default:
        return 'py-1';
    }
  });
}
