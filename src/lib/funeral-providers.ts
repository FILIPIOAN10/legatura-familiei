export interface FuneralProvider {
  id: string;
  name: string;
  city: string;
  phone: string;
  priceFrom: number; // RON, pachet de bază
  rating: number; // 1-5
  notes: string;
}

// Listă demo cu prețuri orientative din piața românească (pachete de bază)
export const FUNERAL_PROVIDERS: FuneralProvider[] = [
  { id: "fp-1", name: "Pompe Funebre Crinul Alb",   city: "București", phone: "+40 21 311 22 33", priceFrom: 2200, rating: 4.6, notes: "Pachet economic: sicriu, transport, formalități" },
  { id: "fp-2", name: "Casa Funerară Sf. Maria",    city: "București", phone: "+40 21 444 55 66", priceFrom: 2850, rating: 4.4, notes: "Capelă proprie, asistență 24/7" },
  { id: "fp-3", name: "Memorial Servicii Funerare", city: "Cluj-Napoca", phone: "+40 264 123 456", priceFrom: 3100, rating: 4.8, notes: "Pachet complet, inclusiv flori" },
  { id: "fp-4", name: "Eternitate Funerar",         city: "Iași",      phone: "+40 232 987 654", priceFrom: 3450, rating: 4.3, notes: "Transport regional inclus" },
  { id: "fp-5", name: "Pompe Funebre Liniștea",     city: "Timișoara", phone: "+40 256 778 899", priceFrom: 3800, rating: 4.5, notes: "Servicii religioase complete" },
  { id: "fp-6", name: "Crucea de Lemn",             city: "București", phone: "+40 21 666 77 88", priceFrom: 4200, rating: 4.7, notes: "Pachet premium, sicriu lemn masiv" },
  { id: "fp-7", name: "Casa Funerară Regală",       city: "București", phone: "+40 21 999 00 11", priceFrom: 5600, rating: 4.9, notes: "Lux: cortegiu auto premium, ceremonie extinsă" },
];

export function getProvidersSortedByPrice(): FuneralProvider[] {
  return [...FUNERAL_PROVIDERS].sort((a, b) => a.priceFrom - b.priceFrom);
}
