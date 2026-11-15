import React from 'react';
import ServicesForSchoolsClientView from '../../components/ServicesForSchoolsClientView.jsx';

export const metadata = {
  title: 'Services for Schools & Institutional ERP Suite',
  description: 'Enterprise ERP modules, admissions CRM, white-label mobile apps (Teacher & Student), fee ledgers, and CBSE/ICSE report card generator for modern schools in India.',
  alternates: {
    canonical: 'https://schoolkarma.com/services-for-schools'
  },
  openGraph: {
    title: 'Services for Schools | SchoolKarma Enterprise Suite',
    description: 'Digitize your school operations: Admissions CRM, Student Fee Ledgers, Mobile Apps, and Biometric Attendance.',
    url: 'https://schoolkarma.com/services-for-schools',
    siteName: 'SchoolKarma',
    locale: 'en_IN',
    type: 'website'
  }
};

export default function ServicesForSchoolsPage() {
  return (
    <main>
      <ServicesForSchoolsClientView />
    </main>
  );
}

