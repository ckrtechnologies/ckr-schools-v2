import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  IconArrowsDiff,
  IconStarFilled,
  IconCheck,
  IconX,
  IconCurrencyRupee,
  IconMapPin,
  IconUsers,
  IconSchool,
  IconShieldCheck
} from '@tabler/icons-react';
import { removeSchoolFromCompare, clearComparison } from '../store/comparisonSlice.js';

const COMPARE_ATTRIBUTES = [
  { key: 'affiliation_board', label: 'Affiliation Board' },
  { key: 'city', label: 'Location / City' },
  { key: 'established_year', label: 'Year Established' },
  { key: 'grades_offered', label: 'Grades Offered' },
  { key: '_fees', label: 'Annual Fee Range', render: (s) => s.min_fee && s.max_fee ? `₹${Number(s.min_fee).toLocaleString('en-IN')} – ₹${Number(s.max_fee).toLocaleString('en-IN')}` : '—' },
  { key: 'avg_rating', label: 'Parent Avg Rating (5-axis)', render: (s) => s.avg_rating ? `${s.avg_rating} / 5 (${s.review_count} reviews)` : '—' },
  { key: 'student_teacher_ratio', label: 'Student : Teacher Ratio' },
  { key: 'student_count_badge', label: 'Total Enrolled Students' },
  { key: 'teacher_count_badge', label: 'Certified Faculty' },
  { key: 'admission_status', label: 'Admission Status (2026-27)' }
];

export default function CompareView({ onSelectSchool, onOpenMultiEnquiry, onBack }) {
  const dispatch = useDispatch();
  const { comparedSchools } = useSelector((state) => state.comparison);

  if (comparedSchools.length === 0) {
    return (
      <div style={{ maxWidth: '900px', margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '56px 40px'
        }}>
          <IconArrowsDiff size={48} color="#94a3b8" style={{ marginBottom: '14px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            No Schools in Comparison
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
            Browse schools and click <strong>"Compare"</strong> on any school card to add it to your comparison tray. You can compare up to 3 schools side-by-side.
          </p>
          <button
            onClick={onBack}
            style={{
              backgroundColor: '#064e3b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '11px 24px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Browse Schools
          </button>
        </div>
      </div>
    );
  }

  const getCellValue = (school, attr) => {
    if (attr.render) return attr.render(school);
    const val = school[attr.key];
    return val !== null && val !== undefined && val !== '' ? String(val) : '—';
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', textTransform: 'uppercase' }}>
            SCHOOL COMPARISON MATRIX
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
            Comparing {comparedSchools.length} School{comparedSchools.length > 1 ? 's' : ''} Side-by-Side
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                dispatch(clearComparison());
                onBack();
              }}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Clear & Start Over
            </button>
            <button
              onClick={onOpenMultiEnquiry}
              style={{
                backgroundColor: '#064e3b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              1-Click Enquire to All {comparedSchools.length} Schools
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        {/* School Hero Images Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `200px repeat(${comparedSchools.length}, 1fr)`,
          borderBottom: '2px solid #e2e8f0'
        }}>
          {/* Empty corner */}
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0' }} />

          {comparedSchools.map((school) => (
            <div
              key={school.slug}
              style={{
                padding: '20px',
                textAlign: 'center',
                borderRight: '1px solid #e2e8f0',
                position: 'relative'
              }}
            >
              {/* Remove from compare */}
              <button
                onClick={() => dispatch(removeSchoolFromCompare(school.slug))}
                title="Remove from comparison"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <IconX size={13} />
              </button>

              {/* Hero image */}
              <div style={{
                height: '110px',
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '12px'
              }}>
                <img
                  src={school.hero_image_url || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop&q=80'}
                  alt={school.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* School info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                {school.logo_url && (
                  <img src={school.logo_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain', border: '1px solid #e2e8f0' }} />
                )}
                <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>
                  {school.name}
                </div>
              </div>

              {/* Star rating */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                <IconStarFilled size={14} color="#f59e0b" />
                <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{school.avg_rating || '4.8'}</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>({school.review_count || 0} reviews)</span>
              </div>

              {/* CTA Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => onSelectSchool(school.slug)}
                  style={{
                    backgroundColor: '#f0fdf4',
                    color: '#064e3b',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  View Profile
                </button>
                <button
                  onClick={onOpenMultiEnquiry}
                  style={{
                    backgroundColor: '#064e3b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Enquire
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Attribute Rows */}
        {COMPARE_ATTRIBUTES.map((attr, rowIdx) => (
          <div
            key={attr.key}
            style={{
              display: 'grid',
              gridTemplateColumns: `200px repeat(${comparedSchools.length}, 1fr)`,
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc'
            }}
          >
            {/* Attribute label */}
            <div style={{
              padding: '14px 16px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              borderRight: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              {attr.label}
            </div>

            {/* School values */}
            {comparedSchools.map((school) => {
              const val = getCellValue(school, attr);
              const isAdmissionsOpen = attr.key === 'admission_status' && val.toLowerCase().includes('open');
              return (
                <div
                  key={school.slug}
                  style={{
                    padding: '14px 18px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: isAdmissionsOpen ? '#047857' : '#334155',
                    borderRight: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isAdmissionsOpen && <span className="pulse-indicator" />}
                  {attr.key === 'avg_rating' && val !== '—' && (
                    <IconStarFilled size={13} color="#f59e0b" />
                  )}
                  {val}
                </div>
              );
            })}
          </div>
        ))}

        {/* Facilities Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `200px repeat(${comparedSchools.length}, 1fr)`,
            borderBottom: '1px solid #f1f5f9'
          }}
        >
          <div style={{
            padding: '14px 16px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
            borderRight: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}>
            Key Facilities
          </div>

          {comparedSchools.map((school) => {
            const facilities = typeof school.facilities === 'string'
              ? JSON.parse(school.facilities || '[]')
              : (school.facilities || []);
            return (
              <div
                key={school.slug}
                style={{
                  padding: '14px 18px',
                  borderRight: '1px solid #f1f5f9'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {facilities.slice(0, 5).map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155' }}>
                      <IconCheck size={13} color="#047857" />
                      {f}
                    </div>
                  ))}
                  {facilities.length > 5 && (
                    <div style={{ fontSize: '11px', color: '#64748b' }}>+{facilities.length - 5} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div style={{
        marginTop: '32px',
        backgroundColor: '#064e3b',
        borderRadius: '12px',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#ffffff'
      }}>
        <div>
          <div style={{ fontWeight: '800', fontSize: '18px', marginBottom: '4px' }}>
            Ready to Apply? Send One Enquiry to All Schools at Once.
          </div>
          <div style={{ fontSize: '13px', color: '#a7f3d0' }}>
            Your child's details reach all {comparedSchools.length} selected school admission desks in 1 click. Zero parent fee.
          </div>
        </div>
        <button
          onClick={onOpenMultiEnquiry}
          style={{
            backgroundColor: '#ffffff',
            color: '#064e3b',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          1-Click Multi-School Enquiry
        </button>
      </div>
    </div>
  );
}

