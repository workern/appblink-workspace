/**
 * Common button variants across UI libraries
 */
export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/**
 * Common input types across UI libraries
 */
export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url';

/**
 * Common dialog sizes
 */
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Base props for button components
 */
export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Base props for input components
 */
export interface InputProps {
  type?: InputType;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  hint?: string;
}

/**
 * Base props for dialog components
 */
export interface DialogProps {
  size?: DialogSize;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
}

/**
 * Base props for card components
 */
export interface CardProps {
  hoverable?: boolean;
  clickable?: boolean;
  elevated?: boolean;
}

/**
 * Base props for dropdown components
 */
export interface DropdownProps {
  align?: 'start' | 'end' | 'center';
  side?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
}

/**
 * Base props for dropdown item components
 */
export interface DropdownItemProps {
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  inset?: boolean;
}
