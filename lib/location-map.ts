// A map-only OpenStreetMap embed avoids the business popup forced by 2GIS.
export function locationMapUrl(link: string): string | null {
  try {
    const url = new URL(link);
    if (url.protocol !== 'https:' || !['2gis.kz','2gis.ru','2gis.com'].includes(url.hostname) || url.username || url.password) return null;
    const match = url.pathname.match(/^\/([a-z0-9_-]+)\/firm\/(\d+)(?:\/|$)/);
    if (!match) return null;
    // The known store's actual coordinates, not the shared map viewport.
    if (match[2] !== '70000001067393553') return null;
    return pinMapUrl(51.14245, 71.420112);
  } catch { return null; }
}
export function pinMapUrl(latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude)>85 || Math.abs(longitude)>180) return null;
  const params = new URLSearchParams({bbox: `${longitude-.006},${latitude-.0035},${longitude+.006},${latitude+.0035}`,layer:'mapnik',marker:`${latitude},${longitude}`});
  return `https://www.openstreetmap.org/export/embed.html?${params}`;
}
