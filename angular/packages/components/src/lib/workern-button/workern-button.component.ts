import { NgClass } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';

@Component({
  selector: 'wn-button',
  template: `
    <button
      [type]="type()"
      [disabled]="!enabled() || isLoading()"
      (click)="handleClick()"
      class="inline-flex items-center justify-center gap-2 px-6 font-semibold rounded-lg transition-all
             disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2"
      [class.h-12]="size() === 'medium'"
      [class.h-10]="size() === 'small'"
      [class.h-14]="size() === 'large'"
      [class.text-sm]="size() === 'small'"
      [class.text-base]="size() === 'medium' || size() === 'large'"
      [ngClass]="buttonClasses()"
      [style.--primary-color]="variant() === 'primary' ? primaryColor() : ''"
    >
      @if (isLoading()) {
        <svg
          class="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      }
      <span>{{ label() }}</span>
    </button>
  `,
  styles: [
    `
      button.primary-custom {
        background-color: var(--primary-color, #6c5ce7);
      }
      button.primary-custom:hover:not(:disabled) {
        filter: brightness(0.9);
      }
      button.primary-custom:focus {
        --tw-ring-color: var(--primary-color, #6c5ce7);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass]
})
export class WorkernButtonComponent {
  readonly label = input.required<string>();
  readonly variant = input<'primary' | 'secondary' | 'danger'>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly size = input<'small' | 'medium' | 'large'>('medium');
  readonly enabled = input<boolean>(true);
  readonly isLoading = input<boolean>(false);
  readonly primaryColor = input<string>('#6c5ce7');

  readonly clicked = output<void>();

  protected handleClick(): void {
    if (this.enabled() && !this.isLoading()) {
      this.clicked.emit();
    }
  }

  protected buttonClasses(): string {
    const variant = this.variant();

    if (variant === 'primary') {
      return 'primary-custom text-white hover:brightness-90';
    } else if (variant === 'secondary') {
      return 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 focus:ring-gray-300';
    } else if (variant === 'danger') {
      return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
    }

    return '';
  }
}
