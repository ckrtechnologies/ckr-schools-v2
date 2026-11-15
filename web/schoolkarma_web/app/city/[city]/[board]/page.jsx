import React from 'react';
import { notFound } from 'next/navigation';
import { fetchSchools } from '../../../../lib/api.js';
import CityHubClientView from '../../../../components/CityHubClientView.jsx';

export const revalidate = 3600; // 1-hour ISR

const CITY_MAP = {
  'delhi-ncr': { name: 'Delhi NCR', query: 'Delhi' },
  'delhi': { name: 'Delhi', query: 'Delhi' },
  'noida': { name: 'Noida', query: 'Noida' },
  'greater-noida': { name: 'Greater Noida', query: 'Greater Noida' },
  'ghaziabad': { name: 'Ghaziabad', query: 'Ghaziabad' },
  'pune': { name: 'Pune', query: 'Pune' },
  'bengaluru': { name: 'Bengaluru', query: 'Bengaluru' },
  'bangalore': { name: 'Bengaluru', query: 'Bengaluru' },
  'lucknow': { name: 'Lucknow', query: 'Lucknow' },
  'kanpur': { name: 'Kanpur', query: 'Kanpur' },
  'mumbai': { name: 'Mumbai', query: 'Mumbai' }
};

const POPULAR_CITIES = [
  { slug: 'delhi-ncr', name: 'Delhi NCR' },
  { slug: 'noida', name: 'Noida' },
  { slug: 'pune', name: 'Pune' },
  { slug: 'bengaluru', name: 'Bengaluru' },
  { slug: 'lucknow', name: 'Lucknow' },
  { slug: 'kanpur', name: 'Kanpur' },
  { slug: 'ghaziabad', name: 'Ghaziabad' }
];

const BOARD_MAP = {
  'cbse': 'CBSE',
  'icse': 'ICSE',
  'ib': 'IB',
  'cambridge': 'Cambridge'
};

function getCityMeta(slug) {
  const normalized = slug ? slug.toLowerCase().trim() : '';
  if (CITY_MAP[normalized]) return CITY_MAP[normalized];
  
  const formatted = normalized
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { name: formatted, query: formatted };
}

function getBoardMeta(slug) {
  const normalized = slug ? slug.toLowerCase().trim() : '';
  return BOARD_MAP[normalized] || normalized.toUpperCase();
}

export async function generateStaticParams() {
  const cities = ['delhi-ncr', 'noida', 'bengaluru', 'pune', 'lucknow', 'kanpur', 'ghaziabad', 'greater-noida'];
  const boards = ['cbse', 'icse', 'ib', 'cambridge'];

  const params = [];
  cities.forEach(city => {
    boards.forEach(board => {
      params.push({ city, board });
    });
  });
  return params;
}

export async function generateMetadata({ params }) {
  const { city, board } = await params;
  const { name: cityName } = getCityMeta(city);
  const boardName = getBoardMeta(board);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://schoolkarma.com';
  const canonicalUrl = `${siteUrl}/city/${city}/${board}`;

  return {
    title: `Best ${boardName} Schools in ${cityName} (2026–27) — Fees & Admissions | SchoolKarma`,
    description: `Compare accredited ${boardName} schools in ${cityName}. View annual fee schedules, student-teacher ratio, campus facilities, verified reviews, and apply directly online.`,
    keywords: [
      `best ${boardName.toLowerCase()} schools in ${cityName}`,
      `top ${boardName.toLowerCase()} schools in ${cityName}`,
      `${boardName.toLowerCase()} schools in ${cityName} with fee structure`,
      `${boardName.toLowerCase()} school admissions in ${cityName} 2026`,
      `list of ${boardName.toLowerCase()} schools ${cityName}`
    ],
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: `Best ${boardName} Schools in ${cityName} (2026–27) — Verified Fees & Ratings`,
      description: `Explore top-rated ${boardName} schools in ${cityName}. 100% verified annual fees, parent ratings, and direct admission applications.`,
      url: canonicalUrl,
      siteName: 'SchoolKarma',
      locale: 'en_IN',
      type: 'website'
    }
  };
}

export default async function CityBoardMatrixPage({ params }) {
  const { city, board } = await params;
  const { name: cityName, query: queryCity } = getCityMeta(city);
  const boardName = getBoardMeta(board);

  // Fetch all schools for this city
  const schoolsRes = await fetchSchools({ city: queryCity, limit: 100 });
  let schools = schoolsRes?.data || [];

  if (schools.length === 0) {
    const allRes = await fetchSchools({ limit: 200 });
    const all = allRes?.data || [];
    schools = all.filter(s => 
      s.city?.toLowerCase().includes(queryCity.toLowerCase()) ||
      s.address?.toLowerCase().includes(queryCity.toLowerCase())
    );
  }

  // Filter for board match
  const boardFilteredSchools = schools.filter(s => 
    s.affiliation_board?.toLowerCase().includes(board.toLowerCase())
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://schoolkarma.com';
  const canonicalUrl = `${siteUrl}/city/${city}/${board}`;

  // Structured Data (ItemList + Breadcrumbs + FAQ)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': siteUrl
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': cityName,
            'item': `${siteUrl}/city/${city}`
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': `${boardName} Schools`,
            'item': canonicalUrl
          }
        ]
      },
      {
        '@type': 'ItemList',
        'name': `Best ${boardName} Schools in ${cityName}`,
        'description': `Verified list of ${boardName} affiliated schools in ${cityName} with fee structures and admission links.`,
        'numberOfItems': boardFilteredSchools.length,
        'itemListElement': boardFilteredSchools.map((s, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'item': {
            '@type': 'School',
            'name': s.name,
            'url': `${siteUrl}/schools/${s.slug}`,
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': s.city || cityName,
              'addressCountry': 'IN'
            }
          }
        }))
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': `What is the average annual fee for ${boardName} schools in ${cityName}?`,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': `Annual fees for verified ${boardName} schools in ${cityName} typically range from ₹65,000 to ₹3,50,000 depending on campus infrastructure, sports amenities, and transport.`
            }
          },
          {
            '@type': 'Question',
            'name': `How can I apply directly to ${boardName} schools in ${cityName}?`,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': `You can submit direct admission enquiries and download official brochures on SchoolKarma with zero brokerage or middleman fees.`
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CityHubClientView
        citySlug={city}
        cityName={cityName}
        initialSchools={boardFilteredSchools.length > 0 ? boardFilteredSchools : schools}
        popularCities={POPULAR_CITIES}
        initialBoard={boardName}
      />
    </>
  );
}

