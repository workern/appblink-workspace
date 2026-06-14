import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  forwardRef
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { HlmInput } from '@spartan/components/input';
import { HlmLabel } from '@spartan/components/label';
import { CountryCodeSelectorComponent } from '../country-code-selector/country-code-selector.component';
import { CountryDialCode, DEFAULT_COUNTRY } from '../login/country-codes.data';

@Component({
  selector: 'wn-phone-input',
  templateUrl: './workern-phone-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [HlmInput, HlmLabel, CountryCodeSelectorComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WorkernPhoneInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => WorkernPhoneInputComponent),
      multi: true
    }
  ]
})
export class WorkernPhoneInputComponent
  implements ControlValueAccessor, Validator
{
  readonly label = input<string>('');
  readonly placeholder = input<string>('Phone number');
  readonly required = input<boolean>(false);
  readonly error = input<string>('');
  readonly id = input<string>(
    `phone-${Math.random().toString(36).substring(7)}`
  );

  /** Emits the selected country whenever the user changes it. */
  readonly selectedCountryChange = output<CountryDialCode>();

  protected readonly localValue = signal<string>('');
  /** Reactive signal for the currently selected country. Can be read in a signals-form validate() rule. */
  readonly selectedCountry = signal<CountryDialCode>(DEFAULT_COUNTRY);
  protected readonly isDisabled = signal<boolean>(false);

  private onChangeFn: (v: string) => void = () => {};
  private onTouchedFn: () => void = () => {};
  private onValidatorChangeFn: () => void = () => {};

  writeValue(value: string): void {
    this.localValue.set(value ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChangeFn = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    const value = this.localValue();
    const country = this.selectedCountry();

    if (!value) return null; // required is the consumer's responsibility

    if (!/^\d+$/.test(value)) {
      return { phoneInvalid: { reason: 'digits-only' } };
    }

    if (
      country.mobileLength !== undefined &&
      value.length !== country.mobileLength
    ) {
      return {
        phoneInvalid: {
          reason: 'length',
          expected: country.mobileLength,
          actual: value.length
        }
      };
    }

    return null;
  }

  protected onInputChange(value: string): void {
    this.localValue.set(value);
    this.onChangeFn(value);
    this.onValidatorChangeFn();
  }

  protected onBlur(): void {
    this.onTouchedFn();
  }

  protected onCountrySelected(country: CountryDialCode): void {
    this.selectedCountry.set(country);
    this.selectedCountryChange.emit(country);
    this.onValidatorChangeFn();
  }
}
