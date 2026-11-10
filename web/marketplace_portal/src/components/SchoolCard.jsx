import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  IconStarFilled, 
  IconMapPin, 
  IconCertificate, 
  IconCheck, 
  IconArrowsDiff,
  IconArrowRight,
  IconDownload,
  IconUsers,
  IconSchool
} from '@tabler/icons-react';
import { addSchoolToCompare, removeSchoolFromCompare } from '../store/comparisonSlice.js';

function formatPaiseToRupees(num) {
  if (!num) return '₹0';
  return `₹${Number(num).toLocaleString('en-IN')}`;
}

export default function SchoolCard({ 
  school, 
  onSelectSchool, 
  onOpenEnquiry,
  onOpenBrochure
}) {
  const dispatch = useDispatch();
  const comparedSchools = useSelector((state) => state.comparison.comparedSchools);
  const isCompared = comparedSchools.some(s => s.slug === school.slug);

  const handleToggleCompare = (e) => {
    e.stopPropagation();
    if (isCompared) {
      dispatch(removeSchoolFromCompare(school.slug));
    } else {
      dispatch(addSchoolToCompare(school));
    }
  };

  const facilities = typeof school.facilities === 'string' ? JSON.parse(school.facilities || '[]') : (school.facilities || []);

  return (
    <div 
      onClick={() => onSelectSchool(school.slug)}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.12)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      {/* Hero Image Section */}
      <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
        <img
          src={school.hero_image_url || school.gallery_images?.[0]?.url || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80'}
          alt={school.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
        />

        {/* Live Admission Status Badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: '#064e3b',
          color: '#f0fdf4',
          fontSize: '11px',
          fontWeight: '700',
          padding: '4px 10px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          <span className="pulse-indicator" />
          {school.admission_status || 'Admissions Open (2026-27)'}
        </div>

        {/* Featured Partner Badge */}
        {school.is_featured && (
          <div style={{
            position: 'absolute',
            top: '44px',
            left: '12px',
            backgroundColor: '#fbbf24',
            color: '#78350f',
            fontSize: '10px',
            fontWeight: '800',
            padding: '2px 8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            letterSpacing: '0.03em',
            textTransform: 'uppercase'
          }}>
            ★ Featured
          </div>
        )}

        {/* Board & City Pill */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: '600',
          padding: '3px 8px',
          borderRadius: '4px',
          backdropFilter: 'blur(4px)'
        }}>
          {school.affiliation_board || 'CBSE'} · {school.city}
        </div>

        {/* Compare Checkbox Button */}
        <button
          onClick={handleToggleCompare}
          title={isCompared ? 'Remove from Comparison' : 'Add to Compare'}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: isCompared ? '#064e3b' : 'rgba(255, 255, 255, 0.95)',
            color: isCompared ? '#ffffff' : '#334155',
            border: isCompared ? '1px solid #064e3b' : '1px solid #cbd5e1',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            transition: 'all 0.15s ease'
          }}
        >
          <IconArrowsDiff size={13} />
          {isCompared ? 'Comparing' : 'Compare'}
        </button>
      </div>

      {/* Body Details */}
      <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Title & Logo */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
          {school.logo_url && (
            <img 
              src={school.logo_url} 
              alt="" 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                objectFit: 'contain',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff'
              }} 
            />
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '17px',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.3px',
              lineHeight: '1.25',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {school.name}
              <IconCheck size={16} color="#047857" title="Verified Campus" />
            </h3>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {school.city}, {school.state} · Est. {school.established_year || '2012'}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: '13px',
          color: '#475569',
          lineHeight: '1.45',
          marginBottom: '14px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {school.tagline || school.about}
        </p>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '14px',
          backgroundColor: '#f8fafc',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #f1f5f9'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>ANNUAL TUITION</div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#047857' }}>
              {formatPaiseToRupees(school.min_fee)} – {formatPaiseToRupees(school.max_fee)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>PARENT RATING</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
              <IconStarFilled size={14} color="#f59e0b" />
              <span>{school.avg_rating || '4.8'}</span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>({school.review_count || 4} reviews)</span>
            </div>
          </div>
        </div>

        {/* Facilities Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', flex: 1 }}>
          {facilities.slice(0, 3).map((f, i) => (
            <span
              key={i}
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#334155',
                backgroundColor: '#f1f5f9',
                padding: '3px 8px',
                borderRadius: '4px'
              }}
            >
              {f}
            </span>
          ))}
          {facilities.length > 3 && (
            <span style={{ fontSize: '11px', color: '#64748b', padding: '3px 4px' }}>
              +{facilities.length - 3} more
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '14px'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenEnquiry(school);
            }}
            style={{
              backgroundColor: '#064e3b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(6, 78, 59, 0.15)'
            }}
          >
            Enquire Now
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenBrochure(school);
            }}
            style={{
              backgroundColor: '#ffffff',
              color: '#064e3b',
              border: '1px solid #064e3b',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <IconDownload size={14} />
            Brochure
          </button>
        </div>
      </div>
    </div>
  );
}

