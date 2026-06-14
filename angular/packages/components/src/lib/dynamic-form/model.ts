import {
  form,
  schema,
  FieldTree,
  Schema,
  maxLength,
  required,
  min,
  applyEach,
  max,
  minLength,
  pattern,
  validate
} from '@angular/forms/signals';
import {
  FieldDescriptor,
  ObjectFieldDescriptor,
  TextFieldDescriptor,
  PhoneFieldDescriptor
} from './descriptor';
import { signal, WritableSignal } from '@angular/core';
import { CountryDialCode, DEFAULT_COUNTRY } from '../login/country-codes.data';

/** Map of phone-field name → reactive country signal. Pass to `applyDescriptorValidators` and bind to `DynamicForm`. */
export type PhoneCountrySignals = Map<string, WritableSignal<CountryDialCode>>;

function createSchema(descriptor: FieldDescriptor): Schema<object> {
  return schema<object>((p) => defineRules(p, descriptor));
}

function defineRules(path: any, descriptor: FieldDescriptor): void {
  if ((descriptor as any)?.required) {
    required(path);
  }

  switch (descriptor.type) {
    case 'text':
      if (descriptor.maxLength !== undefined) {
        maxLength(path, descriptor.maxLength);
      }
      if (descriptor.minLength !== undefined) {
        minLength(path, descriptor.minLength);
      }
      if (descriptor.pattern !== undefined) {
        pattern(
          path,
          descriptor.pattern,
          descriptor.patternMessage
            ? { message: descriptor.patternMessage }
            : undefined
        );
      }
      break;
    case 'number':
      if (descriptor.min !== undefined) {
        min(path, descriptor.min);
      }
      if (descriptor.max !== undefined) {
        max(path, descriptor.max);
      }
      break;
    case 'checkbox':
      break;
    case 'select':
      break;
    case 'switch':
      break;
    case 'phone':
      if (descriptor.pattern !== undefined) {
        pattern(
          path,
          descriptor.pattern,
          descriptor.patternMessage
            ? { message: descriptor.patternMessage }
            : undefined
        );
      }
      break;
    case 'image':
      break;
    case 'date':
      break;
    case 'object':
      for (const property of descriptor.properties) {
        defineRules((path as any)[property.name], property);
      }
      break;
    case 'array':
      applyEach<object>(path, createSchema(descriptor.template));
      break;
  }
}

export function dynamicForm(descriptor: FieldDescriptor): FieldTree<object> {
  return form(signal(createModel(descriptor)), createSchema(descriptor));
}

export function createModel(descriptor: FieldDescriptor): object {
  const model: Record<string, object> = {};
  switch (descriptor.type) {
    case 'object':
      for (const property of descriptor.properties) {
        model[property.name] = createModel(property);
      }
      return model;
    case 'array':
      return [...descriptor.initialValue];
    default:
      return descriptor.initialValue as any;
  }
}

/**
 * Applies pattern/min/max validators from an ObjectFieldDescriptor to an
 * existing FieldTree. Call this inside your `form()` validator function to
 * keep validation rules co-located with their field descriptors.
 *
 * Does NOT apply `required` — add those manually with custom messages.
 *
 * For phone fields, a reactive `validate()` rule is registered that reads
 * from a `WritableSignal<CountryDialCode>` stored in `phoneCountrySignals`.
 * Pass the same map to `<wn-dynamic-form [phoneCountrySignals]="...">` so
 * the component can update the signal when the user switches country —
 * this automatically re-runs the validator without any manual wiring.
 */
export function applyDescriptorValidators(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any,
  descriptor: ObjectFieldDescriptor,
  phoneCountrySignals: PhoneCountrySignals = new Map()
): void {
  for (const property of descriptor.properties) {
    const path = (field as any)[property.name];
    switch (property.type) {
      case 'text': {
        const d = property as TextFieldDescriptor;
        if (d.maxLength !== undefined) maxLength(path, d.maxLength);
        if (d.minLength !== undefined) minLength(path, d.minLength);
        if (d.pattern !== undefined)
          pattern(
            path,
            d.pattern,
            d.patternMessage ? { message: d.patternMessage } : undefined
          );
        break;
      }
      case 'number':
        if (property.min !== undefined) min(path, property.min);
        if (property.max !== undefined) max(path, property.max);
        break;
      case 'phone': {
        const d = property as PhoneFieldDescriptor;
        const fieldName = (property as any).name as string;
        // Create (or reuse) a reactive country signal for this field.
        if (!phoneCountrySignals.has(fieldName)) {
          phoneCountrySignals.set(fieldName, signal(DEFAULT_COUNTRY));
        }
        const countrySig = phoneCountrySignals.get(fieldName)!;
        // Reactive validator: re-runs automatically when countrySig changes.
        validate(path, (ctx) => {
          const country = countrySig(); // reactive dependency
          const value = ctx.value() as string;
          if (!value) return null;
          if (
            country.mobileLength !== undefined &&
            value.length !== country.mobileLength
          ) {
            return {
              kind: 'phoneInvalid',
              message:
                d.patternMessage ??
                `Enter a valid ${country.mobileLength}-digit phone number.`
            };
          }
          return null;
        });
        break;
      }
    }
  }
}
