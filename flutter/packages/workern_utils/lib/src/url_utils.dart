/// Utility functions for URL validation and manipulation
library;

/// Checks if a string is a valid URL
///
/// Returns true if the string starts with http://, https://, or contains ://
/// (to support other protocols like ftp://, spotify://, etc.)
///
/// Examples:
/// ```dart
/// isValidUrl('https://example.com') // true
/// isValidUrl('http://example.com') // true
/// isValidUrl('ftp://example.com') // true
/// isValidUrl('just some text') // false
/// isValidUrl('') // false
/// ```
bool isValidUrl(String? text) {
  if (text == null || text.isEmpty) {
    return false;
  }

  return text.startsWith('http://') ||
      text.startsWith('https://') ||
      text.contains('://');
}

/// Checks if a string is a valid HTTP/HTTPS URL
///
/// Returns true only if the string starts with http:// or https://
///
/// Examples:
/// ```dart
/// isValidHttpUrl('https://example.com') // true
/// isValidHttpUrl('http://example.com') // true
/// isValidHttpUrl('ftp://example.com') // false
/// isValidHttpUrl('just some text') // false
/// ```
bool isValidHttpUrl(String? text) {
  if (text == null || text.isEmpty) {
    return false;
  }

  return text.startsWith('http://') || text.startsWith('https://');
}

/// Validates if a string is a proper URL using Uri.tryParse
///
/// Returns true if the string can be parsed as a valid URI with a scheme and host
///
/// Examples:
/// ```dart
/// isValidUri('https://example.com') // true
/// isValidUri('https://example.com/path?query=1') // true
/// isValidUri('not a url') // false
/// ```
bool isValidUri(String? text) {
  if (text == null || text.isEmpty) {
    return false;
  }

  final uri = Uri.tryParse(text);
  return uri != null && uri.hasScheme && uri.hasAuthority;
}
