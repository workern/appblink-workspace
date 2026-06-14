export interface CountryDialCode {
  name: string;
  isoCode: string;
  dialCode: string;
  flag: string;
  /** Whether mobile numbers in this country have a fixed digit count (excluding dial code) */
  isFixedLength: boolean;
  /** Number of digits in local mobile number (excluding dial code). Undefined if variable-length. */
  mobileLength?: number;
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { name: 'Argentina', isoCode: 'AR', dialCode: '+54', flag: '🇦🇷', isFixedLength: true, mobileLength: 10 },
  { name: 'Australia', isoCode: 'AU', dialCode: '+61', flag: '🇦🇺', isFixedLength: true, mobileLength: 9 },
  { name: 'Bangladesh', isoCode: 'BD', dialCode: '+880', flag: '🇧🇩', isFixedLength: true, mobileLength: 10 },
  { name: 'Brazil', isoCode: 'BR', dialCode: '+55', flag: '🇧🇷', isFixedLength: true, mobileLength: 11 },
  { name: 'Canada', isoCode: 'CA', dialCode: '+1', flag: '🇨🇦', isFixedLength: true, mobileLength: 10 },
  { name: 'China', isoCode: 'CN', dialCode: '+86', flag: '🇨🇳', isFixedLength: true, mobileLength: 11 },
  { name: 'Colombia', isoCode: 'CO', dialCode: '+57', flag: '🇨🇴', isFixedLength: true, mobileLength: 10 },
  { name: 'Denmark', isoCode: 'DK', dialCode: '+45', flag: '🇩🇰', isFixedLength: true, mobileLength: 8 },
  { name: 'Egypt', isoCode: 'EG', dialCode: '+20', flag: '🇪🇬', isFixedLength: true, mobileLength: 10 },
  { name: 'Finland', isoCode: 'FI', dialCode: '+358', flag: '🇫🇮', isFixedLength: false },
  { name: 'France', isoCode: 'FR', dialCode: '+33', flag: '🇫🇷', isFixedLength: true, mobileLength: 9 },
  { name: 'Germany', isoCode: 'DE', dialCode: '+49', flag: '🇩🇪', isFixedLength: false },
  { name: 'Ghana', isoCode: 'GH', dialCode: '+233', flag: '🇬🇭', isFixedLength: true, mobileLength: 9 },
  { name: 'India', isoCode: 'IN', dialCode: '+91', flag: '🇮🇳', isFixedLength: true, mobileLength: 10 },
  { name: 'Indonesia', isoCode: 'ID', dialCode: '+62', flag: '🇮🇩', isFixedLength: false },
  { name: 'Ireland', isoCode: 'IE', dialCode: '+353', flag: '🇮🇪', isFixedLength: true, mobileLength: 9 },
  { name: 'Israel', isoCode: 'IL', dialCode: '+972', flag: '🇮🇱', isFixedLength: true, mobileLength: 9 },
  { name: 'Italy', isoCode: 'IT', dialCode: '+39', flag: '🇮🇹', isFixedLength: false },
  { name: 'Japan', isoCode: 'JP', dialCode: '+81', flag: '🇯🇵', isFixedLength: true, mobileLength: 10 },
  { name: 'Kenya', isoCode: 'KE', dialCode: '+254', flag: '🇰🇪', isFixedLength: true, mobileLength: 9 },
  { name: 'Malaysia', isoCode: 'MY', dialCode: '+60', flag: '🇲🇾', isFixedLength: false },
  { name: 'Mexico', isoCode: 'MX', dialCode: '+52', flag: '🇲🇽', isFixedLength: true, mobileLength: 10 },
  { name: 'Nepal', isoCode: 'NP', dialCode: '+977', flag: '🇳🇵', isFixedLength: true, mobileLength: 10 },
  { name: 'Netherlands', isoCode: 'NL', dialCode: '+31', flag: '🇳🇱', isFixedLength: true, mobileLength: 9 },
  { name: 'New Zealand', isoCode: 'NZ', dialCode: '+64', flag: '🇳🇿', isFixedLength: false },
  { name: 'Nigeria', isoCode: 'NG', dialCode: '+234', flag: '🇳🇬', isFixedLength: true, mobileLength: 10 },
  { name: 'Norway', isoCode: 'NO', dialCode: '+47', flag: '🇳🇴', isFixedLength: true, mobileLength: 8 },
  { name: 'Pakistan', isoCode: 'PK', dialCode: '+92', flag: '🇵🇰', isFixedLength: true, mobileLength: 10 },
  { name: 'Philippines', isoCode: 'PH', dialCode: '+63', flag: '🇵🇭', isFixedLength: true, mobileLength: 10 },
  { name: 'Poland', isoCode: 'PL', dialCode: '+48', flag: '🇵🇱', isFixedLength: true, mobileLength: 9 },
  { name: 'Portugal', isoCode: 'PT', dialCode: '+351', flag: '🇵🇹', isFixedLength: true, mobileLength: 9 },
  { name: 'Russia', isoCode: 'RU', dialCode: '+7', flag: '🇷🇺', isFixedLength: true, mobileLength: 10 },
  { name: 'Saudi Arabia', isoCode: 'SA', dialCode: '+966', flag: '🇸🇦', isFixedLength: true, mobileLength: 9 },
  { name: 'Singapore', isoCode: 'SG', dialCode: '+65', flag: '🇸🇬', isFixedLength: true, mobileLength: 8 },
  { name: 'South Africa', isoCode: 'ZA', dialCode: '+27', flag: '🇿🇦', isFixedLength: true, mobileLength: 9 },
  { name: 'South Korea', isoCode: 'KR', dialCode: '+82', flag: '🇰🇷', isFixedLength: true, mobileLength: 10 },
  { name: 'Spain', isoCode: 'ES', dialCode: '+34', flag: '🇪🇸', isFixedLength: true, mobileLength: 9 },
  { name: 'Sri Lanka', isoCode: 'LK', dialCode: '+94', flag: '🇱🇰', isFixedLength: true, mobileLength: 9 },
  { name: 'Sweden', isoCode: 'SE', dialCode: '+46', flag: '🇸🇪', isFixedLength: true, mobileLength: 9 },
  { name: 'Switzerland', isoCode: 'CH', dialCode: '+41', flag: '🇨🇭', isFixedLength: true, mobileLength: 9 },
  { name: 'Thailand', isoCode: 'TH', dialCode: '+66', flag: '🇹🇭', isFixedLength: true, mobileLength: 9 },
  { name: 'Turkey', isoCode: 'TR', dialCode: '+90', flag: '🇹🇷', isFixedLength: true, mobileLength: 10 },
  { name: 'UAE', isoCode: 'AE', dialCode: '+971', flag: '🇦🇪', isFixedLength: true, mobileLength: 9 },
  { name: 'United Kingdom', isoCode: 'GB', dialCode: '+44', flag: '🇬🇧', isFixedLength: true, mobileLength: 10 },
  { name: 'United States', isoCode: 'US', dialCode: '+1', flag: '🇺🇸', isFixedLength: true, mobileLength: 10 },
  { name: 'Vietnam', isoCode: 'VN', dialCode: '+84', flag: '🇻🇳', isFixedLength: true, mobileLength: 9 }
];

export const DEFAULT_COUNTRY =
  COUNTRY_DIAL_CODES.find((c) => c.isoCode === 'IN') || COUNTRY_DIAL_CODES[0]; // India (+91)
