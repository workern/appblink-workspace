import {
  Component,
  ChangeDetectionStrategy,
  input,
  model
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'wn-textarea',
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
      <textarea
        [id]="id()"
        [placeholder]="hint()"
        [required]="required()"
        [rows]="rows()"
        [(ngModel)]="value"
        class="px-3 py-2.5 text-sm border rounded-lg transition-colors resize-y
               focus:outline-none focus:ring-2
               disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
        [class.border-gray-300]="!error()"
        [class.focus:border-primary]="!error()"
        [class.focus:ring-primary/20]="!error()"
        [class.border-red-500]="error()"
        [class.focus:border-red-500]="error()"
        [class.focus:ring-red-500/20]="error()"
        [style.--primary]="primaryColor()"
      ></textarea>
      @if (error()) {
        <p class="text-xs text-red-500 mt-1">{{ error() }}</p>
      }
    </div>
  `,
  styles: [
    `
      textarea {
        border-color: var(--border-color, #d1d5db);
      }
      textarea:focus {
        border-color: var(--primary, #6c5ce7);
        ring-color: var(--primary, #6c5ce7);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule]
})
export class WorkernTextareaComponent {
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly enabled = input<boolean>(true);
  readonly autofocus = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly rows = input<number>(3);
  readonly primaryColor = input<string>('#6c5ce7');
  readonly id = input<string>(
    `textarea-${Math.random().toString(36).substring(7)}`
  );
  readonly error = input<string>('');

  readonly value = model<string>('');
}
