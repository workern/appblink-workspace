import { computed, Injectable, resource, signal } from '@angular/core';

export interface Coordinates {
  lat: number;
  lng: number;
}

export type GeolocationPermissionState =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unsupported';

@Injectable({ providedIn: 'root' })
export class LocationService {
  userLocation$ = resource({
    params: () => ({}),
    loader: async ({ params }) => {
      return new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            },
            (error) => {
              console.error('Geolocation error:', error);
              this.handleLocationError(error);
              resolve(null);
            }
          );
        } else {
          return resolve(null);
        }
      });
    }
  });
  userLocation = computed(() => this.userLocation$.value());
  locationError = signal<string | null>(null);

  async isLocationServiceEnabled(): Promise<boolean> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    return !!navigator.geolocation;
  }

  async checkPermission(): Promise<GeolocationPermissionState> {
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      !('permissions' in navigator)
    ) {
      return 'unsupported';
    }

    try {
      const permissionStatus = await navigator.permissions.query({
        name: 'geolocation'
      });
      return permissionStatus.state;
    } catch {
      return 'unsupported';
    }
  }

  async requestPermission(): Promise<GeolocationPermissionState> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'unsupported';
    }

    if (!navigator.geolocation) {
      return 'unsupported';
    }

    return new Promise<GeolocationPermissionState>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve('granted'),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve('denied');
          } else {
            resolve('prompt');
          }
        }
      );
    });
  }

  async getCurrentPosition(): Promise<Coordinates | null> {
    try {
      const serviceEnabled = await this.isLocationServiceEnabled();
      if (!serviceEnabled) {
        this.locationError.set('Location services are disabled.');
        return null;
      }

      const permission = await this.checkPermission();

      if (permission === 'denied') {
        this.locationError.set('Location permissions are denied.');
        return null;
      }

      if (permission === 'unsupported') {
        this.locationError.set('Location services are not supported.');
        return null;
      }

      const effectivePermission =
        permission === 'prompt' ? await this.requestPermission() : permission;

      if (effectivePermission !== 'granted') {
        this.locationError.set('Location permissions are denied.');
        return null;
      }

      return new Promise<Coordinates | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.locationError.set(null);
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            this.handleLocationError(error);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      });
    } catch {
      this.locationError.set('Error getting location.');
      return null;
    }
  }

  async getLastKnownPosition(): Promise<Coordinates | null> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return null;
    }

    if (!navigator.geolocation) {
      return null;
    }

    return new Promise<Coordinates | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: 300000
        }
      );
    });
  }

  private handleLocationError(error: GeolocationPositionError): void {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.locationError.set('User denied the request for Geolocation.');
        break;
      case error.POSITION_UNAVAILABLE:
        this.locationError.set('Location information is unavailable.');
        break;
      case error.TIMEOUT:
        this.locationError.set('The request to get user location timed out.');
        break;
      default:
        this.locationError.set('An unknown error occurred.');
        break;
    }
  }

  /**
   * Calculates the distance between two geographical coordinates using the Haversine formula.
   * @param coords1 - The first coordinate object { lat, lng }.
   * @param coords2 - The second coordinate object { lat, lng }.
   * @returns The distance in kilometers.
   */
  calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
    const toRad = (value: number) => (value * Math.PI) / 180;

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLng = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
  }

  calculateDistanceInMeters(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): number {
    return (
      this.calculateDistance(
        { lat: startLat, lng: startLng },
        { lat: endLat, lng: endLng }
      ) * 1000
    );
  }
}
