import React from 'react';
import Link from 'next/link';
import { IconFileText, IconShieldCheck } from '@tabler/icons-react';

export const metadata = {
  title: 'Terms of Service — SchoolKarma Guidelines & Conditions',
  description: 'Official Terms of Service governing the use of SchoolKarma school discovery network, ERP portals, and mobile applications.',
  alternates: {
    canonical: 'https://schoolkarma.com/terms'
  }
};

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', width: '100%', padding: '40px 0 80px', boxSizing: 'border-box' }}>
      <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
        
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
          <Link href="/" style={{ color: '#064e3b', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>Terms of Service</span>
        </div>

        {/* Header */}
        <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '24px', marginBottom: '32px', width: '100%' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ecfdf5',
            color: '#064e3b',
            border: '1px solid #a7f3d0',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 800,
            marginBottom: '12px'
          }}>
            <IconFileText size={14} />
            <span>LEGAL TERMS &amp; CONDITIONS</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Last Updated: November 15, 2026 · Governing all usage of SchoolKarma Web Portals &amp; Mobile Applications.
          </p>
        </div>

        {/* Content Body */}
        <div style={{ fontSize: '14.5px', color: '#334155', lineHeight: '1.75', display: 'flex', flexDirection: 'column', gap: '26px' }}>
          
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the SchoolKarma website, mobile apps, or associated ERP portals, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not access our services.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              2. Nature of Services
            </h2>
            <p>
              SchoolKarma operates as an educational discovery directory, admission enquiry facilitator, and institutional enterprise resource planning (ERP) platform. SchoolKarma is <strong>not a broker or intermediary</strong> and charges zero commission to parents for school discovery or admission submissions.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              3. School Data &amp; Verification Accuracy
            </h2>
            <p>
              School profiles, fee schedules, board affiliations (CBSE, ICSE, IB, Cambridge), and facilities listed on SchoolKarma are verified using official school prospectus documents, SPOC verifications, and public regulatory records. However, final admission approvals, fee concession approvals, and scholarship grants remain solely at the discretion of the respective school management.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              4. Review Guidelines &amp; Community Standards
            </h2>
            <p>
              To maintain the integrity of our 5-axis parent rating system, reviews submitted must reflect genuine, authentic parent experiences. Spam, promotional campaigns, or malicious reviews by competitor institutions are strictly prohibited and subject to automated fraud screening and removal.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              5. Governing Law &amp; Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts located in Gautam Buddha Nagar (Greater Noida / Noida), Uttar Pradesh, India.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}

