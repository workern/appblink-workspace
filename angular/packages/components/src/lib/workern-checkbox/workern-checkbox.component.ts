import {
  Component,
  ChangeDetectionStrategy,
  input,
  model
} from '@angular/core';
import { HlmCheckbox } from '@spartan/components/checkbox';
import { HlmLabel } from '@spartan/components/label';

@Component({
  selector: 'wn-checkbox',
  template: `
    <div class="flex items-start gap-2" [style.--primary]="primaryColor()">
      <hlm-checkbox
        [id]="id()"
        [checked]="checked()"
        (checkedChange)="checked.set($event)"
        [disabled]="!enabled()"
      />
      <label
        hlmLabel
        [for]="id()"
        class="cursor-pointer"
        [class.opacity-50]="!enabled()"
      >
        <span>{{ label() }}</span>
        @if (description()) {
          <span class="block text-xs text-muted-foreground mt-0.5 font-normal">
            {{ description() }}
          </span>
        }
      </label>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmCheckbox, HlmLabel]
})
export class WorkernCheckboxComponent {
  readonly label = input.required<string>();
  readonly description = input<string>('');
  readonly enabled = input<boolean>(true);
  readonly primaryColor = input<string>('#6c5ce7');
  readonly id = input<string>(
    `checkbox-${Math.random().toString(36).substring(7)}`
  );

  readonly checked = model<boolean>(false);
}
