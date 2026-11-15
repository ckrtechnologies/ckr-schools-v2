'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SchoolCard from './SchoolCard.jsx';
import EnquiryModal from './modals/EnquiryModal.jsx';
import BrochureModal from './modals/BrochureModal.jsx';
import SchoolSelectorModal from './modals/SchoolSelectorModal.jsx';
import { 
  IconSchool, 
  IconSearch, 
  IconMapPin, 
  IconCertificate, 
  IconCurrencyRupee, 
  IconShieldCheck,
  IconHelpCircle,
  IconArrowsDiff
} from '@tabler/icons-react';

export default function CityHubClientView({ 
  citySlug, 
  cityName, 
  initialSchools = [],
  popularCities = [],
  initialBoard = 'all'
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBoard, setSelectedBoard] = useState(initialBoard);
  const [selectedFee, setSelectedFee] = useState('all');

  // Modals
  const [selectedSchoolForEnquiry, setSelectedSchoolForEnquiry] = useState(null);
  const [selectedSchoolForBrochure, setSelectedSchoolForBrochure] = useState(null);
  const [isSchoolSelectorOpen, setIsSchoolSelectorOpen] = useState(false);

  // Extract boards available in this city
  const boardsInCity = Array.from(new Set(
    initialSchools.map(s => s.affiliation_board).filter(Boolean)
  ));

  // Filtered schools
  const filteredSchools = initialSchools.filter(school => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = (school.name && school.name.toLowerCase().includes(q)) ||
                    (school.affiliation_board && school.affiliation_board.toLowerCase().includes(q)) ||
                    (school.address && school.address.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (selectedBoard !== 'all') {
      if (school.affiliation_board?.toLowerCase() !== selectedBoard.toLowerCase()) return false;
    }
    if (selectedFee !== 'all') {
      const fee = Number(school.annual_fee_min || school.annual_fee_max || 0);
      if (selectedFee === 'under50k' && fee > 50000) return false;
      if (selectedFee === '50k_to_100k' && (fee < 50000 || fee > 100000)) return false;
      if (selectedFee === 'above100k' && fee < 100000) return false;
    }
    return true;
  });

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* City Hero Section */}
      <section style={{
        background: 'linear-gradient(180deg, #ecfdf5 0%, #f0fdf4 40%, #ffffff 100%)',
        padding: '36px clamp(16px, 2.5vw, 40px) 44px',
        borderBottom: '1px solid #e2e8f0',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '1720px', margin: '0 auto' }}>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: '16px' }}>
            <ol style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '12.5px',
              color: '#64748b'
            }}>
              <li>
                <Link href="/" style={{ color: '#047857', textDecoration: 'none', fontWeight: '700' }}>
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/schools" style={{ color: '#64748b', textDecoration: 'none' }}>
                  Cities
                </Link>
              </li>
              <li>/</li>
              <li style={{ color: '#0f172a', fontWeight: '700' }} aria-current="page">
                {cityName}
              </li>
            </ol>
          </nav>

          {/* City Badge & Title */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #bbf7d0',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '800',
            color: '#166534',
            marginBottom: '14px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
          }}>
            <IconMapPin size={15} color="#166534" />
            REGIONAL EDUCATION DIRECTORY · 2026–27
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 3.2vw, 44px)',
            fontWeight: '900',
            lineHeight: '1.2',
            color: '#0f172a',
            letterSpacing: '-1px',
            margin: '0 0 14px'
          }}>
            Best Schools in <span style={{ color: '#047857' }}>{cityName}</span>
          </h1>

          <p style={{
            fontSize: 'clamp(14px, 1.2vw, 16px)',
            color: '#475569',
            lineHeight: '1.6',
            maxWidth: '720px',
            margin: '0 0 28px'
          }}>
            Compare accredited CBSE, ICSE, and IB institutions across {cityName}. View verified annual fee structures, student-to-teacher ratios, 5-axis parent ratings, and apply directly to school admission desks.
          </p>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            maxWidth: '960px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconSchool size={22} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>{initialSchools.length}+</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Accredited Campuses</div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconCurrencyRupee size={22} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>₹0 Fee</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Zero Parent Brokerage</div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>100% Verified</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>SPOC &amp; ERP Linked</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div style={{ width: '100%', padding: '36px clamp(16px, 2.5vw, 40px) 80px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1720px', margin: '0 auto' }}>
          {/* Filter Toolbar */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <IconSearch size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search schools in ${cityName}…`}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Board Filter */}
            {boardsInCity.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Board:</span>
                <button
                  type="button"
                  onClick={() => setSelectedBoard('all')}
                  style={{
                    backgroundColor: selectedBoard === 'all' ? '#064e3b' : '#f1f5f9',
                    color: selectedBoard === 'all' ? '#ffffff' : '#334155',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  All Boards
                </button>
                {boardsInCity.map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBoard(b)}
                    style={{
                      backgroundColor: selectedBoard === b ? '#064e3b' : '#f1f5f9',
                      color: selectedBoard === b ? '#ffffff' : '#334155',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}

            {/* Fee Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Fee:</span>
              <button
                type="button"
                onClick={() => setSelectedFee('all')}
                style={{
                  backgroundColor: selectedFee === 'all' ? '#064e3b' : '#f1f5f9',
                  color: selectedFee === 'all' ? '#ffffff' : '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                All Fees
              </button>
              <button
                type="button"
                onClick={() => setSelectedFee('under50k')}
                style={{
                  backgroundColor: selectedFee === 'under50k' ? '#064e3b' : '#f1f5f9',
                  color: selectedFee === 'under50k' ? '#ffffff' : '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                &lt; ₹50k/yr
              </button>
              <button
                type="button"
                onClick={() => setSelectedFee('above100k')}
                style={{
                  backgroundColor: selectedFee === 'above100k' ? '#064e3b' : '#f1f5f9',
                  color: selectedFee === 'above100k' ? '#ffffff' : '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                &gt; ₹1 Lakh/yr
              </button>
            </div>
          </div>

          {/* Results Count Headline */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Showing {filteredSchools.length} Verified Schools in {cityName}
            </h2>
            <Link
              href="/compare"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#047857',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              <IconArrowsDiff size={16} />
              <span>Compare Selected</span>
            </Link>
          </div>

          {/* Schools Grid */}
          {filteredSchools.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <IconSchool size={48} color="#94a3b8" style={{ marginBottom: '14px' }} />
              <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                No Schools Match Your Criteria in {cityName}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
                Try resetting your board affiliation or fee filters.
              </p>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setSelectedBoard('all'); setSelectedFee('all'); }}
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
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="mk-schools-grid-cards" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              marginBottom: '64px'
            }}>
              {filteredSchools.map(school => (
                <SchoolCard
                  key={school.slug}
                  school={school}
                  onSelectSchool={(slug) => router.push(`/schools/${slug}`)}
                  onOpenEnquiry={(s) => setSelectedSchoolForEnquiry(s)}
                  onOpenBrochure={(s) => setSelectedSchoolForBrochure(s)}
                />
              ))}
            </div>
          )}

          {/* City Education Guide & FAQ Section (High SEO Relevance) */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '36px clamp(20px, 3vw, 40px)',
            marginBottom: '64px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              PARENT ADMISSION GUIDE
            </span>
            <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '6px 0 16px' }}>
              School Admissions &amp; Board Options in {cityName}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  What are the primary school boards in {cityName}?
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  Most premier private institutions in {cityName} follow the Central Board of Secondary Education (CBSE) or the Council for the Indian School Certificate Examinations (ICSE/ISC). International baccalaureate (IB) and Cambridge (IGCSE) options are also widely accessible in modern tech corridors.
                </p>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  What is the average annual school fee in {cityName}?
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  Annual tuition in {cityName} typically ranges between ₹50,000 for standard accredited secondary schools to ₹2,50,000+ for premium international day-boarding campuses offering world-class sports and robotics labs.
                </p>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  When do admissions open in {cityName} for 2026–27?
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  Pre-school, Nursery, and Grade 1 admissions for the 2026–2027 academic year begin in August–November. Mid-term and transfer admissions remain open through SchoolKarma’s direct SPOC desk.
                </p>
              </div>
            </div>
          </div>

          {/* Explore Other Hubs */}
          {popularCities.length > 0 && (
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
                Explore Schools in Other Regional Hubs
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {popularCities.filter(c => c.slug !== citySlug).map(c => (
                  <Link
                    key={c.slug}
                    href={`/city/${c.slug}`}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#0f172a',
                      textDecoration: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    Schools in {c.name} →
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedSchoolForEnquiry && (
        <EnquiryModal
          school={selectedSchoolForEnquiry}
          isOpen={true}
          onClose={() => setSelectedSchoolForEnquiry(null)}
        />
      )}

      {selectedSchoolForBrochure && (
        <BrochureModal
          school={selectedSchoolForBrochure}
          isOpen={true}
          onClose={() => setSelectedSchoolForBrochure(null)}
        />
      )}

      <SchoolSelectorModal
        isOpen={isSchoolSelectorOpen}
        onClose={() => setIsSchoolSelectorOpen(false)}
      />
    </div>
  );
}

