export async function geocodeCity(
  city: string,
  country: string | null | undefined,
): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({ city, format: "json", limit: "1" });
  if (country) params.set("country", country);

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
