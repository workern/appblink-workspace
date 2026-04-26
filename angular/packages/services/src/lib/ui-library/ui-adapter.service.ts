import { Injectable, inject } from '@angular/core';
import { GlobalManagerService } from '../global-manager-service';
import { ButtonVariant, ButtonSize } from './ui-component.interface';

/**
 * UI Adapter Service
 *
 * Maps abstract UI concepts to library-specific CSS classes and directives.
 * This allows components to be library-agnostic while still using the correct
 * styling based on the configured UI library.
 *
 * Usage:
 * ```typescript
 * const buttonClass = this.uiAdapter.getButtonClass({ variant: 'primary', size: 'md' });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class UIAdapterService {
  private gms = inject(GlobalManagerService);

  /**
   * Get CSS classes for button based on configured UI library
   */
  getButtonClass(props: {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }): string {
    const library = this.gms.uiLibrary();

    switch (library) {
      case 'spartan':
        return this.getSpartanButtonClass(props);
      case 'material':
        return this.getMaterialButtonClass(props);
      case 'primeng':
        return this.getPrimeNgButtonClass(props);
      case 'custom':
      default:
        return this.getCustomButtonClass(props);
    }
  }

  /**
   * Get directive name for button based on configured UI library
   */
  getButtonDirective(): string {
    const library = this.gms.uiLibrary();

    switch (library) {
      case 'spartan':
        return 'hlmBtn';
      case 'material':
        return 'mat-button';
      case 'primeng':
        return 'pButton';
      case 'custom':
      default:
        return '';
    }
  }

  /**
   * Spartan button classes
   */
  private getSpartanButtonClass(props: {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }): string {
    // Spartan uses hlmBtn directive with variant attribute
    // This is for additional classes if needed
    const classes: string[] = [];

    // Spartan handles variants through directive attributes
    // Additional utility classes can be added here

    return classes.join(' ');
  }

  /**
   * Material button classes
   */
  private getMaterialButtonClass(props: {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }): string {
    const classes: string[] = [];

    // Map abstract variants to Material variants
    switch (props.variant) {
      case 'primary':
        classes.push('mat-primary');
        break;
      case 'secondary':
        classes.push('mat-accent');
        break;
      case 'destructive':
        classes.push('mat-warn');
        break;
    }

    return classes.join(' ');
  }

  /**
   * PrimeNG button classes
   */
  private getPrimeNgButtonClass(props: {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }): string {
    const classes: string[] = ['p-button'];

    // Map abstract variants to PrimeNG classes
    switch (props.variant) {
      case 'primary':
        classes.push('p-button-primary');
        break;
      case 'secondary':
        classes.push('p-button-secondary');
        break;
      case 'outline':
        classes.push('p-button-outlined');
        break;
      case 'destructive':
        classes.push('p-button-danger');
        break;
      case 'link':
        classes.push('p-button-link');
        break;
    }

    // Map sizes
    switch (props.size) {
      case 'sm':
        classes.push('p-button-sm');
        break;
      case 'lg':
        classes.push('p-button-lg');
        break;
    }

    return classes.join(' ');
  }

  /**
   * Custom (Workern) button classes
   */
  private getCustomButtonClass(props: {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }): string {
    const classes: string[] = ['workern-btn'];

    // Custom Tailwind-based classes
    switch (props.variant) {
      case 'primary':
        classes.push('bg-indigo-600 text-white hover:bg-indigo-700');
        break;
      case 'secondary':
        classes.push('bg-gray-600 text-white hover:bg-gray-700');
        break;
      case 'outline':
        classes.push('border border-gray-300 text-gray-700 hover:bg-gray-50');
        break;
      case 'ghost':
        classes.push('text-gray-700 hover:bg-gray-100');
        break;
      case 'destructive':
        classes.push('bg-red-600 text-white hover:bg-red-700');
        break;
      case 'link':
        classes.push(
          'text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline'
        );
        break;
      default:
        classes.push(
          'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'
        );
    }

    // Size classes
    switch (props.size) {
      case 'sm':
        classes.push('px-3 py-1.5 text-sm');
        break;
      case 'lg':
        classes.push('px-6 py-3 text-lg');
        break;
      case 'icon':
        classes.push('p-2');
        break;
      default:
        classes.push('px-4 py-2 text-base');
    }

    // Base classes
    classes.push(
      'rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    );

    return classes.join(' ');
  }

  /**
   * Get input classes based on configured UI library
   */
  getInputClass(): string {
    const library = this.gms.uiLibrary();

    switch (library) {
      case 'spartan':
        return 'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
      case 'material':
        return ''; // Material uses mat-form-field
      case 'primeng':
        return 'p-inputtext';
      case 'custom':
      default:
        return 'w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed';
    }
  }

  /**
   * Get card classes based on configured UI library
   */
  getCardClass(): string {
    const library = this.gms.uiLibrary();

    switch (library) {
      case 'spartan':
        return 'rounded-lg border bg-card text-card-foreground shadow-sm';
      case 'material':
        return 'mat-card';
      case 'primeng':
        return 'p-card';
      case 'custom':
      default:
        return 'bg-white rounded-lg shadow-md border border-gray-200';
    }
  }

  /**
   * Get dropdown menu classes based on configured UI library
   */
  getDropdownMenuClass(): string {
    const library = this.gms.uiLibrary();

    switch (library) {
      case 'spartan':
        return 'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md';
      case 'material':
        return 'mat-menu-panel';
      case 'primeng':
        return 'p-menu p-component';
      case 'custom':
      default:
        return 'absolute z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5';
    }
  }

  /**
   * Get dropdown item classes based on configured UI library
   */
  getDropdownItemClass(props: {
    variant?: 'default' | 'destructive';
    inset?: boolean;
  }): string {
    const library = this.gms.uiLibrary();

    switch (library) {
      case 'spartan':
        return this.getSpartanDropdownItemClass(props);
      case 'material':
        return 'mat-menu-item';
      case 'primeng':
        return 'p-menuitem-link';
      case 'custom':
      default:
        return this.getCustomDropdownItemClass(props);
    }
  }

  private getSpartanDropdownItemClass(props: {
    variant?: 'default' | 'destructive';
    inset?: boolean;
  }): string {
    const classes = [
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none'
    ];
    classes.push(
      'transition-colors focus:bg-accent focus:text-accent-foreground'
    );
    classes.push(
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
    );

    if (props.variant === 'destructive') {
      classes.push('text-destructive focus:text-destructive');
    }

    if (props.inset) {
      classes.push('pl-8');
    }

    return classes.join(' ');
  }

  private getCustomDropdownItemClass(props: {
    variant?: 'default' | 'destructive';
    inset?: boolean;
  }): string {
    const classes = ['w-full text-left px-4 py-2 text-sm text-gray-700'];
    classes.push('hover:bg-gray-100 hover:text-gray-900');
    classes.push('flex items-center justify-between');

    if (props.variant === 'destructive') {
      classes.push('text-red-600 hover:bg-red-50');
    }

    if (props.inset) {
      classes.push('pl-8');
    }

    return classes.join(' ');
  }
}
