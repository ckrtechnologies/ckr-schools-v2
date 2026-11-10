import React from 'react';
import {
  IconShieldCheck,
  IconStarFilled,
  IconMapPin,
  IconCurrencyRupee,
  IconCheck,
  IconArrowRight,
  IconSchool
} from '@tabler/icons-react';
import { useGetSchoolsQuery } from '../store/marketplaceApi';

export default function HeroSection({ onExploreClick, onSelectSchool }) {
  const { data: schoolsData } = useGetSchoolsQuery({});
  const schools = schoolsData?.data || [];
  // Pick first two featured schools (backend already sorts is_featured DESC)
  const previewCards = schools.slice(0, 2);

  return (
    <section style={{
      background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
      padding: '48px 20px 40px',
      borderBottom: '1px solid #e2e8f0',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '40px',
        alignItems: 'center'
      }}>
        {/* Left Column: Headlines & Value Prop */}
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #bbf7d0',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#166534',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
          }}>
            <span className="pulse-indicator" />
            Admissions Open For Academic Year 2026-27
          </div>

          <h1 style={{
            fontSize: '44px',
            fontWeight: '800',
            lineHeight: '1.15',
            color: '#0f172a',
            letterSpacing: '-1px',
            marginBottom: '18px'
          }}>
            Find, Compare & Enrol in India's Top{' '}
            <span style={{ color: '#047857', position: 'relative', display: 'inline-block' }}>
              Verified Schools
            </span>
          </h1>

          <p style={{
            fontSize: '17px',
            color: '#475569',
            lineHeight: '1.6',
            marginBottom: '28px',
            maxWidth: '560px'
          }}>
            Unbiased 5-axis parent ratings, transparent annual fee schedules, official campus photo galleries, and 1-click admission inquiries directly through CKR's verified portal.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={onExploreClick}
              style={{
                backgroundColor: '#064e3b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(6, 78, 59, 0.25)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Explore Verified Schools
              <IconArrowRight size={18} />
            </button>

            {schools.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
                <div style={{ display: 'flex', color: '#f59e0b' }}>
                  {[1, 2, 3, 4, 5].map(i => <IconStarFilled key={i} size={15} />)}
                </div>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>
                  {schools.length}+ Schools
                </span>
                <span>listed & verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Floating Interactive School Preview Cards */}
        <div style={{ position: 'relative', height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {previewCards.length === 0 ? (
            /* Loading / empty state — no fake cards */
            <div style={{
              width: '320px',
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              padding: '40px 24px',
              textAlign: 'center',
              border: '1px dashed #cbd5e1',
              color: '#94a3b8'
            }}>
              <IconSchool size={36} style={{ marginBottom: '12px', color: '#cbd5e1' }} />
              <div style={{ fontSize: '14px', fontWeight: '600' }}>Schools Loading…</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Fetching verified campuses</div>
            </div>
          ) : (
            <>
              {/* Card 1: Featured school (Foreground Float) */}
              {previewCards[0] && (
                <div
                  onClick={() => onSelectSchool(previewCards[0].slug)}
                  className="animate-float"
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '10px',
                    width: '320px',
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    zIndex: 2,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  <div style={{
                    height: '140px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: '12px',
                    backgroundColor: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {previewCards[0].hero_image_url ? (
                      <img
                        src={previewCards[0].hero_image_url}
                        alt={previewCards[0].name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : previewCards[0].logo_url ? (
                      <img
                        src={previewCards[0].logo_url}
                        alt={previewCards[0].name}
                        style={{ maxHeight: '90px', objectFit: 'contain' }}
                      />
                    ) : (
                      <IconSchool size={48} style={{ color: '#a7f3d0' }} />
                    )}
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}>
                      {previewCards[0].board || 'CBSE'}{previewCards[0].city ? ` · ${previewCards[0].city}` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                      {previewCards[0].name}
                    </div>
                    {previewCards[0].avg_rating > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', color: '#b45309' }}>
                        <IconStarFilled size={12} />
                        {parseFloat(previewCards[0].avg_rating).toFixed(1)}
                      </div>
                    )}
                  </div>

                  {previewCards[0].city && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      <IconMapPin size={12} />
                      {previewCards[0].city}{previewCards[0].state ? `, ${previewCards[0].state}` : ''}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '6px' }}>
                    {previewCards[0].fee_range_min > 0 ? (
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#047857' }}>
                        ₹{Math.round(previewCards[0].fee_range_min / 1000)}K
                        {previewCards[0].fee_range_max > 0 ? ` – ₹${Math.round(previewCards[0].fee_range_max / 1000)}K / yr` : ' / yr'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Fees on enquiry</span>
                    )}
                    <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>View Profile →</span>
                  </div>
                </div>
              )}

              {/* Card 2: Second featured school (Background offset) */}
              {previewCards[1] && (
                <div
                  onClick={() => onSelectSchool(previewCards[1].slug)}
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '10px',
                    width: '280px',
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.12)',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    zIndex: 1
                  }}
                >
                  <div style={{
                    height: '120px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: '10px',
                    backgroundColor: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {previewCards[1].hero_image_url ? (
                      <img
                        src={previewCards[1].hero_image_url}
                        alt={previewCards[1].name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : previewCards[1].logo_url ? (
                      <img
                        src={previewCards[1].logo_url}
                        alt={previewCards[1].name}
                        style={{ maxHeight: '80px', objectFit: 'contain' }}
                      />
                    ) : (
                      <IconSchool size={40} style={{ color: '#bfdbfe' }} />
                    )}
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}>
                      {previewCards[1].board || 'CBSE'}{previewCards[1].city ? ` · ${previewCards[1].city}` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
                      {previewCards[1].name}
                    </div>
                    {previewCards[1].avg_rating > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', color: '#b45309' }}>
                        <IconStarFilled size={12} />
                        {parseFloat(previewCards[1].avg_rating).toFixed(1)}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '6px' }}>
                    {previewCards[1].fee_range_min > 0 ? (
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#047857' }}>
                        ₹{Math.round(previewCards[1].fee_range_min / 1000)}K
                        {previewCards[1].fee_range_max > 0 ? ` – ₹${Math.round(previewCards[1].fee_range_max / 1000)}K / yr` : ' / yr'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Fees on enquiry</span>
                    )}
                    <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>View Profile →</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Trust Stats Ribbon */}
      <div style={{
        maxWidth: '1280px',
        margin: '40px auto 0',
        paddingTop: '24px',
        borderTop: '1px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#064e3b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>100% Verified</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Accredited CBSE Campuses</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCurrencyRupee size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>₹0 Parent Fee</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Zero Brokerage or Markup</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconStarFilled size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>5-Axis Reviews</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Verified Parent UGC Only</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconSchool size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>1-Click Multi-Enquiry</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Apply to Multiple Schools</div>
          </div>
        </div>
      </div>
    </section>
  );
}
