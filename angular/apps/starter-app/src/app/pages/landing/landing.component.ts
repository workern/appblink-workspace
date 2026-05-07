import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
// import { SEOService } from '@workern/services';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class LandingComponent implements OnInit {
  private router = inject(Router);
  // private seoService = inject(SEOService);

  ngOnInit() {
    // // TODO: Replace all placeholder values with your actual app info
    // this.seoService.updateSEO({
    //   title: 'App Name — Short Value Proposition | by Workern',
    //   description:
    //     'TODO: Describe your app in 150-160 chars. Include primary keywords. What problem does it solve? Who is it for?',
    //   keywords: 'TODO: keyword1, keyword2, keyword3',
    //   ogTitle: 'App Name — Short Value Proposition',
    //   ogDescription: 'TODO: Same as description above',
    //   ogImage: 'https://your-app-domain.com/assets/og-image.png',
    //   twitterTitle: 'App Name — Short Value Proposition',
    //   twitterDescription: 'TODO: Same as description above',
    //   canonical: 'https://your-app-domain.com/',
    //   structuredData: {
    //     '@context': 'https://schema.org',
    //     '@type': 'WebApplication',
    //     name: 'TODO: App Name',
    //     description: 'TODO: Full app description',
    //     url: 'https://your-app-domain.com',
    //     applicationCategory: 'TODO: e.g. ProductivityApplication',
    //     operatingSystem: 'Web',
    //     offers: {
    //       '@type': 'Offer',
    //       price: '0',
    //       priceCurrency: 'USD',
    //       description: 'TODO: Free plan description'
    //     },
    //     creator: {
    //       '@type': 'Organization',
    //       name: 'Workern',
    //       url: 'https://workern.com'
    //     }
    //   }
    // });
  }

  openLogin() {
    this.router.navigate(['/login']);
  }
}
