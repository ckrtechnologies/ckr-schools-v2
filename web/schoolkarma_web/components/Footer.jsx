'use client';

import React from 'react';
import Link from 'next/link';
import { 
  IconSchool, 
  IconPhoneCall, 
  IconBrandWhatsapp, 
  IconShieldCheck, 
  IconCertificate, 
  IconLock, 
  IconBuildingBank,
  IconBuildingSkyscraper, 
  IconMail,
  IconCheck,
  IconAward,
  IconSparkles,
  IconArrowRight 
} from '@tabler/icons-react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#064e3b',
      color: '#f0fdf4',
      borderTop: '1px solid #047857',
      padding: '56px 0 32px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
        
        {/* Top Authority & MSME Accreditation Banner */}
        <div style={{
          backgroundColor: '#043e2f',
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '48px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '820px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1.5px solid rgba(255, 255, 255, 0.35)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <IconBuildingBank size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14.5px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.3px' }}>
                  GOVERNMENT OF INDIA MSME REGISTERED ORGANIZATION
                </span>
                <span style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.35)'
                }}>
                  UDYAM VERIFIED
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: '4px 0 0', lineHeight: 1.5 }}>
                Ministry of Micro, Small and Medium Enterprises · Make in India Initiative · Sovereign Tier-4 Indian VPS Infrastructure.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="tel:+919821776412"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <IconPhoneCall size={16} style={{ color: '#ffffff' }} />
              <span>+91 98217 76412</span>
            </a>

            <a
              href="https://wa.me/919821776412?text=Hello%20SchoolKarma%20Team,%20we%20need%20assistance."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ffffff',
                color: '#064e3b',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.15s ease'
              }}
            >
              <IconBrandWhatsapp size={16} />
              <span>WhatsApp Advisory</span>
            </a>
          </div>
        </div>

        {/* 5 Modular Columns (Exact Marquee Dark Green Palette) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '36px',
          paddingBottom: '44px',
          borderBottom: '1px solid #047857'
        }}>
          
          {/* Col 1: Schools by City */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#ffffff', letterSpacing: '0.8px', marginBottom: '16px' }}>
              Schools by City
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/city/delhi-ncr" style={{ color: '#ffffff', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                  Schools in Delhi NCR
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/city/noida" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Schools in Noida
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/city/greater-noida" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Schools in Greater Noida
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/city/bengaluru" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Schools in Bengaluru
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/city/pune" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Schools in Pune
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/city/lucknow" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Schools in Lucknow
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/city/kanpur" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Schools in Kanpur
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/city/ghaziabad" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Schools in Ghaziabad
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Boards & Combined City Matrix */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#ffffff', letterSpacing: '0.8px', marginBottom: '16px' }}>
              Boards &amp; Curricula
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/board/cbse" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  CBSE Affiliated Schools
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/board/icse" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  ICSE / CISCE Schools
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/board/ib" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  IB World Schools (PYP/DP)
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/board/cambridge" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Cambridge IGCSE &amp; A-Levels
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/city/noida/cbse" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '12.5px' }}>
                  CBSE Schools in Noida
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/city/bengaluru/ib" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '12.5px' }}>
                  IB Schools in Bengaluru
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/city/lucknow/icse" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '12.5px' }}>
                  ICSE Schools in Lucknow
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/city/delhi-ncr/cbse" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '12.5px' }}>
                  CBSE Schools in Delhi NCR
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Enterprise ERP Suites */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#ffffff', letterSpacing: '0.8px', marginBottom: '16px' }}>
              ERP for Schools
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/services-for-schools/fee-management" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Fee Management &amp; Ledgers
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/services-for-schools/cbse-report-card" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  CBSE Report Card Generator
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/services-for-schools/admissions-crm" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Admissions CRM &amp; Lead Desk
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/services-for-schools/timetable-scheduler" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Timetable &amp; Substitution
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/services-for-schools/smart-attendance" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Smart Biometric &amp; RFID Gates
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/services-for-schools/teacher-parent-apps" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  White-Label Mobile Apps
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/services-for-schools" style={{ color: '#ffffff', fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                  Complete 12-Module Suite →
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Company, Story & Founders */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#ffffff', letterSpacing: '0.8px', marginBottom: '16px' }}>
              About SchoolKarma
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/about" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  About
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/founders" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Founders
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/contact" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Contact
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/schools" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Directory
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/compare" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Compare
                </Link>
              </li>
              <li style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                  Headquarters
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>
                  Office No. 618, Galaxy Blue Sapphire Plaza, TechZone 4, Greater Noida West, Gautam Buddha Nagar, UP 201306, India
                </div>
              </li>
            </ul>
          </div>

          {/* Col 5: Mandatory Legal & Play Store Guidelines */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#ffffff', letterSpacing: '0.8px', marginBottom: '16px' }}>
              Legal &amp; Data Safety
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/privacy-policy" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Privacy Policy (DPDP 2023)
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link href="/terms" style={{ color: '#ffffff', textDecoration: 'none' }}>
                  Terms of Service
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>•</span>
                <Link
                  href="/delete-account"
                  style={{
                    color: '#ffffff',
                    textDecoration: 'none'
                  }}
                >
                  Request Account Deletion
                </Link>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1, marginTop: '2px' }}>•</span>
                <div>
                  <span style={{ fontSize: '11.5px', color: '#e2e8f0', display: 'block' }}>
                    Google Play &amp; App Store Compliant
                  </span>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1, marginTop: '2px' }}>•</span>
                <div>
                  <span style={{ fontSize: '11px', color: '#e2e8f0', display: 'block' }}>
                    Grievance Redressal:
                  </span>
                  <a href="mailto:privacy@schoolkarma.com" style={{ fontSize: '12px', color: '#ffffff', textDecoration: 'none' }}>
                    privacy@schoolkarma.com
                  </a>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          paddingTop: '24px',
          fontSize: '12.5px',
          color: '#e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: '#ffffff' }}>SchoolKarma Technologies</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>·</span>
            <span style={{ color: '#e2e8f0' }}>Govt. of India MSME Registered Organization</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>·</span>
            <span style={{ color: '#e2e8f0' }}>© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ color: '#ffffff', fontWeight: 800 }}>✓ 100% Indian VPS Hosted</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>·</span>
            <span style={{ color: '#e2e8f0' }}>Zero Parent Brokerage</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>·</span>
            <span style={{ color: '#e2e8f0' }}>DLT Template Registered</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
