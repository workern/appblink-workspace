import {
  Component,
  ChangeDetectionStrategy,
  input,
  model
} from '@angular/core';
import { HlmSwitchImports } from '@spartan/components/switch';
import { HlmLabel } from '@spartan/components/label';

@Component({
  selector: 'wn-switch',
  template: `
    <div
      class="flex items-center justify-between gap-4"
      [style.--primary]="activeColor()"
    >
      <div class="flex-1">
        <label hlmLabel [for]="id()">
          {{ title() }}
        </label>
        @if (subtitle()) {
          <p class="text-xs text-muted-foreground mt-0.5">{{ subtitle() }}</p>
        }
      </div>
      <hlm-switch
        [id]="id()"
        [checked]="checked()"
        (checkedChange)="checked.set($event)"
        [disabled]="!enabled()"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HlmSwitchImports, HlmLabel]
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
}
