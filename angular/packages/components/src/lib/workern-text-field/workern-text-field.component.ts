import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  model
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FieldTree, FormField } from '@angular/forms/signals';
import {
  FieldDescriptor,
  TextFieldDescriptor
} from '../dynamic-form/descriptor';

@Component({
  selector: 'wn-text-field',
  templateUrl: './workern-text-field.component.html',
  styleUrl: './workern-text-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, FormField]
})
export class WorkernTextFieldComponent {
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly type = input<'text' | 'email' | 'password' | 'tel' | 'url'>('text');
  readonly enabled = input<boolean>(true);
  readonly autofocus = input<boolean>(false);
  readonly primaryColor = input<string>('#6c5ce7');
  readonly id = input<string>(
    `textfield-${Math.random().toString(36).substring(7)}`
  );
  readonly error = input<string>('');
  readonly formField = input<FieldTree<string>>();
  readonly descriptor = input<TextFieldDescriptor>();
}
