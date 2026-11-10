export interface CompanyBankAccount {
  id: string;
  accountHolder: string;
  bankName: string;
  branch?: string;
  accountNumber: string;
  iban?: string;
  currency: string;
  accountType: string;
  use: string;
  odFacility?: string;
}

export interface Subsidiary {
  id: "chartered-brokers" | "medibroker";
  name: string;
  shortName: string;
  brn: string;
  vat: string;
  bankAccounts: CompanyBankAccount[];
}

export const SUBSIDIARIES: Record<"chartered-brokers" | "medibroker", Subsidiary> = {
  "chartered-brokers": {
    id: "chartered-brokers",
    name: "Chartered Brokers Ltd",
    shortName: "Chartered Brokers",
    brn: "C06013326",
    vat: "20137198",
    bankAccounts: [
      {
        id: "cbg-mur-admin",
        accountHolder: "Chartered Brokers Ltd",
        bankName: "The Mauritius Commercial Bank Ltd (MCB)",
        branch: "Sir William Newton Street, Port Louis",
        accountNumber: "000010312102",
        iban: "MU53MCBL0901000000312102000MUR",
        currency: "MUR",
        accountType: "Current account",
        use: "Admin (MUR) expenses only",
        odFacility: "1,000,000",
      },
      {
        id: "cbg-mur-premium",
        accountHolder: "Chartered Brokers Ltd",
        bankName: "The Mauritius Commercial Bank Ltd (MCB)",
        branch: "Sir William Newton Street, Port Louis",
        accountNumber: "000445112131",
        iban: "MU20MCBL0944000445112131000MUR",
        currency: "MUR",
        accountType: "Current account",
        use: "Premium only (MUR)",
      },
      {
        id: "cbg-usd-premium",
        accountHolder: "Chartered Brokers Ltd",
        bankName: "The Mauritius Commercial Bank Ltd (MCB)",
        branch: "Sir William Newton Street, Port Louis",
        accountNumber: "000011721006",
        iban: "MU79MCBL0901000001721006000USD",
        currency: "USD",
        accountType: "Current account",
        use: "Premium only (USD)",
      },
      {
        id: "cbg-usd-admin",
        accountHolder: "Chartered Brokers Ltd",
        bankName: "The Mauritius Commercial Bank Ltd (MCB)",
        branch: "Sir William Newton Street, Port Louis",
        accountNumber: "000450374068",
        iban: "MU35MCBL0901000450374068000USD",
        currency: "USD",
        accountType: "Current account",
        use: "Admin (USD) expenses only",
      },
      {
        id: "cbg-gbp-premium",
        accountHolder: "Chartered Brokers Ltd",
        bankName: "The Mauritius Commercial Bank Ltd (MCB)",
        branch: "Sir William Newton Street, Port Louis",
        accountNumber: "000451519965",
        iban: "MU16MCBL0944000451519965000GBP",
        currency: "GBP",
        accountType: "Current account",
        use: "Premium only (GBP)",
      },
      {
        id: "cbg-eur-premium",
        accountHolder: "Chartered Brokers Ltd",
        bankName: "The Mauritius Commercial Bank Ltd (MCB)",
        branch: "Sir William Newton Street, Port Louis",
        accountNumber: "000451519981",
        iban: "MU32MCBL094400045151998100EUR",
        currency: "EUR",
        accountType: "Current account",
        use: "Premium only (EUR)",
      },
    ],
  },
  medibroker: {
    id: "medibroker",
    name: "Medibroker Ltd",
    shortName: "Medi Broker",
    brn: "C06039689",
    vat: "20227270",
    bankAccounts: [
      {
        id: "mb-mur-admin",
        accountHolder: "Medibroker Ltd",
        bankName: "The Mauritius Commercial Bank Ltd (MCB)",
        branch: "Sir William Newton Street, Port Louis",
        accountNumber: "000011628367",
        iban: "MU14MCBL0901000001628367000MUR",
        currency: "MUR",
        accountType: "Current account",
        use: "Admin expenses only",
        odFacility: "1,000,000",
      },
      {
        id: "mb-mur-corp",
        accountHolder: "Medibroker Ltd",
        bankName: "The Mauritius Commercial Bank Ltd (MCB)",
        branch: "Sir William Newton Street, Port Louis",
        accountNumber: "000445216735",
        iban: "MU56MCBL0944000445216735000MUR",
        currency: "MUR",
        accountType: "Current account",
        use: "Premium only - CORP/RET/FFC",
      },
      {
        id: "mb-mur-edu",
        accountHolder: "Medibroker Ltd",
        bankName: "The Mauritius Commercial Bank Ltd (MCB)",
        branch: "Sir William Newton Street, Port Louis",
        accountNumber: "000449415996",
        iban: "MU22MCBL0901000449415996000MUR",
        currency: "MUR",
        accountType: "Current account",
        use: "Premium only - EDUHEALTH/EOU",
      },
      {
        id: "mb-mur-lexcura",
        accountHolder: "Medibroker Ltd",
        bankName: "The Mauritius Commercial Bank Ltd (MCB)",
        branch: "Sir William Newton Street, Port Louis",
        accountNumber: "000455402175",
        currency: "MUR",
        accountType: "Current account",
        use: "Premium only - LEXCURA",
      },
      {
        id: "mb-usd-premium",
        accountHolder: "Medibroker Ltd",
        bankName: "The Mauritius Commercial Bank Ltd (MCB)",
        branch: "Sir William Newton Street, Port Louis",
        accountNumber: "000011721839",
        iban: "MU36MCBL0901000001721839000USD",
        currency: "USD",
        accountType: "Current account",
        use: "Premium only - USD",
      },
      {
        id: "mb-sbm-poa",
        accountHolder: "Medibroker Ltd",
        bankName: "SBM BANK (MAURITIUS) LTD",
        branch: "Vacoas SME HUB, John Kennedy Avenue, Vacoas",
        accountNumber: "50300000668800",
        iban: "MU46STCB1180000000668800000MUR",
        currency: "MUR",
        accountType: "Current account",
        use: "Premium only (POA)",
      },
    ],
  },
};

export const SUBSIDIARY_OPTIONS = [
  { value: "chartered-brokers", label: "Chartered Brokers Ltd" },
  { value: "medibroker", label: "Medibroker Ltd (Medi Broker)" },
];
