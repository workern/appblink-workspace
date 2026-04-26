export interface CountryDialCode {
  name: string;
  isoCode: string;
  dialCode: string;
  flag: string;
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { name: 'Argentina', isoCode: 'AR', dialCode: '+54', flag: '🇦🇷' },
  { name: 'Australia', isoCode: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Bangladesh', isoCode: 'BD', dialCode: '+880', flag: '🇧🇩' },
  { name: 'Brazil', isoCode: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Canada', isoCode: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'China', isoCode: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'Colombia', isoCode: 'CO', dialCode: '+57', flag: '🇨🇴' },
  { name: 'Denmark', isoCode: 'DK', dialCode: '+45', flag: '🇩🇰' },
  { name: 'Egypt', isoCode: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'Finland', isoCode: 'FI', dialCode: '+358', flag: '🇫🇮' },
  { name: 'France', isoCode: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Germany', isoCode: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'Ghana', isoCode: 'GH', dialCode: '+233', flag: '🇬🇭' },
  { name: 'India', isoCode: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'Indonesia', isoCode: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { name: 'Ireland', isoCode: 'IE', dialCode: '+353', flag: '🇮🇪' },
  { name: 'Israel', isoCode: 'IL', dialCode: '+972', flag: '🇮🇱' },
  { name: 'Italy', isoCode: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Japan', isoCode: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'Kenya', isoCode: 'KE', dialCode: '+254', flag: '🇰🇪' },
  { name: 'Malaysia', isoCode: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'Mexico', isoCode: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { name: 'Nepal', isoCode: 'NP', dialCode: '+977', flag: '🇳🇵' },
  { name: 'Netherlands', isoCode: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { name: 'New Zealand', isoCode: 'NZ', dialCode: '+64', flag: '🇳🇿' },
  { name: 'Nigeria', isoCode: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { name: 'Norway', isoCode: 'NO', dialCode: '+47', flag: '🇳🇴' },
  { name: 'Pakistan', isoCode: 'PK', dialCode: '+92', flag: '🇵🇰' },
  { name: 'Philippines', isoCode: 'PH', dialCode: '+63', flag: '🇵🇭' },
  { name: 'Poland', isoCode: 'PL', dialCode: '+48', flag: '🇵🇱' },
  { name: 'Portugal', isoCode: 'PT', dialCode: '+351', flag: '🇵🇹' },
  { name: 'Russia', isoCode: 'RU', dialCode: '+7', flag: '🇷🇺' },
  { name: 'Saudi Arabia', isoCode: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'Singapore', isoCode: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'South Africa', isoCode: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'South Korea', isoCode: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { name: 'Spain', isoCode: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Sri Lanka', isoCode: 'LK', dialCode: '+94', flag: '🇱🇰' },
  { name: 'Sweden', isoCode: 'SE', dialCode: '+46', flag: '🇸🇪' },
  { name: 'Switzerland', isoCode: 'CH', dialCode: '+41', flag: '🇨🇭' },
  { name: 'Thailand', isoCode: 'TH', dialCode: '+66', flag: '🇹🇭' },
  { name: 'Turkey', isoCode: 'TR', dialCode: '+90', flag: '🇹🇷' },
  { name: 'UAE', isoCode: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'United Kingdom', isoCode: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'United States', isoCode: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Vietnam', isoCode: 'VN', dialCode: '+84', flag: '🇻🇳' }
];

export const DEFAULT_COUNTRY =
  COUNTRY_DIAL_CODES.find((c) => c.isoCode === 'IN') || COUNTRY_DIAL_CODES[0]; // India (+91)
