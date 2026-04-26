import {
  Component,
  ChangeDetectionStrategy,
  input,
  model,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'workern-slider',
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-gray-700">
          {{ label() }}
        </label>
        <span class="text-sm font-semibold text-gray-900">
          {{ displayValue() }}{{ unit() ? ' ' + unit() : '' }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        @if (showMinMaxLabels()) {
          <span class="text-xs text-gray-500 min-w-fit">
            {{ minLabel() || min() }}
          </span>
        }
        <input
          type="range"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [disabled]="!enabled()"
          [(ngModel)]="value"
          class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                 disabled:opacity-50 disabled:cursor-not-allowed
                 slider-thumb"
          [style.--primary]="activeColor()"
        />
        @if (showMinMaxLabels()) {
          <span class="text-xs text-gray-500 min-w-fit">
            {{ maxLabel() || max() }}
          </span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      input[type='range'] {
        accent-color: var(--primary, #6c5ce7);
      }

      /* Webkit (Chrome, Safari, Edge) */
      input[type='range']::-webkit-slider-thumb {
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--primary, #6c5ce7);
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      input[type='range']::-webkit-slider-runnable-track {
        height: 8px;
        border-radius: 4px;
        background: #e5e7eb;
      }

      /* Firefox */
      input[type='range']::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--primary, #6c5ce7);
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      input[type='range']::-moz-range-track {
        height: 8px;
        border-radius: 4px;
        background: #e5e7eb;
      }

      /* Disabled state */
      input[type='range']:disabled::-webkit-slider-thumb {
        cursor: not-allowed;
        opacity: 0.5;
      }

      input[type='range']:disabled::-moz-range-thumb {
        cursor: not-allowed;
        opacity: 0.5;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule]
})
export class WorkernSliderComponent {
  readonly label = input.required<string>();
  readonly min = input<number>(0);
  readonly max = input<number>(100);
  readonly step = input<number>(1);
  readonly unit = input<string>('');
  readonly enabled = input<boolean>(true);
  readonly activeColor = input<string>('#6c5ce7');
  readonly showMinMaxLabels = input<boolean>(true);
  readonly minLabel = input<string>('');
  readonly maxLabel = input<string>('');
  readonly decimals = input<number>(0);

  readonly value = model<number>(0);

  protected readonly displayValue = computed(() => {
    const val = this.value();
    const dec = this.decimals();
    return dec > 0 ? val.toFixed(dec) : Math.round(val).toString();
  });
}
