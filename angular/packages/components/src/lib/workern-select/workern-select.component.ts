import {
  Component,
  ChangeDetectionStrategy,
  input,
  model
} from '@angular/core';
import { HlmNativeSelectImports } from '@spartan/components/native-select';
import { HlmLabel } from '@spartan/components/label';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'workern-select',
  template: `
    <div class="flex flex-col gap-1.5" [style.--primary]="primaryColor()">
      @if (label()) {
        <label hlmLabel [for]="id()">
          {{ label() }}
          @if (required()) {
            <span class="text-destructive ml-0.5">*</span>
          }
        </label>
      }
      <hlm-native-select
        [selectId]="id()"
        [value]="value()"
        (valueChange)="value.set($event ?? '')"
        [disabled]="!enabled()"
      >
        @if (placeholder()) {
          <option value="" disabled>{{ placeholder() }}</option>
        }
        @for (option of options(); track option.value) {
          <option [value]="option.value" [disabled]="option.disabled ?? false">
            {{ option.label }}
          </option>
        }
      </hlm-native-select>
      @if (error()) {
        <p class="text-xs text-destructive mt-1">{{ error() }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HlmNativeSelectImports, HlmLabel]
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
}
