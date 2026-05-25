export async function geocodeCity(
  city: string,
  country: string | null | undefined,
): Promise<{ lat: number; lng: number } | null> {
  // Free-form query is more robust than structured params for Nominatim
  const q = [city, country].filter(Boolean).join(", ");
  const params = new URLSearchParams({ q, format: "json", limit: "1" });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { "User-Agent": "EDN2006Reunion/1.0" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
