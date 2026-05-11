import { computed, inject, Injectable, resource } from '@angular/core';
import Typesense from 'typesense';
import { BaseSearchService, SearchOptions } from './base-search.service';
import { GlobalManagerService } from './global-manager-service';
import { FirebaseFunctionsService } from './firebase-functions.service';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class TypesenseService extends BaseSearchService {
  fns = inject(FirebaseFunctionsService);
  auth = inject(AuthService);
  gms = inject(GlobalManagerService);

  appName = computed(() => this.gms.appKeyName());
  functionsInitialSlug = computed(() => this.gms.config().functionsInitialSlug ?? this.appName());
  clients$ = resource({
    params: () => ({
      uid: this.auth.uid(),
      appName: this.appName()
    }),

    loader: async () => {
      if (typeof window === 'undefined') {
        return {};
      }
      if (!this.appName()) {
        throw new Error('Set the app name in GMS service');
      }
      const localStorageKey = `${this.appName()}:${this.auth.uid()}:typesenseApiKeys`;
      const localApiKeyObjString = localStorage.getItem(localStorageKey);
      let needToFetch = false;
      let apiKeyObj;
      if (!localApiKeyObjString) {
        needToFetch = true;
      } else {
        const obj = JSON.parse(localApiKeyObjString);
        needToFetch = Object.keys(obj).some(
          (key) => obj[key].expiresAt < Date.now()
        );
        if (!needToFetch) {
          apiKeyObj = obj;
        }
      }

      if (needToFetch) {
        apiKeyObj = await this.fns
          .firebaseCall<
            { apiKey: string; expiresAt: number },
            { data: { apiKey: string } }
          >(`${this.functionsInitialSlug()}-typesense-getapikey`)
          .then((response) => {
            return response.data;
          });

        localStorage.setItem(localStorageKey, JSON.stringify(apiKeyObj));
      }

      return Object.keys(apiKeyObj).reduce((clients, key) => {
        const currentIndexObj = apiKeyObj[key];

        clients[key] = new Typesense.Client({
          nodes: [
            {
              host: 'olypvi2b0587qkejp-1.a1.typesense.net',
              port: 443,
              protocol: 'https'
            }
          ],
          apiKey: currentIndexObj.apiKey
        });
        return clients;
      }, {});
    }
  });

  clients = computed(() => this.clients$.value());

  constructor() {
    super();
    this.clients$.reload();
  }

  async search<T = any>(
    indexName: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<T[]> {
    const { hitsPerPage = 10, attributesToRetrieve, filters } = options;

    try {
      const searchParameters: any = {
        q: query,
        query_by: '*', // Search across all fields, can be customized
        per_page: hitsPerPage
      };

      // Add include/exclude fields if specified
      if (
        attributesToRetrieve &&
        attributesToRetrieve.length > 0 &&
        !attributesToRetrieve.includes('*')
      ) {
        searchParameters.include_fields = attributesToRetrieve.join(',');
      }

      // Add filter string if specified
      if (filters) {
        searchParameters.filter_by = filters;
      }
      console.log('clients', this.clients());
      const searchResults = await this.clients()
        ?.[indexName]?.collections(indexName)
        .documents()
        .search(searchParameters);
      console.log('search results from typesense', searchResults);
      const hits =
        searchResults?.hits?.map((hit) => ({
          ...hit.document
        })) || [];

      return this.processHits(hits) as T[];
    } catch (error) {
      console.error('Typesense search error:', error);
      throw new Error(`Failed to search in Typesense: ${error}`);
    }
  }

  /**
   * Override processHits to handle Typesense-specific fields
   */
  protected override processHits(hits: any[]): any[] {
    return hits.map((hit) => {
      const {
        objectID,
        _highlightResult,
        _rankingInfo,
        _distinctSeqID,
        _snippetResult,
        // Typesense specific fields
        highlights,
        text_match,
        ...itemData
      } = hit;
      return this.fs.convertTimestampsToDates(itemData);
    });
  }
}
