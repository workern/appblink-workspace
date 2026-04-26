import 'day_hours.dart';

/// Shop working hours for the entire week
class WorkingHours {
  final DayHours monday;
  final DayHours tuesday;
  final DayHours wednesday;
  final DayHours thursday;
  final DayHours friday;
  final DayHours saturday;
  final DayHours sunday;

  WorkingHours({
    required this.monday,
    required this.tuesday,
    required this.wednesday,
    required this.thursday,
    required this.friday,
    required this.saturday,
    required this.sunday,
  });

  factory WorkingHours.fromJson(Map<String, dynamic> json) => WorkingHours(
    monday: DayHours.fromJson(json['monday'] ?? {}),
    tuesday: DayHours.fromJson(json['tuesday'] ?? {}),
    wednesday: DayHours.fromJson(json['wednesday'] ?? {}),
    thursday: DayHours.fromJson(json['thursday'] ?? {}),
    friday: DayHours.fromJson(json['friday'] ?? {}),
    saturday: DayHours.fromJson(json['saturday'] ?? {}),
    sunday: DayHours.fromJson(json['sunday'] ?? {}),
  );

  Map<String, dynamic> toJson() => {
    'monday': monday.toJson(),
    'tuesday': tuesday.toJson(),
    'wednesday': wednesday.toJson(),
    'thursday': thursday.toJson(),
    'friday': friday.toJson(),
    'saturday': saturday.toJson(),
    'sunday': sunday.toJson(),
  };
}
