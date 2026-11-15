'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  IconShieldCheck,
  IconArrowLeft
} from '@tabler/icons-react';
import { removeSchoolFromCompare, clearComparison } from '../lib/store/comparisonSlice.js';
import SchoolImage from './SchoolImage.jsx';
import SchoolLogo from './SchoolLogo.jsx';
import MultiEnquiryModal from './modals/MultiEnquiryModal.jsx';

const COMPARE_ATTRIBUTES = [
  { key: 'affiliation_board', label: 'Affiliation Board' },
  { key: 'city', label: 'Location / City' },
  { key: 'established_year', label: 'Year Established' },
  { key: 'grades_offered', label: 'Grades Offered' },
  { key: '_fees', label: 'Fee Range', render: (s) => (Number(s.min_fee || s.annual_fee_min) > 0 && Number(s.max_fee || s.annual_fee_max) > 0) ? `₹${Number(s.min_fee || s.annual_fee_min).toLocaleString('en-IN')} – ₹${Number(s.max_fee || s.annual_fee_max).toLocaleString('en-IN')}` : 'Fees on enquiry' },
  { key: 'avg_rating', label: 'Parent Avg Rating', render: (s) => Number(s.review_count) > 0 && Number(s.avg_rating) > 0 ? `${Number(s.avg_rating).toFixed(1)} / 5 (${s.review_count} reviews)` : 'No reviews yet' },
  { key: 'student_teacher_ratio', label: 'Student : Teacher Ratio' },
  { key: 'student_count_badge', label: 'Total Enrolled Students' },
  { key: 'teacher_count_badge', label: 'Certified Faculty' },
  { key: 'admission_status', label: 'Admission Status' }
];

export default function CompareClientView() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { comparedSchools } = useSelector((state) => state.comparison);
  const [isMultiEnquiryOpen, setIsMultiEnquiryOpen] = useState(false);

  const getCellValue = (school, attr) => {
    if (attr.render) return attr.render(school);
    const val = school[attr.key];
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  };

  if (comparedSchools.length === 0) {
    return (
      <div style={{ maxWidth: '900px', margin: '60px auto', textAlign: 'center', padding: '0 20px', minHeight: '60vh' }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '56px 40px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <IconArrowsDiff size={48} color="#94a3b8" style={{ marginBottom: '14px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            No Schools Selected for Comparison
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', maxWidth: '520px', margin: '0 auto 24px' }}>
            Browse accredited campuses and click <strong>"Compare"</strong> on any card to add it to your comparison tray. You can compare up to 3 schools side-by-side.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href="/schools"
              style={{
                backgroundColor: '#064e3b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Browse Campus Catalog →
            </Link>
            <Link
              href="/"
              style={{
                backgroundColor: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '28px clamp(16px, 2.5vw, 40px) 80px', boxSizing: 'border-box' }}>
      {/* Top action header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <Link
            href="/schools"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#064e3b',
              fontWeight: '700',
              textDecoration: 'none',
              marginBottom: '6px'
            }}
          >
            <IconArrowLeft size={16} />
            Back to School Catalog
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
            Side-by-Side School Comparison
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0' }}>
            Evaluating {comparedSchools.length} of 3 campuses across fees, academics, ratings, and infrastructure.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => dispatch(clearComparison())}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#64748b',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
          <button
            onClick={() => setIsMultiEnquiryOpen(true)}
            style={{
              backgroundColor: '#064e3b',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(6, 78, 59, 0.25)'
            }}
          >
            Enquire to All {comparedSchools.length} Campuses
          </button>
        </div>
      </div>

      {/* Comparison Table / Matrix */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflowX: 'auto',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
      }}>
        {/* School Cards Header Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `160px repeat(${comparedSchools.length}, minmax(220px, 1fr))`,
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{
            padding: '20px 16px',
            fontSize: '12px',
            fontWeight: '800',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center'
          }}>
            Campus Profile
          </div>

          {comparedSchools.map((school) => (
            <div
              key={school.slug}
              style={{
                padding: '20px 16px',
                borderRight: '1px solid #e2e8f0',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <button
                onClick={() => dispatch(removeSchoolFromCompare(school.slug))}
                title="Remove school"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <IconX size={16} />
              </button>

              <SchoolLogo
                school={school}
                size={64}
                borderRadius="12px"
                style={{ marginBottom: '10px' }}
              />

              <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a', marginBottom: '6px', wordBreak: 'break-word' }}>
                {school.name}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                {Number(school.review_count) > 0 && Number(school.avg_rating) > 0 ? (
                  <>
                    <IconStarFilled size={14} color="#f59e0b" />
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{Number(school.avg_rating).toFixed(1)}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>({school.review_count})</span>
                  </>
                ) : (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>No reviews yet</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <Link
                  href={`/schools/${school.slug}`}
                  style={{
                    flex: 1,
                    backgroundColor: '#f0fdf4',
                    color: '#064e3b',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    padding: '7px 8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textDecoration: 'none'
                  }}
                >
                  View Profile
                </Link>
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
              gridTemplateColumns: `160px repeat(${comparedSchools.length}, minmax(220px, 1fr))`,
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc'
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
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              {attr.label}
            </div>

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
                  {attr.key === 'avg_rating' && val !== 'No reviews yet' && (
                    <IconStarFilled size={13} color="#f59e0b" />
                  )}
                  {val}
                </div>
              );
            })}
          </div>
        ))}

        {/* Facilities Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `160px repeat(${comparedSchools.length}, minmax(220px, 1fr))`,
          borderBottom: '1px solid #f1f5f9'
        }}>
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
                  {facilities.length === 0 && (
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Facilities not listed yet</div>
                  )}
                  {facilities.slice(0, 6).map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155' }}>
                      <IconCheck size={13} color="#047857" />
                      {f}
                    </div>
                  ))}
                  {facilities.length > 6 && (
                    <div style={{ fontSize: '11px', color: '#64748b' }}>+{facilities.length - 6} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Enquiry Modal */}
      {isMultiEnquiryOpen && (
        <MultiEnquiryModal
          selectedSchools={comparedSchools}
          isOpen={isMultiEnquiryOpen}
          onClose={() => setIsMultiEnquiryOpen(false)}
        />
      )}
    </div>
  );
}

