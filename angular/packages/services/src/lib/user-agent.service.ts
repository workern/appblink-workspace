import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Service for detecting user agent characteristics like bots, crawlers, and device types
 */
@Injectable({
  providedIn: 'root'
})
export class UserAgentService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  /**
   * List of known bot/crawler patterns to detect
   */
  private readonly BOT_PATTERNS = [
    'bot',
    'crawl',
    'spider',
    'preview',
    'whatsapp',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'slackbot',
    'telegrambot',
    'discordbot',
    'applebot',
    'bingbot',
    'googlebot',
    'yandexbot',
    'baiduspider',
    'duckduckbot',
    'ia_archiver',
    'mj12bot',
    'ahrefsbot',
    'semrushbot'
  ];

  /**
   * Detect if the current visitor is a bot/crawler (e.g., WhatsApp preview generator)
   * @returns true if the visitor is detected as a bot, false otherwise
   */
  isBot(): boolean {
    if (!this.isBrowser) {
      return false; // Server-side rendering
    }

    const userAgent = navigator.userAgent.toLowerCase();

    return this.BOT_PATTERNS.some((pattern) => userAgent.includes(pattern));
  }

  /**
   * Get the raw user agent string
   * @returns The user agent string or empty string if not in browser
   */
  getUserAgent(): string {
    if (!this.isBrowser) {
      return '';
    }

    return navigator.userAgent;
  }

  /**
   * Detect if the user is on a mobile device
   * @returns true if on mobile, false otherwise
   */
  isMobileDevice(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    return /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent
    );
  }

  /**
   * Detect if the user is on an iOS device
   * @returns true if on iOS, false otherwise
   */
  isIOS(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/i.test(userAgent);
  }

  /**
   * Detect if the user is on an Android device
   * @returns true if on Android, false otherwise
   */
  isAndroid(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    return /android/i.test(userAgent);
  }
}
