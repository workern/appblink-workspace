import { ChangeDetectionStrategy, Component, inject, signal, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkernThemeService, WORKERN_PALETTES } from '@workern/services';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideSparkles,
  lucideSun,
  lucideMoon,
  lucideMonitor,
  lucideCheck,
  lucideX,
  lucideChevronUp
} from '@ng-icons/lucide';

@Component({
  selector: 'workern-dev-tools',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './dev-tools.component.html',
  styleUrls: ['./dev-tools.component.css'],
  providers: [
    provideIcons({
      lucideSparkles,
      lucideSun,
      lucideMoon,
      lucideMonitor,
      lucideCheck,
      lucideX,
      lucideChevronUp
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkernDevToolsComponent {
  protected readonly themeService = inject(WorkernThemeService);
  protected readonly isDevelopment = isDevMode();
  
  protected readonly isOpen = signal(false);
  protected readonly palettes = WORKERN_PALETTES;

  toggleOpen(): void {
    this.isOpen.update((v) => !v);
  }

  setMode(mode: 'light' | 'dark' | 'system'): void {
    this.themeService.setMode(mode);
  }

  setPalette(palette: string): void {
    this.themeService.setPalette(palette);
  }

  // Flutter Parity: Double-click to cycle theme mode
  onTriggerDblClick(event: MouseEvent): void {
    event.preventDefault();
    this.themeService.cycleMode();
  }

  // Flutter Parity: Right-click (context menu) to cycle color palette
  onTriggerRightClick(event: MouseEvent): void {
    event.preventDefault();
    this.themeService.cyclePalette();
  }
}
