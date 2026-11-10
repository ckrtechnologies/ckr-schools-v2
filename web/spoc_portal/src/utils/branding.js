/**
 * Multi-tenant branding for the SPOC portal — same behaviour as the school admin panel.
 */

export function resolveAssetUrl(url) {
  if (!url) return null;
  if (/^(https?:|data:)/.test(url)) return url;
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5006/api').replace(/\/api\/?$/, '');
  return `${apiBase}${url.startsWith('/') ? url : `/${url}`}`;
}

export function applySchoolBranding(school, portalTitle = 'SPOC Portal') {
  if (!school) return;

  const schoolName = school.name || school.schoolName || 'School';
  document.title = `${schoolName} - ${portalTitle}`;

  const faviconUrl = resolveAssetUrl(school.logoUrl || school.logo_url);
  if (faviconUrl) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }

  const primary = school.themeColor || school.theme_color;
  if (primary) {
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--brand-theme', primary);
  }
}

export async function fetchSchoolProfile(slug) {
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5006/api').replace(/\/api\/?$/, '');
  const targetSlug = slug || localStorage.getItem('spocTenantSlug') || '';
  try {
    const res = await fetch(
      `${apiBase}/api/public-school-profile${targetSlug ? `?slug=${encodeURIComponent(targetSlug)}` : ''}`,
      { headers: targetSlug ? { 'x-tenant-slug': targetSlug } : {} }
    );
    const json = await res.json();
    if (json.success && json.data) return json.data;
  } catch (e) {
    console.error('Failed to fetch school profile:', e);
  }
  return null;
}
