import {
  Component,
  ChangeDetectionStrategy,
  input,
  model
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'wn-switch',
  template: `
    <div class="flex items-center justify-between gap-4">
      <div class="flex-1">
        <label
          [for]="id()"
          class="block text-sm font-medium text-gray-700 cursor-pointer"
        >
          {{ title() }}
        </label>
        @if (subtitle()) {
          <p class="text-xs text-gray-500 mt-0.5">{{ subtitle() }}</p>
        }
      </div>
      <button
        [id]="id()"
        type="button"
        role="switch"
        [attr.aria-checked]="checked()"
        [disabled]="!enabled()"
        (click)="toggle()"
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors
               focus:outline-none focus:ring-2 focus:ring-offset-2
               disabled:opacity-50 disabled:cursor-not-allowed"
        [class.bg-gray-200]="!checked()"
        [class.cursor-pointer]="enabled()"
        [style.background-color]="checked() ? activeColor() : ''"
        [style.--tw-ring-color]="activeColor()"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
          [class.translate-x-6]="checked()"
          [class.translate-x-1]="!checked()"
        ></span>
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule]
})
export class WorkernSwitchComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly enabled = input<boolean>(true);
  readonly activeColor = input<string>('#6c5ce7');
  readonly id = input<string>(
    `switch-${Math.random().toString(36).substring(7)}`
  );

  readonly checked = model<boolean>(false);

  protected toggle(): void {
    if (this.enabled()) {
      this.checked.set(!this.checked());
    }
  }
}
