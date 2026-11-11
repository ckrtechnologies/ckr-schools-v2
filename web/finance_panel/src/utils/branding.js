/**
 * Dynamic Multi-Tenant Branding Engine
 * Automatically applies custom document.title, favicon, and brand color palette per school.
 */

export function applySchoolBranding(school, portalTitle = 'Finance Portal') {
  if (!school) return;

  const schoolName = school.name || school.schoolName || 'School';
  document.title = `${schoolName} - ${portalTitle}`;

  const faviconUrl = school.logoUrl || school.logo_url;
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

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/api\/?$/, '');

export function resolveAssetUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE}${cleanPath}`;
}

export async function fetchSchoolProfile(slug) {
  try {
    let targetSlug = slug || localStorage.getItem('tenantSlug') || '';
    if (!targetSlug) {
      try {
        const u = JSON.parse(localStorage.getItem('financeUser') || localStorage.getItem('adminUser') || '{}');
        targetSlug = u.schoolSlug || u.tenant_slug || '';
      } catch (e) {}
    }
    const url = `${API_BASE}/api/public-school-profile${targetSlug ? `?slug=${encodeURIComponent(targetSlug)}` : ''}`;
    const res = await fetch(url, {
      headers: { ...(targetSlug ? { 'x-tenant-slug': targetSlug } : {}) }
    });
    const json = await res.json();
    if (json.success && json.data) {
      if (json.data.logoUrl) {
        json.data.logoUrl = resolveAssetUrl(json.data.logoUrl);
      }
      return json.data;
    }
  } catch (e) {
    console.error('Failed to fetch school profile:', e);
  }
  return null;
}

