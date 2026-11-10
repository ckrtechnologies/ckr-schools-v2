import React, { useState } from 'react';
import HeroSection from '../components/HeroSection.jsx';
import SearchDock from '../components/SearchDock.jsx';
import SchoolCard from '../components/SchoolCard.jsx';
import { useGetSchoolsQuery } from '../store/marketplaceApi.js';
import { 
  IconSchool, 
  IconAward, 
  IconShieldCheck, 
  IconCheck, 
  IconHelpCircle,
  IconChevronDown
} from '@tabler/icons-react';

export default function HomeView({ onSelectSchool, onOpenEnquiry, onOpenBrochure, onOpenComparison }) {
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

  // Compute fee filters
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

  const schools = response?.data || [];

  const faqs = [
    {
      q: 'Are all schools on this marketplace official and verified?',
      a: 'Yes. Every school featured on CKR Marketplace is an accredited CBSE/ICSE/IB campus directly integrated with our enterprise School ERP suite. Profiles, facilities, and fee schedules are verified.'
    },
    {
      q: 'Is there any fee or commission charged to parents?',
      a: 'Zero. Prospective parents can browse, download brochures, and submit admission inquiries 100% free with no brokerage, markups, or hidden charges.'
    },
    {
      q: 'How does the 1-Click Multi-School enquiry work?',
      a: 'You can select up to 3 schools in the comparison tray or from search results. When you submit your child’s details once, individual inquiries are registered simultaneously across all selected institutions.'
    },
    {
      q: 'Why cannot parents upload photos with their reviews?',
      a: 'To guarantee total authentic review integrity and avoid misleading or outdated images, parent UGC is focused strictly on 5-axis star ratings and written testimonials. Campus photos are curated and verified directly by the school administration.'
    }
  ];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Hero Section */}
      <HeroSection 
        onExploreClick={() => {
          const el = document.getElementById('schools-grid');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectSchool={onSelectSchool}
      />

      {/* Main Content Area */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px 80px' }}>
        {/* Search Dock Floating */}
        <SearchDock
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Section Header */}
        <div id="schools-grid" style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ACCREDITED INSTITUTIONS
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px', margin: '4px 0 0' }}>
              Explore Verified Campuses ({schools.length})
            </h2>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Showing top schools with verified 2026-27 admission seats
          </div>
        </div>

        {/* School Cards Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            Loading Verified School Profiles...
          </div>
        ) : schools.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '48px 20px',
            textAlign: 'center'
          }}>
            <IconSchool size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
              No Schools Found
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              Try adjusting your city, board, or budget filters to see available campuses.
            </p>
            <button
              onClick={handleResetFilters}
              style={{
                backgroundColor: '#064e3b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '24px',
            marginBottom: '64px'
          }}>
            {schools.map(school => (
              <SchoolCard
                key={school.id}
                school={school}
                onSelectSchool={onSelectSchool}
                onOpenEnquiry={onOpenEnquiry}
                onOpenBrochure={onOpenBrochure}
              />
            ))}
          </div>
        )}

        {/* Comparison Feature Banner */}
        <div style={{
          backgroundColor: '#064e3b',
          borderRadius: '16px',
          padding: '36px 40px',
          color: '#ffffff',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
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
              fontWeight: '700',
              textTransform: 'uppercase'
            }}>
              Interactive Decision Engine
            </span>
            <h3 style={{ fontSize: '26px', fontWeight: '800', margin: '12px 0 10px', lineHeight: '1.2' }}>
              Unsure which school fits your child best? Compare side-by-side.
            </h3>
            <p style={{ fontSize: '14px', color: '#a7f3d0', lineHeight: '1.6', marginBottom: '20px' }}>
              Evaluate Vision International School vs ARC School across tuition fees, teacher ratios, sports amenities, and CBSE board performance in 1 clear view.
            </p>
            <button
              onClick={onOpenComparison}
              style={{
                backgroundColor: '#ffffff',
                color: '#064e3b',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Open Comparison Matrix
            </button>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#f0fdf4', marginBottom: '12px' }}>
              7-Dimension Comparison Metrics:
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheck size={16} color="#34d399" /> Official CBSE Affiliation & School Code
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheck size={16} color="#34d399" /> Annual Tuition & Transport Fee Range
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheck size={16} color="#34d399" /> Student-to-Teacher Ratio (18:1 vs 16:1)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheck size={16} color="#34d399" /> STEM Robotics Lab & Sports Facilities
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheck size={16} color="#34d399" /> 1-Click Multi-School Joint Enquiry
              </li>
            </ul>
          </div>
        </div>

        {/* FAQs */}
        <div id="faq" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', textTransform: 'uppercase' }}>
              HELP & TRANSPARENCY
            </span>
            <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0' }}>
              Frequently Asked Questions
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '8px' }}>
                  <IconHelpCircle size={18} color="#047857" />
                  {faq.q}
                </div>
                <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', paddingLeft: '28px' }}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        borderTop: '1px solid #1e293b',
        padding: '48px 20px 32px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: '#ffffff' }}>
              CKR Schools Marketplace
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Built with ❤️ for Indian parents and schools by CKR Technologies, Greater Noida.
            </div>
          </div>
          <div style={{ fontSize: '12px' }}>
            © {new Date().getFullYear()} CKR Technologies. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

