/**
 * Seed script for generic app billing products in Firestore.
 *
 * Usage:
 *   node scripts/init-billing-products.js
 *
 * Optional env:
 *   BILLING_APP_ID=smartSaveApp
 *   BILLING_APP_NAME="Save Nest"
 *   BILLING_SPACE_ID=smartSaveApp
 *   BILLING_OWNER_UID=system
 *   BILLING_OWNER_NAME="System"
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

const GATEWAY = {
  RAZORPAY: 'RAZORPAY',
  LEMON_SQUEEZY: 'LEMON_SQUEEZY',
  DODO_PAYMENTS: 'DODO_PAYMENTS',
  PLAY_STORE: 'PLAY_STORE',
  APP_STORE: 'APP_STORE'
};

const PRODUCT_STATUS = {
  ACTIVE: 'ACTIVE'
};

const PAYMENT_TYPE = {
  ONE_TIME: 'ONE_TIME',
  SUBSCRIPTION: 'SUBSCRIPTION'
};

const BILLING_INTERVAL = {
  MONTH: 'MONTH',
  YEAR: 'YEAR'
};

const appId = process.env.BILLING_APP_ID || 'smartSaveApp';
const appName = process.env.BILLING_APP_NAME || 'Save Nest';
const spaceId = process.env.BILLING_SPACE_ID || appId;
const ownerUid = process.env.BILLING_OWNER_UID || 'system';
const ownerName = process.env.BILLING_OWNER_NAME || 'System';

const buildBase = (id) => ({
  id,
  owner: { uid: ownerUid, name: ownerName },
  space: { id: spaceId },
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});

const products = [
  {
    id: `${appId}_starter_monthly`,
    key: 'starter-monthly',
    name: 'Starter Monthly',
    description: 'Monthly subscription for core premium features.',
    paymentType: PAYMENT_TYPE.SUBSCRIPTION,
    status: PRODUCT_STATUS.ACTIVE,
    sortOrder: 10,
    features: ['Unlimited saves', 'AI chat over saves', 'Priority support'],
    gateways: {
      [GATEWAY.RAZORPAY]: {
        gateway: GATEWAY.RAZORPAY,
        enabled: true,
        externalProductId: `${appId}_starter_monthly`,
        price: {
          amount: { value: 19900, currency: 'INR', symbol: '₹' },
          intervalCount: 1,
          intervalUnit: BILLING_INTERVAL.MONTH,
          displayLabel: 'Popular'
        }
      },
      [GATEWAY.LEMON_SQUEEZY]: {
        gateway: GATEWAY.LEMON_SQUEEZY,
        enabled: true,
        externalProductId: `${appId}_starter_monthly`,
        externalPriceId: 'REPLACE_WITH_LEMONSQUEEZY_VARIANT_ID',
        price: {
          amount: { value: 999, currency: 'USD', symbol: '$' },
          intervalCount: 1,
          intervalUnit: BILLING_INTERVAL.MONTH
        }
      },
      [GATEWAY.DODO_PAYMENTS]: {
        gateway: GATEWAY.DODO_PAYMENTS,
        enabled: false,
        externalProductId: 'REPLACE_WITH_DODO_PRODUCT_ID',
        price: {
          amount: { value: 999, currency: 'USD', symbol: '$' },
          intervalCount: 1,
          intervalUnit: BILLING_INTERVAL.MONTH
        }
      },
      [GATEWAY.PLAY_STORE]: {
        gateway: GATEWAY.PLAY_STORE,
        enabled: true,
        externalProductId: `${appId}.starter.monthly`,
        price: {
          amount: { value: 19900, currency: 'INR', symbol: '₹' },
          intervalCount: 1,
          intervalUnit: BILLING_INTERVAL.MONTH
        }
      },
      [GATEWAY.APP_STORE]: {
        gateway: GATEWAY.APP_STORE,
        enabled: true,
        externalProductId: `${appId}.starter.monthly`,
        price: {
          amount: { value: 19900, currency: 'INR', symbol: '₹' },
          intervalCount: 1,
          intervalUnit: BILLING_INTERVAL.MONTH
        }
      }
    },
    app: { id: appId, name: appName },
    entitlement: {
      appId,
      claimKey: 'starterMonthly',
      claimValue: true,
      customClaims: {
        hasActiveSubscription: true
      }
    },
    metadata: {
      logoUrl: 'https://workern-assets.b-cdn.net/workern_logo.png'
    }
  },
  {
    id: `${appId}_lifetime`,
    key: 'lifetime',
    name: 'Lifetime Access',
    description: 'One-time purchase for lifetime access.',
    paymentType: PAYMENT_TYPE.ONE_TIME,
    status: PRODUCT_STATUS.ACTIVE,
    sortOrder: 20,
    features: ['Lifetime access', 'No recurring billing'],
    gateways: {
      [GATEWAY.RAZORPAY]: {
        gateway: GATEWAY.RAZORPAY,
        enabled: true,
        externalProductId: `${appId}_lifetime`,
        price: {
          amount: { value: 499900, currency: 'INR', symbol: '₹' },
          displayLabel: 'Best value'
        }
      },
      [GATEWAY.LEMON_SQUEEZY]: {
        gateway: GATEWAY.LEMON_SQUEEZY,
        enabled: true,
        externalProductId: `${appId}_lifetime`,
        externalPriceId: 'REPLACE_WITH_LEMONSQUEEZY_VARIANT_ID',
        price: {
          amount: { value: 9900, currency: 'USD', symbol: '$' }
        }
      }
    },
    app: { id: appId, name: appName },
    entitlement: {
      appId,
      claimKey: 'lifetime',
      claimValue: true,
      customClaims: {
        hasLifetimeAccess: true
      }
    },
    metadata: {
      logoUrl: 'https://workern-assets.b-cdn.net/workern_logo.png'
    }
  }
];

async function seedProducts() {
  console.log(`Seeding products for appId=${appId} ...`);

  const batch = db.batch();

  for (const product of products) {
    const ref = db.collection('products').doc(product.id);
    batch.set(
      ref,
      {
        ...buildBase(product.id),
        ...product
      },
      { merge: true }
    );
  }

  await batch.commit();

  console.log('✅ Billing products seed complete.');
  console.log('Products written:');
  products.forEach((product) => {
    console.log(` - products/${product.id}`);
  });
  console.log('\nNext steps:');
  console.log('1) Replace placeholder external IDs (Lemon Squeezy / Dodo).');
  console.log(
    '2) Call billing-getProductsForApp from Angular/Flutter services.'
  );
  console.log('3) Use billing-createProductCheckoutSession for checkout.');
}

seedProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error seeding billing products:', error);
    process.exit(1);
  });
