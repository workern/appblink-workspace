import { Timestamp } from 'firebase-admin/firestore';
import {
  TASK_RESPONSE_STATE_APPROVED,
  TASK_RESPONSE_STATE_PENDING,
  TASK_RESPONSE_STATE_REJECTED
} from '../constants';

export function nth(d) {
  if (d > 3 && d < 21) return 'th';
  switch (d % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export function getRequesterResponseMessage(response) {
  if (response == TASK_RESPONSE_STATE_PENDING) return 'Pending';
  else if (response == TASK_RESPONSE_STATE_APPROVED) return 'Approved';
  else if (response == TASK_RESPONSE_STATE_REJECTED) return 'Rejected';
  else return 'Unknown state';
}

export function calculateAge(dateOfBirth: Timestamp): number {
  const birthDate = dateOfBirth.toDate();
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  // Adjust age if the birthday hasn't occurred yet this year
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

export function format(string: string): string {
  // Check if the string contains both uppercase and lowercase letters
  const hasBothCases = /[a-z]/.test(string) && /[A-Z]/.test(string);

  let formattedString;

  if (hasBothCases) {
    // If the string has both lowercase and uppercase, add space before capital letters
    formattedString = string
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/([A-Z])/g, ' $1') // Insert space before uppercase letters
      .toLowerCase(); // Convert the whole string to lowercase
  } else {
    // If the string is all uppercase, make only the first letter uppercase
    formattedString = string
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .toLowerCase(); // Convert the whole string to lowercase
  }

  // Capitalize the first letter of each word
  formattedString = formattedString.replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

  return formattedString.trim(); // Trim to remove any leading/trailing spaces
}

export function toCamelCase(str: string): string {
  return str
    .replace(/([-_ ][a-z])/gi, (group) =>
      group.toUpperCase().replace('-', '').replace('_', '').replace(' ', '')
    )
    .replace(/^[A-Z]/, (first) => first.toLowerCase());
}
