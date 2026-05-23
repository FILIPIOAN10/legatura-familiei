import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type GoogleFuneralProvider = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: number;
  mapsUri?: string;
  websiteUri?: string;
  location?: { latitude: number; longitude: number };

};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export const searchFuneralProviders = createServerFn({ method: "POST" })
  .inputValidator((input: { city: string }) =>
    z.object({ city: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ providers: GoogleFuneralProvider[] }> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY is not configured");

    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.priceLevel,places.googleMapsUri,places.websiteUri,places.location",
      },
      body: JSON.stringify({
        textQuery: `pompe funebre ${data.city}`,
        languageCode: "ro",
        regionCode: "RO",
        maxResultCount: 15,
      }),
    });

    const json = (await res.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        nationalPhoneNumber?: string;
        internationalPhoneNumber?: string;
        rating?: number;
        userRatingCount?: number;
        priceLevel?: string;
        googleMapsUri?: string;
        websiteUri?: string;
      }>;
    };
    if (!res.ok) {
      throw new Error(`Places searchText failed [${res.status}]: ${JSON.stringify(json)}`);
    }

    const priceMap: Record<string, number> = {
      PRICE_LEVEL_FREE: 0,
      PRICE_LEVEL_INEXPENSIVE: 1,
      PRICE_LEVEL_MODERATE: 2,
      PRICE_LEVEL_EXPENSIVE: 3,
      PRICE_LEVEL_VERY_EXPENSIVE: 4,
    };

    const providers: GoogleFuneralProvider[] = (json.places ?? []).map((p) => ({
      id: p.id,
      name: p.displayName?.text ?? "Casă funerară",
      address: p.formattedAddress ?? "",
      phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber,
      rating: p.rating,
      userRatingCount: p.userRatingCount,
      priceLevel: p.priceLevel ? priceMap[p.priceLevel] : undefined,
      mapsUri: p.googleMapsUri,
      websiteUri: p.websiteUri,
    }));

    // Sort: known price level asc, then by rating desc
    providers.sort((a, b) => {
      const ap = a.priceLevel ?? 99;
      const bp = b.priceLevel ?? 99;
      if (ap !== bp) return ap - bp;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

    return { providers };
  });
