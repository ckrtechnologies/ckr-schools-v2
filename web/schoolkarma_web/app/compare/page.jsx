import React from 'react';
import CompareClientView from '../../components/CompareClientView.jsx';

export const metadata = {
  title: 'Compare Schools Side-by-Side',
  description: 'Evaluate up to 3 CBSE, ICSE, and IB schools side-by-side. Compare annual fees, student-teacher ratios, ratings, facilities, and board affiliations in one clear matrix.',
  alternates: {
    canonical: 'https://schoolkarma.com/compare'
  },
  openGraph: {
    title: 'Compare Schools Side-by-Side | SchoolKarma',
    description: 'Compare fees, facilities, student-to-teacher ratio and parent ratings across top schools in India.',
    url: 'https://schoolkarma.com/compare',
    siteName: 'SchoolKarma',
    locale: 'en_IN',
    type: 'website'
  }
};

export default function ComparePage() {
  return (
    <main>
      <CompareClientView />
    </main>
  );
}

