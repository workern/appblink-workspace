import {
  Component,
  ChangeDetectionStrategy,
  input,
  model
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'currency-text-field',
  template: `
    <div class="flex flex-col">
      @if (label()) {
        <label [for]="id()" class="text-xs font-medium text-gray-700 mb-1">
          {{ label() }}
          @if (required()) {
            <span class="text-red-500">*</span>
          }
        </label>
      }
      <div class="relative">
        <div
          class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
        >
          <span
            class="text-sm font-medium"
            [class.text-gray-700]="enabled()"
            [class.text-gray-400]="!enabled()"
          >
            {{ currencySymbol() }}
          </span>
        </div>
        <input
          [id]="id()"
          type="number"
          step="0.01"
          [placeholder]="hint()"
          [disabled]="!enabled()"
          [required]="required()"
          [(ngModel)]="value"
          class="w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg transition-colors
                 focus:outline-none focus:ring-2
                 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                 [appearance:textfield]
                 [&::-webkit-outer-spin-button]:appearance-none
                 [&::-webkit-inner-spin-button]:appearance-none"
          [class.border-gray-300]="!error()"
          [class.focus:border-primary]="!error()"
          [class.focus:ring-primary/20]="!error()"
          [class.border-red-500]="error()"
          [class.focus:border-red-500]="error()"
          [class.focus:ring-red-500/20]="error()"
          [style.--primary]="primaryColor()"
        />
      </div>
      @if (error()) {
        <p class="text-xs text-red-500 mt-1">{{ error() }}</p>
      }
    </div>
  `,
  styles: [
    `
      input {
        border-color: var(--border-color, #d1d5db);
      }
      input:focus {
        border-color: var(--primary, #6c5ce7);
        ring-color: var(--primary, #6c5ce7);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule]
})
export class CurrencyTextFieldComponent {
  readonly label = input<string>('');
  readonly hint = input<string>('0.00');
  readonly currencySymbol = input.required<string>();
  readonly enabled = input<boolean>(true);
  readonly required = input<boolean>(false);
  readonly primaryColor = input<string>('#6c5ce7');
  readonly id = input<string>(
    `currency-${Math.random().toString(36).substring(7)}`
  );
  readonly error = input<string>('');

  readonly value = model<number>(0);
}
