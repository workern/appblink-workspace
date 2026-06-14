import {
  Component,
  input,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormField, FieldTree } from '@angular/forms/signals';
import { createModel, PhoneCountrySignals } from './model';
import { FieldDescriptor } from './descriptor';
import { WorkernTextFieldComponent } from '../workern-text-field/workern-text-field.component';
import { WorkernCheckboxComponent } from '../workern-checkbox/workern-checkbox.component';
import { WorkernButtonComponent } from '../workern-button/workern-button.component';
import { WorkernSelectComponent } from '../workern-select/workern-select.component';
import { WorkernSwitchComponent } from '../workern-switch/workern-switch.component';
import { WorkernPhoneInputComponent } from '../workern-phone-input/workern-phone-input.component';
import { CountryDialCode, DEFAULT_COUNTRY } from '../login/country-codes.data';

@Component({
  selector: 'wn-dynamic-form',
  templateUrl: './dynamic-form.html',
  styleUrls: ['./dynamic-form.css'],
  imports: [
    FormField,
    WorkernTextFieldComponent,
    WorkernCheckboxComponent,
    WorkernButtonComponent,
    WorkernSelectComponent,
    WorkernSwitchComponent,
    WorkernPhoneInputComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicForm {
  readonly descriptor = input.required<FieldDescriptor>();
  readonly field = input.required<FieldTree<object>>();
  /**
   * Pass the map returned from `applyDescriptorValidators` here.
   * When present, country changes update the reactive signals that drive the
   * signals-form validators, so form validity stays in sync automatically.
   */
  readonly phoneCountrySignals = input<PhoneCountrySignals | null>(null);

  protected readonly imagePreviews = signal<Map<string, string[]>>(new Map());

  protected onPhoneCountryChange(
    fieldName: string,
    country: CountryDialCode
  ): void {
    // Update the signals-form reactive validator signal if connected.
    const sigMap = this.phoneCountrySignals();
    if (sigMap?.has(fieldName)) {
      sigMap.get(fieldName)!.set(country);
    }
  }

  protected phoneError(
    field: FieldTree<string>,
    fieldName: string,
    desc: any
  ): string {
    const f = (field as any)();
    if (!f.touched()) return '';
    // Errors from the signals form (includes our reactive phoneInvalid rule).
    if (f.errors().length > 0) {
      return f.errors()[0]?.message || '';
    }
    return '';
  }

  addItem(item: FieldTree<object[]>, descriptor: FieldDescriptor): void {
    item().value.update((v) => [...v, createModel(descriptor)]);
  }

  removeItem(item: FieldTree<object[]>, index: number): void {
    item().value.update((v) => v.filter((_, i) => i !== index));
  }

  onImageSelected(
    event: Event,
    field: FieldTree<string | File[]>,
    descriptor: any
  ): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) return;

    const maxFiles = descriptor.maxFiles || 5;
    const maxSizeMB = descriptor.maxSizeMB || 5;
    const fieldId = this.getFieldId(field);
    const currentPreviews = this.imagePreviews().get(fieldId) || [];

    const newFiles = Array.from(files).slice(
      0,
      maxFiles - currentPreviews.length
    );
    console.log('Selected files:', newFiles);
    field().value.set(newFiles);
    newFiles.forEach((file) => {
      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        console.warn(`File ${file.name} exceeds ${maxSizeMB}MB limit`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const updatedPreviews = [
          ...(this.imagePreviews().get(fieldId) || []),
          result
        ];

        this.imagePreviews.update((map) => {
          const newMap = new Map(map);
          newMap.set(fieldId, updatedPreviews);
          return newMap;
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    input.value = '';
  }

  removeImage(field: FieldTree<string>, index: number): void {
    const fieldId = this.getFieldId(field);
    const currentPreviews = this.imagePreviews().get(fieldId) || [];
    const updatedPreviews = currentPreviews.filter((_, i) => i !== index);

    this.imagePreviews.update((map) => {
      const newMap = new Map(map);
      newMap.set(fieldId, updatedPreviews);
      return newMap;
    });

    // Update field value
    field().value.set(updatedPreviews.join(','));
  }

  getImagePreviews(field: FieldTree<string>): string[] {
    const fieldId = this.getFieldId(field);
    return this.imagePreviews().get(fieldId) || [];
  }

  private getFieldId(field: FieldTree<string | File[]>): string {
    // Create a unique identifier for the field
    return `field_${field().name}`;
  }
}
