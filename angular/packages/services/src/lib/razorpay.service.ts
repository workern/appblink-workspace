import { Injectable } from '@angular/core';

import { GatewayOrderCreationResult } from '@workern/models';

declare let Razorpay: any;

@Injectable({ providedIn: 'root' })
export class RazorpayService {
  payWithRazorpay(gateway: GatewayOrderCreationResult) {
    // Small delay to ensure navigation completes before opening Razorpay

    const rzp = new Razorpay(gateway.data);
    rzp.on('payment.failed', (response: any) => {
      console.error('Payment Failed', response);
      // Send failure message to waiting page
    });
    rzp.open();
  }
}
