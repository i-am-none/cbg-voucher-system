export interface CreditorInfo {
  name: string;
  bankName: string;
  bankAccount: string;
  category?: "Premium" | "Admin";
  phone?: string;
  address?: string;
}

export const CREDITORS: CreditorInfo[] = [
  {
    name: "MEDSCHEME- Bord",
    bankName: "MCB",
    bankAccount: "000446163015",
    category: "Premium",
  },
  {
    name: "MEDSCHEME- TDS",
    bankName: "MCB",
    bankAccount: "010185313",
    category: "Premium",
  },
  {
    name: "SICOM LTD",
    bankName: "SBM",
    bankAccount: "61030100045713",
    category: "Premium",
  },
  {
    name: "LINKHAM SERVICES LTD",
    bankName: "MCB",
    bankAccount: "000440791022",
    category: "Premium",
  },
  {
    name: "LINKHAM SERVICES LTD -TRAVEL",
    bankName: "MCB",
    bankAccount: "000442044917",
    category: "Premium",
  },
  {
    name: "SWAN",
    bankName: "MCB",
    bankAccount: "000200702513",
    category: "Premium",
  },
  {
    name: "MUA",
    bankName: "MCB",
    bankAccount: "000010702547",
    category: "Premium",
  },
  {
    name: "NIC- MEDICAL",
    bankName: "MAU",
    bankAccount: "143100007063",
    category: "Premium",
  },
  {
    name: "NIC- MOTOR /GENERAL",
    bankName: "MCB",
    bankAccount: "000444155732",
    category: "Premium",
  },
  {
    name: "EAGLE",
    bankName: "MCB",
    bankAccount: "000010700234",
    category: "Premium",
  },
  {
    name: "JUBILEE",
    bankName: "BARC",
    bankAccount: "142040743",
    category: "Premium",
  },
  {
    name: "Medibroker Ltd Admin",
    bankName: "MCB",
    bankAccount: "000011628367",
    category: "Premium",
  },
  {
    name: "Chartered Brokers Ltd Admin",
    bankName: "MCB",
    bankAccount: "000010312102",
    category: "Premium",
  },
  {
    name: "JUBILEE- FISTRCARE",
    bankName: "ABSA",
    bankAccount: "14-2033909",
    category: "Premium",
  },
  {
    name: "Business Mauritius Provident Association",
    bankName: "MCB",
    bankAccount: "000010190732",
    category: "Premium",
  },
  {
    name: "AQUA COOLER LTD",
    bankName: "BankOne",
    bankAccount: "03121063550",
    category: "Admin",
  },
  {
    name: "CENTRAL BUSINESS EQUIPMENT",
    bankName: "MCB",
    bankAccount: "000050055593",
    category: "Admin",
  },
  {
    name: "Jean David Cabri",
    bankName: "SBM",
    bankAccount: "03136200030902",
    category: "Admin",
  },
  {
    name: "Leal & Co Ltd",
    bankName: "MCB",
    bankAccount: "000130006815",
    category: "Admin",
  },
  {
    name: "MCB FACTORS",
    bankName: "MCB",
    bankAccount: "000011729546",
    category: "Admin",
  },
  {
    name: "PiXel GraphiX Ltée",
    bankName: "MCB",
    bankAccount: "000072592915",
    category: "Admin",
  },
  {
    name: "TPS PRINTING",
    bankName: "MCB",
    bankAccount: "000050050680",
    category: "Admin",
  },
  {
    name: "Yutu Construction Co Ltd",
    bankName: "Barclays Bank",
    bankAccount: "15/1001726",
    category: "Admin",
  },
  {
    name: "Microage Systems Ltd",
    bankName: "AFR",
    bankAccount: "001300014051017",
    category: "Admin",
  },
  {
    name: "Business Mauritius",
    bankName: "MCB",
    bankAccount: "000010052739",
    category: "Admin",
  },
  {
    name: "Architecture & Design Ltd",
    bankName: "MCB",
    bankAccount: "000443605777",
    category: "Admin",
  },
  {
    name: "ARC",
    bankName: "Afrasia Bank",
    bankAccount: "28564000000033",
    category: "Admin",
  },
  {
    name: "Servansingh Leeladharsingh",
    bankName: "MCB",
    bankAccount: "000200757164",
    category: "Admin",
  },
  {
    name: "Linkham Ltd",
    bankName: "MCB",
    bankAccount: "000440791022",
    category: "Admin",
  },
  {
    name: "Societe De La Preneuse Sur Mer",
    bankName: "MCB",
    bankAccount: "000200760122",
    category: "Admin",
  },
  {
    name: "Swan Defined Contribution Scheme",
    bankName: "MCB",
    bankAccount: "000443282994",
    category: "Admin",
  },
  {
    name: "Delior Ltd",
    bankName: "MCB",
    bankAccount: "000444480390",
    category: "Admin",
  },
  {
    name: "AFRI VENTURE PARTNER LIMITED",
    bankName: "Afrasia Bank",
    bankAccount: "074731000000027",
    category: "Admin",
  },
  {
    name: "Alpha Hygiene Ltd",
    bankName: "MCB",
    bankAccount: "0000200737260",
    category: "Admin",
  },
  {
    name: "Brink's (Mtius) Ltd",
    bankName: "MCB",
    bankAccount: "000011580399",
    category: "Admin",
  },
  {
    name: "Easypay Outsourcing Co Ltd",
    bankName: "MCB",
    bankAccount: "000445341866",
    category: "Admin",
  },
  {
    name: "Chase Derwitt",
    bankName: "MCB",
    bankAccount: "000011778784",
    category: "Admin",
  },
  {
    name: "Eruption Media Ltd",
    bankName: "MCB",
    bankAccount: "000446430420",
    category: "Admin",
  },
  {
    name: "Impact Sign Ltd",
    bankName: "MCB",
    bankAccount: "000442905238",
    category: "Admin",
  },
  {
    name: "Seemadree Appadoo",
    bankName: "ABSA",
    bankAccount: "124048273",
    category: "Admin",
  },
  {
    name: "SERVINT",
    bankName: "MCB",
    bankAccount: "000445746483",
    category: "Admin",
  },
];

export function findCreditorByName(searchName: string): CreditorInfo | undefined {
  if (!searchName) return undefined;
  const normalized = searchName.trim().toLowerCase();
  return CREDITORS.find(
    (c) => c.name.toLowerCase() === normalized || c.name.toLowerCase().includes(normalized)
  );
}
