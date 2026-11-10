import React, { useState } from 'react';
import {
  IconArrowLeft,
  IconStarFilled,
  IconCheck,
  IconMapPin,
  IconPhone,
  IconMail,
  IconLink,
  IconDownload,
  IconMessageCircle,
  IconThumbUp,
  IconArrowsDiff,
  IconShieldCheck,
  IconUsers,
  IconAward,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import {
  useGetSchoolBySlugQuery,
  useGetSchoolReviewsQuery,
  useGetPressReleasesQuery,
  useUpvoteReviewHelpfulMutation
} from '../store/marketplaceApi.js';
import { addSchoolToCompare, removeSchoolFromCompare } from '../store/comparisonSlice.js';
import EnquiryModal from '../components/EnquiryModal.jsx';
import BrochureModal from '../components/BrochureModal.jsx';
import ReviewModal from '../components/ReviewModal.jsx';

function StarRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <div style={{ width: '140px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{label}</div>
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <IconStarFilled key={i} size={13} color={i <= (value || 0) ? '#f59e0b' : '#e2e8f0'} />
        ))}
      </div>
      <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>{value || '—'}</span>
    </div>
  );
}

export default function SchoolProfileView({ slug, onBack, onOpenComparison }) {
  const dispatch = useDispatch();
  const comparedSchools = useSelector((state) => state.comparison.comparedSchools);
  const isCompared = comparedSchools.some(s => s.slug === slug);

  const [activeTab, setActiveTab] = useState('overview');
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [brochureOpen, setBrochureOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [upvotedReviews, setUpvotedReviews] = useState(new Set());

  const { data: schoolRes, isLoading: schoolLoading } = useGetSchoolBySlugQuery(slug);
  const { data: reviewsRes } = useGetSchoolReviewsQuery(slug);
  const { data: pressRes } = useGetPressReleasesQuery(slug);
  const [upvoteReview] = useUpvoteReviewHelpfulMutation();

  const school = schoolRes?.data;
  const reviews = reviewsRes?.data || [];
  const pressReleases = pressRes?.data || [];

  if (schoolLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
        Loading school profile...
      </div>
    );
  }

  if (!school) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ color: '#0f172a' }}>School not found</h2>
        <button onClick={onBack} style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '8px', backgroundColor: '#064e3b', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700' }}>
          Back to Search
        </button>
      </div>
    );
  }

  const galleryImages = typeof school.gallery_images === 'string'
    ? JSON.parse(school.gallery_images || '[]')
    : (school.gallery_images || []);

  const facilities = typeof school.facilities === 'string'
    ? JSON.parse(school.facilities || '[]')
    : (school.facilities || []);

  const handleUpvote = async (reviewId) => {
    if (upvotedReviews.has(reviewId)) return;
    try {
      await upvoteReview(reviewId).unwrap();
      setUpvotedReviews(prev => new Set([...prev, reviewId]));
    } catch {}
  };

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'gallery', label: `Gallery (${galleryImages.length})` },
    { id: 'reviews', label: `Reviews (${school.review_count || reviews.length})` },
    { id: 'newsroom', label: `Newsroom (${pressReleases.length})` }
  ];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Hero Banner */}
      <div style={{
        height: '320px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <img
          src={school.hero_image_url || galleryImages[0]?.url || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&auto=format&fit=crop&q=80'}
          alt={school.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.65) 100%)'
        }} />

        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '20px',
            left: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: '8px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          <IconArrowLeft size={15} />
          All Schools
        </button>

        {/* School Hero Info */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          right: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{
                  backgroundColor: '#064e3b',
                  color: '#a7f3d0',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span className="pulse-indicator" />
                  {school.admission_status || 'Admissions Open (2026-27)'}
                </span>
                <span style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '20px'
                }}>
                  {school.affiliation_board} Affiliated
                </span>
                {school.is_verified && (
                  <span style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <IconShieldCheck size={13} />
                    CKR Verified
                  </span>
                )}
              </div>

              <h1 style={{
                fontSize: '30px',
                fontWeight: '800',
                color: '#ffffff',
                letterSpacing: '-0.5px',
                marginBottom: '8px',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {school.name}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <IconMapPin size={14} />
                  {school.address ? `${school.address}, ` : ''}{school.city}, {school.state}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconStarFilled size={14} color="#f59e0b" />
                  <span style={{ fontWeight: '700', color: '#ffffff' }}>{school.avg_rating || '4.8'}</span>
                  <span>({school.review_count || 0} reviews)</span>
                </span>
                <span>Est. {school.established_year || '2012'}</span>
              </div>
            </div>

            {/* Stats Badges (right side) */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {school.student_count_badge && (
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  textAlign: 'center',
                  color: '#ffffff'
                }}>
                  <div style={{ fontSize: '15px', fontWeight: '800' }}>{school.student_count_badge}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Enrolled</div>
                </div>
              )}
              {school.teacher_count_badge && (
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  textAlign: 'center',
                  color: '#ffffff'
                }}>
                  <div style={{ fontSize: '15px', fontWeight: '800' }}>{school.teacher_count_badge}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Faculty</div>
                </div>
              )}
              {school.student_teacher_ratio && (
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  textAlign: 'center',
                  color: '#ffffff'
                }}>
                  <div style={{ fontSize: '15px', fontWeight: '800' }}>{school.student_teacher_ratio}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Ratio</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        position: 'sticky',
        top: '68px',
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '4px' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  height: '100%',
                  padding: '0 18px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #064e3b' : '2px solid transparent',
                  color: activeTab === tab.id ? '#064e3b' : '#64748b',
                  fontWeight: activeTab === tab.id ? '700' : '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                if (isCompared) {
                  dispatch(removeSchoolFromCompare(school.slug));
                } else {
                  dispatch(addSchoolToCompare(school));
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: isCompared ? '#ecfdf5' : '#f1f5f9',
                color: isCompared ? '#064e3b' : '#475569',
                border: isCompared ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                borderRadius: '7px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <IconArrowsDiff size={14} />
              {isCompared ? 'Comparing' : 'Compare'}
            </button>

            <button
              onClick={() => setBrochureOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#ffffff',
                color: '#064e3b',
                border: '1px solid #064e3b',
                borderRadius: '7px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <IconDownload size={14} />
              Brochure
            </button>

            <button
              onClick={() => setEnquiryOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#064e3b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '7px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(6,78,59,0.15)'
              }}
            >
              Enquire for Admission
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '28px' }}>
            {/* Left main */}
            <div>
              {/* About */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>About the School</h3>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7' }}>{school.about}</p>
                {school.motto && (
                  <div style={{
                    marginTop: '14px',
                    padding: '10px 16px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontStyle: 'italic',
                    color: '#064e3b',
                    fontWeight: '600'
                  }}>
                    "{school.motto}"
                  </div>
                )}
              </div>

              {/* Facilities Grid */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                  Campus Facilities & Infrastructure
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '10px'
                }}>
                  {facilities.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        color: '#334155',
                        fontWeight: '500'
                      }}
                    >
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: '#ecfdf5',
                        color: '#047857',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <IconCheck size={13} />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Rating Summary */}
              {reviews.length > 0 && (
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Parent Rating Summary</h3>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      style={{
                        background: 'none', border: 'none', color: '#064e3b',
                        fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                      }}
                    >
                      See All {reviews.length} Reviews →
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '44px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
                        {school.avg_rating || '4.8'}
                      </div>
                      <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', margin: '6px 0' }}>
                        {[1,2,3,4,5].map(i => (
                          <IconStarFilled key={i} size={16} color={i <= Math.round(school.avg_rating) ? '#f59e0b' : '#e2e8f0'} />
                        ))}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{school.review_count} reviews</div>
                    </div>

                    <div style={{ flex: 1 }}>
                      {(() => {
                        const avg = reviews.length > 0 ? {
                          academics: reviews.reduce((a, r) => a + (r.academics_rating || 0), 0) / reviews.length,
                          infrastructure: reviews.reduce((a, r) => a + (r.infrastructure_rating || 0), 0) / reviews.length,
                          faculty: reviews.reduce((a, r) => a + (r.faculty_rating || 0), 0) / reviews.length,
                          safety: reviews.reduce((a, r) => a + (r.safety_rating || 0), 0) / reviews.length,
                          value: reviews.reduce((a, r) => a + (r.value_for_money_rating || 0), 0) / reviews.length
                        } : {};
                        return <>
                          <StarRow label="Academics" value={avg.academics?.toFixed(1)} />
                          <StarRow label="Infrastructure" value={avg.infrastructure?.toFixed(1)} />
                          <StarRow label="Faculty & Care" value={avg.faculty?.toFixed(1)} />
                          <StarRow label="Safety & Transport" value={avg.safety?.toFixed(1)} />
                          <StarRow label="Value for Money" value={avg.value?.toFixed(1)} />
                        </>;
                      })()}
                    </div>
                  </div>

                  <button
                    onClick={() => setReviewOpen(true)}
                    style={{
                      width: '100%',
                      backgroundColor: '#f0fdf4',
                      color: '#064e3b',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <IconMessageCircle size={16} />
                    Write a Verified Parent Review
                  </button>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div>
              {/* Quick Info Card */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                marginBottom: '16px',
                position: 'sticky',
                top: '132px'
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                  Quick Information
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Affiliation Board</div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{school.affiliation_board} {school.board_affiliation_number ? `(${school.board_affiliation_number})` : ''}</div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Grades Offered</div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{school.grades_offered}</div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Annual Tuition Fee</div>
                    <div style={{ fontWeight: '800', color: '#047857', fontSize: '15px' }}>
                      ₹{Number(school.min_fee).toLocaleString('en-IN')} – ₹{Number(school.max_fee).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Per academic year (approx.)</div>
                  </div>

                  {school.official_phone && (
                    <div>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Official Contact</div>
                      <a href={`tel:${school.official_phone}`} style={{ color: '#064e3b', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IconPhone size={13} />
                        {school.official_phone}
                      </a>
                    </div>
                  )}

                  {school.official_email && (
                    <div>
                      <a href={`mailto:${school.official_email}`} style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <IconMail size={13} />
                        {school.official_email}
                      </a>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => setEnquiryOpen(true)}
                    style={{
                      width: '100%',
                      backgroundColor: '#064e3b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Enquire for Admission
                  </button>
                  <button
                    onClick={() => setBrochureOpen(true)}
                    style={{
                      width: '100%',
                      backgroundColor: '#ffffff',
                      color: '#064e3b',
                      border: '1px solid #064e3b',
                      borderRadius: '8px',
                      padding: '10px',
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
                    Download Brochure / Prospectus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div>
            {galleryImages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                Gallery images will be added by the school administration.
              </div>
            ) : (
              <div>
                {/* Main featured image */}
                <div style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  height: '400px',
                  marginBottom: '16px',
                  position: 'relative',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
                }}>
                  <img
                    src={galleryImages[galleryIndex]?.url}
                    alt={galleryImages[galleryIndex]?.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '16px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backdropFilter: 'blur(4px)'
                  }}>
                    {galleryImages[galleryIndex]?.title || 'Campus Photo'} · {galleryImages[galleryIndex]?.category || 'Campus'}
                  </div>

                  {galleryImages.length > 1 && (
                    <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 12px', pointerEvents: 'none' }}>
                      <button
                        onClick={() => setGalleryIndex(i => Math.max(0, i - 1))}
                        disabled={galleryIndex === 0}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          pointerEvents: 'all',
                          opacity: galleryIndex === 0 ? 0.4 : 1
                        }}
                      >
                        <IconChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setGalleryIndex(i => Math.min(galleryImages.length - 1, i + 1))}
                        disabled={galleryIndex === galleryImages.length - 1}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          pointerEvents: 'all',
                          opacity: galleryIndex === galleryImages.length - 1 ? 0.4 : 1
                        }}
                      >
                        <IconChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                  {galleryImages.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setGalleryIndex(i)}
                      style={{
                        height: '110px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: i === galleryIndex ? '3px solid #064e3b' : '2px solid transparent',
                        opacity: i === galleryIndex ? 1 : 0.75,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <img src={img.url} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                Parent Reviews ({reviews.length})
              </h3>
              <button
                onClick={() => setReviewOpen(true)}
                style={{
                  backgroundColor: '#064e3b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <IconMessageCircle size={16} />
                Write a Review
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.map(review => (
                <div
                  key={review.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#064e3b',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '14px'
                        }}>
                          {review.reviewer_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {review.reviewer_name}
                            {review.is_verified && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <IconShieldCheck size={10} />
                                Verified
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {review.relationship} · {new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <IconStarFilled key={i} size={16} color={i <= review.overall_rating ? '#f59e0b' : '#e2e8f0'} />
                      ))}
                    </div>
                  </div>

                  {review.title && (
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '6px' }}>
                      {review.title}
                    </div>
                  )}

                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', marginBottom: '12px' }}>
                    {review.review_text}
                  </p>

                  {/* Sub-ratings */}
                  {review.academics_rating && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '12px',
                      fontSize: '11px',
                      color: '#64748b'
                    }}>
                      <span>📚 Academics: <strong>{review.academics_rating}/5</strong></span>
                      <span>🏫 Infrastructure: <strong>{review.infrastructure_rating}/5</strong></span>
                      <span>👩‍🏫 Faculty: <strong>{review.faculty_rating}/5</strong></span>
                      <span>🛡️ Safety: <strong>{review.safety_rating}/5</strong></span>
                      <span>💰 Value: <strong>{review.value_for_money_rating}/5</strong></span>
                    </div>
                  )}

                  <button
                    onClick={() => handleUpvote(review.id)}
                    disabled={upvotedReviews.has(review.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'none',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      color: upvotedReviews.has(review.id) ? '#047857' : '#64748b',
                      fontWeight: '600',
                      cursor: upvotedReviews.has(review.id) ? 'default' : 'pointer',
                      backgroundColor: upvotedReviews.has(review.id) ? '#ecfdf5' : '#f8fafc'
                    }}
                  >
                    <IconThumbUp size={13} />
                    Helpful ({review.helpful_count || 0})
                    {upvotedReviews.has(review.id) && <IconCheck size={12} />}
                  </button>
                </div>
              ))}

              {reviews.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                  <p>No parent reviews yet. Be the first verified parent to review {school.name}.</p>
                  <button
                    onClick={() => setReviewOpen(true)}
                    style={{
                      marginTop: '12px',
                      backgroundColor: '#064e3b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Write the First Review
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEWSROOM TAB */}
        {activeTab === 'newsroom' && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>
              School Newsroom & Press Releases
            </h3>

            {pressReleases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                No press releases published yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                {pressReleases.map(pr => (
                  <div
                    key={pr.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                    }}
                  >
                    {pr.featured_image_url && (
                      <div style={{ height: '160px', overflow: 'hidden' }}>
                        <img
                          src={pr.featured_image_url}
                          alt={pr.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div style={{ padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: '#f0fdf4',
                          color: '#047857',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {pr.category}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {new Date(pr.published_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', lineHeight: '1.3', marginBottom: '8px' }}>
                        {pr.title}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                        {pr.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <EnquiryModal school={school} isOpen={enquiryOpen} onClose={() => setEnquiryOpen(false)} />
      <BrochureModal school={school} isOpen={brochureOpen} onClose={() => setBrochureOpen(false)} />
      <ReviewModal school={school} isOpen={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
}

