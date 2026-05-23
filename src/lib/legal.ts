// Legal references and deadlines used across the platform.
export const LEGAL_REFS = {
  declarationDeadline: {
    hours: 72,
    text: "Declarația de deces se face în termen de 3 zile de la deces",
    ref: "L. 119/1996 art. 35",
  },
  burialWindow: {
    hours: 72,
    text: "Înhumarea/incinerarea se face între 24h și 72h de la deces",
    ref: "L. 102/2014",
  },
  successionFree: {
    days: 730,
    text: "Dezbaterea succesiunii fără taxe suplimentare",
    ref: "C. Fiscal art. 111 alin. (3)",
  },
  funeralAid: {
    text: "Ajutor de înmormântare",
    ref: "L. 263/2010",
  },
} as const;

export const CASE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Ciornă",
  AWAITING_DOCTOR: "Așteaptă medic",
  CMCD_ISSUED: "CMCD emis",
  AWAITING_CIVIL_OFFICER: "La Starea Civilă",
  DEATH_CERT_ISSUED: "Certificat deces emis",
  FUNERAL_SCHEDULED: "Înmormântare programată",
  FUNERAL_COMPLETED: "Înmormântare finalizată",
  SUCCESSION_OPEN: "Succesiune deschisă",
  SUCCESSION_CLOSED: "Succesiune închisă",
  ARCHIVED: "Arhivat",
};

export const CASE_STATUS_ORDER = [
  "DRAFT",
  "AWAITING_DOCTOR",
  "CMCD_ISSUED",
  "AWAITING_CIVIL_OFFICER",
  "DEATH_CERT_ISSUED",
  "FUNERAL_SCHEDULED",
  "FUNERAL_COMPLETED",
  "SUCCESSION_OPEN",
  "SUCCESSION_CLOSED",
  "ARCHIVED",
] as const;

export const ROLE_LABELS: Record<string, string> = {
  family: "Aparținător",
  doctor: "Medic constatator",
  civil_officer: "Funcționar Stare Civilă",
  funeral_provider: "Casă funerară",
  notary: "Notar public",
  admin: "Administrator",
};

export const DOC_TYPE_LABELS: Record<string, string> = {
  cmcd: "Certificat Medical Constatator al Decesului",
  death_certificate: "Certificat de deces",
  burial_permit: "Adeverință de înhumare",
  parquet_release: "Eliberare parchet",
  funeral_contract: "Contract servicii funerare",
  inheritance_acceptance: "Acceptare moștenire",
  inheritance_certificate: "Certificat de moștenitor",
  id_card: "Carte de identitate",
  birth_certificate: "Certificat de naștere",
  marriage_certificate: "Certificat de căsătorie",
  other: "Alt document",
};

export const ROMANIAN_COUNTIES = [
  "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani",
  "Brașov", "Brăila", "București", "Buzău", "Caraș-Severin", "Călărași",
  "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu",
  "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș",
  "Mehedinți", "Mureș", "Neamț", "Olt", "Prahova", "Satu Mare", "Sălaj",
  "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea", "Vaslui", "Vâlcea",
  "Vrancea",
];
