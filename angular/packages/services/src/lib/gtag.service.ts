import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class GtagService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Send an event to Google Analytics if gtag is available
   * @param eventName The name of the event
   * @param eventParams Optional parameters for the event
   */
  sendEvent(eventName: string, eventParams?: Record<string, any>): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      const dataLayer = (window as any)['dataLayer'];
      if (dataLayer) {
        console.log('Sending gtag event:', eventName, eventParams);
        dataLayer.push({ event: eventName, ...eventParams });
        console.log(`[Gtag] Event sent: ${eventName}`, eventParams);
      } else {
        console.warn(`[Gtag] gtag not available for event: ${eventName}`);
      }
    } catch (error) {
      console.error(`[Gtag] Error sending event: ${eventName}`, error);
    }
  }

  /**
   * Check if gtag is available on the window object
   */
  isAvailable(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    return typeof (window as any)['gtag'] === 'function';
  }
}
