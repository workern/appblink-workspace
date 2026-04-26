import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GlobalManagerService,
  UIAdapterService,
  ButtonVariant,
  ButtonSize
} from '@workern/services';

/**
 * Universal Button Component
 *
 * This component automatically adapts to the UI library configured in GlobalManagerService.
 *
 * Supported Libraries:
 * - Spartan: Uses hlmBtn directive
 * - Material: Uses mat-button directive
 * - PrimeNG: Uses pButton directive
 * - Custom: Uses Tailwind classes
 *
 * Usage:
 * ```html
 * <ui-button variant="primary" size="md" (clicked)="handleClick()">
 *   Click Me
 * </ui-button>
 * ```
 */
@Component({
  selector: 'wn-ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="buttonClasses()"
      [attr.data-variant]="variant()"
      [attr.data-size]="size()"
      (click)="clicked.emit($event)"
    >
      @if (loading()) {
        <svg
          class="animate-spin -ml-1 mr-2 h-4 w-4 inline"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      }
      <ng-content></ng-content>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UIButtonComponent {
  // Inputs
  variant = input<ButtonVariant>('default');
  size = input<ButtonSize>('md');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');

  // Outputs
  clicked = output<MouseEvent>();

  // Services
  private gms = inject(GlobalManagerService);
  private uiAdapter = inject(UIAdapterService);

  // Computed classes based on UI library
  protected buttonClasses = computed(() => {
    const baseClasses = this.uiAdapter.getButtonClass({
      variant: this.variant(),
      size: this.size()
    });

    // Add library-specific directive classes
    const library = this.gms.uiLibrary();
    const libraryClasses: string[] = [];

    switch (library) {
      case 'spartan':
        libraryClasses.push('inline-flex items-center justify-center');
        // Spartan variant classes
        switch (this.variant()) {
          case 'default':
            libraryClasses.push(
              'bg-primary text-primary-foreground hover:bg-primary/90'
            );
            break;
          case 'destructive':
            libraryClasses.push(
              'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            );
            break;
          case 'outline':
            libraryClasses.push(
              'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
            );
            break;
          case 'secondary':
            libraryClasses.push(
              'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            );
            break;
          case 'ghost':
            libraryClasses.push('hover:bg-accent hover:text-accent-foreground');
            break;
          case 'link':
            libraryClasses.push(
              'text-primary underline-offset-4 hover:underline'
            );
            break;
        }
        // Spartan size classes
        switch (this.size()) {
          case 'sm':
            libraryClasses.push('h-9 rounded-md px-3');
            break;
          case 'lg':
            libraryClasses.push('h-11 rounded-md px-8');
            break;
          case 'icon':
            libraryClasses.push('h-10 w-10');
            break;
          default:
            libraryClasses.push('h-10 px-4 py-2');
        }
        libraryClasses.push(
          'rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
        );
        break;
    }

    return `${baseClasses} ${libraryClasses.join(' ')}`.trim();
  });
}
