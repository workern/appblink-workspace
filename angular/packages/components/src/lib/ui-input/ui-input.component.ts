import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  computed,
  model
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  GlobalManagerService,
  UIAdapterService,
  InputType
} from '@workern/services';

/**
 * Universal Input Component
 *
 * This component automatically adapts to the UI library configured in GlobalManagerService.
 *
 * Usage:
 * ```html
 * <ui-input
 *   [(value)]="username"
 *   type="text"
 *   label="Username"
 *   placeholder="Enter your username"
 *   [error]="usernameError"
 * />
 * ```
 */
@Component({
  selector: 'wn-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      @if (label()) {
        <label
          [for]="id()"
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          {{ label() }}
          @if (required()) {
            <span class="text-red-500">*</span>
          }
        </label>
      }

      <input
        [id]="id()"
        [type]="type()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [required]="required()"
        [class]="inputClasses()"
        [(ngModel)]="value"
        (blur)="blurred.emit($event)"
        (focus)="focused.emit($event)"
      />

      @if (hint() && !error()) {
        <p class="mt-1 text-xs text-gray-500">{{ hint() }}</p>
      }

      @if (error()) {
        <p class="mt-1 text-xs text-red-600">{{ error() }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UIInputComponent {
  // Inputs
  type = input<InputType>('text');
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  error = input<string>('');
  label = input<string>('');
  hint = input<string>('');
  id = input<string>(`ui-input-${Math.random().toString(36).substr(2, 9)}`);

  // Two-way binding for value
  value = model<string>('');

  // Outputs
  blurred = output<FocusEvent>();
  focused = output<FocusEvent>();

  // Services
  private gms = inject(GlobalManagerService);
  private uiAdapter = inject(UIAdapterService);

  // Computed classes based on UI library
  protected inputClasses = computed(() => {
    const baseClasses = this.uiAdapter.getInputClass();
    const classes: string[] = [baseClasses];

    // Add error state classes
    if (this.error()) {
      const library = this.gms.uiLibrary();
      switch (library) {
        case 'spartan':
          classes.push('border-destructive focus:ring-destructive');
          break;
        case 'custom':
        default:
          classes.push(
            'border-red-500 focus:ring-red-500 focus:border-red-500'
          );
      }
    }

    return classes.join(' ').trim();
  });
}
