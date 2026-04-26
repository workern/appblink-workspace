import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmIcon } from '@spartan/components/icon';
import {
  lucideTwitter,
  lucideLinkedin,
  lucideYoutube,
  lucideMail,
  lucidePhone
} from '@ng-icons/lucide';

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterSocialLink {
  icon: string;
  href: string;
  ariaLabel: string;
}

export interface FooterConfig {
  appName: string;
  tagline: string;
  year?: number;
  companyName?: string;
  links: FooterLink[];
  legalLinks: FooterLink[];
  socialLinks?: FooterSocialLink[];
  contactEmail?: string;
  contactPhone?: string;
}

@Component({
  selector: 'workern-app-footer',
  standalone: true,
  imports: [RouterLink, NgIcon, HlmIcon],
  providers: [
    provideIcons({
      lucideTwitter,
      lucideLinkedin,
      lucideYoutube,
      lucideMail,
      lucidePhone
    })
  ],
  templateUrl: './app-footer.component.html',
  styleUrl: './app-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFooterComponent {
  public readonly config = input.required<FooterConfig>();

  protected get year(): number {
    return this.config().year ?? new Date().getFullYear();
  }

  protected get company(): string {
    return this.config().companyName ?? 'Workern by Uroboros Coders Pvt. Ltd.';
  }

  protected get activeSocialLinks(): FooterSocialLink[] {
    return (this.config().socialLinks ?? []).filter((s) => !!s.href?.trim());
  }
}
