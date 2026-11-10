/**
 * Utility to resolve dynamic school links and asset URLs based on current host
 */

export function getSchoolPortalUrl(slug) {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `https://${slug}.ckrschools.online/login`;
  }
  return `http://localhost:5174/login?tenant=${encodeURIComponent(slug)}`;
}

export function resolveAssetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return url;
  }
  return `http://localhost:5006${url}`;
}
