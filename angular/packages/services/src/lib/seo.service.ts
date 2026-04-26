import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';

export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  canonical?: string;
  structuredData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SEOService {
  private meta = inject(Meta);
  private titleService = inject(Title);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private defaultSEO: SEOData = {
    title: '',
    description: '',
    keywords: '',
    ogImage: '',
    canonical: ''
  };

  constructor() {
    // Track route changes for dynamic SEO
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateSEOForRoute(event.urlAfterRedirects);
      });
  }

  updateSEO(data: Partial<SEOData>): void {
    const seoData = { ...this.defaultSEO, ...data };

    // Update title
    this.titleService.setTitle(seoData.title);

    // Update meta tags
    this.updateMetaTag('description', seoData.description);
    this.updateMetaTag(
      'keywords',
      seoData.keywords || this.defaultSEO.keywords!
    );

    // Open Graph tags
    this.updateMetaTag(
      'og:title',
      seoData.ogTitle || seoData.title,
      'property'
    );
    this.updateMetaTag(
      'og:description',
      seoData.ogDescription || seoData.description,
      'property'
    );
    this.updateMetaTag(
      'og:image',
      seoData.ogImage || this.defaultSEO.ogImage!,
      'property'
    );
    this.updateMetaTag(
      'og:url',
      seoData.canonical || this.defaultSEO.canonical!,
      'property'
    );

    // Twitter tags
    this.updateMetaTag(
      'twitter:title',
      seoData.twitterTitle || seoData.title,
      'name'
    );
    this.updateMetaTag(
      'twitter:description',
      seoData.twitterDescription || seoData.description,
      'name'
    );

    // Canonical URL
    this.updateCanonical(seoData.canonical || this.defaultSEO.canonical!);

    // Structured Data
    if (seoData.structuredData) {
      this.updateStructuredData(seoData.structuredData);
    }
  }

  private updateMetaTag(
    name: string,
    content: string,
    attribute = 'name'
  ): void {
    if (this.meta.getTag(`${attribute}="${name}"`)) {
      this.meta.updateTag({ [attribute]: name, content });
    } else {
      this.meta.addTag({ [attribute]: name, content });
    }
  }

  private updateCanonical(url: string): void {
    if (!this.isBrowser) return; // Skip on server

    let link: HTMLLinkElement | null = document.querySelector(
      'link[rel="canonical"]'
    );
    if (link) {
      link.href = url;
    } else {
      link = document.createElement('link');
      link.rel = 'canonical';
      link.href = url;
      document.head.appendChild(link);
    }
  }

  private updateStructuredData(data: any): void {
    if (!this.isBrowser) return; // Skip on server

    // Remove existing structured data
    const existing = document.querySelector(
      'script[type="application/ld+json"][data-dynamic]'
    );
    if (existing) {
      existing.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-dynamic', 'true');
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  private updateSEOForRoute(url: string): void {
    const routeSEO = this.getRouteSpecificSEO(url);
    this.updateSEO(routeSEO);
  }

  private getRouteSpecificSEO(url: string): Partial<SEOData> {
    if (url === '/' || url === '/landing') {
      return {
        title:
          'Nikaट - Local Shopping & Delivery | Shop from Nearby Stores | By Workern',
        description:
          'Discover and shop from the best local stores around you. Get groceries, pharmacy items, fashion, and electronics delivered fast with Nikaट. Support local businesses.',
        canonical: 'https://nikat.in',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Nikaट - Local Shopping & Delivery',
          description:
            'Local shopping platform for discovering nearby stores and quick delivery',
          url: 'https://nikat.in',
          applicationCategory: 'BusinessApplication'
        }
      };
    }

    if (url === '/home') {
      return {
        title: 'Shop Local Stores Near You | Nikaट Home',
        description:
          "Browse local stores in your area. Find groceries, pharmacy, fashion, and electronics with quick delivery. Discover what's available near you.",
        canonical: 'https://nikat.in/home'
      };
    }

    if (url.includes('/shop/')) {
      return {
        title: 'Shop Products | Local Store | Nikaट',
        description:
          'Browse products from local stores. Add to cart and get quick delivery to your doorstep.',
        canonical: `https://nikat.in${url}`
      };
    }

    if (url === '/cart') {
      return {
        title: 'Shopping Cart | Review Your Order | Nikaट',
        description:
          'Review your cart, select delivery options, and complete your order from local stores.',
        canonical: 'https://nikat.in/cart'
      };
    }

    if (url === '/profile') {
      return {
        title: 'My Profile | Order History & Settings | Nikaट',
        description:
          'Manage your profile, view order history, saved addresses, and favorite stores.',
        canonical: 'https://nikat.in/profile'
      };
    }

    return {};
  }

  // Generate rich snippets for products
  generateProductSchema(product: any, shop: any): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description:
        product.description || `${product.name} available at ${shop.name}`,
      image: product.imageUrls,
      offers: {
        '@type': 'Offer',
        price: (product.price.value / 100).toFixed(2),
        priceCurrency: product.price.currency,
        availability:
          product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'LocalBusiness',
          name: shop.name,
          address: shop.address
        }
      },
      brand: {
        '@type': 'Brand',
        name: shop.name
      }
    };
  }

  // Generate local business schema
  generateLocalBusinessSchema(shop: any): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: shop.name,
      image: shop.imageUrl,
      description: shop.description,
      address: {
        '@type': 'PostalAddress',
        streetAddress: shop.address,
        addressLocality: shop.city,
        addressCountry: 'IN'
      },
      aggregateRating: shop.rating
        ? {
            '@type': 'AggregateRating',
            ratingValue: shop.rating,
            ratingCount: shop.reviewsCount || 1
          }
        : undefined,
      openingHours: this.formatOpeningHours(shop.workingHours)
    };
  }

  private formatOpeningHours(workingHours: any): string[] {
    const days = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday'
    ];
    return days
      .filter((day) => workingHours[day] && !workingHours[day].isClosed)
      .map(
        (day) =>
          `${day.charAt(0).toUpperCase() + day.slice(1)} ${
            workingHours[day].open
          }-${workingHours[day].close}`
      );
  }
}
