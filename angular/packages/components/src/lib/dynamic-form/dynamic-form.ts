import {
  Component,
  input,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormField, FieldTree } from '@angular/forms/signals';
import { createModel } from './model';
import { FieldDescriptor } from './descriptor';
import { WorkernTextFieldComponent } from '../workern-text-field/workern-text-field.component';
import { WorkernCheckboxComponent } from '../workern-checkbox/workern-checkbox.component';
import { WorkernButtonComponent } from '../workern-button/workern-button.component';

@Component({
  selector: 'wn-dynamic-form',
  templateUrl: './dynamic-form.html',
  styleUrls: ['./dynamic-form.css'],
  imports: [
    FormField,
    WorkernTextFieldComponent,
    WorkernCheckboxComponent,
    WorkernButtonComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicForm {
  readonly descriptor = input.required<FieldDescriptor>();
  readonly field = input.required<FieldTree<object>>();

  protected readonly imagePreviews = signal<Map<string, string[]>>(new Map());

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
