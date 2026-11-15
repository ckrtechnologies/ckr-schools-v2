import React from 'react';
import { 
  IconShieldCheck, 
  IconStarFilled, 
  IconCurrencyRupee, 
  IconArrowRight,
  IconSchool,
  IconMapPin
} from '@tabler/icons-react';
import { useGetSchoolsQuery } from '../store/marketplaceApi.js';
import SchoolSolarSystemHero from './SchoolSolarSystemHero.jsx';

export default function HeroSection({ onExploreClick, onSelectSchool }) {
  const { data: schoolsData } = useGetSchoolsQuery({});
  const allSchools = schoolsData?.data || [];
  
  // Strictly prioritize schools marked 'is_featured' from the Superadmin panel
  const featuredOnly = allSchools.filter(s => s.is_featured);
  const featuredSchools = featuredOnly.length >= 6 
    ? featuredOnly.slice(0, 8)
    : [...featuredOnly, ...allSchools.filter(s => !s.is_featured)].slice(0, 6);

  return (
    <section style={{
      background: 'linear-gradient(180deg, #ecfdf5 0%, #f0fdf4 35%, #ffffff 100%)',
      padding: '40px clamp(16px, 2.5vw, 40px) 48px',
      borderBottom: '1px solid #e2e8f0',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* FULL CANVAS HERO LAYOUT: Left Headline (1fr) + Right 6-8 School Cards (1.6fr) */}
      <div className="mk-hero-layout" style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(480px, 1.5fr)',
        gap: 'clamp(24px, 3vw, 48px)',
        alignItems: 'center'
      }}>
        {/* Left Column: Headlines & High-Contrast CTAs */}
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #bbf7d0',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '800',
            color: '#166534',
            marginBottom: '18px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
          }}>
            <span className="pulse-indicator" style={{ backgroundColor: '#22c55e' }} />
            Admissions Open For Academic Year 2027-28
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 3.2vw, 48px)',
            fontWeight: '900',
            lineHeight: '1.15',
            color: '#0f172a',
            letterSpacing: '-1px',
            marginBottom: '18px'
          }}>
            Find, Compare &amp; Enroll in India’s Top{' '}
            <span style={{ color: '#047857', position: 'relative', display: 'inline-block' }}>
              Verified Schools
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(14px, 1.2vw, 16px)',
            color: '#475569',
            lineHeight: '1.6',
            marginBottom: '28px',
            maxWidth: '560px'
          }}>
            Unbiased 5-axis parent ratings, transparent annual fee schedules, official campus photo galleries, and 1-click admission inquiries directly through SchoolKarma.
          </p>

          {/* Solid CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={onExploreClick}
              style={{
                backgroundColor: '#064e3b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 14px rgba(6, 78, 59, 0.35)',
                transition: 'transform 0.15s ease, background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.backgroundColor = '#047857';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.backgroundColor = '#064e3b';
              }}
            >
              <span>Explore Featured Campuses</span>
              <IconArrowRight size={18} />
            </button>

            {allSchools.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
                <div style={{ display: 'flex', color: '#f59e0b' }}>
                  {[1, 2, 3, 4, 5].map(i => <IconStarFilled key={i} size={15} />)}
                </div>
                <span style={{ fontWeight: '800', color: '#0f172a' }}>
                  {allSchools.length}+ Schools
                </span>
                <span>accredited in India</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Featured Schools Solar System Planetary Orbit Animation */}
        <div className="mk-hero-solar-wrap" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '460px',
          position: 'relative'
        }}>
          <SchoolSolarSystemHero
            schools={featuredSchools}
            onSelectSchool={onSelectSchool}
          />
        </div>
      </div>

      {/* Solid Trust Metric Cards: Full Width */}
      <div className="mk-metric-cards-grid" style={{
        width: '100%',
        marginTop: '36px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        boxSizing: 'border-box'
      }}>
        {/* Solid Badge 1: Emerald Verified */}
        <div style={{
          backgroundColor: '#064e3b',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 4px 12px rgba(6, 78, 59, 0.15)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconShieldCheck size={26} color="#34d399" />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px' }}>100% Verified</div>
            <div style={{ fontSize: '12px', color: '#a7f3d0', marginTop: '2px' }}>Accredited CBSE/ICSE Campuses</div>
          </div>
        </div>

        {/* Solid Badge 2: Royal Blue Zero Fee */}
        <div style={{
          backgroundColor: '#1e3a8a',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 4px 12px rgba(30, 58, 138, 0.15)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconCurrencyRupee size={26} color="#93c5fd" />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px' }}>₹0 Parent Fee</div>
            <div style={{ fontSize: '12px', color: '#bfdbfe', marginTop: '2px' }}>Zero Brokerage or Markup</div>
          </div>
        </div>

        {/* Solid Badge 3: Amber 5-Axis Reviews */}
        <div style={{
          backgroundColor: '#b45309',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 4px 12px rgba(180, 83, 9, 0.15)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconStarFilled size={24} color="#fde68a" />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px' }}>5-Axis Reviews</div>
            <div style={{ fontSize: '12px', color: '#fef3c7', marginTop: '2px' }}>Real Parent UGC Testimonials</div>
          </div>
        </div>

        {/* Solid Badge 4: Deep Purple Multi-Enquiry */}
        <div style={{
          backgroundColor: '#581c87',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 4px 12px rgba(88, 28, 135, 0.15)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconSchool size={24} color="#d8b4fe" />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px' }}>1-Click Enquiry</div>
            <div style={{ fontSize: '12px', color: '#e9d5ff', marginTop: '2px' }}>Apply to Multiple Schools</div>
          </div>
        </div>
      </div>
    </section>
  );
}
