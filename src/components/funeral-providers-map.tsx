import { useEffect, useRef } from "react";
import type { GoogleFuneralProvider } from "@/lib/funeral-providers.functions";

declare global {
  interface Window {
    google?: any;
    __lovableMapsLoading?: Promise<void>;
    __lovableInitMap?: () => void;
  }
}

function loadMapsApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__lovableMapsLoading) return window.__lovableMapsLoading;
  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
  window.__lovableMapsLoading = new Promise<void>((resolve, reject) => {
    window.__lovableInitMap = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__lovableInitMap&channel=${channel}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
  return window.__lovableMapsLoading;
}

export function FuneralProvidersMap({ providers, city }: { providers: GoogleFuneralProvider[]; city?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadMapsApi().then(() => {
      if (cancelled || !ref.current || !window.google?.maps) return;
      const g = window.google.maps;
      const pts = providers.filter((p) => p.location).map((p) => p.location!);
      const map = new g.Map(ref.current, {
        center: pts[0] ? { lat: pts[0].latitude, lng: pts[0].longitude } : { lat: 46.77, lng: 23.6 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      const bounds = new g.LatLngBounds();
      providers.forEach((p, i) => {
        if (!p.location) return;
        const pos = { lat: p.location.latitude, lng: p.location.longitude };
        const marker = new g.Marker({
          position: pos,
          map,
          label: { text: String(i + 1), color: "white", fontSize: "12px", fontWeight: "600" },
          title: p.name,
        });
        const info = new g.InfoWindow({
          content: `<div style="font-family:system-ui;max-width:220px"><div style="font-weight:600;margin-bottom:4px">${p.name}</div><div style="font-size:12px;color:#555">${p.address}</div>${p.phone ? `<div style="font-size:12px;margin-top:4px"><a href="tel:${p.phone.replace(/\s+/g, "")}">${p.phone}</a></div>` : ""}</div>`,
        });
        marker.addListener("click", () => info.open({ map, anchor: marker }));
        bounds.extend(pos);
      });
      if (pts.length > 1) map.fitBounds(bounds, 40);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [providers]);

  return (
    <div
      ref={ref}
      role="application"
      aria-label={city ? `Hartă case funerare în ${city}` : "Hartă case funerare"}
      className="h-72 w-full overflow-hidden rounded-lg border border-border bg-muted"
    />
  );
}
