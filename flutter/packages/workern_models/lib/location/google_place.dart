/// Shop Google Maps information
class GooglePlace {
  final String? placeId;
  final String? mapsLink;

  GooglePlace({this.placeId, this.mapsLink});

  factory GooglePlace.fromJson(Map<String, dynamic> json) =>
      GooglePlace(placeId: json['placeId'], mapsLink: json['mapsLink']);

  Map<String, dynamic> toJson() => {
    if (placeId != null) 'placeId': placeId,
    if (mapsLink != null) 'mapsLink': mapsLink,
  };
}
