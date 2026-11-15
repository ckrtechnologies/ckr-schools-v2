'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  IconCheck,
  IconArrowRight,
  IconPhoneCall,
  IconBrandWhatsapp,
  IconSparkles,
  IconShieldCheck,
  IconChevronDown,
  IconChevronUp,
  IconBuildingSkyscraper,
  IconDeviceLaptop,
  IconSchool,
  IconX
} from '@tabler/icons-react';
import ErpLeadModal from './modals/ErpLeadModal.jsx';
import { ERP_MODULES } from '../lib/erpModulesData.js';

export default function ErpModuleDetailClientView({ moduleData }) {
  const [isErpModalOpen, setIsErpModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const allModules = Object.values(ERP_MODULES);
  const otherModules = allModules.filter(m => m.slug !== moduleData.slug);

  return (
    <div className="erp-module-page" style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '80px', width: '100%' }}>
      
      {/* 1. Breadcrumbs */}
      <div style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 0', width: '100%' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', boxSizing: 'border-box' }}>
          <Link href="/" style={{ color: '#064e3b', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <Link href="/services-for-schools" style={{ color: '#064e3b', textDecoration: 'none', fontWeight: 600 }}>Services for Schools</Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>{moduleData.title}</span>
        </div>
      </div>

      {/* 2. Hero Section */}
      <section style={{
        background: 'radial-gradient(ellipse at top, #f0fdf4 0%, #ffffff 80%)',
        borderBottom: '1px solid #e2e8f0',
        padding: '56px 0 48px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', textAlign: 'center', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            backgroundColor: moduleData.badgeBg,
            color: moduleData.badgeColor,
            border: `1px solid ${moduleData.badgeColor}33`,
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: 800,
            letterSpacing: '0.6px',
            marginBottom: '16px'
          }}>
            <IconSparkles size={14} />
            <span>{moduleData.badge}</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(30px, 4.5vw, 48px)',
            fontWeight: 900,
            color: '#0f172a',
            lineHeight: 1.22,
            letterSpacing: '-0.8px',
            margin: '0 0 16px'
          }}>
            {moduleData.title}
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: '#475569',
            lineHeight: 1.65,
            maxWidth: '920px',
            margin: '0 auto 32px'
          }}>
            {moduleData.tagline}
          </p>

          {/* Key Stat Badges */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            maxWidth: '1200px',
            margin: '0 auto 36px'
          }}>
            {moduleData.stats.map((st, idx) => (
              <div key={idx} style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#064e3b', marginBottom: '3px' }}>
                  {st.value}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                  {st.label}
                </div>
              </div>
            ))}
          </div>

          {/* Primary CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsErpModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#064e3b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '13px 26px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(6, 78, 59, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Book 15-Min Live Campus Demo</span>
              <IconArrowRight size={16} />
            </button>

            <a
              href="tel:+919821776412"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                padding: '12px 22px',
                fontSize: '13.5px',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <IconPhoneCall size={16} color="#064e3b" />
              <span>Talk to Institutional Advisor</span>
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '20px', fontSize: '12.5px', color: '#64748b' }}>
            <span>✓ 100% Indian VPS Hosted</span>
            <span>✓ CBSE / ICSE Compliant</span>
            <span>✓ Zero Software Lock-in</span>
          </div>

        </div>
      </section>

      {/* 3. Interactive Workflow Diagram (Infographic) */}
      <section style={{ padding: '64px 0', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fcfdfd', width: '100%', boxSizing: 'border-box' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.8px' }}>
              INTERACTIVE ARCHITECTURE
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', margin: '6px 0 10px' }}>
              {moduleData.workflowTitle}
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '720px', margin: '0 auto' }}>
              Click any stage in the sequence below to inspect the step-by-step workflow engineered for Indian campuses.
            </p>
          </div>

          {/* Workflow Stepper Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '28px'
          }}>
            {moduleData.workflowSteps.map((ws, idx) => {
              const isSelected = activeStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  style={{
                    backgroundColor: isSelected ? '#ffffff' : '#f8fafc',
                    border: `2px solid ${isSelected ? '#064e3b' : '#e2e8f0'}`,
                    borderRadius: '14px',
                    padding: '24px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 10px 24px -4px rgba(6, 78, 59, 0.15)' : 'none',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 900,
                      color: isSelected ? '#064e3b' : '#94a3b8',
                      backgroundColor: isSelected ? '#dcfce7' : '#e2e8f0',
                      padding: '3px 10px',
                      borderRadius: '6px'
                    }}>
                      STAGE {ws.step}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#059669' }}>
                        Active Step ●
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: isSelected ? '#064e3b' : '#1e293b', margin: '0 0 8px' }}>
                    {ws.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                    {ws.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Active Step Deep-Dive Highlight Box */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #a7f3d0',
            borderRadius: '14px',
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 16px rgba(6, 78, 59, 0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#064e3b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '16px',
                flexShrink: 0
              }}>
                {moduleData.workflowSteps[activeStep]?.step}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#064e3b' }}>
                  {moduleData.workflowSteps[activeStep]?.title}
                </div>
                <div style={{ fontSize: '13.5px', color: '#334155', marginTop: '2px' }}>
                  {moduleData.workflowSteps[activeStep]?.desc}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsErpModalOpen(true)}
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 22px',
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              See This In Live Demo →
            </button>
          </div>

        </div>
      </section>

      {/* 4. Core Capabilities Grid */}
      <section style={{ padding: '64px 0', borderBottom: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.8px' }}>
              CORE CAPABILITIES
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', margin: '6px 0 10px' }}>
              Engineered for Modern Indian Campus Operations
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '720px', margin: '0 auto' }}>
              Eliminate manual paperwork, repetitive accounting mistakes, and communication gaps across departments.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px'
          }}>
            {moduleData.capabilities.map((cap, idx) => (
              <div key={idx} style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '24px',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconCheck size={20} stroke={2.5} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {cap.title}
                  </h3>
                </div>
                <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.65, margin: 0 }}>
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Head-to-Head Comparison: Legacy Software vs SchoolKarma */}
      <section style={{ padding: '64px 0', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.8px' }}>
              HEAD-TO-HEAD COMPARISON
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', margin: '6px 0 10px' }}>
              Why Indian Schools Replace Legacy Systems
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b' }}>
              Compare old desktop installations with our enterprise multi-tenant cloud platform.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
            gap: '28px'
          }}>
            
            {/* Legacy Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #fecaca',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconX size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#991b1b' }}>
                  {moduleData.comparison.legacyTitle}
                </h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {moduleData.comparison.legacyPoints.map((pt, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13.5px', color: '#64748b', lineHeight: 1.6 }}>
                    <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '16px', lineHeight: 1 }}>✕</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* SchoolKarma Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px solid #059669',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 8px 28px -4px rgba(5, 150, 105, 0.15)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '24px',
                backgroundColor: '#064e3b',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 12px',
                borderRadius: '20px',
                letterSpacing: '0.5px'
              }}>
                RECOMMENDED
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#dcfce7',
                  color: '#064e3b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconCheck size={20} stroke={2.5} />
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#064e3b' }}>
                  {moduleData.comparison.schoolkarmaTitle}
                </h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {moduleData.comparison.schoolkarmaPoints.map((pt, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13.5px', color: '#1e293b', fontWeight: 600, lineHeight: 1.6 }}>
                    <span style={{ color: '#059669', fontWeight: 900, fontSize: '16px', lineHeight: 1 }}>✓</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 6. FAQ Accordion Section */}
      <section style={{ padding: '64px 0', borderBottom: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.8px' }}>
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', margin: '6px 0 10px' }}>
              Answers for School Trustees &amp; Principals
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b' }}>
              Everything you need to know about implementation, board compliance, and pricing.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '16px' }}>
            {moduleData.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: isOpen ? '0 4px 14px rgba(0,0,0,0.04)' : 'none',
                    alignSelf: 'start'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '18px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 700, color: isOpen ? '#064e3b' : '#0f172a' }}>
                      {faq.q}
                    </span>
                    <span style={{ color: '#64748b', marginLeft: '12px', flexShrink: 0 }}>
                      {isOpen ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 22px 20px', fontSize: '14px', color: '#475569', lineHeight: 1.65, borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Other ERP Modules Explorer */}
      <section style={{ padding: '60px 0', backgroundColor: '#fcfdfd', borderBottom: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Explore Other SchoolKarma ERP Modules
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                Integrated enterprise suites built for Indian schools.
              </p>
            </div>
            <Link
              href="/services-for-schools"
              style={{ fontSize: '14px', fontWeight: 700, color: '#064e3b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>View All 12 Modules</span>
              <IconArrowRight size={16} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '18px'
          }}>
            {otherModules.map((om, idx) => (
              <Link
                key={idx}
                href={`/services-for-schools/${om.slug}`}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: om.badgeColor,
                    backgroundColor: om.badgeBg,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    display: 'inline-block',
                    marginBottom: '10px'
                  }}>
                    {om.badge}
                  </span>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.35 }}>
                    {om.title}
                  </h4>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
                  <span>View Details</span>
                  <IconArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Bottom CTA Banner */}
      <section style={{
        padding: '60px 0',
        background: 'linear-gradient(135deg, #064e3b 0%, #043e2f 100%)',
        color: '#ffffff',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.5px', color: '#ffffff' }}>
            Transform Your Campus with Next-Gen ERP
          </h2>
          <p style={{ fontSize: '15.5px', color: '#e2e8f0', lineHeight: 1.65, margin: '0 auto 28px', maxWidth: '720px' }}>
            Join accredited campuses running on SchoolKarma. Request a tailored walkthrough with custom module selection and pricing.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsErpModalOpen(true)}
              style={{
                backgroundColor: '#ffffff',
                color: '#064e3b',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 30px',
                fontSize: '14.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}
            >
              Request Custom Campus Quote
            </button>
            <a
              href="https://wa.me/919821776412?text=Hello%20SchoolKarma%20team,%20we%20want%20to%20know%20more%20about%20your%20ERP%20modules."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '13px 24px',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <IconBrandWhatsapp size={18} />
              <span>WhatsApp Advisor</span>
            </a>
          </div>
        </div>
      </section>
      {/* Modal */}
      {isErpModalOpen && (
        <ErpLeadModal
          isOpen={isErpModalOpen}
          onClose={() => setIsErpModalOpen(false)}
          initialService={moduleData.title}
        />
      )}

    </div>
  );
}

