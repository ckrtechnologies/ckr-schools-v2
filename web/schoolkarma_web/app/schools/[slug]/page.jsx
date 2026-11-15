import { notFound } from 'next/navigation';
import { fetchSchools, fetchSchoolBySlug, fetchSchoolReviews, fetchPressReleases } from '../../../lib/api.js';
import SchoolProfileClientView from '../../../components/SchoolProfileClientView.jsx';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  try {
    const res = await fetchSchools({ limit: 100 });
    const schools = res?.data || [];
    return schools.map((school) => ({
      slug: school.slug
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const res = await fetchSchoolBySlug(slug);
  const school = res?.data;

  if (!school) {
    return {
      title: 'School Not Found | SchoolKarma',
      description: 'The requested school profile could not be found.'
    };
  }

  const locationSuffix = school.city && !school.name.toLowerCase().includes(school.city.toLowerCase())
    ? `, ${school.city}`
    : '';
  const title = `${school.name}${locationSuffix} — Admissions 2026-27, Fees & Reviews`;
  const description = school.about 
    ? `${school.name} in ${school.city}. Verified ${school.affiliation_board || 'accredited'} curriculum. View annual fee structure, 5-axis parent ratings, student-teacher ratio, and direct admissions.`
    : `Explore verified campus facilities, annual fees, and 5-axis parent ratings for ${school.name}${locationSuffix}. Admissions open for 2026-27.`;

  const heroImage = school.hero_image_url || school.logo_url || 'https://schoolkarma.com/schoolkarma-logo-1024.png';

  return {
    title,
    description,
    keywords: [
      school.name,
      `${school.name} fees`,
      `${school.name} admissions 2026`,
      `${school.name} reviews`,
      `${school.affiliation_board || 'cbse'} schools in ${school.city}`,
      `schools in ${school.city}`
    ],
    alternates: {
      canonical: `https://schoolkarma.com/schools/${slug}`
    },
    openGraph: {
      title,
      description,
      url: `https://schoolkarma.com/schools/${slug}`,
      siteName: 'SchoolKarma',
      images: [
        {
          url: heroImage,
          width: 1200,
          height: 630,
          alt: `${school.name} Campus`
        }
      ],
      locale: 'en_IN',
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${school.name}, ${school.city} | SchoolKarma`,
      description,
      images: [heroImage]
    }
  };
}

export default async function SchoolPage({ params }) {
  const { slug } = await params;

  const [schoolRes, reviewsRes, pressRes] = await Promise.all([
    fetchSchoolBySlug(slug),
    fetchSchoolReviews(slug),
    fetchPressReleases(slug)
  ]);

  const school = schoolRes?.data;
  if (!school) {
    notFound();
  }

  const reviews = reviewsRes?.data || [];
  const pressReleases = pressRes?.data || [];

  // Schema.org Structured Data: EducationalOrganization + BreadcrumbList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'School',
        '@id': `https://schoolkarma.com/schools/${slug}#school`,
        'name': school.name,
        'description': school.about || `${school.name} is a premier accredited institution in ${school.city}.`,
        'url': `https://schoolkarma.com/schools/${slug}`,
        'image': school.hero_image_url || school.logo_url || 'https://schoolkarma.com/schoolkarma-logo-1024.png',
        'logo': school.logo_url || undefined,
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': school.address || '',
          'addressLocality': school.city,
          'addressRegion': school.state || 'India',
          'postalCode': school.pincode || '',
          'addressCountry': 'IN'
        },
        'telephone': school.official_phone || '+91-9821776412',
        'email': school.official_email || 'hello@schoolkarma.com',
        ...(Number(school.review_count) > 0 && Number(school.avg_rating) > 0 && {
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': Number(school.avg_rating).toFixed(1),
            'bestRating': '5',
            'worstRating': '1',
            'ratingCount': Number(school.review_count)
          }
        }),
        ...(Number(school.min_fee) > 0 && {
          'offers': {
            '@type': 'Offer',
            'price': String(school.min_fee),
            'priceCurrency': 'INR',
            'description': 'Annual Tuition Fee Range'
          }
        })
      },
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
            'name': 'Schools',
            'item': 'https://schoolkarma.com/schools'
          },
          ...(school.city ? [
            {
              '@type': 'ListItem',
              'position': 3,
              'name': school.city,
              'item': `https://schoolkarma.com/city/${encodeURIComponent(school.city.toLowerCase())}`
            },
            {
              '@type': 'ListItem',
              'position': 4,
              'name': school.name,
              'item': `https://schoolkarma.com/schools/${slug}`
            }
          ] : [
            {
              '@type': 'ListItem',
              'position': 3,
              'name': school.name,
              'item': `https://schoolkarma.com/schools/${slug}`
            }
          ])
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

      <main>
        <SchoolProfileClientView
          school={school}
          initialReviews={reviews}
          initialPressReleases={pressReleases}
        />
      </main>
    </>
  );
}
