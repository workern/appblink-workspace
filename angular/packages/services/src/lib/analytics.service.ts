import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Analytics, logEvent } from '@angular/fire/analytics';

/**
 * Analytics service for tracking user events using Firebase Analytics
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private analytics = inject(Analytics);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Log a custom event to Firebase Analytics
   * @param eventName - Name of the event (e.g., 'page_view', 'button_click')
   * @param eventParams - Optional parameters for the event
   */
  logEvent(eventName: string, eventParams?: Record<string, unknown>): void {
    // Skip analytics during SSR
    if (!this.isBrowser) {
      return;
    }

    try {
      logEvent(this.analytics, eventName, eventParams);
    } catch (error) {
      console.error('Failed to log analytics event:', eventName, error);
    }
  }

  /**
   * Log a page view event
   * @param pageName - Name of the page being viewed
   * @param additionalParams - Optional additional parameters
   */
  logPageView(
    pageName: string,
    additionalParams?: Record<string, unknown>
  ): void {
    this.logEvent('page_view', {
      page_name: pageName,
      ...additionalParams
    });
  }

  /**
   * Log a button click event
   * @param buttonName - Name of the button clicked
   * @param additionalParams - Optional additional parameters
   */
  logButtonClick(
    buttonName: string,
    additionalParams?: Record<string, unknown>
  ): void {
    this.logEvent('button_click', {
      button_name: buttonName,
      ...additionalParams
    });
  }

  /**
   * Log a share event
   * @param method - Share method (e.g., 'whatsapp', 'email', 'clipboard')
   * @param contentType - Type of content being shared
   * @param itemId - Optional ID of the item being shared
   */
  logShare(method: string, contentType: string, itemId?: string): void {
    this.logEvent('share', {
      method,
      content_type: contentType,
      item_id: itemId
    });
  }
}
