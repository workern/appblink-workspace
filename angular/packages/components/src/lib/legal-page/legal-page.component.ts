import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  inject,
  input,
  output
} from '@angular/core';

export interface LegalTocSection {
  id: string;
  label: string;
}

export interface LegalPageConfig {
  title: string;
  /** ISO date string, e.g. "2025-01-15" — used in datetime attribute */
  lastUpdated: string;
  /** Human-readable date, e.g. "January 15, 2025" */
  lastUpdatedDisplay: string;
  introText: string;
  tocSections: LegalTocSection[];
}

@Component({
  selector: 'app-legal-page',
  standalone: true,
  templateUrl: './legal-page.component.html',
  styleUrls: ['./legal-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LegalPageComponent {
  private readonly _el = inject(ElementRef);

  readonly config = input.required<LegalPageConfig>();
  readonly appName = input<string>('');
  readonly hideBuiltInHeader = input<boolean>(false);
  /** Height in px of any external sticky header above this component (e.g. sn-info-nav). Used to size the internal scroll container correctly. */
  readonly topOffset = input<number>(0);
  readonly backClick = output<void>();

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    const contentEl = this._el.nativeElement.querySelector(
      '.legal-content'
    ) as HTMLElement | null;
    if (contentEl && contentEl.scrollHeight > contentEl.clientHeight) {
      // Desktop: content scrolls internally
      const containerTop = contentEl.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      const scrollTop = contentEl.scrollTop + (elTop - containerTop) - 16;
      contentEl.scrollTo({ top: scrollTop, behavior: 'smooth' });
    } else {
      // Mobile fallback: scroll the window
      const headerOffset = this.topOffset() || 64;
      const top =
        el.getBoundingClientRect().top + window.scrollY - headerOffset - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
}
