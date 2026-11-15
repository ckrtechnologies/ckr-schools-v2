'use client';

import React from 'react';
import {
  IconSchool,
  IconMapPin
} from '@tabler/icons-react';
import SchoolImage from './SchoolImage.jsx';

export default function SchoolSolarSystemHero({ schools = [], onSelectSchool }) {
  // Take 6 to 8 featured campuses to orbit in 2 concentric elliptical planetary tracks
  const campuses = schools.slice(0, 6);

  // Distribute across 2 tracks with full original rectangular card aspect ratio
  // Track 1 (Inner Track: 2 cards, radius 130px)
  const track1 = campuses.slice(0, 2).map((s, idx) => ({
    ...s,
    angle: idx === 0 ? 0 : 180
  }));

  // Track 2 (Outer Track: 4 cards, radius 215px)
  const track2 = campuses.slice(2, 6).map((s, idx) => ({
    ...s,
    angle: idx * 90 + 35
  }));

  const renderSchoolRectCard = (school) => (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onSelectSchool) onSelectSchool(school.slug);
      }}
      style={{
        width: '185px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1.5px solid #e2e8f0',
        padding: '10px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#10b981';
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(6, 78, 59, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.16)';
      }}
    >
      {/* Photo Header */}
      <div style={{
        height: '76px',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f1f5f9',
        marginBottom: '8px'
      }}>
        <SchoolImage
          school={school}
          alt={school.name}
          height="100%"
          objectFit="cover"
          logoPadding="12px"
        />
        <span style={{
          position: 'absolute',
          top: '5px',
          left: '5px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          color: '#ffffff',
          fontSize: '9px',
          fontWeight: '800',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          {[school.affiliation_board || school.board, school.city].filter(Boolean).join(' · ')}
        </span>
      </div>

      {/* School Name */}
      <div style={{
        fontWeight: '800',
        fontSize: '12px',
        color: '#0f172a',
        lineHeight: '1.3',
        marginBottom: '3px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {school.name}
      </div>

      {/* School Tagline instead of Fees */}
      <div style={{
        fontSize: '10px',
        color: '#64748b',
        lineHeight: '1.35',
        marginBottom: '6px',
        height: '26px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}>
        {school.tagline || school.motto || `${school.name} - Premier Learning Campus`}
      </div>

      {/* Footer Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
        paddingTop: '6px',
        borderTop: '1px solid #f8fafc',
        fontSize: '10.5px'
      }}>
        <span style={{ fontWeight: '800', color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ★ Verified
        </span>
        <span style={{ color: '#064e3b', fontWeight: '800' }}>
          Explore →
        </span>
      </div>
    </div>
  );

  return (
    <div className="mk-solar-system-container" style={{
      position: 'relative',
      width: '100%',
      maxWidth: '560px',
      height: '500px',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible'
    }}>
      {/* Background Solar Nebula Glow */}
      <div style={{
        position: 'absolute',
        width: '420px',
        height: '420px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(6, 78, 59, 0) 70%)',
        pointerEvents: 'none'
      }} />

      {/* Center Sun Core: Clean SchoolKarma Brand Emblem */}
      <div 
        className="orbit-sun-core"
        onClick={() => {
          const el = document.getElementById('marketplace-catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        style={{
          width: '92px',
          height: '92px',
          borderRadius: '50%',
          backgroundColor: '#064e3b',
          border: '2.5px solid #34d399',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          zIndex: 10,
          cursor: 'pointer',
          boxShadow: '0 0 35px rgba(52, 211, 153, 0.45)',
          padding: '6px',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}
        title="SchoolKarma — 90+ Partner Campuses. Click to explore catalog."
      >
        <span style={{ fontSize: '18px', lineHeight: '1', marginBottom: '2px' }}>🏫</span>
        <span style={{ 
          fontSize: '11px', 
          fontWeight: '900', 
          color: '#ffffff', 
          letterSpacing: '-0.2px',
          lineHeight: '1.2'
        }}>
          SchoolKarma
        </span>
        <span style={{ 
          fontSize: '8.5px', 
          fontWeight: '800', 
          color: '#34d399', 
          letterSpacing: '0.4px', 
          textTransform: 'uppercase',
          marginTop: '2px'
        }}>
          90+ Campuses
        </span>
      </div>

      {/* Orbit Track 1 (Inner Ring) */}
      <div
        className="orbit-ring-1"
        style={{
          position: 'absolute',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          border: '1.5px dashed rgba(5, 150, 105, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {track1.map((school, idx) => {
          const rad = (school.angle * Math.PI) / 180;
          const x = Math.round(130 * Math.cos(rad));
          const y = Math.round(130 * Math.sin(rad));

          return (
            <div
              key={school.slug || idx}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="planet-counter-spin">
                {renderSchoolRectCard(school)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Orbit Track 2 (Outer Ring) */}
      <div
        className="orbit-ring-2"
        style={{
          position: 'absolute',
          width: '430px',
          height: '430px',
          borderRadius: '50%',
          border: '1.5px dashed rgba(5, 150, 105, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {track2.map((school, idx) => {
          const rad = (school.angle * Math.PI) / 180;
          const x = Math.round(215 * Math.cos(rad));
          const y = Math.round(215 * Math.sin(rad));

          return (
            <div
              key={school.slug || idx}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="planet-counter-spin">
                {renderSchoolRectCard(school)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
