export interface Country {
  code: string;
  name: string;
  flag: string;
  stickersCount: number; // 20 stickers per country
}

export interface Confederation {
  id: string;
  name: string;
  countries: Country[];
}

export const CONFEDERATIONS: Confederation[] = [
  {
    id: "special",
    name: "Speciale (Fifa World Cup)",
    countries: [
      { code: "FWC", name: "Steme & Highlights", flag: "PANINI", stickersCount: 20 }
    ]
  },
  {
    id: "countries",
    name: "Țări (Ordine Album)",
    countries: [
      { code: "MEX", name: "Mexic", flag: "🇲🇽", stickersCount: 20 },
      { code: "RSA", name: "Africa de Sud", flag: "🇿🇦", stickersCount: 20 },
      { code: "KOR", name: "Coreea de Sud", flag: "🇰🇷", stickersCount: 20 },
      { code: "CZE", name: "Cehia", flag: "🇨🇿", stickersCount: 20 },
      { code: "CAN", name: "Canada", flag: "🇨🇦", stickersCount: 20 },
      { code: "BIH", name: "Bosnia & Herțegovina", flag: "🇧🇦", stickersCount: 20 },
      { code: "QAT", name: "Qatar", flag: "🇶🇦", stickersCount: 20 },
      { code: "SUI", name: "Elveția", flag: "🇨🇭", stickersCount: 20 },
      { code: "BRA", name: "Brazilia", flag: "🇧🇷", stickersCount: 20 },
      { code: "MAR", name: "Maroc", flag: "🇲🇦", stickersCount: 20 },
      { code: "HAI", name: "Haiti", flag: "🇭🇹", stickersCount: 20 },
      { code: "SCO", name: "Scoția", flag: "🏴\u200D󠁢\u200D󠁳\u200D󠁣\u200D󠁴\u200D󠁿", stickersCount: 20 },
      { code: "USA", name: "Statele Unite", flag: "🇺🇸", stickersCount: 20 },
      { code: "PAR", name: "Paraguay", flag: "🇵🇾", stickersCount: 20 },
      { code: "AUS", name: "Australia", flag: "🇦🇺", stickersCount: 20 },
      { code: "TUR", name: "Turcia", flag: "🇹🇷", stickersCount: 20 },
      { code: "GER", name: "Germania", flag: "🇩🇪", stickersCount: 20 },
      { code: "CUW", name: "Curaçao", flag: "🇨🇼", stickersCount: 20 },
      { code: "CIV", name: "Coasta de Fildeș", flag: "🇨🇮", stickersCount: 20 },
      { code: "ECU", name: "Ecuador", flag: "🇪🇨", stickersCount: 20 },
      { code: "NED", name: "Țările de Jos", flag: "🇳🇱", stickersCount: 20 },
      { code: "JPN", name: "Japonia", flag: "🇯🇵", stickersCount: 20 },
      { code: "SWE", name: "Suedia", flag: "🇸🇪", stickersCount: 20 },
      { code: "TUN", name: "Tunisia", flag: "🇹🇳", stickersCount: 20 },
      { code: "BEL", name: "Belgia", flag: "🇧🇪", stickersCount: 20 },
      { code: "EGY", name: "Egipt", flag: "🇪🇬", stickersCount: 20 },
      { code: "IRN", name: "Iran", flag: "🇮🇷", stickersCount: 20 },
      { code: "NZL", name: "Noua Zeelandă", flag: "🇳🇿", stickersCount: 20 },
      { code: "ESP", name: "Spania", flag: "🇪🇸", stickersCount: 20 },
      { code: "CPV", name: "Capul Verde", flag: "🇨🇻", stickersCount: 20 },
      { code: "KSA", name: "Arabia Saudită", flag: "🇸🇦", stickersCount: 20 },
      { code: "URU", name: "Uruguay", flag: "🇺🇾", stickersCount: 20 },
      { code: "FRA", name: "Franța", flag: "🇫🇷", stickersCount: 20 },
      { code: "SEN", name: "Senegal", flag: "🇸🇳", stickersCount: 20 },
      { code: "IRQ", name: "Irak", flag: "🇮🇶", stickersCount: 20 },
      { code: "NOR", name: "Norvegia", flag: "🇳🇴", stickersCount: 20 },
      { code: "ARG", name: "Argentina", flag: "🇦🇷", stickersCount: 20 },
      { code: "ALG", name: "Algeria", flag: "🇩🇿", stickersCount: 20 },
      { code: "AUT", name: "Austria", flag: "🇦🇹", stickersCount: 20 },
      { code: "JOR", name: "Iordania", flag: "🇯🇴", stickersCount: 20 },
      { code: "POR", name: "Portugalia", flag: "🇵🇹", stickersCount: 20 },
      { code: "COD", name: "R.D. Congo", flag: "🇨🇩", stickersCount: 20 },
      { code: "UZB", name: "Uzbekistan", flag: "🇺🇿", stickersCount: 20 },
      { code: "COL", name: "Columbia", flag: "🇨🇴", stickersCount: 20 },
      { code: "ENG", name: "Anglia", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", stickersCount: 20 },
      { code: "CRO", name: "Croația", flag: "🇭🇷", stickersCount: 20 },
      { code: "GHA", name: "Ghana", flag: "🇬🇭", stickersCount: 20 },
      { code: "PAN", name: "Panama", flag: "🇵🇦", stickersCount: 20 }
    ]
  }
];

// Helper to get total number of stickers in the album
export const TOTAL_STICKERS_COUNT = CONFEDERATIONS.reduce((acc, conf) => {
  return acc + conf.countries.reduce((sum, country) => sum + country.stickersCount, 0);
}, 0); // Should be 48 * 20 + 20 = 980 stickers total
