import { useCallback, useEffect, useState } from 'react';

/**
 * Lightweight path routing for the public marketplace so every surface is
 * shareable and the school profile lives at /schools/:slug.
 */
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

export function parseRoute(pathname = '/') {
  let path = String(pathname || '/');
  if (BASE && path.toLowerCase().startsWith(BASE.toLowerCase())) {
    path = path.slice(BASE.length) || '/';
  }
  path = path.replace(/\/+$/, '') || '/';

  if (path === '/schools' || path === '/catalog') return { view: 'catalog', slug: null };
  if (path === '/compare') return { view: 'compare', slug: null };

  const school = path.match(/^\/schools\/([^/]+)$/);
  if (school) return { view: 'school-profile', slug: decodeURIComponent(school[1]) };

  return { view: 'home', slug: null };
}

export function pathFor(view, slug) {
  if (view === 'school-profile' && slug) return `${BASE}/schools/${encodeURIComponent(slug)}`;
  if (view === 'catalog') return `${BASE}/schools` || '/schools';
  if (view === 'compare') return `${BASE}/compare` || '/compare';
  return `${BASE}/` || '/';
}

export function useMarketplaceRoute() {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((view, slug) => {
    const path = pathFor(view, slug);
    if (window.location.pathname !== path) {
      window.history.pushState({ view, slug: slug || null }, '', path);
    }
    setRoute(parseRoute(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { ...route, navigate };
}
