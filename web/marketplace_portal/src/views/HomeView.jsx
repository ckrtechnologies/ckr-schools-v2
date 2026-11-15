import React, { useState } from 'react';
import HeroSection from '../components/HeroSection.jsx';
import SearchDock from '../components/SearchDock.jsx';
import SchoolCard from '../components/SchoolCard.jsx';
import { useGetSchoolsQuery } from '../store/marketplaceApi.js';
import { 
  IconSchool, 
  IconHelpCircle,
  IconChevronRight,
  IconBuildingCommunity,
  IconCheck
} from '@tabler/icons-react';

export default function HomeView({ onSelectSchool, onOpenEnquiry, onOpenBrochure, onOpenComparison, onOpenCatalog, onOpenErpModal }) {
  const [filters, setFilters] = useState({
    search: '',
    city: 'all',
    board: 'all',
    budgetRange: 'all'
  });

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      city: 'all',
      board: 'all',
      budgetRange: 'all'
    });
  };

  let minFee, maxFee;
  if (filters.budgetRange === 'under50k') {
    maxFee = 50000;
  } else if (filters.budgetRange === '50k_to_100k') {
    minFee = 50000;
    maxFee = 100000;
  } else if (filters.budgetRange === 'above100k') {
    minFee = 100000;
  }

  const { data: response, isLoading } = useGetSchoolsQuery({
    search: filters.search,
    city: filters.city,
    board: filters.board,
    minFee,
    maxFee
  });

  const allSchools = response?.data || [];
  
  // Show a curated limit of 8 schools on home page to keep it clean (not an endless list)
  const HOME_DISPLAY_LIMIT = 8;
  const displayedSchools = allSchools.slice(0, HOME_DISPLAY_LIMIT);
  const remainingCount = Math.max(0, allSchools.length - HOME_DISPLAY_LIMIT);

  const faqs = [
    {
      q: 'Where does the school information on SchoolKarma come from?',
      a: 'Each affiliated school directly maintains its official campus profile, fees schedule, facilities, and photo galleries via their dedicated SchoolKarma ERP & SPOC portal. SchoolKarma strictly verifies accreditation and board affiliation before publishing.'
    },
    {
      q: 'Is there any fee or commission charged to parents?',
      a: 'Zero. Prospective parents can browse, download brochures, and submit admission inquiries 100% free with no brokerage, markups, or hidden charges whatsoever.'
    },
    {
      q: 'How does the 1-Click Multi-School enquiry work?',
      a: 'You can select up to 3 schools in the comparison tray or from search results. When you submit your child’s details once, individual inquiries are registered simultaneously across all selected institutions, saving parents from filling repetitive paperwork.'
    },
    {
      q: 'Do I need an account to enquire or to review a school?',
      a: 'No account is required to browse or submit an admission inquiry. To submit verified parent reviews and ratings, parents sign in securely via phone OTP to prevent fake testimonials.'
    },
    {
      q: 'Can schools modify parent reviews or ratings?',
      a: 'No. SchoolKarma maintains strict editorial independence. 5-axis ratings and parent reviews are tamper-evident and cannot be manipulated or hidden by school administrations.'
    },
    {
      q: 'How can our school partner with SchoolKarma?',
      a: 'School trustees and administrators can click the "School Login" button at the top right, access their school domain, or register a new campus directly through our verification team.'
    }
  ];

  const cityHubs = [
    { name: 'Delhi NCR', schoolsCount: '15+ Campuses', tag: 'Capital Hub', bg: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', cityKey: 'Delhi' },
    { name: 'Noida / Greater Noida', schoolsCount: '8+ Campuses', tag: 'Fast Growing', bg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', cityKey: 'Noida' },
    { name: 'Pune & Shirur', schoolsCount: '6+ Campuses', tag: 'Oxford of the East', bg: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)', cityKey: 'Pune' },
    { name: 'Bengaluru', schoolsCount: '5+ Campuses', tag: 'Tech & STEM Focus', bg: 'linear-gradient(135deg, #581c87 0%, #7e22ce 100%)', cityKey: 'Bengaluru' }
  ];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* 1. Hero Section (Full Width Canvas with 6-8 Featured School Cards) */}
      <HeroSection 
        onExploreClick={() => {
          const el = document.getElementById('schools-grid');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectSchool={onSelectSchool}
      />

      {/* Main Full Canvas Wrapper (Fluid padding, no narrow squeeze) */}
      <div style={{ width: '100%', padding: '0 clamp(16px, 2.5vw, 40px) 80px', boxSizing: 'border-box' }}>
        {/* Search Dock Floating */}
        <SearchDock
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Section Header: Featured Campuses Spotlight (Capped at 8, with Catalog CTA) */}
        <div id="schools-grid" style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              CAMPUS SPOTLIGHT
            </div>
            <h2 style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', margin: '4px 0 0' }}>
              Featured Accredited Campuses
            </h2>
          </div>
          <button
            onClick={onOpenCatalog}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#064e3b',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(6, 78, 59, 0.25)',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047857'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#064e3b'}
          >
            <span>View All {allSchools.length} Schools in Catalog</span>
            <IconChevronRight size={16} />
          </button>
        </div>

        {/* School Cards Grid (Clean 8-card grid, not an endless scroll) */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: '15px' }}>
            Loading Verified School Profiles...
          </div>
        ) : displayedSchools.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '48px 20px',
            textAlign: 'center'
          }}>
            <IconSchool size={44} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              No Schools Matched Your Filters
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
              Try adjusting your city, board affiliation or fee range.
            </p>
            <button
              onClick={handleResetFilters}
              style={{
                backgroundColor: '#064e3b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="mk-schools-grid-cards" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              marginBottom: '32px'
            }}>
              {displayedSchools.map(school => (
                <SchoolCard
                  key={school.slug}
                  school={school}
                  onSelectSchool={onSelectSchool}
                  onOpenEnquiry={onOpenEnquiry}
                  onOpenBrochure={onOpenBrochure}
                />
              ))}
            </div>

            {/* View More in Catalog Action Bar */}
            {remainingCount > 0 && (
              <div style={{
                textAlign: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '64px'
              }}>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                  Looking for more schools?
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  Browse all {allSchools.length} verified campuses with advanced filters in the full directory.
                </div>
                <button
                  onClick={onOpenCatalog}
                  style={{
                    backgroundColor: '#064e3b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 28px',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(6, 78, 59, 0.2)'
                  }}
                >
                  Explore All {allSchools.length} Schools in Catalog →
                </button>
              </div>
            )}
          </>
        )}

        {/* ============================================================== */}
        {/* NEW SECTION 1: 3-Step Guided Process for Parents */}
        {/* ============================================================== */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '44px clamp(20px, 3vw, 40px)',
          marginBottom: '64px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 36px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              HOW SCHOOLKARMA WORKS
            </span>
            <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '6px 0 10px', letterSpacing: '-0.5px' }}>
              The Zero-Brokerage Admission Journey
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
              From initial discovery to seat enrollment, SchoolKarma empowers parents with direct, verified school access.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {/* Step 1 */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #f1f5f9',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '20px',
                backgroundColor: '#064e3b',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '14px'
              }}>
                1
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginTop: '12px', marginBottom: '8px' }}>
                Discover &amp; Filter
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                Explore accredited CBSE, ICSE, and IB schools across Delhi NCR, Pune, and Bengaluru with real photos and annual fee breakdown.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #f1f5f9',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '20px',
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '14px'
              }}>
                2
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginTop: '12px', marginBottom: '8px' }}>
                Compare Metrics
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                Put up to 3 campuses side-by-side to evaluate teacher ratios, sports facilities, bus routes, and true academic costs in 1 clean matrix.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #f1f5f9',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '20px',
                backgroundColor: '#059669',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '14px'
              }}>
                3
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginTop: '12px', marginBottom: '8px' }}>
                Enroll Direct in 1-Click
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                Submit inquiries or unlock verified official prospectuses directly to the school principal’s admissions desk with zero agent commissions.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* NEW SECTION 2: Top Education Hubs / Cities */}
        {/* ============================================================== */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                REGIONAL DIRECTORIES
              </span>
              <h3 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '4px 0 0' }}>
                Explore Top School Hubs
              </h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            {cityHubs.map((hub, i) => (
              <div
                key={i}
                onClick={() => handleFilterChange('city', hub.cityKey)}
                style={{
                  background: hub.bg,
                  borderRadius: '14px',
                  padding: '24px 20px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  display: 'inline-block',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  marginBottom: '10px'
                }}>
                  {hub.tag}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>
                  {hub.name}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconBuildingCommunity size={15} />
                  <span>{hub.schoolsCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* Interactive Comparison Banner */}
        {/* ============================================================== */}
        <div style={{
          backgroundColor: '#064e3b',
          borderRadius: '16px',
          padding: 'clamp(24px, 3vw, 40px)',
          color: '#ffffff',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          alignItems: 'center',
          marginBottom: '64px',
          boxShadow: '0 20px 25px -5px rgba(6, 78, 59, 0.2)'
        }}>
          <div>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#a7f3d0',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase'
            }}>
              Interactive Decision Engine
            </span>
            <h3 style={{ fontSize: '28px', fontWeight: '900', margin: '12px 0 10px', lineHeight: '1.2' }}>
              Unsure which school fits your child best? Compare side-by-side.
            </h3>
            <p style={{ fontSize: '14px', color: '#a7f3d0', lineHeight: '1.6', marginBottom: '24px' }}>
              Compare tuition fees, student-teacher ratios, sports facilities, and board affiliation side by side in one clear view.
            </p>
            <button
              onClick={onOpenCatalog}
              style={{
                backgroundColor: '#ffffff',
                color: '#064e3b',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 26px',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              Choose Schools to Compare →
            </button>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#f0fdf4', marginBottom: '14px' }}>
              7-Dimension Comparison Metrics:
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheck size={16} color="#34d399" /> Board affiliation and school code
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheck size={16} color="#34d399" /> Verified Annual Tuition Fee Range
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheck size={16} color="#34d399" /> Student-to-Teacher Ratio &amp; Faculty count
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheck size={16} color="#34d399" /> Smart STEM Robotics, Sports &amp; Transport
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheck size={16} color="#34d399" /> 1-Click Multi-School Joint Enquiry
              </li>
            </ul>
          </div>
        </div>

        {/* ============================================================== */}
        {/* NEW SECTION 3: Partner with SchoolKarma (Principal / Trustee) */}
        {/* ============================================================== */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          padding: '40px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
          marginBottom: '64px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{ maxWidth: '640px' }}>
            <span style={{
              backgroundColor: 'rgba(52, 211, 153, 0.15)',
              color: '#34d399',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase'
            }}>
              FOR SCHOOL ADMINISTRATORS &amp; TRUSTEES
            </span>
            <h3 style={{ fontSize: '26px', fontWeight: '900', margin: '12px 0 8px' }}>
              Manage Admissions with SchoolKarma ERP
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
              Join 1,000+ verified partner schools across India. Access your dedicated SPOC inquiry desk, automate fee collections, timetable scheduling, and report cards with the SchoolKarma platform.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onOpenErpModal && onOpenErpModal()}
              style={{
                backgroundColor: '#34d399',
                color: '#064e3b',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)'
              }}
            >
              Get School ERP Demo →
            </button>
            <button
              onClick={() => {
                const el = document.querySelector('.mk-header');
                if (el) window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              School Staff Login
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 5. FULL-WIDTH FAQ SECTION (100% Canvas Width) */}
        {/* ============================================================== */}
        <div id="faq" style={{ width: '100%', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              HELP &amp; TRANSPARENCY
            </span>
            <h3 style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', margin: '4px 0 8px' }}>
              Frequently Asked Questions
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Clear answers regarding school verification, admissions, fee structures, and parent rights.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontWeight: '800', fontSize: '15px', color: '#0f172a', marginBottom: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: '#ecfdf5',
                    color: '#064e3b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconHelpCircle size={18} />
                  </div>
                  <span>{faq.q}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.65', paddingLeft: '40px' }}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer (Full Width Canvas) */}
      <footer style={{
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        borderTop: '1px solid #1e293b',
        padding: '56px clamp(16px, 2.5vw, 40px) 36px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div>
            <div style={{ fontWeight: '900', fontSize: '18px', color: '#ffffff', letterSpacing: '-0.3px' }}>
              SchoolKarma
            </div>
            <div style={{ fontSize: '13px', marginTop: '6px', color: '#94a3b8' }}>
              India’s School Discovery, Verification &amp; Operating System.
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            © {new Date().getFullYear()} SchoolKarma. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
