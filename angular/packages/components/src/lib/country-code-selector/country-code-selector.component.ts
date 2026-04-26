import {
  Component,
  ChangeDetectionStrategy,
  output,
  input
} from '@angular/core';
import {
  COUNTRY_DIAL_CODES,
  CountryDialCode,
  DEFAULT_COUNTRY
} from '../login/country-codes.data';
import { HlmComboboxImports } from '@spartan/components/combobox';

@Component({
  selector: 'wn-country-code-selector',
  standalone: true,
  imports: [HlmComboboxImports],
  templateUrl: './country-code-selector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountryCodeSelectorComponent {
  readonly value = input<CountryDialCode>(DEFAULT_COUNTRY);
  readonly countrySelected = output<CountryDialCode>();

  protected readonly countryCodes = COUNTRY_DIAL_CODES;

  protected readonly isEqualFn = (
    a: CountryDialCode,
    b: CountryDialCode | null
  ): boolean => a?.isoCode === b?.isoCode;

  // Per-item filter: return true if this country matches the search string
  protected readonly filterFn = (
    item: CountryDialCode,
    search: string
  ): boolean => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.dialCode.includes(q) ||
      item.flag.includes(q)
    );
  };

  protected onValueChange(country: CountryDialCode | null) {
    if (country) this.countrySelected.emit(country);
  }
}
