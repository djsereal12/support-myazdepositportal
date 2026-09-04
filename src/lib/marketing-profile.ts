/** Client-safe marketing profile types and the seeded default brand kit. */

export type MarketingProfile = {
  brand_name: string;
  one_liner: string;
  positioning: string;
  audience: string;
  tone: string;
  value_props: string[];
  objections: string[];
  taglines: string[];
  ad_headlines: string[];
  ad_long_headlines: string[];
  ad_descriptions: string[];
  keywords: string[];
  negative_keywords: string[];
  updated_at?: string | null;
};

export const DEFAULT_MARKETING_PROFILE: MarketingProfile = {
  brand_name: "deposit",
  one_liner:
    "Tamper-proof move-in and move-out photo evidence that gets Arizona renters their security deposit back.",
  positioning:
    "deposit is the evidence layer for Arizona renters. Every photo is hashed, timestamped and GPS-stamped at capture, then sealed into a report a landlord can verify but nobody can quietly edit. Where competitors sell storage, deposit sells proof that stands up in a dispute — plus the A.R.S. §33-1321 demand letter that follows it.",
  audience:
    "Arizona renters aged 20-40 in Phoenix, Tempe, Mesa, Scottsdale and Tucson — students, first apartments, military and travel-nurse relocations. They move often, pay $1,000-$2,500 deposits, and expect to be nickel-and-dimed on move-out. Secondary: small landlords and property managers who want a clean, signed record.",
  tone: "Calm, precise, protective. Plain English. Never fear-mongering, never legalese. Confidence of a good attorney, warmth of a friend who has been through it.",
  value_props: [
    "Every photo hashed with SHA-256 at capture — edits are detectable",
    "Sealed report with a QR link your landlord can verify",
    "Landlord can review and e-sign without creating an account",
    "One-click Arizona demand letter citing A.R.S. §33-1321",
    "14 business day deadline calculator built in",
    "Free to scan — pay $14.99 only when you send it",
  ],
  objections: [
    "\"My phone photos are enough\" — undated camera-roll photos are easy to dispute; hashed, GPS-stamped evidence is not.",
    "\"My landlord is fine\" — the report also protects you if the property changes hands or managers.",
    "\"Too expensive\" — $14.99 against a deposit that averages well over $1,000.",
    "\"Takes too long\" — eight guided room prompts, about ten minutes on your phone.",
  ],
  taglines: [
    "Seal it before you unpack.",
    "Proof, not promises.",
    "Your deposit, documented.",
    "Move in. Seal it. Get it back.",
  ],
  ad_headlines: [
    "Get your deposit back",
    "Arizona deposit protection",
    "Proof your landlord can't edit",
    "Seal it before you unpack",
    "Move-in photos that hold up",
    "$14.99 deposit insurance",
    "Timestamped move-in report",
    "Arizona renters: document it",
    "Deposit withheld? Act fast",
    "14 business days to refund",
    "Free move-in scan",
    "Send proof to your landlord",
    "A.R.S. §33-1321 demand letter",
    "Tamper-proof move-out photos",
    "Phoenix renters, protect $1,500",
  ],
  ad_long_headlines: [
    "Tamper-proof move-in photos that get your Arizona deposit back",
    "Seal your move-in condition in ten minutes from your phone",
    "Hashed, timestamped evidence your landlord can verify but not edit",
  ],
  ad_descriptions: [
    "Photograph every room, get a sealed report your landlord can verify. Free to scan.",
    "Arizona law gives landlords 14 business days. Have the proof ready before then.",
    "Every photo is hashed and timestamped, so move-out disputes end fast.",
    "Send a verified report to your landlord and generate a demand letter in one click.",
  ],
  keywords: [
    "arizona security deposit",
    "get security deposit back arizona",
    "security deposit law arizona",
    "move in inspection checklist",
    "landlord kept my deposit",
    "security deposit demand letter arizona",
    "move out photo documentation",
    "arizona renters rights deposit",
    "14 business days deposit arizona",
    "phoenix security deposit refund",
    "tucson security deposit refund",
    "normal wear and tear arizona",
    "move in condition report",
    "apartment move in checklist app",
  ],
  negative_keywords: [
    "free lawyer",
    "jobs",
    "bank deposit",
    "direct deposit",
    "crypto deposit",
    "casino deposit",
  ],
};
