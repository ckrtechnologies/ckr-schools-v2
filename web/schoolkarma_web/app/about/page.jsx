import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  IconSchool, 
  IconShieldCheck, 
  IconSparkles, 
  IconBuildingSkyscraper, 
  IconBuildingBank,
  IconCertificate, 
  IconUsers, 
  IconHeartHandshake, 
  IconArrowRight,
  IconMapPin,
  IconTarget,
  IconEye,
  IconBrandLinkedin,
  IconCheck
} from '@tabler/icons-react';

export const metadata = {
  title: 'About Us — SchoolKarma India',
  description: 'Learn about SchoolKarma, our founders Chandan Mallik and Krishna Dhall, our mission, vision, and our commitment to transparent Indian school discovery and institutional ERP.',
  alternates: {
    canonical: 'https://schoolkarma.com/about'
  }
};

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '80px', width: '100%' }}>
      
      {/* 1. Breadcrumb */}
      <div style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 0', width: '100%' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', boxSizing: 'border-box' }}>
          <Link href="/" style={{ color: '#064e3b', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>About</span>
        </div>
      </div>

      {/* 2. Hero Section (100% Full Width) */}
      <section style={{
        background: 'radial-gradient(ellipse at top, #ecfdf5 0%, #ffffff 80%)',
        borderBottom: '1px solid #e2e8f0',
        padding: '56px 0 48px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', textAlign: 'center', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          
          {/* MSME Authority Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            color: '#064e3b',
            border: '1.5px solid #a7f3d0',
            padding: '6px 16px',
            borderRadius: '24px',
            fontSize: '12px',
            fontWeight: 800,
            boxShadow: '0 2px 6px rgba(6, 78, 59, 0.08)',
            marginBottom: '18px'
          }}>
            <IconBuildingBank size={16} color="#064e3b" />
            <span>GOVT. OF INDIA MSME REGISTERED ORGANIZATION</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 4.5vw, 48px)',
            fontWeight: 900,
            color: '#0f172a',
            lineHeight: 1.2,
            letterSpacing: '-0.8px',
            margin: '0 0 16px'
          }}>
            Transforming Indian Education with Transparency &amp; Next-Gen Tech
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: '#475569',
            lineHeight: 1.65,
            maxWidth: '900px',
            margin: '0 auto 36px'
          }}>
            SchoolKarma was founded with a singular conviction: school admissions in India should be transparent, honest, and completely free of brokerage, while schools deserve modern, sovereign software built specifically for Indian boards.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#064e3b' }}>3,600+</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>Verified Campuses</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Across major Indian cities</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#064e3b' }}>₹0 Fee</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>Zero Parent Brokerage</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>100% direct school admission desks</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#064e3b' }}>100%</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>Indian Sovereign VPS</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>DPDP 2023 certified data residency</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#064e3b' }}>MSME</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>Govt. of India Certified</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Udyam registration verified</div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Mission & Vision Statements (100% Full Width) */}
      <section style={{ padding: '64px 0', borderBottom: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.8px' }}>
              OUR NORTH STAR
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: '6px 0 10px' }}>
              Mission &amp; Vision
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '680px', margin: '0 auto' }}>
              Guiding every feature we design for parents, teachers, and school trustees across India.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '32px'
          }}>
            
            {/* Mission Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px solid #a7f3d0',
              borderRadius: '16px',
              padding: '36px',
              boxShadow: '0 8px 24px rgba(6, 78, 59, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: '#ecfdf5',
                color: '#064e3b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconTarget size={28} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  CORE PURPOSE
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '4px 0 12px' }}>
                  Our Mission
                </h3>
                <p style={{ fontSize: '15.5px', color: '#334155', lineHeight: 1.75, margin: 0 }}>
                  To revolutionize Indian school admissions and campus administration by eliminating brokerages, establishing absolute fee transparency down to integer paise for parents, and empowering school educators with sovereign, high-velocity Indian cloud software built natively for CBSE, ICSE, and State Boards.
                </p>
              </div>
            </div>

            {/* Vision Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px solid #cbd5e1',
              borderRadius: '16px',
              padding: '36px',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: '#f1f5f9',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconEye size={28} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  LONG-TERM HORIZON
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '4px 0 12px' }}>
                  Our Vision
                </h3>
                <p style={{ fontSize: '15.5px', color: '#334155', lineHeight: 1.75, margin: 0 }}>
                  To become India’s most trusted educational technology infrastructure — where every parent discovers and enrolls in verified accredited schools without deceit or markups, and every partner school operates with automated, paperless, enterprise-grade digital sovereignty.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Leadership & Co-Founders (100% Full Width) */}
      <section style={{ padding: '64px 0', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.8px' }}>
              LEADERSHIP &amp; ENGINEERING EXCELLENCE
            </span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: '6px 0 10px' }}>
              Meet the Founders
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '720px', margin: '0 auto' }}>
              Founded by seasoned technology architects and business leaders from CKR Technologies dedicated to Indian digital sovereignty.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: '32px'
          }}>

            {/* Founder 1: Krishna Dhall */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '24px'
            }}>
              <div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: '#ecfdf5',
                    border: '2px solid #a7f3d0',
                    flexShrink: 0
                  }}>
                    <img 
                      src="/team/Krishna.png" 
                      alt="Krishna Dhall"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                      Krishna Dhall
                    </h3>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#059669', margin: '2px 0 6px' }}>
                      Co-Founder &amp; CEO
                    </div>
                    <span style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '12px'
                    }}>
                      13+ Years Experience · Growth &amp; Strategy
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.7, margin: 0 }}>
                  A technology and business leader with 13+ years across tech delivery, sales growth, and market expansion. Krishna drives CKR's and SchoolKarma's vision and scaling — known for building high-trust teams and lasting relationships with school trustees and academic institutions nationwide. Also Founder of KiloWatt Crew, and passionate about mentoring the next generation of tech and education leaders.
                </p>
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Focus: Strategy, Scaling &amp; Institutional Governance
                </span>
                <a
                  href="https://www.linkedin.com/in/krishna-dhall-01838855/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#0a66c2',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <IconBrandLinkedin size={18} />
                  <span>LinkedIn Profile ↗</span>
                </a>
              </div>
            </div>

            {/* Founder 2: Chandan Mallik */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '24px'
            }}>
              <div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: '#ecfdf5',
                    border: '2px solid #a7f3d0',
                    flexShrink: 0
                  }}>
                    <img 
                      src="/team/Chandan.png" 
                      alt="Chandan Mallik"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                      Chandan Mallik
                    </h3>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#059669', margin: '2px 0 6px' }}>
                      Co-Founder &amp; CTO
                    </div>
                    <span style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '12px'
                    }}>
                      15+ Years Experience · Architecture &amp; Engineering
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.7, margin: 0 }}>
                  A technology leader with 15+ years in software engineering, mobile systems, and technical leadership. Chandan owns the core engineering strategy — distributed systems, high-concurrency database architecture, Android and React Native New Architecture apps, and full-stack web platforms — building scalable, secure, and sovereign products. An alumnus of Era Business School, he pairs engineering excellence with real business insight.
                </p>
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Focus: Architecture, System Design &amp; Security
                </span>
                <a
                  href="https://www.linkedin.com/in/chandanmallik/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#0a66c2',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <IconBrandLinkedin size={18} />
                  <span>LinkedIn Profile ↗</span>
                </a>
              </div>
            </div>

          </div>

          {/* Founders' Joint Pledge Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '2px solid #059669',
            borderRadius: '16px',
            padding: '36px',
            boxShadow: '0 8px 24px rgba(6, 78, 59, 0.08)',
            marginTop: '40px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#064e3b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconHeartHandshake size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  The Founders' Pledge to Indian Parents &amp; Schools
                </h3>
                <span style={{ fontSize: '12.5px', color: '#059669', fontWeight: 700 }}>
                  Signed by Chandan Mallik &amp; Krishna Dhall
                </span>
              </div>
            </div>
            <blockquote style={{
              margin: '0 0 16px',
              fontStyle: 'italic',
              fontSize: '15px',
              color: '#334155',
              lineHeight: 1.8,
              borderLeft: '3px solid #059669',
              paddingLeft: '20px'
            }}>
              "We believe that education technology in India must be built with uncompromising sovereign integrity. Student records, fee ledgers, and academic assessments belong solely to Indian institutions, hosted on Indian servers, with zero third-party commercial exploitation or hidden brokerage markups. That is our unbreakable promise to every parent and school trustee who trusts SchoolKarma."
            </blockquote>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: '#064e3b', fontWeight: 800 }}>
                Chandan Mallik &amp; Krishna Dhall · CKR Technologies
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Office No. 618, Galaxy Blue Sapphire Plaza, Greater Noida West, UP 201306
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Our Origin Story (100% Full Width) */}
      <section style={{ padding: '64px 0', borderBottom: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.8px' }}>
              OUR ORIGIN STORY
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: 900, color: '#0f172a', margin: '6px 0 18px' }}>
              Why We Built SchoolKarma
            </h2>
            <div style={{ fontSize: '15.5px', color: '#334155', lineHeight: 1.85, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <p>
                Every year, over 2.5 crore Indian parents embark on the stressful journey of finding the right school for their children. Too often, they encounter opaque fee structures, hidden charges discovered only at the fee counter, unverified rumors, and commission-driven consultants who push whichever institution pays the highest referral markup.
              </p>
              <p>
                At the same time, forward-thinking school trustees and principals struggle with fragmented desktop software from the 2000s, spreadsheet formula errors during CBSE report card generation, and unmonitored WhatsApp groups that disturb teachers late at night.
              </p>
              <p>
                <strong>SchoolKarma bridges both worlds.</strong> For parents, we built an unbiased school verification network that displays full annual fee schedules down to integer paise, 5-axis verified parent reviews, and 1-click direct enquiries. For institutions, we built a modern, multi-tenant cloud ERP with white-label mobile apps that run entire campuses seamlessly.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 6. MSME & Legal Identity (100% Full Width) */}
      <section style={{ padding: '64px 0', backgroundColor: '#fcfdfd', borderBottom: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.8px' }}>
              LEGAL REGISTRATION &amp; COMPLIANCE
            </span>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '6px 0 8px' }}>
              Government of India MSME Recognition
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Recognized under the Ministry of Micro, Small and Medium Enterprises, Government of India.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', marginBottom: '6px' }}>
                Enterprise Category
              </div>
              <div style={{ fontSize: '13.5px', color: '#059669', fontWeight: 700 }}>
                Services / Educational Software Technology
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', lineHeight: 1.6, margin: 0 }}>
                Officially registered under Udyam Registration framework for educational software publication, school analytics, and digital portal infrastructure.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', marginBottom: '6px' }}>
                Corporate Headquarters
              </div>
              <div style={{ fontSize: '13.5px', color: '#064e3b', fontWeight: 700 }}>
                Greater Noida West, Uttar Pradesh
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', lineHeight: 1.6, margin: 0 }}>
                Office No. 618, Galaxy Blue Sapphire Plaza, TechZone 4, Greater Noida West, Gautam Buddha Nagar, UP 201306, India.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', marginBottom: '6px' }}>
                Data Sovereignty
              </div>
              <div style={{ fontSize: '13.5px', color: '#059669', fontWeight: 700 }}>
                100% Indian Cloud &amp; VPS Storage
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', lineHeight: 1.6, margin: 0 }}>
                Zero foreign database transfers; fully compliant with DPDP Act 2023, DLT SMS regulations, and RBI payment gateway directives.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#064e3b',
                color: '#ffffff',
                padding: '13px 28px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(6, 78, 59, 0.25)'
              }}
            >
              <span>Connect with Our Leadership Team</span>
              <IconArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
