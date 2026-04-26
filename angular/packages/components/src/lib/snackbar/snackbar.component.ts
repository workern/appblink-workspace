import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '@workern/services';
import { HlmButton } from '@spartan/components/button';
import { HlmIcon } from '@spartan/components/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheckCircle,
  lucideX,
  lucideAlertCircle,
  lucideInfo
} from '@ng-icons/lucide';

type MessageType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule, HlmIcon, NgIcon],
  providers: [
    provideIcons({
      lucideCheckCircle,
      lucideX,
      lucideAlertCircle,
      lucideInfo
    })
  ],
  template: `
    <div class="fixed top-4 right-4 z-[9999] space-y-2">
      @for (message of snackbarService.getMessages(); track message.id) {
        <div
          [class]="getSnackbarClasses(message.type)"
          [style.background-color]="getBackgroundColor()"
          [style.border-color]="getBorderColor()"
          [style.color]="getForegroundColor()"
          class="flex items-center gap-3 min-w-80 max-w-md p-4 rounded-lg border shadow-lg transform transition-all duration-300 ease-in-out animate-slide-in-right"
        >
          <div class="flex-shrink-0">
            <ng-icon
              hlm
              [name]="getIcon(message.type)"
              size="sm"
              [class]="getIconClasses(message.type)"
            />
          </div>
          <p class="flex-1 text-sm font-medium">{{ message.message }}</p>
          <button
            hlmBtn
            variant="ghost"
            size="sm"
            type="button"
            (click)="snackbarService.dismiss(message.id)"
            class="h-auto p-0 text-muted-foreground hover:text-foreground"
          >
            <ng-icon hlm name="lucideX" size="sm" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes slide-in-right {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .animate-slide-in-right {
        animation: slide-in-right 0.3s ease-out;
        @media (prefers-reduced-motion: reduce) {
          animation: none;
          transform: translateX(0);
          opacity: 1;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SnackbarComponent {
  readonly appearance = input<'semantic' | 'neutral'>('semantic');
  readonly snackbarService = inject(SnackbarService);

  getSnackbarClasses(type: MessageType): string {
    if (this.appearance() === 'neutral') {
      return 'shadow-[var(--shadow-3)]';
    }

    switch (type) {
      case 'success':
        return 'bg-green/10 border-green/30 text-green';
      case 'error':
        return 'bg-destructive/10 border-destructive/30 text-destructive';
      case 'warning':
        return 'bg-yellow/10 border-yellow/30 text-yellow';
      case 'info':
      default:
        return 'bg-blue/10 border-blue/30 text-blue';
    }
  }

  getIconClasses(type: MessageType): string {
    if (this.appearance() === 'neutral') {
      return 'text-current';
    }

    switch (type) {
      case 'success':
        return 'text-green';
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-yellow';
      case 'info':
      default:
        return 'text-blue';
    }
  }

  getIcon(type: MessageType): string {
    if (this.appearance() === 'neutral') {
      return 'lucideInfo';
    }

    switch (type) {
      case 'success':
        return 'lucideCheckCircle';
      case 'error':
        return 'lucideAlertCircle';
      case 'warning':
        return 'lucideAlertCircle';
      case 'info':
      default:
        return 'lucideInfo';
    }
  }

  getBackgroundColor(): string | null {
    if (this.appearance() !== 'neutral') return null;
    return 'var(--snackbar-bg, var(--foreground))';
  }

  getBorderColor(): string | null {
    if (this.appearance() !== 'neutral') return null;
    return 'var(--snackbar-border, var(--foreground))';
  }

  getForegroundColor(): string | null {
    if (this.appearance() !== 'neutral') return null;
    return 'var(--snackbar-fg, var(--background))';
  }
}
