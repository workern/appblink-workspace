import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan/components/button';
import { HlmIcon } from '@spartan/components/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLogOut, lucideUserRound } from '@ng-icons/lucide';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'workern-app-header',
  imports: [
    CommonModule,
    RouterLink,
    NgIcon,
    HlmIcon,
    ...HlmButtonImports,
  ],
  providers: [
    provideIcons({
      lucideLogOut,
      lucideUserRound
    })
  ],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()'
  }
})
export class WorkernAppHeaderComponent {
  public readonly appName = input.required<string>();
  public readonly byline = input<string>('by Workern');
  public readonly logoSrc = input<string>('/assets/icon.png');
  public readonly logoAlt = input<string>('App logo');

  public readonly isLoggedIn = input<boolean>(false);
  public readonly showAvatar = input<boolean>(true);
  public readonly billingRoute = input<string>('/billing');

  public readonly signInClick = output<void>();
  public readonly logoutClick = output<void>();

  protected readonly isMenuOpen = signal(false);

  protected onHeaderClick(): void {
    this.isMenuOpen.set(false);
  }

  protected onAvatarClick(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen.update((value) => !value);
  }

  protected onLogoutClick(): void {
    this.isMenuOpen.set(false);
    this.logoutClick.emit();
  }

  protected onSignInClick(): void {
    this.signInClick.emit();
  }

  protected onBillingClick(): void {
    this.isMenuOpen.set(false);
  }

  protected onEscape(): void {
    this.isMenuOpen.set(false);
  }
}
