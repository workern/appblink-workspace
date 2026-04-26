import { Injectable } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { get, set } from 'lodash';
@Injectable({
  providedIn: 'root'
})
export class FirestoreHelpers {
  convertTimestampsToDates(item: any): any {
    const explicitPaths = [
      'expiryDate',
      'date',
      'expiryDates.closest',
      'expiryDates.all',
      'expiryDates.farthest',
      'createdAt',
      'updatedAt',
      'items',
      'placedAt',
      'paidAt',
      'verification.verifiedAt'
    ];

    // Handle explicitly listed paths (supports dot-notation, arrays, nested objects)
    explicitPaths.forEach((propPath) => {
      const value = get(item, propPath);
      if (value instanceof Timestamp) {
        set(item, propPath, value.toDate());
      } else if (value instanceof Number) {
        set(item, propPath, new Date(value as number));
      } else if (Array.isArray(value)) {
        const updated = value.map((entry: any) => {
          if (entry instanceof Timestamp) {
            return entry.toDate();
          } else if (entry instanceof Number) {
            return new Date(entry as number);
          } else if (typeof entry === 'object' && entry !== null) {
            return this.convertTimestampsToDates(entry);
          }
          return entry;
        });
        set(item, propPath, updated);
      }
    });

    // For all other top-level keys not covered by explicit paths, auto-convert Timestamps
    const topLevelExplicit = new Set(explicitPaths.map((p) => p.split('.')[0]));
    Object.keys(item).forEach((key) => {
      if (topLevelExplicit.has(key)) return;
      const value = item[key];
      if (value instanceof Timestamp) {
        item[key] = value.toDate();
      } else if (Array.isArray(value)) {
        item[key] = value.map((entry: any) => {
          if (entry instanceof Timestamp) return entry.toDate();
          if (typeof entry === 'object' && entry !== null)
            return this.convertTimestampsToDates(entry);
          return entry;
        });
      }
    });

    // Handle variants object with dynamic keys
    if (item.variants && typeof item.variants === 'object') {
      Object.keys(item.variants).forEach((variantKey) => {
        const variant = item.variants[variantKey];
        if (variant && typeof variant === 'object') {
          // Convert expiryDates within each variant
          [
            'expiryDates.closest',
            'expiryDates.all',
            'expiryDates.farthest'
          ].forEach((propPath) => {
            const value = get(variant, propPath);
            if (value instanceof Timestamp) {
              set(variant, propPath, value.toDate());
            } else if (value instanceof Number) {
              set(variant, propPath, new Date(value as number));
            } else if (Array.isArray(value)) {
              const updated = value.map((v: any) => {
                if (v instanceof Timestamp) {
                  return v.toDate();
                } else if (v instanceof Number) {
                  return new Date(v as number);
                }
                return v;
              });
              set(variant, propPath, updated);
            }
          });
        }
      });
    }

    return item;
  }
}
