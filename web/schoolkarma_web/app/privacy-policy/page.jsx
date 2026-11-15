import React from 'react';
import Link from 'next/link';
import { 
  IconShieldCheck, 
  IconLock, 
  IconTrash, 
  IconDeviceMobile, 
  IconDatabase, 
  IconMail, 
  IconPhoneCall, 
  IconBuildingSkyscraper 
} from '@tabler/icons-react';

export const metadata = {
  title: 'Privacy Policy — SchoolKarma Data Safety & Protection',
  description: 'Official SchoolKarma Privacy Policy compliant with Indian IT Act 2000, SPDI Rules 2011, and Google Play Store Developer Guidelines.',
  alternates: {
    canonical: 'https://schoolkarma.com/privacy-policy'
  }
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', width: '100%', padding: '40px 0 80px', boxSizing: 'border-box' }}>
      <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
        
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
          <Link href="/" style={{ color: '#064e3b', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>Privacy Policy</span>
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
            <IconShieldCheck size={14} />
            <span>PLAY STORE &amp; APP STORE COMPLIANT DATA SAFETY</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Privacy Policy &amp; Data Protection
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Effective Date: March 1, 2026 · Last Updated: November 15, 2026 · Compliant with Digital Personal Data Protection Act (DPDP) 2023 &amp; IT Rules.
          </p>
        </div>

        {/* Content Body */}
        <div style={{ fontSize: '14.5px', color: '#334155', lineHeight: '1.75', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              1. Overview &amp; Our Commitment
            </h2>
            <p>
              SchoolKarma Technologies (a Government of India MSME Registered Educational Organization) operates the SchoolKarma School Discovery Portal, School Admin &amp; SPOC Portals, and White-Label Teacher and Parent Mobile Apps. We are deeply committed to protecting the privacy and personal data of parents, students, teachers, and school administrators.
            </p>
            <p>
              <strong>We never sell, rent, or trade student, parent, or school data to third-party advertising brokers or coaching centers.</strong> All data is strictly hosted within India on sovereign Indian cloud and office VPS infrastructure.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              2. Information We Collect
            </h2>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>Parent &amp; Student Information:</strong> Parent name, mobile number, email address, student name, grade applied for, and optional remarks submitted during direct admission enquiries.
              </li>
              <li>
                <strong>School Account &amp; Administrative Data:</strong> School registration details, official email, phone numbers, administrator login credentials (stored with industry-standard bcrypt hashing), and campus profile media.
              </li>
              <li>
                <strong>Financial Information:</strong> Fee receipts, payment transaction IDs, and dues ledgers. All online transactions are processed through RBI-authorized payment gateways (Cashfree / Razorpay). SchoolKarma does not store full credit card numbers or banking passwords.
              </li>
              <li>
                <strong>Mobile Device Information &amp; App Permissions:</strong> Camera &amp; storage permissions requested only when teachers or parents upload homework attachments or student profile pictures; Push notification permissions (Firebase Cloud Messaging) for emergency campus alerts and circulars.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              3. Purpose &amp; Use of Collected Data
            </h2>
            <p>We process collected information strictly for:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Direct routing of admission enquiries and prospectus downloads to the chosen school's admissions desk.</li>
              <li>Generating verifiable student fee receipts, report cards, and attendance registers.</li>
              <li>Sending transactional WhatsApp and DLT-registered SMS alerts regarding admissions, fees, and campus notices.</li>
              <li>Enforcing tamper-proof verified parent reviews (preventing automated spam or competitor defamation).</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              4. Data Retention &amp; User Account Deletion (Google Play Compliance)
            </h2>
            <p>
              In accordance with Google Play Store Developer Guidelines on Account and Data Deletion, any user who has created an account on SchoolKarma or its white-label mobile applications has the right to request full account deletion and erasure of their personal information.
            </p>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              padding: '16px 20px',
              marginTop: '12px'
            }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconTrash size={18} color="#dc2626" />
                <span>How to Request Account &amp; Data Deletion</span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '13.5px' }}>
                You can submit an instant, self-serve account deletion request via our dedicated portal:
              </p>
              <Link
                href="/delete-account"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                Submit Data Deletion Request →
              </Link>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              5. Data Security &amp; Hosting
            </h2>
            <p>
              All databases, student records, and server instances run on isolated self-hosted PostgreSQL environments located in Tier-4 Indian data centers. We enforce SSL/TLS encryption for all data in transit and multi-tenant row-level access controls to ensure school records remain isolated.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              6. Grievance Officer &amp; Institutional Contact
            </h2>
            <p>
              In accordance with the Information Technology Act 2000 and rules made thereunder, the contact details of the Grievance Officer are:
            </p>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px 18px', fontSize: '13.5px' }}>
              <div><strong>Grievance Redressal Officer:</strong> Data Protection Cell, SchoolKarma</div>
              <div><strong>Organization:</strong> SchoolKarma Technologies (Govt. of India MSME Reg.)</div>
              <div><strong>Address:</strong> TechZone 4, Greater Noida West, Uttar Pradesh 201306, India</div>
              <div><strong>Helpline:</strong> +91 98217 76412</div>
              <div><strong>Email:</strong> privacy@schoolkarma.com</div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}

