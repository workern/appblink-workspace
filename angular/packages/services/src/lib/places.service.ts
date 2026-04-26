import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Coordinates, LocationService } from './location.service';

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
}

export interface PlaceDetailsResult {
  [key: string]: unknown;
}

export interface PlacePredictionWithDetails extends PlacePrediction {
  details?: PlaceDetailsResult;
}

export interface ReverseGeocodeResult {
  street: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  area: string | null;
  subLocality: string | null;
}

export interface ReverseGeocodeCurrentLocationResult {
  position: Coordinates;
  address: ReverseGeocodeResult;
}

interface GoogleApiResponse {
  status?: string;
  predictions?: GooglePlacePrediction[];
  results?: GoogleGeocodeResult[];
  result?: PlaceDetailsResult;
}

interface GooglePlacePrediction {
  place_id?: string;
  description?: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

interface GoogleGeocodeResult {
  address_components?: GoogleAddressComponent[];
}

interface GoogleAddressComponent {
  long_name?: string;
  short_name?: string;
  types?: string[];
}

@Injectable({ providedIn: 'root' })
export class PlacesService {
  private readonly http = inject(HttpClient);
  private readonly locationService = inject(LocationService);

  async searchPlaces(options: {
    query: string;
    apiKey: string;
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    fields?: string[];
  }): Promise<PlacePredictionWithDetails[]> {
    try {
      let params = new HttpParams()
        .set('input', options.query)
        .set('key', options.apiKey);

      if (options.latitude !== undefined && options.longitude !== undefined) {
        params = params.set(
          'location',
          `${options.latitude},${options.longitude}`
        );

        if (options.radiusMeters !== undefined) {
          params = params.set('radius', String(options.radiusMeters));
        }
      }

      const data = await firstValueFrom(
        this.http.get<GoogleApiResponse>(
          'https://maps.googleapis.com/maps/api/place/autocomplete/json',
          { params }
        )
      );

      const predictions = data.predictions ?? [];
      const baseResults: PlacePredictionWithDetails[] = predictions.map(
        (p) => ({
          placeId: p.place_id ?? '',
          description: p.description ?? '',
          mainText: p.structured_formatting?.main_text,
          secondaryText: p.structured_formatting?.secondary_text
        })
      );

      if (!options.fields?.length) {
        return baseResults.filter((p) => !!p.placeId);
      }

      const detailedResults = await Promise.all(
        baseResults.map(async (place) => {
          if (!place.placeId) {
            return place;
          }

          const details = await PlacesService.fetchPlaceDetails(
            place.placeId,
            options.apiKey,
            this.http,
            options.fields
          );

          return details ? { ...place, details } : place;
        })
      );

      return detailedResults;
    } catch {
      return [];
    }
  }

  static async fetchPlaceDetails(
    placeId: string,
    googleApiKey: string,
    http?: HttpClient,
    fields?: string[]
  ): Promise<PlaceDetailsResult | null> {
    if (!http) {
      return null;
    }

    try {
      let params = new HttpParams()
        .set('place_id', placeId)
        .set('key', googleApiKey);

      if (fields?.length) {
        params = params.set('fields', fields.join(','));
      }

      const data = await firstValueFrom(
        http.get<GoogleApiResponse>(
          'https://maps.googleapis.com/maps/api/place/details/json',
          { params }
        )
      );

      if (data.status === 'OK' && data.result) {
        return data.result;
      }

      return null;
    } catch {
      return null;
    }
  }

  async fetchPlaceDetails(
    placeId: string,
    googleApiKey: string,
    fields?: string[]
  ): Promise<PlaceDetailsResult | null> {
    return PlacesService.fetchPlaceDetails(
      placeId,
      googleApiKey,
      this.http,
      fields
    );
  }

  async reverseGeocode(options: {
    latitude: number;
    longitude: number;
    apiKey: string;
  }): Promise<ReverseGeocodeResult> {
    const emptyResult: ReverseGeocodeResult = {
      street: null,
      city: null,
      state: null,
      postalCode: null,
      area: null,
      subLocality: null
    };

    try {
      const params = new HttpParams()
        .set('latlng', `${options.latitude},${options.longitude}`)
        .set('key', options.apiKey);

      const data = await firstValueFrom(
        this.http.get<GoogleApiResponse>(
          'https://maps.googleapis.com/maps/api/geocode/json',
          { params }
        )
      );

      const results = data.results ?? [];
      if (!results.length) {
        return emptyResult;
      }

      const components = results[0].address_components ?? [];
      const mapped = new Map<string, string>();
      const shortMapped = new Map<string, string>();

      for (const component of components) {
        const types = component.types ?? [];
        const longName = component.long_name;
        const shortName = component.short_name;

        for (const type of types) {
          if (longName) {
            mapped.set(type, longName);
          }
          if (shortName) {
            shortMapped.set(type, shortName);
          }
        }
      }

      const route = mapped.get('route');
      const streetNumber = mapped.get('street_number');
      const fallbackStreet = mapped.get('sublocality') ?? '';
      const street =
        route && streetNumber
          ? `${streetNumber} ${route}`
          : (route ?? fallbackStreet);

      const city =
        mapped.get('locality') ??
        mapped.get('administrative_area_level_2') ??
        null;
      const state = shortMapped.get('administrative_area_level_1') ?? null;
      const postalCode = mapped.get('postal_code') ?? null;
      const subLocality =
        mapped.get('sublocality') ??
        mapped.get('sublocality_level_1') ??
        mapped.get('sublocality_level_2') ??
        null;

      return {
        street: street || null,
        city,
        state,
        postalCode,
        area: subLocality,
        subLocality
      };
    } catch {
      return emptyResult;
    }
  }

  async reverseGeocodeCurrentLocation(options: {
    apiKey: string;
  }): Promise<ReverseGeocodeCurrentLocationResult | null> {
    const position = await this.locationService.getCurrentPosition();
    if (!position) {
      return null;
    }

    const address = await this.reverseGeocode({
      latitude: position.lat,
      longitude: position.lng,
      apiKey: options.apiKey
    });

    return {
      position,
      address
    };
  }
}
