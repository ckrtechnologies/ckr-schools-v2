import { fetchSchools } from '../lib/api.js';
import { ERP_MODULES } from '../lib/erpModulesData.js';
import { BOARDS_DATA } from '../lib/boardsData.js';

export const revalidate = 86400; // 24-hour ISR for sitemap

const POPULAR_CITIES = [
  'delhi-ncr',
  'delhi',
  'noida',
  'pune',
  'bengaluru',
  'lucknow',
  'kanpur',
  'ghaziabad'
];

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://schoolkarma.com';

  // 1. Static Core Landing Pages
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/schools`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/services-for-schools`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/delete-account`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    }
  ];

  // 2. Fetch all verified schools from backend
  let schools = [];
  try {
    const res = await fetchSchools({ limit: 1000 });
    schools = res?.data || [];
  } catch (err) {
    schools = [];
  }

  // 3. Extract unique cities from live database
  const dynamicCitySet = new Set(POPULAR_CITIES);
  schools.forEach(s => {
    if (s.city) {
      const slug = s.city.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (slug) dynamicCitySet.add(slug);
    }
  });

  const cityRoutes = Array.from(dynamicCitySet).map(citySlug => ({
    url: `${baseUrl}/city/${citySlug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // 4. ERP Solution Module Routes (B2B Institutional SEO)
  const erpModuleRoutes = Object.keys(ERP_MODULES).map(slug => ({
    url: `${baseUrl}/services-for-schools/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // 5. Affiliation Board Hub Routes
  const boardRoutes = Object.keys(BOARDS_DATA).map(board => ({
    url: `${baseUrl}/board/${board}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // 6. Programmatic City + Board Matrix Routes (e.g. /city/noida/cbse)
  const cityBoardMatrixRoutes = [];
  const topCities = ['delhi-ncr', 'noida', 'bengaluru', 'pune', 'lucknow', 'kanpur', 'ghaziabad', 'greater-noida'];
  const topBoards = Object.keys(BOARDS_DATA);
  topCities.forEach(city => {
    topBoards.forEach(board => {
      cityBoardMatrixRoutes.push({
        url: `${baseUrl}/city/${city}/${board}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });
  });

  // 7. Individual Campus Routes
  const schoolRoutes = schools.map(s => ({
    url: `${baseUrl}/schools/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...erpModuleRoutes,
    ...cityRoutes,
    ...boardRoutes,
    ...cityBoardMatrixRoutes,
    ...schoolRoutes
  ];
}

