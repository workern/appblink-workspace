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

export interface FieldOption {
  readonly value: string;
  readonly label: string;
}

export interface TextFieldDescriptor extends BaseLeafFieldDescriptor {
  readonly type: 'text';
  readonly initialValue: string;
  readonly maxLength?: number;
  readonly minLength?: number;
  readonly pattern?: RegExp;
  readonly patternMessage?: string;
  readonly inputType?: 'text' | 'tel' | 'email' | 'url' | 'password';
  readonly placeholder?: string;
}

export interface NumberFieldDescriptor extends BaseLeafFieldDescriptor {
  readonly type: 'number';
  readonly initialValue: number;
  readonly min?: number;
  readonly max?: number;
  readonly placeholder?: string;
}

export interface CheckboxFieldDescriptor extends BaseLeafFieldDescriptor {
  readonly type: 'checkbox';
  readonly initialValue: boolean;
  readonly description?: string;
}

export interface SelectFieldDescriptor extends BaseLeafFieldDescriptor {
  readonly type: 'select';
  readonly initialValue: string;
  readonly options: FieldOption[];
  readonly placeholder?: string;
}

export interface SwitchFieldDescriptor extends BaseLeafFieldDescriptor {
  readonly type: 'switch';
  readonly initialValue: boolean;
  readonly subtitle?: string;
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
  | NumberFieldDescriptor
  | SelectFieldDescriptor
  | SwitchFieldDescriptor
  | PhoneFieldDescriptor;

export interface PhoneFieldDescriptor extends BaseLeafFieldDescriptor {
  readonly type: 'phone';
  readonly initialValue: string;
  readonly placeholder?: string;
  readonly pattern?: RegExp;
  readonly patternMessage?: string;
}
