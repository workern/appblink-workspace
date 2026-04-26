export type FieldDescriptor =
  | LeafFieldDescriptor
  | ArrayFieldDescriptor
  | ObjectFieldDescriptor
  | NumberFieldDescriptor;

export interface ArrayFieldDescriptor {
  readonly type: 'array';
  readonly template: FieldDescriptor;
  readonly initialValue: unknown[];
}

export interface ObjectFieldDescriptor {
  readonly type: 'object';
  readonly properties: Array<FieldDescriptor & { readonly name: string }>;
}

export interface BaseLeafFieldDescriptor {
  readonly required?: boolean;
  readonly show?: () => boolean;
  readonly displayName?: string;
  readonly separateRow?: boolean;
}

export interface TextFieldDescriptor extends BaseLeafFieldDescriptor {
  readonly type: 'text';
  readonly initialValue: string;
  readonly maxLength?: number;
  readonly minLength?: number;
}

export interface NumberFieldDescriptor extends BaseLeafFieldDescriptor {
  readonly type: 'number';
  readonly initialValue: number;
  readonly min?: number;
  readonly max?: number;
}

export interface CheckboxFieldDescriptor extends BaseLeafFieldDescriptor {
  readonly type: 'checkbox';
  readonly initialValue: boolean;
}

export interface ImageFieldDescriptor extends BaseLeafFieldDescriptor {
  readonly type: 'image';
  readonly initialValue: string;
  readonly maxSizeMB?: number;
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly maxFiles?: number;
}

export interface DateFieldDescriptor extends BaseLeafFieldDescriptor {
  readonly type: 'date';
  readonly initialValue: string;
  readonly min?: string;
  readonly max?: string;
}

export type LeafFieldDescriptor =
  | TextFieldDescriptor
  | CheckboxFieldDescriptor
  | ImageFieldDescriptor
  | DateFieldDescriptor
  | NumberFieldDescriptor;
