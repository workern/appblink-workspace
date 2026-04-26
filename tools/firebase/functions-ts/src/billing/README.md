# Generic Billing Products

This module provides reusable billing APIs backed by a single Firestore `products` collection.

## Firestore Collection

Use:

- `products/{productId}`

### Required shape (summary)

```json
{
  "id": "saveNestApp_starter_monthly",
  "key": "starter-monthly",
  "app": { "id": "save-nest", "name": "Save Nest" },
  "name": "Starter Monthly",
  "description": "Monthly subscription for core premium features.",
  "paymentType": "SUBSCRIPTION",
  "status": "ACTIVE",
  "sortOrder": 10,
  "features": ["Unlimited saves", "AI chat over saves"],
  "gateways": {
    "RAZORPAY": {
      "gateway": "RAZORPAY",
      "enabled": true,
      "externalProductId": "saveNestApp_starter_monthly",
      "price": {
        "amount": { "value": 19900, "currency": "INR", "symbol": "₹" },
        "intervalCount": 1,
        "intervalUnit": "MONTH"
      }
    }
  },
  "entitlement": {
    "appId": "save-nest",
    "claimKey": "starterMonthly",
    "claimValue": true,
    "customClaims": { "hasActiveSubscription": true }
  },
  "owner": { "uid": "system", "name": "System" },
  "space": { "id": "save-nest" },
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

## Callable Functions

- `billing-getProductsForApp`
  - Input: `{ appId, paymentType?, gateway?, includeInactive? }`
  - Output: `{ appId, products[] }`

- `billing-createProductCheckoutSession`
  - Input: `{ appId, productId, gateway, quantity?, langCode?, metadata? }`
  - Output:
    - External checkout: `{ mode: "EXTERNAL_CHECKOUT", gateway, product, transactionId? }`
    - In-app purchase: `{ mode: "IN_APP_PURCHASE", gateway, product }`

## Claim Activation

When a successful transaction has reason `APP_PRODUCT_PURCHASE`:

- Auth custom claims are updated for the app scope.
- `userClaims/{uid}` is updated with merged app claims.

## Seed Script

Use the script below to bootstrap sample products:

```bash
cd tools/firebase/functions-ts
node scripts/init-billing-products.js
```

Optional env vars:

- `BILLING_APP_ID`
- `BILLING_APP_NAME`
- `BILLING_SPACE_ID`
- `BILLING_OWNER_UID`
- `BILLING_OWNER_NAME`
