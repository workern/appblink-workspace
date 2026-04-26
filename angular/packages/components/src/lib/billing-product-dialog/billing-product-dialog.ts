import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentDialog } from '../payment-dialog/payment-dialog';

@Component({
  selector: 'wn-billing-product-dialog',
  imports: [CommonModule, PaymentDialog],
  templateUrl: './billing-product-dialog.html',
  styleUrl: './billing-product-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillingProductDialog {
  readonly open = input(false);

  readonly canceled = output<void>();
  readonly checkoutStarted = output<unknown>();
  readonly checkoutCompleted = output<unknown>();
  readonly checkoutFailed = output<string>();
}
