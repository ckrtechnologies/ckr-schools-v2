import React from 'react';
import Link from 'next/link';
import { 
  IconHeartHandshake, 
  IconBrandLinkedin, 
  IconShieldCheck, 
  IconTarget, 
  IconEye, 
  IconArrowRight,
  IconBuildingBank
} from '@tabler/icons-react';

export const metadata = {
  title: 'Founders & Leadership — SchoolKarma India',
  description: 'Meet the founders of SchoolKarma, Chandan Mallik and Krishna Dhall, and discover our commitment to Indian educational digital sovereignty and zero-brokerage admissions.',
  alternates: {
    canonical: 'https://schoolkarma.com/founders'
  }
};

export default function FoundersPage() {
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '80px', width: '100%' }}>
      
      {/* 1. Breadcrumb */}
      <div style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 0', width: '100%' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', boxSizing: 'border-box' }}>
          <Link href="/" style={{ color: '#064e3b', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <Link href="/about" style={{ color: '#64748b', textDecoration: 'none' }}>About</Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>Founders</span>
        </div>
      </div>

      {/* 2. Hero Section (100% Full Width) */}
      <section style={{
        background: 'radial-gradient(ellipse at top, #ecfdf5 0%, #ffffff 80%)',
        borderBottom: '1px solid #e2e8f0',
        padding: '56px 0 44px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', textAlign: 'center', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          
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
            <span>FOUNDED AT CKR TECHNOLOGIES · GREATER NOIDA</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 4.5vw, 48px)',
            fontWeight: 900,
            color: '#0f172a',
            lineHeight: 1.2,
            letterSpacing: '-0.8px',
            margin: '0 0 16px'
          }}>
            Meet the Founders Behind SchoolKarma
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: '#475569',
            lineHeight: 1.65,
            maxWidth: '820px',
            margin: '0 auto'
          }}>
            SchoolKarma was co-founded by Krishna Dhall and Chandan Mallik to eradicate admission brokerage, protect student data sovereignty, and deliver unified enterprise campus automation for Indian schools.
          </p>

        </div>
      </section>

      {/* 3. Co-Founders Detail Profiles (100% Full Width) */}
      <section style={{ padding: '64px 0', borderBottom: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: '36px'
          }}>

            {/* Founder 1: Krishna Dhall */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '36px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '24px'
            }}>
              <div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{
                    width: '100px',
                    height: '100px',
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
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                      Krishna Dhall
                    </h2>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#059669', margin: '3px 0 6px' }}>
                      Co-Founder &amp; CEO
                    </div>
                    <span style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '12px'
                    }}>
                      13+ Years Experience · Growth &amp; Scaling
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.75, margin: 0 }}>
                  A technology and business leader with 13+ years across tech delivery, sales growth, and market expansion. Krishna drives CKR's and SchoolKarma's vision and scaling — known for building high-trust teams and lasting relationships with school trustees and academic institutions nationwide. Also Founder of KiloWatt Crew, and passionate about mentoring the next generation of tech and education leaders.
                </p>
              </div>

              <div style={{ paddingTop: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Institutional Strategy &amp; Governance
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
                    fontSize: '13.5px',
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
              padding: '36px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '24px'
            }}>
              <div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{
                    width: '100px',
                    height: '100px',
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
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                      Chandan Mallik
                    </h2>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#059669', margin: '3px 0 6px' }}>
                      Co-Founder &amp; CTO
                    </div>
                    <span style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '12px'
                    }}>
                      15+ Years Experience · Architecture &amp; System Design
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.75, margin: 0 }}>
                  A technology leader with 15+ years in software engineering, mobile systems, and technical leadership. Chandan owns the core engineering strategy — distributed systems, high-concurrency database architecture, Android and React Native New Architecture apps, and full-stack web platforms — building scalable, secure, and sovereign products. An alumnus of Era Business School, he pairs engineering excellence with real business insight.
                </p>
              </div>

              <div style={{ paddingTop: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Core Architecture &amp; Engineering
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
                    fontSize: '13.5px',
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

          {/* Joint Pledge */}
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
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>
                  The Founders' Pledge
                </h3>
                <span style={{ fontSize: '12.5px', color: '#059669', fontWeight: 700 }}>
                  Signed by Chandan Mallik &amp; Krishna Dhall
                </span>
              </div>
            </div>
            <blockquote style={{
              margin: '0 0 16px',
              fontStyle: 'italic',
              fontSize: '15.5px',
              color: '#334155',
              lineHeight: 1.8,
              borderLeft: '3px solid #059669',
              paddingLeft: '20px'
            }}>
              "We believe that education technology in India must be built with uncompromising sovereign integrity. Student records, fee ledgers, and academic assessments belong solely to Indian institutions, hosted on Indian servers, with zero third-party commercial exploitation or hidden brokerage markups. That is our unbreakable promise to every parent and school trustee who trusts SchoolKarma."
            </blockquote>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '13.5px', color: '#064e3b', fontWeight: 800 }}>
                Chandan Mallik &amp; Krishna Dhall · CKR Technologies
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                Office No. 618, Galaxy Blue Sapphire Plaza, TechZone 4, Greater Noida West, UP 201306
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Mission & Vision (100% Full Width) */}
      <section style={{ padding: '64px 0', backgroundColor: '#fcfdfd', width: '100%', boxSizing: 'border-box' }}>
        <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
          
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
              boxShadow: '0 8px 24px rgba(6, 78, 59, 0.05)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#ecfdf5',
                color: '#064e3b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <IconTarget size={26} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                MISSION STATEMENT
              </span>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '4px 0 12px' }}>
                Empowering Indian Education
              </h3>
              <p style={{ fontSize: '15px', color: '#334155', lineHeight: 1.75, margin: 0 }}>
                To revolutionize Indian school admissions and campus administration by eliminating brokerages, establishing absolute fee transparency down to integer paise for parents, and empowering school educators with sovereign, high-velocity Indian cloud software built natively for CBSE, ICSE, and State Boards.
              </p>
            </div>

            {/* Vision Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px solid #cbd5e1',
              borderRadius: '16px',
              padding: '36px',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#f1f5f9',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <IconEye size={26} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                VISION STATEMENT
              </span>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '4px 0 12px' }}>
                India's Trusted Edu-Tech Standard
              </h3>
              <p style={{ fontSize: '15px', color: '#334155', lineHeight: 1.75, margin: 0 }}>
                To become India’s most trusted educational technology infrastructure — where every parent discovers and enrolls in verified accredited schools without deceit or markups, and every partner school operates with automated, paperless, enterprise-grade digital sovereignty.
              </p>
            </div>

          </div>

          <div style={{ textAlign: 'center', marginTop: '44px' }}>
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
              <span>Speak with Our Founders &amp; Advisory Team</span>
              <IconArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}

