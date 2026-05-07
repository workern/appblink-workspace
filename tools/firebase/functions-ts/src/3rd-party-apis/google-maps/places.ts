import axios from 'axios';
import { logger } from 'firebase-functions';
import { SearchResult, SearchResultType } from '../../apps/smart-save/types';

const GOOGLE_PLACES_API_KEY = 'AIzaSyDKALiD1adXRI-E5AS7AD8t8tNG_mguPOc';

export interface GooglePlaceResult {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
}

/**
 * Search Google Places API for locations matching the query
 * @param query Search query string
 * @param limit Maximum number of results to return (default: 3)
 * @returns Array of normalized SearchResult objects
 */
export async function searchGooglePlaces(
  query: string,
  limit = 3
): Promise<SearchResult[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    logger.warn('Google Places API key is not configured');
    return [];
  }

  try {
    logger.info('Searching Google Places', { query });
    const placesResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
      {
        params: {
          input: query,
          key: GOOGLE_PLACES_API_KEY
        }
      }
    );

    if (
      !placesResponse.data ||
      !placesResponse.data.predictions ||
      placesResponse.data.predictions.length === 0
    ) {
      return [];
    }

    const predictions: GooglePlaceResult[] =
      placesResponse.data.predictions.slice(0, limit);

    return predictions.map((prediction) => {
      const mainText =
        prediction.structured_formatting?.main_text || prediction.description;
      const secondaryText = prediction.structured_formatting?.secondary_text;

      return {
        type: SearchResultType.GOOGLE_PLACE,
        sourceUrl: `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${prediction.place_id}`,
        media: [],
        content: {
          title: mainText,
          text: prediction.description
        },
        metadata: {
          placeId: prediction.place_id,
          secondaryText
        },
        title: mainText,
        subTitle: secondaryText || prediction.description
      };
    });
  } catch (err) {
    logger.error('Failed to search Google Places', {
      error: (err as Error).message
    });
    return [];
  }
}
