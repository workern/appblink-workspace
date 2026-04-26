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
  minLength
} from '@angular/forms/signals';
import { FieldDescriptor } from './descriptor';
import { signal } from '@angular/core';

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
