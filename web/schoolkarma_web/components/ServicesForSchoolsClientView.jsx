'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  IconCheck,
  IconSparkles,
  IconArrowRight,
  IconPhoneCall,
  IconBrandWhatsapp,
  IconHeadset,
  IconUsers,
  IconReceipt2,
  IconDeviceMobile,
  IconUserCheck,
  IconCalendarEvent,
  IconReportAnalytics,
  IconFileCertificate,
  IconClipboardCheck,
  IconBooks,
  IconBellRinging2,
  IconBriefcase,
  IconTrophy,
  IconShieldCheck
} from '@tabler/icons-react';
import SolarSystemHero from './SolarSystemHero.jsx';
import ErpLeadModal from './modals/ErpLeadModal.jsx';

export default function ServicesForSchoolsClientView() {
  const [isErpModalOpen, setIsErpModalOpen] = useState(false);

  const servicesList = [
    {
      title: 'Admissions CRM & Lead Desk',
      slug: 'admissions-crm',
      desc: 'Centralize direct parent leads, digital brochure downloads, campus walk-in registrations, and automated WhatsApp follow-ups with zero agency commissions.',
      badgeText: 'CRM',
      badgeBg: '#047857',
      icon: <IconUsers size={22} color="#ffffff" />,
      features: ['Multi-channel lead pipeline', '1-Click instant enquiry alerts', 'Parent prospectus download gate', 'Source conversion analytics']
    },
    {
      title: 'Finance & Student Fee Ledger Desk',
      slug: 'fee-management',
      desc: 'Dedicated manual fee collection and receipt counter. Record cash, cheque, bank transfer and DD entries with custom heads and pending fee ledgers.',
      badgeText: 'FINANCE',
      badgeBg: '#0369a1',
      icon: <IconReceipt2 size={22} color="#ffffff" />,
      features: ['Per-student fee ledger in integer paise', 'Cash, Cheque, NEFT & DD record entry', 'Instant printable PDF receipts & vouchers', 'Outstanding dues & defaulters list']
    },
    {
      title: 'Teacher Mobile App (Android/iOS)',
      slug: 'teacher-parent-apps',
      desc: 'Native teacher app for attendance marking, digital diary, assignment uploads, timetable viewing and seamless communication with parents.',
      badgeText: 'MOBILE',
      badgeBg: '#4338ca',
      icon: <IconDeviceMobile size={22} color="#ffffff" />,
      features: ['White-label campus icon & name', '1-Tap period attendance', 'Broadcast notice board', 'Daily homework & attachments']
    },
    {
      title: 'Student & Parent Mobile App',
      slug: 'teacher-parent-apps',
      desc: 'White-labeled parent app with direct notices, daily attendance, verified report cards, exam datesheets and student diary.',
      badgeText: 'PORTAL',
      badgeBg: '#7c3aed',
      icon: <IconUserCheck size={22} color="#ffffff" />,
      features: ['Live push notifications via Firebase', 'Exam schedule & results', 'Fee dues breakdown & receipts', 'Leave application workflow']
    },
    {
      title: 'Timetable & Classroom Scheduler',
      slug: 'timetable-scheduler',
      desc: 'Automate weekly class schedules, conflict-free faculty allocations, room assignments, and substitute teacher rotations in seconds.',
      badgeText: 'ACADEMICS',
      badgeBg: '#059669',
      icon: <IconCalendarEvent size={22} color="#ffffff" />,
      features: ['Conflict-free teacher scheduling', 'Class & room load balancing', 'Instant substitute suggestions', 'Exportable master class grid']
    },
    {
      title: 'CBSE & ICSE Report Card Generator',
      slug: 'cbse-report-card',
      desc: 'Automate term assessments, scholastic/co-scholastic grading, marks aggregation, and batch-print official board-compliant report cards.',
      badgeText: 'EXAMS',
      badgeBg: '#b45309',
      icon: <IconReportAnalytics size={22} color="#ffffff" />,
      features: ['Custom CBSE 9-point scale', 'Co-scholastic skill grading', 'Single-click PDF report batch generation', 'Direct parent portal publishing']
    },
    {
      title: 'Transfer Certificate (TC) Portal',
      desc: 'Digitally generate, verify, and track transfer certificates with unique verifiable QR codes, eliminating manual forgery.',
      badgeText: 'LEGAL',
      badgeBg: '#be123c',
      icon: <IconFileCertificate size={22} color="#ffffff" />,
      features: ['One-click clearance checks (Fees/Library)', 'Verifiable digital QR authentication', 'Archived student TC registers', 'Instant issuance & reprint']
    },
    {
      title: 'Biometric & RFID Smart Attendance',
      slug: 'smart-attendance',
      desc: 'Hardware-integrated attendance for students and staff with real-time automated SMS/WhatsApp alerts to parents upon campus entry.',
      badgeText: 'HARDWARE',
      badgeBg: '#475569',
      icon: <IconClipboardCheck size={22} color="#ffffff" />,
      features: ['Turnstile / biometric gate sync', 'Instant automated parent SMS/app push', 'Staff shift tracking & leave ledger', 'Monthly attendance percentages']
    },
    {
      title: 'Digital Library & Book Cataloging',
      desc: 'Barcode-enabled library management for book cataloging, issue-return workflows, overdue fine calculations, and digital accession registers.',
      badgeText: 'LIBRARY',
      badgeBg: '#0f766e',
      icon: <IconBooks size={22} color="#ffffff" />,
      features: ['Barcode scanning for fast circulation', 'Automatic fine calculating system', 'Subject & author search portal', 'Digital inventory reconciliation']
    },
    {
      title: 'Multi-Channel Push Notifications',
      desc: 'Broadcast emergency weather closures, exam schedules, and holiday announcements instantly across mobile push, SMS, and WhatsApp.',
      badgeText: 'BROADCAST',
      badgeBg: '#c2410c',
      icon: <IconBellRinging2 size={22} color="#ffffff" />,
      features: ['Targeted class/section broadcasts', 'Emergency audio push alerts', 'DLT-registered template SMS engine', 'Read-receipt delivery analytics']
    },
    {
      title: 'Staff HR & Payroll Processing',
      desc: 'Complete faculty lifecycle management with biometric attendance sync, leaves, deductions, allowance structures, and payslip generation.',
      badgeText: 'HR & PAYROLL',
      badgeBg: '#374151',
      icon: <IconBriefcase size={22} color="#ffffff" />,
      features: ['Attendance-linked salary calculations', 'Custom allowance & deduction heads', 'Instant employee PDF payslips', 'Tax & PF compliance ledgers']
    },
    {
      title: 'Sports & Co-Curricular Tracking',
      desc: 'Record student participation in inter-school tournaments, sports meets, cultural fests, and house points for holistic development profiles.',
      badgeText: 'SPORTS',
      badgeBg: '#1e3a8a',
      icon: <IconTrophy size={22} color="#ffffff" />,
      features: ['House points & leaderboard tracking', 'Inter-school tournament rosters', 'Achievement certificate records', 'Holistic student transcript sync']
    }
  ];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%', paddingBottom: '80px', boxSizing: 'border-box' }}>
      <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', boxSizing: 'border-box' }}>
        {/* Hero Section */}
        <div style={{
          padding: '48px 0 36px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#064e3b',
            fontSize: '11px',
            fontWeight: '800',
            padding: '4px 12px',
            borderRadius: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            marginBottom: '16px'
          }}>
            <IconSparkles size={14} color="#059669" />
            ENTERPRISE INSTITUTIONAL SUITE &bull; 100% INDIAN VPS HOSTED
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: '900',
            color: '#0f172a',
            lineHeight: '1.2',
            letterSpacing: '-0.8px',
            margin: '0 auto 16px',
            maxWidth: '920px'
          }}>
            Transform Your Campus with Next-Gen ERP &amp; White-Label Mobile Apps
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#64748b',
            lineHeight: '1.6',
            maxWidth: '720px',
            margin: '0 auto 28px'
          }}>
            Everything school trustees, principals, and administrative heads need to run admissions, fee collections, academic timetables, and teacher-parent communication smoothly.
          </p>

          {/* Quick Contact & Demo CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsErpModalOpen(true)}
              style={{
                backgroundColor: '#064e3b',
                color: '#ffffff',
                border: 'none',
                padding: '13px 28px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(6, 78, 59, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Request Campus Demo &amp; Custom Quote</span>
              <IconArrowRight size={17} />
            </button>

            <a
              href="tel:+919821776412"
              style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                padding: '13px 22px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <IconPhoneCall size={17} color="#059669" />
              <span>Call +91 98217 76412</span>
            </a>
          </div>
        </div>

        {/* Solar System Visual Graphic */}
        <div style={{ width: '100%', margin: '0 auto 56px' }}>
          <SolarSystemHero onOpenErpModal={() => setIsErpModalOpen(true)} />
        </div>

        {/* 12 Core ERP Modules Grid */}
        <div style={{ width: '100%', margin: '0 auto 64px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              COMPLETE CAMPUS ECOSYSTEM
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: '4px 0 8px' }}>
              12 Enterprise Modules Designed for Indian Schools
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '640px', margin: '0 auto' }}>
              Built specifically to conform with CBSE, ICSE, and State Board guidelines, supporting offline payment counters and dual-language interfaces.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px'
          }}>
            {servicesList.map((service, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '26px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: service.badgeBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                  }}>
                    {service.icon}
                  </div>
                  <span style={{
                    backgroundColor: service.badgeBg,
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    letterSpacing: '0.5px'
                  }}>
                    {service.badgeText}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  {service.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: '0 0 16px', flex: 1 }}>
                  {service.desc}
                </p>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {service.features.map((feat, fIdx) => (
                      <li key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155' }}>
                        <IconCheck size={14} color="#059669" style={{ flexShrink: 0 }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px dashed #e2e8f0',
                    marginTop: 'auto'
                  }}>
                    {service.slug ? (
                      <Link
                        href={`/services-for-schools/${service.slug}`}
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#064e3b',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>Module Spec</span>
                        <IconArrowRight size={13} />
                      </Link>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Standard Module</span>
                    )}

                    <button
                      onClick={() => setIsErpModalOpen(true)}
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#ffffff',
                        backgroundColor: '#064e3b',
                        border: 'none',
                        borderRadius: '7px',
                        padding: '6px 14px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(6, 78, 59, 0.28)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#047857';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(6, 78, 59, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#064e3b';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(6, 78, 59, 0.28)';
                      }}
                    >
                      <span>Request Demo</span>
                      <IconArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Callout Banner */}
        <div style={{
          width: '100%',
          margin: '0 auto 64px',
          backgroundColor: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          padding: 'clamp(32px, 4vw, 48px)',
          boxShadow: '0 12px 32px -8px rgba(15, 23, 42, 0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{ maxWidth: '640px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#ecfdf5',
              color: '#064e3b',
              padding: '4px 12px',
              borderRadius: '20px',
              border: '1px solid #a7f3d0',
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '10px'
            }}>
              READY TO DIGITIZE YOUR CAMPUS?
            </span>
            <h3 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '8px 0 10px', letterSpacing: '-0.3px' }}>
              Speak Directly with Institutional Sales
            </h3>
            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
              Call <strong style={{ color: '#0f172a' }}>+91 98217 76412</strong> or request a live interactive campus walkthrough. Deployment is live within 48 hours with full data migration from legacy registers.
            </p>
          </div>

          <button
            onClick={() => setIsErpModalOpen(true)}
            style={{
              backgroundColor: '#064e3b',
              color: '#ffffff',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '8px',
              fontSize: '14.5px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(6, 78, 59, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Request Campus ERP Demo</span>
            <IconArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* ERP Lead Modal */}
      {isErpModalOpen && (
        <ErpLeadModal
          isOpen={isErpModalOpen}
          onClose={() => setIsErpModalOpen(false)}
        />
      )}
    </div>
  );
}

