export function getPhoneNumberWithoutCountryCode(
  inputString: string
): string | null {
  // Check for empty or falsy input quickly return null
  if (!inputString) {
    return null;
  }

  // Use a more specific regex pattern and directly return the result if found
  const match = inputString.match(/\+\(\d+\)\((\d+)\)/);
  return match ? match[1] : null;
}
