'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SchoolCard from './SchoolCard.jsx';
import EnquiryModal from './modals/EnquiryModal.jsx';
import BrochureModal from './modals/BrochureModal.jsx';
import { 
  IconSchool, 
  IconSearch, 
  IconMapPin, 
  IconCertificate, 
  IconCurrencyRupee, 
  IconShieldCheck,
  IconArrowRight
} from '@tabler/icons-react';

export default function BoardHubClientView({
  boardSlug,
  boardName,
  boardOverview,
  initialSchools = [],
  popularCities = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedFee, setSelectedFee] = useState('all');

  const [selectedSchoolForEnquiry, setSelectedSchoolForEnquiry] = useState(null);
  const [selectedSchoolForBrochure, setSelectedSchoolForBrochure] = useState(null);

  // Available cities in dataset
  const availableCities = Array.from(new Set(
    initialSchools.map(s => s.city).filter(Boolean)
  ));

  // Filtered schools
  const filteredSchools = initialSchools.filter(school => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = (school.name && school.name.toLowerCase().includes(q)) ||
                    (school.city && school.city.toLowerCase().includes(q)) ||
                    (school.address && school.address.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (selectedCity !== 'all') {
      if (!school.city?.toLowerCase().includes(selectedCity.toLowerCase())) return false;
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
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%', paddingBottom: '80px', boxSizing: 'border-box' }}>
      
      {/* 1. Breadcrumbs */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 0' }}>
        <div className="mk-shell" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
          <Link href="/" style={{ color: '#064e3b', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <Link href="/schools" style={{ color: '#064e3b', textDecoration: 'none', fontWeight: 600 }}>Boards</Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>{boardName} Affiliated Schools</span>
        </div>
      </div>

      {/* 2. Hero Section */}
      <section style={{
        backgroundColor: '#064e3b',
        color: '#ffffff',
        padding: '50px 0 44px',
        borderBottom: '1px solid #043e2f'
      }}>
        <div className="mk-shell" style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '5px 14px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: 800,
            letterSpacing: '0.6px',
            marginBottom: '14px'
          }}>
            <IconCertificate size={15} />
            <span>NATIONAL AFFILIATION CURRICULUM</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 4.5vw, 42px)',
            fontWeight: 900,
            margin: '0 0 14px',
            lineHeight: 1.25,
            letterSpacing: '-0.6px'
          }}>
            Top {boardName} Affiliated Schools in India (2026–27)
          </h1>

          <p style={{
            fontSize: 'clamp(14px, 1.8vw, 16px)',
            color: '#a7f3d0',
            maxWidth: '800px',
            margin: '0 auto 28px',
            lineHeight: 1.6
          }}>
            {boardOverview}
          </p>

          {/* Quick City Jump Pills */}
          <div style={{ marginTop: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#6ee7b7', letterSpacing: '0.8px', display: 'block', marginBottom: '10px' }}>
              BROWSE {boardName} SCHOOLS BY TOP CITY:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {popularCities.map((c, idx) => (
                <Link
                  key={idx}
                  href={`/city/${c.slug}/${boardSlug}`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 3. Filter Bar */}
      <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '-24px auto 36px', boxSizing: 'border-box' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          alignItems: 'center'
        }}>
          
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <IconSearch size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={`Search ${boardName} schools by name or area...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Cities in India</option>
            {availableCities.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {/* Budget Filter */}
          <select
            value={selectedFee}
            onChange={(e) => setSelectedFee(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <option value="all">Any Annual Fee</option>
            <option value="under50k">Under ₹50,000 / year</option>
            <option value="50k_to_100k">₹50,000 – ₹1,00,000 / year</option>
            <option value="above100k">Above ₹1,00,000 / year</option>
          </select>

        </div>
      </div>

      {/* 4. Schools Grid */}
      <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Showing {filteredSchools.length} Accredited {boardName} Campuses
          </h2>
          <span style={{ fontSize: '12.5px', color: '#64748b' }}>
            100% Verified Campus Profiles
          </span>
        </div>

        {filteredSchools.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '24px'
          }}>
            {filteredSchools.map((school) => (
              <SchoolCard
                key={school.id || school.slug}
                school={school}
                onEnquire={(s) => setSelectedSchoolForEnquiry(s)}
                onBrochure={(s) => setSelectedSchoolForBrochure(s)}
              />
            ))}
          </div>
        ) : (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '48px 20px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <IconSchool size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>
              No {boardName} schools matched your filter
            </h3>
            <p style={{ fontSize: '13px', margin: 0 }}>
              Try broadening your search term or selecting "All Cities".
            </p>
          </div>
        )}
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

    </div>
  );
}

