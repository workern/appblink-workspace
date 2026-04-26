import 'package:cloud_firestore/cloud_firestore.dart';

/// Converts various timestamp formats to DateTime
///
/// Handles the following cases:
/// - Firestore Timestamp objects
/// - ISO 8601 date strings
/// - Objects with 'seconds' and 'nanoseconds' keys
/// - DateTime objects (returns as-is)
///
/// Returns null if the value is null or cannot be parsed
DateTime? parseTimestamp(dynamic value) {
  if (value == null) return null;

  // Already a DateTime
  if (value is DateTime) return value;

  // Firestore Timestamp
  if (value is Timestamp) return value.toDate();

  // Map with seconds and nanoseconds
  if (value is Map<String, dynamic>) {
    final seconds = value['seconds'] ?? value['_seconds'];
    final nanoseconds = value['nanoseconds'] ?? value['_nanoseconds'];

    if (seconds != null) {
      final secondsInt = seconds is int
          ? seconds
          : int.tryParse(seconds.toString());
      final nanosecondsInt = nanoseconds is int
          ? nanoseconds
          : (int.tryParse(nanoseconds?.toString() ?? '0') ?? 0);

      if (secondsInt != null) {
        return DateTime.fromMillisecondsSinceEpoch(
          secondsInt * 1000 + (nanosecondsInt / 1000000).round(),
        );
      }
    }
  }

  // ISO 8601 string
  if (value is String) {
    try {
      return DateTime.parse(value);
    } catch (_) {
      return null;
    }
  }

  return null;
}

String formatDate(DateTime date) {
  final now = DateTime.now();
  final diff = now.difference(date);

  if (diff.inSeconds < 60) {
    return 'just now';
  } else if (diff.inMinutes < 60) {
    return '${diff.inMinutes}m ago';
  } else if (diff.inHours < 24) {
    return '${diff.inHours}h ago';
  } else if (diff.inDays < 7) {
    return '${diff.inDays}d ago';
  } else {
    return '${date.day}/${date.month}/${date.year}';
  }
}

String formatDateTimeFromISO(String isoDate) {
  final dateTime = DateTime.parse(isoDate);
  final now = DateTime.now();
  final difference = now.difference(dateTime);
  if (difference.inSeconds < 60) {
    return 'just now';
  } else if (difference.inMinutes < 60) {
    return '${difference.inMinutes}m ago';
  } else if (difference.inHours < 24) {
    return '${difference.inHours}h ago';
  } else {
    return '${difference.inDays}d ago';
  }
}
