import { Injectable } from '@angular/core';
import { algoliasearch } from 'algoliasearch';
import { BaseSearchService, SearchOptions } from './base-search.service';
@Injectable({
  providedIn: 'root'
})
export class AlgoliaService extends BaseSearchService {
  private algoliaClient = algoliasearch(
    'V53AP5KZLI', // Replace with your Algolia App ID
    'eb35eca6efbf505fa26740783b077d05' // Replace with your Algolia Search-Only API Key
  );
  override async search(
    indexName: string,
    query: string,
    options: SearchOptions = { fields: ['*'] }
  ): Promise<any[]> {
    const { hits } = await this.algoliaClient.searchSingleIndex({
      indexName: indexName,
      searchParams: {
        query: query,
        hitsPerPage: 10,
        attributesToRetrieve: options.fields
      }
    });

    const data = hits.map((hit) => {
      const {
        objectID,
        _highlightResult,
        _rankingInfo,
        _distinctSeqID,
        _snippetResult,

        ...itemData
      } = hit;
      return {
        ...this.fs.convertTimestampsToDates(itemData)
      };
    });
    return data;
  }
}
