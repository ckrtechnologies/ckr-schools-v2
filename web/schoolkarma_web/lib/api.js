/**
 * SchoolKarma API Client
 * Works both on the Server (direct fetch) and Client (via /api reverse proxy)
 */

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return ''; // Client uses relative URLs, routed via Next.js rewrites
  }
  // Server-side direct call to Express 5 backend
  return process.env.API_INTERNAL_URL || 'http://localhost:5006';
};

export async function fetchSchools({ search = '', city = 'all', board = 'all', minFee, maxFee, limit = 100 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (city && city !== 'all') params.set('city', city);
  if (board && board !== 'all') params.set('board', board);
  if (minFee) params.set('min_fee', String(minFee));
  if (maxFee) params.set('max_fee', String(maxFee));
  if (limit) params.set('limit', String(limit));

  const url = `${getBaseUrl()}/api/marketplace/schools?${params.toString()}`;
  const res = await fetch(url, {
    next: { revalidate: 3600 } // ISR Cache 1 hour
  });
  if (!res.ok) return { success: false, data: [] };
  return res.json();
}

export async function fetchSchoolBySlug(slug) {
  const url = `${getBaseUrl()}/api/marketplace/schools/${slug}`;
  const res = await fetch(url, {
    next: { revalidate: 1800 } // ISR Cache 30 mins
  });
  if (!res.ok) return { success: false, data: null };
  return res.json();
}

export async function fetchFacets() {
  const url = `${getBaseUrl()}/api/marketplace/facets`;
  const res = await fetch(url, {
    next: { revalidate: 7200 } // ISR Cache 2 hours
  });
  if (!res.ok) return { success: false, data: { cities: [], boards: [] } };
  return res.json();
}

export async function fetchSchoolReviews(slug) {
  const url = `${getBaseUrl()}/api/marketplace/schools/${slug}/reviews`;
  const res = await fetch(url, {
    next: { revalidate: 300 }
  });
  if (!res.ok) return { success: false, data: [] };
  return res.json();
}

export async function submitEnquiry(payload) {
  const res = await fetch('/api/marketplace/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function submitMultiEnquiry(payload) {
  const res = await fetch('/api/marketplace/enquiries/multi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function submitBrochureDownload(payload) {
  const res = await fetch('/api/marketplace/brochures/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function submitSchoolReview(slug, payload, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/marketplace/schools/${slug}/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchPressReleases(slug) {
  const url = `${getBaseUrl()}/api/marketplace/schools/${slug}/press-releases`;
  const res = await fetch(url, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) return { success: false, data: [] };
  return res.json();
}

export async function upvoteReviewHelpful(reviewId) {
  const res = await fetch(`/api/marketplace/reviews/${reviewId}/helpful`, {
    method: 'POST'
  });
  return res.json();
}

export async function loginParent({ phone, password }) {
  const res = await fetch('/api/marketplace/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function signupParent(payload) {
  const res = await fetch('/api/marketplace/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

