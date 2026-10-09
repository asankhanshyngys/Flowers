// 2GIS's official widget accepts a firm ID and an optional map position.
export function locationMapUrl(link: string): string | null {
  try {
    const url = new URL(link);
    if (url.protocol !== 'https:' || !['2gis.kz','2gis.ru','2gis.com'].includes(url.hostname) || url.username || url.password) return null;
    const match = url.pathname.match(/^\/([a-z0-9_-]+)\/firm\/(\d+)(?:\/|$)/);
    if (!match) return null;
    const [, city, org] = match;
    const pos = org === '70000001067393553' ? {lat:51.14245,lon:71.420112,zoom:16} : {};
    return 'https://widgets.2gis.com/widget?type=firmsonmap&options=' + encodeURIComponent(JSON.stringify({pos,opt:{city,card:[]},org}));
  } catch { return null; }
}
