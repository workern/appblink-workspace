import 'package:cloud_firestore/cloud_firestore.dart';

/// Utility functions for comparing and detecting changes in data structures
class DataComparisonUtils {
  /// Get only changed fields between original and updated maps
  ///
  /// Compares two maps and returns a new map containing only the fields
  /// that have changed. Skips 'id', 'createdAt', and 'updatedAt' fields.
  ///
  /// Example:
  /// ```dart
  /// final original = {'name': 'John', 'age': 30};
  /// final updated = {'name': 'John', 'age': 31};
  /// final changed = DataComparisonUtils.getChangedFields(original, updated);
  /// // Returns: {'age': 31}
  /// ```
  static Map<String, dynamic> getChangedFields(
    Map<String, dynamic> original,
    Map<String, dynamic> updated,
  ) {
    final changed = <String, dynamic>{};

    for (final key in updated.keys) {
      // Skip id and timestamps as they're handled separately
      if (key == 'id' || key == 'createdAt' || key == 'updatedAt') {
        continue;
      }

      final originalValue = original[key];
      final updatedValue = updated[key];

      // Compare values
      if (!areValuesEqual(originalValue, updatedValue)) {
        changed[key] = updatedValue;
      }
    }

    return changed;
  }

  /// Compare two values for equality
  ///
  /// Handles comparison of:
  /// - null values
  /// - DateTime and Timestamp objects (cross-type)
  /// - Maps (recursive comparison)
  /// - Lists (recursive comparison)
  /// - Primitive types
  ///
  /// Example:
  /// ```dart
  /// final date1 = DateTime.now();
  /// final timestamp1 = Timestamp.fromDate(date1);
  /// final isEqual = DataComparisonUtils.areValuesEqual(date1, timestamp1);
  /// // Returns: true
  /// ```
  static bool areValuesEqual(dynamic value1, dynamic value2) {
    // Handle null cases
    if (value1 == null && value2 == null) return true;
    if (value1 == null || value2 == null) return false;

    // Handle DateTime/Timestamp comparison (cross-type)
    if ((value1 is DateTime || value1 is Timestamp) &&
        (value2 is DateTime || value2 is Timestamp)) {
      final date1 = value1 is DateTime
          ? value1
          : (value1 as Timestamp).toDate();
      final date2 = value2 is DateTime
          ? value2
          : (value2 as Timestamp).toDate();
      return date1.isAtSameMomentAs(date2);
    }

    // Handle Map comparison
    if (value1 is Map && value2 is Map) {
      if (value1.length != value2.length) return false;
      for (final key in value1.keys) {
        if (!value2.containsKey(key)) return false;
        if (!areValuesEqual(value1[key], value2[key])) return false;
      }
      return true;
    }

    // Handle List comparison
    if (value1 is List && value2 is List) {
      if (value1.length != value2.length) return false;
      for (int i = 0; i < value1.length; i++) {
        if (!areValuesEqual(value1[i], value2[i])) return false;
      }
      return true;
    }

    // Default comparison
    return value1 == value2;
  }
}
