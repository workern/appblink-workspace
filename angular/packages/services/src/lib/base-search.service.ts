import { inject, Injectable } from '@angular/core';
import { FirestoreHelpers } from '@workern/services';

export interface SearchOptions {
  hitsPerPage?: number;
  attributesToRetrieve?: string[];
  filters?: string;
  fields?: string[];
}

@Injectable()
export abstract class BaseSearchService {
  protected readonly fs = inject(FirestoreHelpers);

  /**
   * Search documents in the specified index
   * @param indexName The name of the search index
   * @param query The search query string
   * @param options Search options (fields to retrieve, filters, etc.)
   * @returns Array of search results with timestamps converted to dates
   */
  abstract search<T = any>(
    indexName: string,
    query: string,
    options?: SearchOptions
  ): Promise<T[]>;

  /**
   * Helper method to process search hits and convert Firestore timestamps
   */
  protected processHits(hits: any[]): any[] {
    return hits.map((hit) => {
      const {
        objectID,
        _highlightResult,
        _rankingInfo,
        _distinctSeqID,
        _snippetResult,
        ...itemData
      } = hit;
      return this.fs.convertTimestampsToDates(itemData);
    });
  }
}
