import { ShopAddress } from './shop-address';
import { Base } from '../base.model';
import { Verification } from '../verification/verification-data';
import { VerificationStatus } from '../verification/verification-status.model';
import { NikatSettings } from './nikat-settings.model';
import { ShopLogoUrls } from './shop-logos.model';
import { CategoryOption } from './shop.model';

export interface ShopOwnerRecord<T = Date> extends Base {
  name: string;
  contactNumber: string;
  category: CategoryOption['value'];
  whatsappNumber?: string;
  address: ShopAddress;
  email?: string;
  verification?: Verification<T>;
  nikatSettings: NikatSettings;
  logos: ShopLogoUrls;
}

export function getNewShopTemplate(
  shopRef: any,
  user: { uid: string; name?: string; email?: string }
): ShopOwnerRecord {
  const spaceRef = shopRef.parent.parent;
  const newShopTemplate: ShopOwnerRecord = {
    id: shopRef.id,
    name: '',
    contactNumber: '',
    category: 'others',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      formatted: '',
      coordinates: { lat: 0, lng: 0, geoHash: '' },
      google: {
        placeId: '',
        mapsLink: ''
      }
    },
    email: user.email || '',
    verification: {
      status: VerificationStatus.NOT_STARTED,
      remarks: '',
      updatedAt: null,
      handledBy: null,
      documents: {}
    },
    nikatSettings: {
      visibility: {
        shop: false,
        products: 'none'
      },
      order: {
        canPlaceOrders: false,
        minimumAmount: {
          value: 5000, // 50 rupees in paise
          currency: 'INR',
          symbol: '₹'
        },
        timings: {
          monday: { openTime: '11:00', closeTime: '20:00', closed: false },
          tuesday: { openTime: '11:00', closeTime: '20:00', closed: false },
          wednesday: { openTime: '11:00', closeTime: '20:00', closed: false },
          thursday: { openTime: '11:00', closeTime: '20:00', closed: false },
          friday: { openTime: '11:00', closeTime: '20:00', closed: false },
          saturday: { openTime: '11:00', closeTime: '20:00', closed: false },
          sunday: { openTime: '11:00', closeTime: '20:00', closed: false }
        },
        paymentMethods: ['online'],
        allowedOrderTypes: ['instant', 'scheduled', 'periodic']
      },
      delivery: {
        managedBy: 'shop',
        selfDelivery: {
          deliveryChargesPerKm: {
            value: 1000, // 10 rupees in paise
            currency: 'INR',
            symbol: '₹'
          },
          freeDeliveryUptoKm: 2,
          maxDeliveryUptoKm: 4,
          deliveryTime: 'within_1_hour',
          mininmumOrderAmountForFreeDelivery: {
            value: 20000, // 200 rupees in paise
            currency: 'INR',
            symbol: '₹'
          }
        }
      },
      termsAndConditions: {
        returns: {
          days: 7,
          notAllowed: true
        },
        exchange: {
          days: 7,
          notAllowed: true
        }
      }
    },
    owner: {
      uid: user.uid,
      name: user.name || ''
    },
    space: {
      id: spaceRef.id
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    logos: {
      landscape: '',
      square: '',
      small: '',
      portrait: ''
    }
  };
  return newShopTemplate;
}
