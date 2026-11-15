import React from 'react';
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
  IconTrophy
} from '@tabler/icons-react';
import SolarSystemHero from '../components/SolarSystemHero.jsx';

export default function ServicesForSchoolsView({ onOpenErpModal, onNavigateHome, onOpenCatalog }) {
  // 12 Comprehensive Enterprise School ERP Modules with Distinct Graphic Icons & Badges
  const servicesList = [
    {
      title: 'Admissions CRM & Lead Desk',
      desc: 'Centralize direct parent leads, digital brochure downloads, campus walk-in registrations, and automated WhatsApp follow-ups with zero agency commissions.',
      badgeText: 'CRM',
      badgeBg: '#047857',
      icon: <IconUsers size={22} color="#ffffff" />,
      features: ['Multi-channel lead pipeline', '1-Click instant enquiry alerts', 'Parent prospectus download gate', 'Source conversion analytics']
    },
    {
      title: 'Finance & Student Fee Ledger Desk',
      desc: 'Dedicated manual fee collection and receipt counter. Record cash, cheque, bank transfer and DD entries with custom heads and pending fee ledgers.',
      badgeText: 'FINANCE',
      badgeBg: '#0369a1',
      icon: <IconReceipt2 size={22} color="#ffffff" />,
      features: ['Per-student fee ledger in integer paise', 'Cash, Cheque, NEFT & DD record entry', 'Instant printable PDF receipts & vouchers', 'Outstanding dues & defaulters list']
    },
    {
      title: 'Teacher Mobile App (Android/iOS)',
      desc: 'Native teacher app for attendance marking, digital diary, assignment uploads, timetable viewing and seamless communication with parents.',
      badgeText: 'MOBILE',
      badgeBg: '#4338ca',
      icon: <IconDeviceMobile size={22} color="#ffffff" />,
      features: ['White-label campus icon & name', '1-Tap period attendance', 'Broadcast notice board', 'Daily homework & attachments']
    },
    {
      title: 'Student & Parent Mobile App',
      desc: 'White-labeled parent app with direct notices, daily attendance, verified report cards, exam datesheets and student diary.',
      badgeText: 'PORTAL',
      badgeBg: '#7c3aed',
      icon: <IconUserCheck size={22} color="#ffffff" />,
      features: ['Live push notifications via Firebase', 'Exam schedule & results', 'Fee dues breakdown & receipts', 'Leave application workflow']
    },
    {
      title: 'Timetable & Classroom Scheduler',
      desc: 'Automated conflict-free teacher allocation matrix. Manage substitute teacher rosters, period slots, lab hours and smart classrooms in real-time.',
      badgeText: 'SCHEDULE',
      badgeBg: '#b45309',
      icon: <IconCalendarEvent size={22} color="#ffffff" />,
      features: ['Instant substitute assignment', 'Workload balancing matrix', 'Lab & sports ground booking', 'Printable PDF datesheets']
    },
    {
      title: 'CBSE / ICSE Report Card Engine',
      desc: 'Compliant marks calculation, term-wise weightage formulas, custom teacher remarks and 1-click printable board-standard report cards.',
      badgeText: 'EXAMS',
      badgeBg: '#be123c',
      icon: <IconReportAnalytics size={22} color="#ffffff" />,
      features: ['CBSE 2026 guidelines compliant', 'Scholastic & co-scholastic grading', 'Bulk student progress cards', 'Multi-term comparative charts']
    },
    {
      title: 'Transfer Certificate (TC) Portal',
      desc: 'Official CBSE & State Board compliant Transfer Certificate issuance with verifiable QR code, student dues clearance and digital archive.',
      badgeText: 'TC DESK',
      badgeBg: '#0f766e',
      icon: <IconFileCertificate size={22} color="#ffffff" />,
      features: ['Board-standard format printing', 'QR code verification portal', 'Multi-department dues clearance', 'Serial number audit ledger']
    },
    {
      title: 'Class Daily Attendance & Subject Registers',
      desc: 'Real-time teacher attendance register per period and section. Track present, absent, half-day and medical leaves with auto-calculated student percentages.',
      badgeText: 'ATTENDANCE',
      badgeBg: '#1d4ed8',
      icon: <IconClipboardCheck size={22} color="#ffffff" />,
      features: ['Period & morning roll-call modes', 'Monthly percentage calculations', 'Absence logs & pattern tracking', 'Exportable attendance sheets']
    },
    {
      title: 'Academic & Curriculum Manager',
      desc: 'Manage syllabus pacing, term calendars, class chapters, learning objectives, and teacher lesson plan approvals in one central portal.',
      badgeText: 'ACADEMICS',
      badgeBg: '#c2410c',
      icon: <IconBooks size={22} color="#ffffff" />,
      features: ['Chapter completion pacing tracker', 'Teacher lesson plan approval workflow', 'Annual academic calendar planner', 'Subject syllabus repository']
    },
    {
      title: 'Digital Circulars, Consents & Broadcasts',
      desc: 'Official digital circulars, event announcements, parent permission consents with digital sign-offs, and broadcast message feeds.',
      badgeText: 'NOTICES',
      badgeBg: '#475569',
      icon: <IconBellRinging2 size={22} color="#ffffff" />,
      features: ['Targeted class or whole-school circulars', 'Digital parent consent tracking', 'PDF document attachments', 'Broadcast notice archive']
    },
    {
      title: 'Staff HR, Leave Management & Roles',
      desc: 'Teacher and non-teaching staff records, leave applications and approvals, subject teacher allocations, and role-based permissions.',
      badgeText: 'STAFF HR',
      badgeBg: '#059669',
      icon: <IconBriefcase size={22} color="#ffffff" />,
      features: ['Staff service & subject assignment logs', 'Casual and medical leave approvals', 'Multi-level RBAC role configuration', 'Department wise directory']
    },
    {
      title: 'Student Hall of Fame & Campus Showcase',
      desc: 'Highlight campus excellence with Student of the Week awards, Spotlight of the Day, Thought of the Day, and official school media gallery.',
      badgeText: 'SPOTLIGHT',
      badgeBg: '#d97706',
      icon: <IconTrophy size={22} color="#ffffff" />,
      features: ['Student of the Week honors', 'Spotlight campus achievements', 'Thought of the day broadcasts', 'Official high-res photo gallery']
    }
  ];

  return (
    <div style={{ padding: '0 clamp(16px, 2.5vw, 40px)', width: '100%', boxSizing: 'border-box' }}>
      {/* Hero Banner with Right Feature Cards Grid */}
      <div style={{
        backgroundColor: '#064e3b',
        borderRadius: '20px',
        padding: 'clamp(32px, 3.5vw, 54px) clamp(24px, 3vw, 44px)',
        color: '#ffffff',
        marginTop: '24px',
        marginBottom: '40px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 30px -10px rgba(6, 78, 59, 0.3)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 'clamp(24px, 3vw, 48px)',
        alignItems: 'center'
      }} className="mk-services-hero-grid">
        {/* Left Column: Heading & Value Proposition */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '800',
            color: '#a7f3d0',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            marginBottom: '16px'
          }}>
            <IconSparkles size={16} />
            Enterprise Institutional Suite
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 3.2vw, 42px)', fontWeight: '900', lineHeight: '1.18', margin: '0 0 16px' }}>
            Empower Your School Operations with SchoolKarma ERP
          </h1>
          <p style={{ fontSize: '15px', color: '#a7f3d0', lineHeight: '1.6', margin: '0 0 28px' }}>
            From pre-admission lead generation to annual board report cards, SchoolKarma delivers an integrated, white-labeled digital campus ecosystem engineered specifically for modern Indian schools.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
            <button
              onClick={onOpenErpModal}
              style={{
                backgroundColor: '#064e3b',
                color: '#ffffff',
                border: '2px solid #34d399',
                padding: '13px 26px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}
            >
              <span>Schedule Institutional Demo</span>
              <IconArrowRight size={18} />
            </button>
            <button
              onClick={onOpenCatalog || onNavigateHome}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '13px 24px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Explore School Directory
            </button>
          </div>
        </div>

        {/* Right Column: Solar System Planetary Orbit Animation */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '440px'
        }}>
          <SolarSystemHero />
        </div>
      </div>

      {/* Institutional Live Helpline Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid #064e3b',
        borderRadius: '14px',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '54px',
        boxShadow: '0 4px 16px rgba(6, 78, 59, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            backgroundColor: '#064e3b',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconHeadset size={26} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              DIRECT INSTITUTIONAL DESK &bull; MR. KRISHNA
            </div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: '2px 0 0' }}>
              Instant School Onboarding &amp; ERP Support Helpline
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <a
            href="tel:+919821776412"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              backgroundColor: '#064e3b',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '800',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(6, 78, 59, 0.25)'
            }}
          >
            <IconPhoneCall size={17} />
            <span>+91 98217 76412</span>
          </a>

          <a
            href="https://wa.me/919821776412?text=Hi%20Krishna,%20we%20want%20to%20onboard%20our%20school%20and%20explore%20SchoolKarma%20ERP."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              backgroundColor: '#064e3b',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '800',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(6, 78, 59, 0.25)'
            }}
          >
            <IconBrandWhatsapp size={17} />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* 12 Comprehensive Modular Solutions with Graphics Badges & Icons */}
      <div style={{ marginBottom: '64px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            FULL PLETHORA OF INSTITUTION SERVICES
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: '6px 0 10px' }}>
            Comprehensive School Management Solutions
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '680px', margin: '0 auto' }}>
            Deploy individual modules or the complete unified institutional platform tailored to your campus requirements.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '24px'
        }}>
          {servicesList.map((service, i) => (
            <div key={i} style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '26px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header with Solid Graphic Icon & Category Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: service.badgeBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 3px 8px ${service.badgeBg}33`,
                    flexShrink: 0
                  }}>
                    {service.icon}
                  </div>
                  <span style={{
                    backgroundColor: service.badgeBg,
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '900',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    letterSpacing: '0.6px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}>
                    {service.badgeText}
                  </span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>
                  Module #{i + 1}
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px' }}>
                {service.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: '0 0 20px', flex: 1 }}>
                {service.desc}
              </p>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {service.features.map((feat, fIdx) => (
                    <li key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155' }}>
                      <IconCheck size={15} color="#059669" style={{ flexShrink: 0 }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Institutional Callout Banner */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        padding: '48px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '30px',
        marginBottom: '64px'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
            READY TO DIGITIZE YOUR CAMPUS?
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 12px' }}>
            Speak Directly with Krishna &bull; Institutional Sales
          </h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
            Call <strong>+91 98217 76412</strong> or request an institutional demo to receive personalized deployment roadmaps and custom quote proposals.
          </p>
        </div>

        <button
          onClick={onOpenErpModal}
          style={{
            backgroundColor: '#064e3b',
            color: '#ffffff',
            border: '2px solid #34d399',
            padding: '14px 32px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(6, 78, 59, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Request Campus ERP Demo</span>
          <IconArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
