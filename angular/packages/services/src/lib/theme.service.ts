import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface WorkernPalette {
  label: string;
  name: string;
  color: string; // Hex color for display in picker UI
}

export const WORKERN_PALETTES: WorkernPalette[] = [
  { label: 'Default', name: 'default', color: '#4338CA' }, // Deep Indigo / Brand
  { label: 'Emerald', name: 'emerald', color: '#059669' },
  { label: 'Rose', name: 'rose', color: '#E11D48' },
  { label: 'Sky', name: 'sky', color: '#0284C7' },
  { label: 'Violet', name: 'violet', color: '#7C3AED' },
  { label: 'Amber', name: 'amber', color: '#D97706' },
  { label: 'Slate', name: 'slate', color: '#475569' },
  { label: 'Teal', name: 'teal', color: '#0D9488' },
  { label: 'Pink', name: 'pink', color: '#DB2777' }
];

@Injectable({ providedIn: 'root' })
export class WorkernThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly mode = signal<ThemeMode>('system');
  readonly palette = signal<string>('default');

  constructor() {
    if (this.isBrowser) {
      // Load initial preferences from localStorage
      const savedMode = localStorage.getItem('workern-theme-mode') as ThemeMode;
      const savedPalette = localStorage.getItem('workern-theme-palette');

      if (savedMode) this.mode.set(savedMode);
      if (savedPalette) this.palette.set(savedPalette);

      // Listen for system theme changes
      const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
      try {
        darkQuery.addEventListener('change', () => {
          if (this.mode() === 'system') {
            this.updateDOM();
          }
        });
      } catch (e) {
        // Fallback for older browsers
        darkQuery.addListener(() => {
          if (this.mode() === 'system') {
            this.updateDOM();
          }
        });
      }

      // Run effect to apply changes whenever mode or palette changes
      effect(() => {
        const currentMode = this.mode();
        const currentPalette = this.palette();

        localStorage.setItem('workern-theme-mode', currentMode);
        localStorage.setItem('workern-theme-palette', currentPalette);

        this.updateDOM();
      });
    }
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  setPalette(palette: string): void {
    this.palette.set(palette);
  }

  cycleMode(): void {
    const modes: ThemeMode[] = ['system', 'light', 'dark'];
    const nextIndex = (modes.indexOf(this.mode()) + 1) % modes.length;
    this.mode.set(modes[nextIndex]);
  }

  cyclePalette(): void {
    const nextIndex =
      (WORKERN_PALETTES.findIndex((p) => p.name === this.palette()) + 1) %
      WORKERN_PALETTES.length;
    this.palette.set(WORKERN_PALETTES[nextIndex].name);
  }

  private updateDOM(): void {
    if (!this.isBrowser) return;

    const htmlElement = document.documentElement;
    const isDark =
      this.mode() === 'dark' ||
      (this.mode() === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Apply dark mode class
    if (isDark) {
      htmlElement.classList.add('dark');
      htmlElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.style.colorScheme = 'light';
    }

    // Apply palette classes
    // Remove existing themes
    WORKERN_PALETTES.forEach((p) => {
      if (p.name !== 'default') {
        htmlElement.classList.remove(`theme-${p.name}`);
      }
    });

    // Add selected theme class
    const selectedPalette = this.palette();
    if (selectedPalette !== 'default') {
      htmlElement.classList.add(`theme-${selectedPalette}`);
    }
  }
}
