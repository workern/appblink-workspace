/// Country data model for phone authentication
class CountryCode {
  final String code;
  final String dialCode;
  final String flag;
  final String name;

  CountryCode({
    required this.code,
    required this.dialCode,
    required this.flag,
    required this.name,
  });
}

/// List of country codes in alphabetical order by name
final List<CountryCode> countryCodes = [
  CountryCode(code: 'AU', dialCode: '+61', flag: '🇦🇺', name: 'Australia'),
  CountryCode(code: 'AT', dialCode: '+43', flag: '🇦🇹', name: 'Austria'),
  CountryCode(code: 'BE', dialCode: '+32', flag: '🇧🇪', name: 'Belgium'),
  CountryCode(code: 'BR', dialCode: '+55', flag: '🇧🇷', name: 'Brazil'),
  CountryCode(code: 'CA', dialCode: '+1', flag: '🇨🇦', name: 'Canada'),
  CountryCode(code: 'CN', dialCode: '+86', flag: '🇨🇳', name: 'China'),
  CountryCode(code: 'DK', dialCode: '+45', flag: '🇩🇰', name: 'Denmark'),
  CountryCode(code: 'FI', dialCode: '+358', flag: '🇫🇮', name: 'Finland'),
  CountryCode(code: 'FR', dialCode: '+33', flag: '🇫🇷', name: 'France'),
  CountryCode(code: 'DE', dialCode: '+49', flag: '🇩🇪', name: 'Germany'),
  CountryCode(code: 'GR', dialCode: '+30', flag: '🇬🇷', name: 'Greece'),
  CountryCode(code: 'HK', dialCode: '+852', flag: '🇭🇰', name: 'Hong Kong'),
  CountryCode(code: 'IN', dialCode: '+91', flag: '🇮🇳', name: 'India'),
  CountryCode(code: 'IE', dialCode: '+353', flag: '🇮🇪', name: 'Ireland'),
  CountryCode(code: 'IT', dialCode: '+39', flag: '🇮🇹', name: 'Italy'),
  CountryCode(code: 'JP', dialCode: '+81', flag: '🇯🇵', name: 'Japan'),
  CountryCode(code: 'MX', dialCode: '+52', flag: '🇲🇽', name: 'Mexico'),
  CountryCode(code: 'NL', dialCode: '+31', flag: '🇳🇱', name: 'Netherlands'),
  CountryCode(code: 'NZ', dialCode: '+64', flag: '🇳🇿', name: 'New Zealand'),
  CountryCode(code: 'PK', dialCode: '+92', flag: '🇵🇰', name: 'Pakistan'),
  CountryCode(code: 'PH', dialCode: '+63', flag: '🇵🇭', name: 'Philippines'),
  CountryCode(code: 'PL', dialCode: '+48', flag: '🇵🇱', name: 'Poland'),
  CountryCode(code: 'RU', dialCode: '+7', flag: '🇷🇺', name: 'Russia'),
  CountryCode(code: 'SG', dialCode: '+65', flag: '🇸🇬', name: 'Singapore'),
  CountryCode(code: 'KR', dialCode: '+82', flag: '🇰🇷', name: 'South Korea'),
  CountryCode(code: 'ES', dialCode: '+34', flag: '🇪🇸', name: 'Spain'),
  CountryCode(code: 'SE', dialCode: '+46', flag: '🇸🇪', name: 'Sweden'),
  CountryCode(code: 'TH', dialCode: '+66', flag: '🇹🇭', name: 'Thailand'),
  CountryCode(code: 'TR', dialCode: '+90', flag: '🇹🇷', name: 'Turkey'),
  CountryCode(
    code: 'AE',
    dialCode: '+971',
    flag: '🇦🇪',
    name: 'United Arab Emirates',
  ),
  CountryCode(
    code: 'GB',
    dialCode: '+44',
    flag: '🇬🇧',
    name: 'United Kingdom',
  ),
  CountryCode(code: 'US', dialCode: '+1', flag: '🇺🇸', name: 'United States'),
  CountryCode(code: 'UA', dialCode: '+380', flag: '🇺🇦', name: 'Ukraine'),
  CountryCode(code: 'VN', dialCode: '+84', flag: '🇻🇳', name: 'Vietnam'),
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
