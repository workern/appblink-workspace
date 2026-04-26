import {
  Component,
  ChangeDetectionStrategy,
  input,
  model
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormField } from '@angular/forms/signals';

@Component({
  selector: 'wn-checkbox',
  template: `
    <div class="flex items-start gap-2">
      <input
        [id]="id()"
        type="checkbox"
        [formField]="formField()"
        class="mt-0.5 h-4 w-4 rounded border-gray-300 transition-colors
               focus:ring-2 focus:ring-offset-0 cursor-pointer
               disabled:cursor-not-allowed disabled:opacity-50"
        [style.--primary]="primaryColor()"
        [class.text-primary]="checked()"
        [class.focus:ring-primary/20]="checked()"
      />
      <label
        [for]="id()"
        class="flex-1 text-sm cursor-pointer select-none"
        [class.text-gray-700]="enabled()"
        [class.text-gray-400]="!enabled()"
      >
        <div class="font-medium">{{ label() }}</div>
        @if (description()) {
          <div class="text-xs text-gray-500 mt-0.5">{{ description() }}</div>
        }
      </label>
    </div>
  `,
  styles: [
    `
      input[type='checkbox'] {
        accent-color: var(--primary, #6c5ce7);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, FormField]
})
export class WorkernCheckboxComponent {
  readonly label = input.required<string>();
  readonly description = input<string>('');
  readonly enabled = input<boolean>(true);
  readonly primaryColor = input<string>('#6c5ce7');
  readonly id = input<string>(
    `checkbox-${Math.random().toString(36).substring(7)}`
  );
  readonly formField = input<any>(null);

  readonly checked = model<boolean>(false);
}
