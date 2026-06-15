import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginDialogComponent } from '@workern/components';
import {
  SEOService,
  ScrollAnimationService,
  GtagService
} from '@workern/services';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LoginDialogComponent]
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {
  private router = inject(Router);
  private seoService = inject(SEOService);
  private gtagService = inject(GtagService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly scrollAnim = inject(ScrollAnimationService);

  showLoginDialog = signal(false);

  ngAfterViewInit(): void {
    // Animations activate automatically when you add these classes to your HTML:
    // .gsap-hero-item        → hero entrance stagger
    // .hero-blob             → hero blob parallax
    // .hero-float-icon       → floating icon parallax
    // .gsap-hero-content     → hero content scroll lag
    // [data-gsap-grid]       → card grid scroll reveal  (add data-gsap-stagger="0.12" to override)
    // .gsap-section-heading  → section heading reveal
    // [data-gsap-section]    → section wrapper for background blob parallax
    this.scrollAnim.init(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.scrollAnim.destroy();
  }

  ngOnInit() {
    // TODO: Replace all placeholder values with your actual app info
    this.seoService.updateSEO({
      title: 'App Name — Short Value Proposition | by Workern',
      description:
        'TODO: Describe your app in 150-160 chars. Include primary keywords. What problem does it solve? Who is it for?',
      keywords: 'TODO: keyword1, keyword2, keyword3',
      ogTitle: 'App Name — Short Value Proposition',
      ogDescription: 'TODO: Same as description above',
      ogImage: 'https://your-app-domain.com/assets/og-image.png',
      twitterTitle: 'App Name — Short Value Proposition',
      twitterDescription: 'TODO: Same as description above',
      canonical: 'https://your-app-domain.com/',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'TODO: App Name',
        description: 'TODO: Full app description',
        url: 'https://your-app-domain.com',
        applicationCategory: 'TODO: e.g. ProductivityApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'TODO: Free plan description'
        },
        creator: {
          '@type': 'Organization',
          name: 'Workern',
          url: 'https://workern.com'
        }
      }
    });
  }

  openLoginDialog() {
    this.gtagService.sendEvent('cta_login');
    this.showLoginDialog.set(true);
  }

  closeLoginDialog() {
    this.showLoginDialog.set(false);
  }

  onLearnMoreClick() {
    this.gtagService.sendEvent('cta_see_features');
  }

  onLoginSuccess() {
    this.gtagService.sendEvent('sign_in_complete');
    this.showLoginDialog.set(false);
    this.router.navigate(['/home']);
  }
}
