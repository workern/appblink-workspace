import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
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
  readonly config = input.required<LegalPageConfig>();
  readonly appName = input<string>('');
  readonly backClick = output<void>();

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    const headerHeight = 64; // sticky header is 4rem
    const top =
      el.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}
