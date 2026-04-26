import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'wn-payment-waiting',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-waiting.component.html',
  styleUrls: ['./payment-waiting.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentWaitingComponent implements OnInit, OnDestroy {
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private timeoutId?: number;

  backgroundColor = '#f3f4f6'; // Default bg-gray-100

  ngOnInit(): void {
    if (typeof window != 'undefined') {
      const orderId = this.route.snapshot.paramMap.get('orderId');

      // Read backgroundColor from query parameters
      const bgColorParam = this.route.snapshot.queryParamMap.get('bg');
      if (bgColorParam) {
        // Support both hex colors and named colors
        this.backgroundColor = bgColorParam;
      }

      // Set a timeout to redirect to failure page if payment takes too long (5 minutes)
      this.timeoutId = window.setTimeout(() => {
        console.warn('Payment timeout - redirecting to failure page');
        this.router.navigate(['/order/failure']);
      }, 300000); // 5 minutes

      // Listen for payment completion events
      this.setupPaymentListeners(orderId);
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private setupPaymentListeners(orderId: string | null): void {
    // Listen for messages from Razorpay
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'PAYMENT_SUCCESS' && orderId) {
        this.router.navigate(['/order/success', orderId]);
      } else if (event.data.type === 'PAYMENT_FAILED') {
        this.router.navigate(['/order/failure']);
      }
    };

    window.addEventListener('message', messageHandler);

    // Clean up listener when component is destroyed
    window.addEventListener('beforeunload', () => {
      window.removeEventListener('message', messageHandler);
    });
  }
}
