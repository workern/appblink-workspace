/// Shop opening hours for a specific day
class DayHours {
  final String openTime; // e.g., "09:00"
  final String closeTime; // e.g., "20:00"
  final bool closed;

  DayHours({
    required this.openTime,
    required this.closeTime,
    this.closed = false,
  });

  factory DayHours.fromJson(Map<String, dynamic> json) {
    try {
      return DayHours(
        openTime: _safeString(json['openTime'], '09:00'),
        closeTime: _safeString(json['closeTime'], '20:00'),
        closed: _safeBool(json['closed']),
      );
    } catch (e) {
      return DayHours(openTime: '09:00', closeTime: '20:00', closed: false);
    }
  }

  Map<String, dynamic> toJson() => {
    'openTime': openTime,
    'closeTime': closeTime,
    'closed': closed,
  };

  static String _safeString(dynamic value, String defaultValue) {
    if (value == null) return defaultValue;
    final str = value.toString().trim();
    return str.isEmpty ? defaultValue : str;
  }

  static bool _safeBool(dynamic value) {
    if (value == null) return false;
    if (value is bool) return value;
    if (value is String) return value.toLowerCase() == 'true';
    return false;
  }
}
