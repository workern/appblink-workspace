class ShopLogos {
  final String? landscape;
  final String? square;
  final String? small;
  final String? portrait;

  ShopLogos({this.landscape, this.square, this.small, this.portrait});

  factory ShopLogos.fromJson(Map<String, dynamic> json) {
    return ShopLogos(
      landscape: json['landscape'],
      square: json['square'],
      small: json['small'],
      portrait: json['portrait'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (landscape != null) 'landscape': landscape,
      if (square != null) 'square': square,
      if (small != null) 'small': small,
      if (portrait != null) 'portrait': portrait,
    };
  }
}
