/// Country data model for phone authentication
class CountryCode {
  final String code;
  final String dialCode;
  final String flag;
  final String name;

  /// Expected mobile number length (digits only, excluding dial code).
  /// Null means variable length.
  final int? mobileLength;

  /// Whether the mobile number has a fixed length (enables auto-send OTP).
  final bool isFixedLength;

  CountryCode({
    required this.code,
    required this.dialCode,
    required this.flag,
    required this.name,
    this.mobileLength,
    this.isFixedLength = false,
  });
}

/// List of country codes in alphabetical order by name
final List<CountryCode> countryCodes = [
  CountryCode(code: 'AU', dialCode: '+61', flag: '🇦🇺', name: 'Australia', mobileLength: 9, isFixedLength: true),
  CountryCode(code: 'AT', dialCode: '+43', flag: '🇦🇹', name: 'Austria'),
  CountryCode(code: 'BE', dialCode: '+32', flag: '🇧🇪', name: 'Belgium'),
  CountryCode(code: 'BR', dialCode: '+55', flag: '🇧🇷', name: 'Brazil', mobileLength: 11, isFixedLength: true),
  CountryCode(code: 'CA', dialCode: '+1', flag: '🇨🇦', name: 'Canada', mobileLength: 10, isFixedLength: true),
  CountryCode(code: 'CN', dialCode: '+86', flag: '🇨🇳', name: 'China', mobileLength: 11, isFixedLength: true),
  CountryCode(code: 'DK', dialCode: '+45', flag: '🇩🇰', name: 'Denmark', mobileLength: 8, isFixedLength: true),
  CountryCode(code: 'FI', dialCode: '+358', flag: '🇫🇮', name: 'Finland'),
  CountryCode(code: 'FR', dialCode: '+33', flag: '🇫🇷', name: 'France', mobileLength: 9, isFixedLength: true),
  CountryCode(code: 'DE', dialCode: '+49', flag: '🇩🇪', name: 'Germany'),
  CountryCode(code: 'GR', dialCode: '+30', flag: '🇬🇷', name: 'Greece', mobileLength: 10, isFixedLength: true),
  CountryCode(code: 'HK', dialCode: '+852', flag: '🇭🇰', name: 'Hong Kong', mobileLength: 8, isFixedLength: true),
  CountryCode(code: 'IN', dialCode: '+91', flag: '🇮🇳', name: 'India', mobileLength: 10, isFixedLength: true),
  CountryCode(code: 'IE', dialCode: '+353', flag: '🇮🇪', name: 'Ireland'),
  CountryCode(code: 'IT', dialCode: '+39', flag: '🇮🇹', name: 'Italy'),
  CountryCode(code: 'JP', dialCode: '+81', flag: '🇯🇵', name: 'Japan', mobileLength: 10, isFixedLength: true),
  CountryCode(code: 'MX', dialCode: '+52', flag: '🇲🇽', name: 'Mexico', mobileLength: 10, isFixedLength: true),
  CountryCode(code: 'NL', dialCode: '+31', flag: '🇳🇱', name: 'Netherlands', mobileLength: 9, isFixedLength: true),
  CountryCode(code: 'NZ', dialCode: '+64', flag: '🇳🇿', name: 'New Zealand'),
  CountryCode(code: 'PK', dialCode: '+92', flag: '🇵🇰', name: 'Pakistan', mobileLength: 10, isFixedLength: true),
  CountryCode(code: 'PH', dialCode: '+63', flag: '🇵🇭', name: 'Philippines', mobileLength: 10, isFixedLength: true),
  CountryCode(code: 'PL', dialCode: '+48', flag: '🇵🇱', name: 'Poland', mobileLength: 9, isFixedLength: true),
  CountryCode(code: 'RU', dialCode: '+7', flag: '🇷🇺', name: 'Russia', mobileLength: 10, isFixedLength: true),
  CountryCode(code: 'SG', dialCode: '+65', flag: '🇸🇬', name: 'Singapore', mobileLength: 8, isFixedLength: true),
  CountryCode(code: 'KR', dialCode: '+82', flag: '🇰🇷', name: 'South Korea', mobileLength: 10, isFixedLength: true),
  CountryCode(code: 'ES', dialCode: '+34', flag: '🇪🇸', name: 'Spain', mobileLength: 9, isFixedLength: true),
  CountryCode(code: 'SE', dialCode: '+46', flag: '🇸🇪', name: 'Sweden'),
  CountryCode(code: 'TH', dialCode: '+66', flag: '🇹🇭', name: 'Thailand', mobileLength: 9, isFixedLength: true),
  CountryCode(code: 'TR', dialCode: '+90', flag: '🇹🇷', name: 'Turkey', mobileLength: 10, isFixedLength: true),
  CountryCode(
    code: 'AE',
    dialCode: '+971',
    flag: '🇦🇪',
    name: 'United Arab Emirates',
    mobileLength: 9,
    isFixedLength: true,
  ),
  CountryCode(
    code: 'GB',
    dialCode: '+44',
    flag: '🇬🇧',
    name: 'United Kingdom',
    mobileLength: 10,
    isFixedLength: true,
  ),
  CountryCode(code: 'US', dialCode: '+1', flag: '🇺🇸', name: 'United States', mobileLength: 10, isFixedLength: true),
  CountryCode(code: 'UA', dialCode: '+380', flag: '🇺🇦', name: 'Ukraine', mobileLength: 9, isFixedLength: true),
  CountryCode(code: 'VN', dialCode: '+84', flag: '🇻🇳', name: 'Vietnam', mobileLength: 9, isFixedLength: true),
];

/// Find a country code by dial code (e.g., '+91')
CountryCode? findCountryByDialCode(String dialCode) {
  try {
    return countryCodes.firstWhere((c) => c.dialCode == dialCode);
  } catch (e) {
    return null;
  }
}

/// Find a country code by country code (e.g., 'IN')
CountryCode? findCountryByCode(String code) {
  try {
    return countryCodes.firstWhere((c) => c.code == code);
  } catch (e) {
    return null;
  }
}
