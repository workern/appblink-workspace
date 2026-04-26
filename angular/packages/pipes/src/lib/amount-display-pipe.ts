import { Pipe, PipeTransform } from '@angular/core';
import { Amount } from '@workern/models';

@Pipe({
  name: 'amountDisplay',
  standalone: true
})
export class AmountDisplayPipe implements PipeTransform {
  transform(
    amount: number | null | undefined | Amount,
    currencySymbol = ''
  ): string {
    if (
      typeof amount == 'object' &&
      amount.value != undefined &&
      amount.symbol != undefined
    ) {
      currencySymbol = amount.symbol;
      amount = amount.value;
    }
    if (amount == null) return '';
    const formatted = ((amount as number) / 100).toFixed(2);
    return `${currencySymbol}${formatted}`;
  }
}
