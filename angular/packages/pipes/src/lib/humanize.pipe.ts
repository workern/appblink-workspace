import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'humanize'
})
export class HumanizePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    
    return value
      // Handle snake_case: replace underscores with spaces
      .replace(/_/g, ' ')
      // Handle camelCase and PascalCase: add space before uppercase letters
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Handle multiple consecutive uppercase letters (e.g., XMLParser -> XML Parser)
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      // Capitalize first letter of each word
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase())
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
  }
}
