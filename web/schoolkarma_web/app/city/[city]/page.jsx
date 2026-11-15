import { fetchSchools, fetchFacets } from '../../../lib/api.js';
import CityHubClientView from '../../../components/CityHubClientView.jsx';

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

function getCityMeta(slug) {
  const normalized = slug ? slug.toLowerCase().trim() : '';
  if (CITY_MAP[normalized]) return CITY_MAP[normalized];
  
  // Title-case fallback for any custom city (e.g. 'varanasi' -> 'Varanasi')
  const formatted = normalized
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { name: formatted, query: formatted };
}

export async function generateStaticParams() {
  return [
    { city: 'delhi-ncr' },
    { city: 'delhi' },
    { city: 'noida' },
    { city: 'pune' },
    { city: 'bengaluru' },
    { city: 'lucknow' },
    { city: 'kanpur' },
    { city: 'ghaziabad' }
  ];
}

export async function generateMetadata({ params }) {
  const { city } = await params;
  const { name: cityName } = getCityMeta(city);

  return {
    title: `Best Schools in ${cityName} (2026–27) — Verified Fees, Reviews & Admissions`,
    description: `Compare top rated CBSE, ICSE, and IB schools in ${cityName}. View verified annual fee structures, student-teacher ratios, 5-axis parent ratings, and apply directly online.`,
    keywords: [
      `best schools in ${cityName}`,
      `top cbse schools in ${cityName}`,
      `icse schools in ${cityName}`,
      `${cityName} school admissions 2026`,
      `school fees in ${cityName}`,
      `schools in ${cityName} with reviews`
    ],
    alternates: {
      canonical: `https://schoolkarma.com/city/${city}`
    },
    openGraph: {
      title: `Best Schools in ${cityName} (2026–27) — Verified Fees, Reviews & Admissions | SchoolKarma`,
      description: `Explore accredited schools in ${cityName}. 100% verified annual fee structures, facilities, and direct admission inquiries.`,
      url: `https://schoolkarma.com/city/${city}`,
      siteName: 'SchoolKarma',
      images: [
        {
          url: 'https://schoolkarma.com/schoolkarma-logo-1024.png',
          width: 1024,
          height: 1024,
          alt: `SchoolKarma ${cityName} Hub`
        }
      ],
      locale: 'en_IN',
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: `Best Schools in ${cityName} (2026–27) | SchoolKarma`,
      description: `Compare accredited schools, fee schedules, and verified parent reviews in ${cityName}.`,
      images: ['https://schoolkarma.com/schoolkarma-logo-1024.png']
    }
  };
}

export default async function CityPage({ params }) {
  const { city } = await params;
  const { name: cityName, query: queryCity } = getCityMeta(city);

  // Fetch schools for this city
  const schoolsRes = await fetchSchools({ city: queryCity, limit: 100 });
  let schools = schoolsRes?.data || [];

  // If exact query returned few schools, fallback to fetching all schools and filtering locally
  if (schools.length === 0) {
    const allRes = await fetchSchools({ limit: 200 });
    const all = allRes?.data || [];
    schools = all.filter(s => 
      s.city?.toLowerCase().includes(queryCity.toLowerCase()) ||
      s.address?.toLowerCase().includes(queryCity.toLowerCase())
    );
  }

  // Schema.org Structured Data: BreadcrumbList + ItemList (Google Carousel Rich Snippet)
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
            'item': 'https://schoolkarma.com'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Cities',
            'item': 'https://schoolkarma.com/schools'
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': cityName,
            'item': `https://schoolkarma.com/city/${city}`
          }
        ]
      },
      {
        '@type': 'ItemList',
        'name': `Top Schools in ${cityName}`,
        'description': `Directory of verified, accredited schools in ${cityName} for 2026-27 admissions.`,
        'numberOfItems': schools.length,
        'itemListElement': schools.slice(0, 20).map((school, index) => ({
          '@type': 'ListItem',
          'position': index + 1,
          'item': {
            '@type': 'School',
            'name': school.name,
            'url': `https://schoolkarma.com/schools/${school.slug}`,
            'image': school.hero_image_url || school.logo_url,
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': school.city,
              'addressRegion': school.state || 'India',
              'addressCountry': 'IN'
            },
            ...(Number(school.review_count) > 0 && {
              'aggregateRating': {
                '@type': 'AggregateRating',
                'ratingValue': Number(school.avg_rating).toFixed(1),
                'bestRating': '5',
                'worstRating': '1',
                'ratingCount': Number(school.review_count)
              }
            })
          }
        }))
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main>
        <CityHubClientView
          citySlug={city}
          cityName={cityName}
          initialSchools={schools}
          popularCities={POPULAR_CITIES}
        />
      </main>
    </>
  );
}

