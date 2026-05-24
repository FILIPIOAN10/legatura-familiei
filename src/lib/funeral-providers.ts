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
  { id: "fp-cj-1", name: "Pompe Funebre Non-Stop Cluj", city: "Cluj-Napoca", phone: "+40 264 432 100", priceFrom: 1950, rating: 4.2, notes: "Pachet economic: sicriu, transport, formalități" },
  { id: "fp-cj-2", name: "Casa Funerară Eternitas",     city: "Cluj-Napoca", phone: "+40 264 555 210", priceFrom: 2400, rating: 4.5, notes: "Asistență 24/7, capelă proprie" },
  { id: "fp-cj-3", name: "Servicii Funerare Sf. Andrei",city: "Cluj-Napoca", phone: "+40 264 789 012", priceFrom: 2750, rating: 4.6, notes: "Ceremonie religioasă inclusă" },
  { id: "fp-cj-4", name: "Memorial Servicii Funerare",  city: "Cluj-Napoca", phone: "+40 264 123 456", priceFrom: 3100, rating: 4.8, notes: "Pachet complet, inclusiv flori" },
  { id: "fp-cj-5", name: "Casa Funerară Pacea",         city: "Cluj-Napoca", phone: "+40 264 321 654", priceFrom: 3450, rating: 4.4, notes: "Transport în județ inclus" },
  { id: "fp-cj-6", name: "Pompe Funebre Crinul Cluj",   city: "Cluj-Napoca", phone: "+40 264 654 987", priceFrom: 3900, rating: 4.7, notes: "Sicriu lemn masiv, coroane florale" },
  { id: "fp-cj-7", name: "Casa Funerară Heaven",        city: "Cluj-Napoca", phone: "+40 264 888 222", priceFrom: 4600, rating: 4.9, notes: "Pachet premium, cortegiu auto" },
  { id: "fp-cj-8", name: "Liniștea Veșnică Cluj",       city: "Cluj-Napoca", phone: "+40 264 111 333", priceFrom: 5200, rating: 4.8, notes: "Lux: ceremonie extinsă, decor personalizat" },
];

export function getProvidersSortedByPrice(): FuneralProvider[] {
  return [...FUNERAL_PROVIDERS].sort((a, b) => a.priceFrom - b.priceFrom);
}
