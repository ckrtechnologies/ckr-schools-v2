import { fetchSchools, fetchFacets } from '../lib/api.js';
import HomeClientView from '../components/HomeClientView.jsx';

export const revalidate = 3600; // ISR cache 1 hour

export const metadata = {
  title: {
    absolute: 'SchoolKarma — Verified Schools in India, Parent Reviews & Admissions 2026-27'
  },
  description: 'Discover accredited CBSE, ICSE, and IB schools across Delhi NCR, Noida, Pune, and Bengaluru. Compare annual fees, facilities, student-teacher ratios & 5-axis parent ratings with zero brokerage.',
  keywords: [
    'schools in india',
    'best cbse schools in delhi ncr',
    'top icse schools in noida',
    'schools in pune',
    'bengaluru school admissions 2026',
    'school fees comparison',
    'parent reviews of schools',
    'school admission enquiry'
  ],
  alternates: {
    canonical: 'https://schoolkarma.com'
  },
  openGraph: {
    title: 'SchoolKarma — Verified Schools in India, Parent Reviews & Admissions 2026-27',
    description: 'Discover accredited CBSE, ICSE, and IB schools across Delhi NCR, Noida, Pune, and Bengaluru. Compare annual fees, facilities, student-teacher ratios & 5-axis parent ratings with zero brokerage.',
    url: 'https://schoolkarma.com',
    siteName: 'SchoolKarma',
    images: [
      {
        url: 'https://schoolkarma.com/schoolkarma-logo-1024.png',
        width: 1024,
        height: 1024,
        alt: 'SchoolKarma India School Discovery & Admissions'
      }
    ],
    locale: 'en_IN',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SchoolKarma — Verified Schools in India, Parent Reviews & Admissions 2026-27',
    description: 'Compare annual fees, facilities, student-teacher ratios & 5-axis parent ratings across top accredited schools in India.',
    images: ['https://schoolkarma.com/schoolkarma-logo-1024.png']
  }
};

export default async function HomePage() {
  const [schoolsRes, facetsRes] = await Promise.all([
    fetchSchools({ limit: 100 }),
    fetchFacets()
  ]);

  const schools = schoolsRes?.data || [];
  const facets = facetsRes?.data || { cities: [], boards: [] };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://schoolkarma.com/#website',
        'url': 'https://schoolkarma.com',
        'name': 'SchoolKarma',
        'description': 'India’s Verified School Discovery, Admissions & ERP Operating System',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://schoolkarma.com/schools?search={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'Organization',
        '@id': 'https://schoolkarma.com/#organization',
        'name': 'SchoolKarma',
        'url': 'https://schoolkarma.com',
        'logo': 'https://schoolkarma.com/schoolkarma-logo-1024.png',
        'contactPoint': {
          '@type': 'ContactPoint',
          'telephone': '+91-9821776412',
          'contactType': 'customer support',
          'areaServed': 'IN',
          'availableLanguage': ['English', 'Hindi']
        }
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://schoolkarma.com/#faq',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'Where does the school information on SchoolKarma come from?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Each affiliated school directly maintains its official campus profile, fees schedule, facilities, and photo galleries via their dedicated SchoolKarma ERP & SPOC portal. SchoolKarma strictly verifies accreditation and board affiliation before publishing.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Is there any fee or commission charged to parents?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Zero. Prospective parents can browse, download brochures, and submit admission inquiries 100% free with no brokerage, markups, or hidden charges whatsoever.'
            }
          },
          {
            '@type': 'Question',
            'name': 'How does the 1-Click Multi-School enquiry work?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'You can select up to 3 schools in the comparison tray or from search results. When you submit your child’s details once, individual inquiries are registered simultaneously across all selected institutions, saving parents from filling repetitive paperwork.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Do I need an account to enquire or to review a school?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No account is required to browse or submit an admission inquiry. To submit verified parent reviews and ratings, parents sign in securely via phone OTP to prevent fake testimonials.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Can schools modify parent reviews or ratings?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No. SchoolKarma maintains strict editorial independence. 5-axis ratings and parent reviews are tamper-evident and cannot be manipulated or hidden by school administrations.'
            }
          },
          {
            '@type': 'Question',
            'name': 'How can our school partner with SchoolKarma?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'School trustees and administrators can click the "School Login" button at the top right, access their school domain, or register a new campus directly through our verification team.'
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main>
        <HomeClientView 
          initialSchools={schools} 
          initialFacets={facets} 
        />
      </main>
    </>
  );
}
