import {
  Component,
  ChangeDetectionStrategy,
  input,
  model
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'workern-select',
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
      <select
        [id]="id()"
        [disabled]="!enabled()"
        [required]="required()"
        [(ngModel)]="value"
        class="px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white
               transition-colors cursor-pointer
               focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20
               disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
               appearance-none bg-no-repeat bg-right pr-10"
        [style.--primary]="primaryColor()"
        [style.background-image]="'url(' + chevronIcon + ')'"
        [style.background-position]="'right 0.75rem center'"
        [style.background-size]="'1.25rem'"
      >
        @if (placeholder()) {
          <option value="" disabled [selected]="!value()">
            {{ placeholder() }}
          </option>
        }
        @for (option of options(); track option.value) {
          <option [value]="option.value" [disabled]="option.disabled">
            {{ option.label }}
          </option>
        }
      </select>
      @if (error()) {
        <p class="text-xs text-red-500 mt-1">{{ error() }}</p>
      }
    </div>
  `,
  styles: [
    `
      select {
        border-color: var(--border-color, #d1d5db);
      }
      select:focus {
        border-color: var(--primary, #6c5ce7);
        --tw-ring-color: var(--primary, #6c5ce7);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule]
})
export class WorkernSelectComponent {
  readonly label = input<string>('');
  readonly placeholder = input<string>('Select an option');
  readonly options = input.required<SelectOption[]>();
  readonly enabled = input<boolean>(true);
  readonly required = input<boolean>(false);
  readonly primaryColor = input<string>('#6c5ce7');
  readonly id = input<string>(
    `select-${Math.random().toString(36).substring(7)}`
  );
  readonly error = input<string>('');

  readonly value = model<string>('');

  protected readonly chevronIcon =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E";
}
