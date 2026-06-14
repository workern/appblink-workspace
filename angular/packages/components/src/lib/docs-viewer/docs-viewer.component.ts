import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MarkdownComponent, provideMarkdown } from 'ngx-markdown';

/**
 * Reusable docs viewer component (shared across all Workern apps).
 *
 * Fetches a markdown file from the given asset path and renders it with
 * ngx-markdown. Shows a loading state while fetching and an error message
 * if the file is not found.
 *
 * Usage:
 *   <workern-docs-viewer [assetPath]="'/assets/docs/README.md'" />
 *
 * Requires provideHttpClient() in your app's providers.
 */
@Component({
  selector: 'workern-docs-viewer',
  standalone: true,
  templateUrl: './docs-viewer.component.html',
  styleUrl: './docs-viewer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownComponent],
  providers: [provideMarkdown()]
})
export class WorkernDocsViewerComponent {
  /** URL or root-relative path to the markdown file, e.g. '/assets/docs/README.md' */
  readonly assetPath = input.required<string>();

  readonly content = signal<string>('');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  private http = inject(HttpClient);

  constructor() {
    effect(() => {
      this.loadDoc(this.assetPath());
    });
  }

  private loadDoc(path: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get(path, { responseType: 'text' }).subscribe({
      next: (md) => {
        this.content.set(md);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Documentation page not found.');
        this.loading.set(false);
      }
    });
  }
}
