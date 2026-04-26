import { DOCUMENT } from '@angular/common';
import { inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'any'
})
export class LoadScriptsDynamicallyService {
  private renderer: Renderer2;
  private document = inject(DOCUMENT);
  private rendererFactory = inject(RendererFactory2);
  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  loadScript(src: string, type = 'text/javascript'): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.isScriptLoaded(src)) {
        resolve(true);
        return;
      }

      const script = this.renderer.createElement('script');
      script.src = src;
      script.type = type;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        resolve(true); // Resolve the promise indicating successful loading
      };
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

      this.renderer.appendChild(this.document.body, script);
    });
  }

  loadStyle(href: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.isStyleLoaded(href)) {
        resolve();
        return;
      }

      const link = this.renderer.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;

      link.onload = () => resolve();
      link.onerror = () =>
        reject(new Error(`Failed to load stylesheet: ${href}`));

      this.renderer.appendChild(this.document.head, link);
    });
  }

  removeScript(src: string): void {
    const script = this.document.querySelector(`script[src="${src}"]`);
    if (script) {
      this.renderer.removeChild(this.document.body, script);
    }
  }

  removeStyle(href: string): void {
    const link = this.document.querySelector(`link[href="${href}"]`);
    if (link) {
      this.renderer.removeChild(this.document.head, link);
    }
  }

  private isScriptLoaded(src: string): boolean {
    return !!this.document.querySelector(`script[src="${src}"]`);
  }

  private isStyleLoaded(href: string): boolean {
    return !!this.document.querySelector(`link[href="${href}"]`);
  }

  loadRazorpay(): Promise<boolean> {
    return this.loadScript('https://checkout.razorpay.com/v1/checkout.js');
  }
}
