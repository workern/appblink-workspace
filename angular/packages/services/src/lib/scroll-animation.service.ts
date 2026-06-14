import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Convention-based GSAP scroll animation service.
 *
 * Add the following CSS classes / attributes to your landing page HTML and
 * call `init(hostElement)` from `ngAfterViewInit`. No other configuration
 * is required.
 *
 * ## Supported conventions
 *
 * | Element                                | Effect                                      |
 * |----------------------------------------|---------------------------------------------|
 * | `.gsap-hero-item`                      | Staggered entrance (fade + slide up)        |
 * | `[data-gsap-hero]` or `#main-content`  | Hero section used as parallax trigger       |
 * | `.hero-blob`                           | Blob parallax inside the hero               |
 * | `.hero-float-icon`                     | Floating icon parallax inside the hero      |
 * | `.gsap-hero-content`                   | Subtle upward lag on hero scroll            |
 * | `[data-gsap-grid]`                     | Card grid reveal (direct children stagger)  |
 * | `[data-gsap-grid][data-gsap-stagger]`  | Override stagger value (default: 0.10)      |
 * | `.gsap-section-heading`                | Section heading fade + slide up on scroll   |
 * | `[data-gsap-section]`                  | Section wrapper for background blob parallax|
 * | `.sect-blob[data-gsap-speed]`          | Override blob speed (default alternates)    |
 */
@Injectable({ providedIn: 'root' })
export class ScrollAnimationService {
  private readonly platformId = inject(PLATFORM_ID);
  private gsapCtx?: { revert(): void };

  /** Call from `ngAfterViewInit` of your landing component. */
  init(host: HTMLElement): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Always clean up any previous context before re-initialising.
    // Angular creates the new component (ngAfterViewInit) BEFORE destroying the old one
    // (ngOnDestroy), so without this the old component's destroy() would revert the
    // new component's freshly-created GSAP context, leaving elements at opacity:0.
    this.destroy();

    gsap.registerPlugin(ScrollTrigger);

    this.gsapCtx = gsap.context(() => {
      // 1. Hero items entrance stagger
      const heroItems = host.querySelectorAll('.gsap-hero-item');
      if (heroItems.length) {
        gsap.fromTo(
          heroItems,
          { y: 36, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.85, stagger: 0.13, ease: 'power3.out', delay: 0.15 }
        );
      }

      // 2. Hero blob parallax
      const heroSection = host.querySelector<HTMLElement>('[data-gsap-hero], #main-content');
      const heroHeight = heroSection?.offsetHeight ?? 700;
      const blobSpeeds = [0.22, 0.42, 0.30];
      host.querySelectorAll<HTMLElement>('.hero-blob').forEach((blob, i) => {
        gsap.to(blob, {
          y: -(heroHeight * (blobSpeeds[i] ?? 0.25)),
          ease: 'none',
          scrollTrigger: { trigger: heroSection, start: 'top top', end: 'bottom top', scrub: 1.2 }
        });
      });

      // 3. Float icon parallax
      const iconSpeeds = [0.14, 0.08, 0.18, 0.24];
      host.querySelectorAll<HTMLElement>('.hero-float-icon').forEach((icon, i) => {
        gsap.to(icon, {
          y: -(heroHeight * (iconSpeeds[i] ?? 0.15)),
          ease: 'none',
          scrollTrigger: { trigger: heroSection, start: 'top top', end: 'bottom top', scrub: 1.2 }
        });
      });

      // 4. Hero content subtle upward lag
      const heroContent = host.querySelector<HTMLElement>('.gsap-hero-content');
      if (heroContent && heroSection) {
        gsap.to(heroContent, {
          y: heroHeight * 0.06,
          ease: 'none',
          scrollTrigger: { trigger: heroSection, start: 'top top', end: 'bottom top', scrub: 1.5 }
        });
      }

      // 5. Card grid scroll reveals — targets [data-gsap-grid] elements
      host.querySelectorAll<HTMLElement>('[data-gsap-grid]').forEach((grid) => {
        const stagger = parseFloat(grid.dataset['gsapStagger'] ?? '0.10');
        const cards = Array.from(grid.querySelectorAll<HTMLElement>(':scope > *'));
        if (!cards.length) return;
        gsap.from(cards, {
          y: 32,
          opacity: 0,
          duration: 0.65,
          stagger,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: { trigger: grid, start: 'top 86%', toggleActions: 'play none none none' }
        });
      });

      // 6. Section heading reveals
      host.querySelectorAll('.gsap-section-heading').forEach((heading) => {
        gsap.from(heading, {
          y: 28,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: heading, start: 'top 88%', toggleActions: 'play none none none' }
        });
      });

      // 7. Section background blob parallax — .sect-blob inside [data-gsap-section]
      const defaultSpeeds = [0.20, 0.28];
      host.querySelectorAll<HTMLElement>('[data-gsap-section]').forEach((section) => {
        section.querySelectorAll<HTMLElement>('.sect-blob').forEach((blob, i) => {
          const speed = parseFloat(blob.dataset['gsapSpeed'] ?? String(defaultSpeeds[i % 2]));
          gsap.to(blob, {
            y: -(section.offsetHeight * speed),
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1.5 }
          });
        });
      });
    }, host);
  }

  /** Call from `ngOnDestroy` of your landing component. */
  destroy(): void {
    this.gsapCtx?.revert();
    this.gsapCtx = undefined;
  }
}
