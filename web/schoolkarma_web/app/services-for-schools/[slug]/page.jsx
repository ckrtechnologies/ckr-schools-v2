import React from 'react';
import { notFound } from 'next/navigation';
import { ERP_MODULES } from '../../../lib/erpModulesData.js';
import ErpModuleDetailClientView from '../../../components/ErpModuleDetailClientView.jsx';

export const revalidate = 86400; // 24-hour ISR

export async function generateStaticParams() {
  return Object.keys(ERP_MODULES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const moduleData = ERP_MODULES[slug];

  if (!moduleData) {
    return {
      title: 'Module Not Found — SchoolKarma ERP Suite'
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://schoolkarma.com';
  const canonicalUrl = `${siteUrl}/services-for-schools/${slug}`;

  return {
    title: `${moduleData.seoTitle} | SchoolKarma`,
    description: moduleData.seoDescription,
    keywords: moduleData.keywords,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: `${moduleData.title} | SchoolKarma Institutional ERP`,
      description: moduleData.seoDescription,
      url: canonicalUrl,
      siteName: 'SchoolKarma',
      locale: 'en_IN',
      type: 'article'
    },
    twitter: {
      card: 'summary_large_image',
      title: moduleData.title,
      description: moduleData.seoDescription
    }
  };
}

export default async function ErpModulePage({ params }) {
  const { slug } = await params;
  const moduleData = ERP_MODULES[slug];

  if (!moduleData) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://schoolkarma.com';
  const canonicalUrl = `${siteUrl}/services-for-schools/${slug}`;

  // JSON-LD: SoftwareApplication schema
  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `SchoolKarma ${moduleData.title}`,
    operatingSystem: 'Web, Android, iOS',
    applicationCategory: 'EducationalApplication, BusinessApplication',
    description: moduleData.seoDescription,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: 'Included in SchoolKarma Campus Growth & Enterprise Plans'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '128'
    },
    featureList: moduleData.capabilities.map(c => c.title)
  };

  // JSON-LD: FAQPage schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: moduleData.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a
      }
    }))
  };

  // JSON-LD: BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Services for Schools',
        item: `${siteUrl}/services-for-schools`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: moduleData.title,
        item: canonicalUrl
      }
    ]
  };

  return (
    <>
      {/* Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ErpModuleDetailClientView moduleData={moduleData} />
    </>
  );
}

