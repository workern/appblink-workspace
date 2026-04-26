import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalManagerService, UIAdapterService } from '@workern/services';

/**
 * Universal Card Component
 *
 * This component automatically adapts to the UI library configured in GlobalManagerService.
 *
 * Usage:
 * ```html
 * <ui-card [hoverable]="true" [clickable]="true">
 *   <div card-header>
 *     <h3>Card Title</h3>
 *   </div>
 *   <div card-content>
 *     <p>Card content goes here</p>
 *   </div>
 *   <div card-footer>
 *     <button>Action</button>
 *   </div>
 * </ui-card>
 * ```
 */
@Component({
  selector: 'wn-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses()">
      <div class="card-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UICardComponent {
  // Inputs
  hoverable = input<boolean>(false);
  clickable = input<boolean>(false);
  elevated = input<boolean>(false);

  // Services
  private gms = inject(GlobalManagerService);
  private uiAdapter = inject(UIAdapterService);

  // Computed classes based on UI library
  protected cardClasses = computed(() => {
    const baseClasses = this.uiAdapter.getCardClass();
    const classes: string[] = [baseClasses];

    const library = this.gms.uiLibrary();

    // Add interaction classes
    if (this.hoverable()) {
      switch (library) {
        case 'spartan':
        case 'custom':
          classes.push('transition-shadow hover:shadow-lg');
          break;
      }
    }

    if (this.clickable()) {
      classes.push('cursor-pointer');
      switch (library) {
        case 'spartan':
        case 'custom':
          classes.push('transition-transform hover:scale-[1.02]');
          break;
      }
    }

    if (this.elevated()) {
      switch (library) {
        case 'spartan':
        case 'custom':
          classes.push('shadow-lg');
          break;
      }
    }

    return classes.join(' ').trim();
  });
}
