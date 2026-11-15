import React from 'react';
import { notFound } from 'next/navigation';
import { fetchSchools } from '../../../lib/api.js';
import { BOARDS_DATA } from '../../../lib/boardsData.js';
import BoardHubClientView from '../../../components/BoardHubClientView.jsx';

export const revalidate = 3600; // 1-hour ISR

const POPULAR_CITIES = [
  { slug: 'delhi-ncr', name: 'Delhi NCR' },
  { slug: 'noida', name: 'Noida' },
  { slug: 'bengaluru', name: 'Bengaluru' },
  { slug: 'pune', name: 'Pune' },
  { slug: 'lucknow', name: 'Lucknow' },
  { slug: 'kanpur', name: 'Kanpur' },
  { slug: 'greater-noida', name: 'Greater Noida' }
];

export async function generateStaticParams() {
  return Object.keys(BOARDS_DATA).map((board) => ({ board }));
}

export async function generateMetadata({ params }) {
  const { board } = await params;
  const boardData = BOARDS_DATA[board.toLowerCase()];

  if (!boardData) {
    return {
      title: 'Board Not Found — SchoolKarma'
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://schoolkarma.com';
  const canonicalUrl = `${siteUrl}/board/${board}`;

  return {
    title: `${boardData.seoTitle} | SchoolKarma`,
    description: boardData.seoDescription,
    keywords: boardData.keywords,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: `${boardData.name} Schools in India — Verified Directory | SchoolKarma`,
      description: boardData.seoDescription,
      url: canonicalUrl,
      siteName: 'SchoolKarma',
      locale: 'en_IN',
      type: 'website'
    }
  };
}

export default async function BoardPage({ params }) {
  const { board } = await params;
  const boardData = BOARDS_DATA[board.toLowerCase()];

  if (!boardData) {
    notFound();
  }

  // Fetch all schools and filter for this board
  const res = await fetchSchools({ limit: 1000 });
  const allSchools = res?.data || [];
  const boardSchools = allSchools.filter(s => 
    s.affiliation_board?.toLowerCase().includes(board.toLowerCase())
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://schoolkarma.com';
  const canonicalUrl = `${siteUrl}/board/${board}`;

  // Structured Data (ItemList + Breadcrumbs)
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
            'name': 'Affiliation Boards',
            'item': `${siteUrl}/schools`
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': `${boardData.name} Schools`,
            'item': canonicalUrl
          }
        ]
      },
      {
        '@type': 'ItemList',
        'name': `Top ${boardData.name} Schools in India`,
        'description': boardData.seoDescription,
        'numberOfItems': boardSchools.length,
        'itemListElement': boardSchools.slice(0, 30).map((s, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'item': {
            '@type': 'School',
            'name': s.name,
            'url': `${siteUrl}/schools/${s.slug}`,
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': s.city || 'India',
              'addressCountry': 'IN'
            }
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
      <BoardHubClientView
        boardSlug={board.toLowerCase()}
        boardName={boardData.name}
        boardOverview={boardData.overview}
        initialSchools={boardSchools}
        popularCities={POPULAR_CITIES}
      />
    </>
  );
}

