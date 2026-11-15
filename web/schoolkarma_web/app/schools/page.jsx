import React, { Suspense } from 'react';
import { fetchSchools, fetchFacets } from '../../lib/api.js';
import CatalogClientView from '../../components/CatalogClientView.jsx';

export const revalidate = 3600; // 1-hour ISR

export const metadata = {
  title: 'All Schools Catalog & Comparison Directory',
  description: 'Browse, filter, and compare all accredited CBSE, ICSE, and IB schools across India. Inspect annual fee ranges, parent ratings, and student facilities.',
  alternates: {
    canonical: 'https://schoolkarma.com/schools'
  },
  openGraph: {
    title: 'All Schools Catalog | SchoolKarma',
    description: 'Explore verified campuses with transparent fees, parent reviews, and 1-click admission enquiries.',
    url: 'https://schoolkarma.com/schools',
    siteName: 'SchoolKarma',
    locale: 'en_IN',
    type: 'website'
  }
};

export default async function SchoolsCatalogPage() {
  const [schoolsRes, facetsRes] = await Promise.all([
    fetchSchools({ limit: 120 }),
    fetchFacets()
  ]);

  const schools = schoolsRes?.data || [];
  const facets = facetsRes?.data || { cities: [], boards: [] };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'All Accredited Schools in India',
    description: 'Complete directory of verified schools across India on SchoolKarma.',
    itemListElement: schools.slice(0, 30).map((school, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: school.name,
      url: `https://schoolkarma.com/schools/${school.slug}`
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>Loading Catalog…</div>}>
          <CatalogClientView
            initialSchools={schools}
            initialFacets={facets}
          />
        </Suspense>
      </main>
    </>
  );
}

