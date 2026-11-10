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
  IconChevronRight,
  IconLink as IconWebsite,
  IconTrophy,
  IconBulb,
  IconSparkles,
  IconCalendarEvent,
  IconNews
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
import SchoolImage from '../components/SchoolImage.jsx';

function StarRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', minWidth: 0 }}>
      <div style={{ flex: '1 1 90px', minWidth: 0, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{label}</div>
      <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <IconStarFilled key={i} size={13} color={i <= (value || 0) ? '#f59e0b' : '#e2e8f0'} />
        ))}
      </div>
      <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', flexShrink: 0 }}>{value || '—'}</span>
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
  const [upvoteReview] = useUpvoteReviewHelpfulMutation();

  const school = schoolRes?.data;
  const reviews = reviewsRes?.data || [];
  const { data: pressRes } = useGetPressReleasesQuery(slug);
  const pressReleases = pressRes?.data || [];
  const community = school?.community || {};
  const achievements = community.achievements || [];
  const studentOfWeek = community.studentOfWeek || null;
  const highlights = [...(community.spotlight || []), ...(community.thoughts || [])];
  const social = community.social || {};

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

  const galleryImages = community.gallery || [];

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
    { id: 'achievements', label: `Achievements (${achievements.length + (studentOfWeek ? 1 : 0)})` },
    { id: 'news', label: `Newsroom (${pressReleases.length})` },
    { id: 'reviews', label: `Reviews (${school.review_count || reviews.length})` }
  ];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Hero Banner — flow layout (no absolute positioning) so the logo can never
          overlap the school name at any viewport width. */}
      <div className="profile-hero">
        <div className="profile-hero-bg">
          {school.hero_image_url ? (
            <>
              <SchoolImage school={school} alt={school.name} height="100%" />
              <div className="profile-hero-scrim" />
            </>
          ) : (
            <div className="profile-hero-gradient" />
          )}
        </div>

        <div className="mk-shell profile-hero-inner">
          <button onClick={onBack} className="profile-hero-back">
            <IconArrowLeft size={15} />
            All Schools
          </button>

          <div className="profile-hero-body">
            <div className="profile-hero-main">
              {school.logo_url && (
                <div className="profile-hero-logo">
                  <img src={school.logo_url} alt={`${school.name} logo`} />
                </div>
              )}

              <div style={{ minWidth: 0 }}>
                <div className="profile-hero-badges">
                  {school.admission_status && (
                    <span style={{
                      backgroundColor: '#064e3b',
                      color: '#a7f3d0',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span className="pulse-indicator" />
                      {school.admission_status}
                    </span>
                  )}
                  {school.affiliation_board && (
                    <span className="profile-hero-chip">{school.affiliation_board} Affiliated</span>
                  )}
                  {school.is_verified && (
                    <span className="profile-hero-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <IconShieldCheck size={13} />
                      CKR Verified
                    </span>
                  )}
                </div>

                <h1 className="profile-hero-title">{school.name}</h1>

                <div className="profile-hero-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <IconMapPin size={14} style={{ flexShrink: 0 }} />
                    {[school.address, school.city, school.state, school.pincode].filter(Boolean).join(', ')}
                  </span>
                  {Number(school.review_count) > 0 && Number(school.avg_rating) > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IconStarFilled size={14} color="#f59e0b" />
                      <span style={{ fontWeight: '700', color: '#ffffff' }}>{Number(school.avg_rating).toFixed(1)}</span>
                      <span>({school.review_count} {Number(school.review_count) === 1 ? 'review' : 'reviews'})</span>
                    </span>
                  )}
                  {school.established_year && <span>Est. {school.established_year}</span>}
                </div>
              </div>
            </div>

            <div className="profile-hero-stats">
              {school.student_count_badge && (
                <div className="profile-hero-stat">
                  <div className="profile-hero-stat-value">{school.student_count_badge}</div>
                  <div className="profile-hero-stat-label">Enrolled</div>
                </div>
              )}
              {school.teacher_count_badge && (
                <div className="profile-hero-stat">
                  <div className="profile-hero-stat-value">{school.teacher_count_badge}</div>
                  <div className="profile-hero-stat-label">Faculty</div>
                </div>
              )}
              {school.student_teacher_ratio && (
                <div className="profile-hero-stat">
                  <div className="profile-hero-stat-value">{school.student_teacher_ratio}</div>
                  <div className="profile-hero-stat-label">Ratio</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="mk-profile-actionbar">
        <div className="mk-shell mk-actionbar">
          {/* Tabs */}
          <div className="mk-tabbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={(event) => {
                  setActiveTab(tab.id);
                  // Keep the selected tab visible when the bar scrolls horizontally on phones.
                  event.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
                }}
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
          <div className="mk-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

            {school.brochure_url && (
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
            )}

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
      <div className="mk-page">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="profile-overview">
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
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7' }}>
                  {school.about || 'The school has not published an overview yet.'}
                </p>
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
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))',
                  gap: '10px'
                }}>
                  {facilities.length === 0 && (
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>Facilities not listed yet.</div>
                  )}
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

              {/* Campus Highlights (real portal spotlight + thought of the day) */}
              {highlights.length > 0 && (
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconSparkles size={18} color="#047857" />
                    Campus Highlights
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: '12px' }}>
                    {highlights.slice(0, 6).map((item, i) => (
                      <div key={`${item.id}-${i}`} style={{
                        border: '1px solid #f1f5f9',
                        borderRadius: '10px',
                        padding: '14px',
                        backgroundColor: '#f8fafc'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#047857', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {item.thought ? <IconBulb size={12} /> : <IconCalendarEvent size={12} />}
                          {item.thought ? 'Thought of the Day' : 'Spotlight'}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', lineHeight: 1.4 }}>
                          {item.title || item.thought}
                        </div>
                        {(item.description || item.author) && (
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: 1.5 }}>
                            {item.description || `— ${item.author}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest from the Newsroom (press releases published by the school) */}
              {pressReleases.length > 0 && (
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  marginBottom: '20px'
                }}>
                  <div className="mk-section-head" style={{ marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <IconNews size={18} color="#047857" style={{ flexShrink: 0 }} />
                      Latest from the Newsroom
                    </h3>
                    <button
                      onClick={() => {
                        setActiveTab('news');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        background: 'none', border: 'none', color: '#064e3b',
                        fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      View all {pressReleases.length} →
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pressReleases.slice(0, 3).map((release) => (
                      <button
                        key={release.id}
                        onClick={() => {
                          setActiveTab('news');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: release.featured_image_url ? '92px minmax(0, 1fr)' : 'minmax(0, 1fr)',
                          gap: '12px',
                          alignItems: 'center',
                          textAlign: 'left',
                          background: '#f8fafc',
                          border: '1px solid #f1f5f9',
                          borderRadius: '10px',
                          padding: '10px',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        {release.featured_image_url && (
                          <img
                            src={release.featured_image_url}
                            alt={release.title}
                            style={{ width: '100%', height: '64px', objectFit: 'cover', borderRadius: '7px' }}
                          />
                        )}
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: '10.5px', fontWeight: '700', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                            {release.category || 'General'} · {new Date(release.published_date || release.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#0f172a', lineHeight: 1.35 }}>
                            {release.title}
                          </span>
                          {release.summary && (
                            <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {release.summary}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Rating Summary */}
              {reviews.length > 0 && (
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  marginBottom: '20px'
                }}>
                  <div className="mk-section-head" style={{ marginBottom: '16px' }}>
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

                  <div className="mk-rating-summary" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '44px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
                        {Number(school.avg_rating) > 0 ? Number(school.avg_rating).toFixed(1) : '—'}
                      </div>
                      <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', margin: '6px 0' }}>
                        {[1,2,3,4,5].map(i => (
                          <IconStarFilled key={i} size={16} color={i <= Math.round(school.avg_rating) ? '#f59e0b' : '#e2e8f0'} />
                        ))}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{school.review_count} reviews</div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
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
                    Write a Review
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
                  {school.affiliation_board && (
                    <div>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Affiliation Board</div>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{school.affiliation_board} {school.board_affiliation_number ? `(${school.board_affiliation_number})` : ''}</div>
                    </div>
                  )}

                  {school.school_code && (
                    <div>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>School Code</div>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{school.school_code}</div>
                    </div>
                  )}

                  {school.grades_offered && (
                    <div>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Grades Offered</div>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{school.grades_offered}</div>
                    </div>
                  )}

                  <div>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Annual Tuition Fee</div>
                    {Number(school.min_fee) > 0 && Number(school.max_fee) > 0 ? (
                      <>
                        <div style={{ fontWeight: '800', color: '#047857', fontSize: '15px' }}>
                          ₹{Number(school.min_fee).toLocaleString('en-IN')} – ₹{Number(school.max_fee).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Per academic year (approx.)</div>
                      </>
                    ) : (
                      <div style={{ fontWeight: '600', color: '#64748b', fontSize: '13px' }}>Fees on enquiry</div>
                    )}
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

                  {school.website && (
                    <div>
                      <a href={school.website} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <IconWebsite size={13} />
                        Official Website
                      </a>
                    </div>
                  )}

                  {(social.instagram || social.facebook || social.youtube || social.linkedin || social.twitter) && (
                    <div>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Social</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                        {social.instagram && <a href={social.instagram} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>Instagram</a>}
                        {social.facebook && <a href={social.facebook} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>Facebook</a>}
                        {social.youtube && <a href={social.youtube} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>YouTube</a>}
                        {social.linkedin && <a href={social.linkedin} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>LinkedIn</a>}
                        {social.twitter && <a href={social.twitter} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>X / Twitter</a>}
                      </div>
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
                  {school.brochure_url && (
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
                  )}
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
                  height: 'clamp(220px, 42vw, 400px)',
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))', gap: '10px' }}>
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

        {/* ACHIEVEMENTS TAB */}
        {activeTab === 'achievements' && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>
              Achievements
            </h3>

            {achievements.length === 0 && !studentOfWeek ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                The school has not published achievements yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: '16px' }}>
                {studentOfWeek && (
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                      <IconStarFilled size={14} />
                      Student of the Week
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                      {studentOfWeek.student_name}
                    </div>
                    {studentOfWeek.reason && (
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>{studentOfWeek.reason}</p>
                    )}
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                      Week of {new Date(studentOfWeek.week_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                )}

                {achievements.map(a => (
                  <div
                    key={a.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                      <IconTrophy size={14} />
                      {a.achievement_level || 'Achievement'}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                      {a.game_name || 'School achievement'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {a.student_name}{a.marks_score ? ` · ${a.marks_score}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {/* NEWSROOM TAB */}
        {activeTab === 'news' && (
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              Newsroom
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px' }}>
              Circulars, achievements and campus news published by the school.
            </p>

            {pressReleases.length === 0 ? (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '48px 20px',
                textAlign: 'center',
                color: '#64748b'
              }}>
                <IconNews size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  No press releases yet
                </div>
                <div style={{ fontSize: '13px' }}>
                  This school has not published any news to the newsroom.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pressReleases.map((release) => (
                  <article
                    key={release.id}
                    className="press-card"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: release.featured_image_url ? '180px minmax(0, 1fr)' : 'minmax(0, 1fr)',
                      gap: '16px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}
                  >
                    {release.featured_image_url && (
                      <img
                        src={release.featured_image_url}
                        alt={release.title}
                        style={{ width: '100%', height: '100%', minHeight: '130px', objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#047857',
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: '10px',
                          padding: '2px 8px'
                        }}>
                          {release.category || 'General'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {new Date(release.published_date || release.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                        {release.title}
                      </h4>

                      {release.summary && (
                        <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.65, marginBottom: '8px' }}>
                          {release.summary}
                        </p>
                      )}

                      {release.content_html && (
                        <details>
                          <summary style={{ fontSize: '12.5px', fontWeight: 700, color: '#064e3b', cursor: 'pointer' }}>
                            Read full release
                          </summary>
                          <div
                            style={{ marginTop: '8px', fontSize: '13.5px', color: '#334155', lineHeight: 1.7 }}
                            dangerouslySetInnerHTML={{ __html: release.content_html }}
                          />
                        </details>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

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

                  {review.school_reply && (
                    <div style={{
                      marginBottom: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#ecfdf5',
                      borderLeft: '3px solid #059669'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#047857', marginBottom: '3px' }}>
                        Reply from the school
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.55', margin: 0 }}>
                        {review.school_reply}
                      </p>
                    </div>
                  )}

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
                  <p>No parent reviews yet. Be the first parent to review {school.name}.</p>
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

      </div>

      {/* Modals */}
      <EnquiryModal school={school} isOpen={enquiryOpen} onClose={() => setEnquiryOpen(false)} />
      {school.brochure_url && (
        <BrochureModal school={school} isOpen={brochureOpen} onClose={() => setBrochureOpen(false)} />
      )}
      <ReviewModal school={school} isOpen={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
}

