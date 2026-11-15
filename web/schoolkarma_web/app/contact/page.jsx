'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  IconPhoneFilled, 
  IconBrandWhatsappFilled, 
  IconMapPinFilled, 
  IconMailFilled,
  IconClock, 
  IconSend, 
  IconCheck, 
  IconShieldCheck,
  IconLoader2,
  IconExternalLink
} from '@tabler/icons-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    userType: 'parent', // 'parent' | 'school' | 'other'
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      setErrorMsg('Please enter your name, phone number, and query message.');
      return;
    }

    setIsSubmitting(true);
    // Simulate sending ticket
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1000);
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* 1. Breadcrumb */}
      <div style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 0' }}>
        <div className="mk-shell" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
          <Link href="/" style={{ color: '#064e3b', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>Contact Us &amp; Support</span>
        </div>
      </div>

      {/* 2. Hero Header */}
      <section style={{
        background: 'radial-gradient(ellipse at top, #ecfdf5 0%, #ffffff 80%)',
        borderBottom: '1px solid #e2e8f0',
        padding: '48px 0 36px',
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
            padding: '5px 14px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: 800,
            marginBottom: '14px'
          }}>
            <IconPhoneFilled size={14} />
            <span>DIRECT INSTITUTIONAL &amp; PARENT SUPPORT</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 900,
            color: '#0f172a',
            margin: '0 0 12px',
            letterSpacing: '-0.5px'
          }}>
            We’re Here to Help You Find the Right Path
          </h1>
          <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto' }}>
            Whether you are a parent exploring admission deadlines or a school trustee looking to modernize your campus software, our advisory team is at your service.
          </p>
        </div>
      </section>

      {/* 3. Contact Channels Grid + Form */}
      <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '48px auto 0', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '36px',
          alignItems: 'flex-start'
        }}>
          
          {/* Left Column: Direct Channels & Maps */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
              Institutional Desks
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Phone Card */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#064e3b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconPhoneFilled size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Central Helpline
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '2px 0 4px' }}>
                    +91 98217 76412
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Available Mon–Sat: 9:00 AM – 6:30 PM IST
                  </div>
                </div>
              </div>

              {/* WhatsApp Card */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconBrandWhatsappFilled size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Instant WhatsApp Advisory
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '2px 0 6px' }}>
                    Connect with an Admission Counselor
                  </div>
                  <a
                    href="https://wa.me/919821776412?text=Hello%20SchoolKarma,%20I%20need%20assistance."
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#059669',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    <span>Start Chat on WhatsApp →</span>
                  </a>
                </div>
              </div>

              {/* Office Address Card */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#064e3b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconMapPinFilled size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Corporate Office &amp; Headquarters
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '2px 0 4px' }}>
                    SchoolKarma Technologies
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>
                    Govt. of India MSME Registered Organization
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                    Office No. 618, 6th Floor, Galaxy Blue Sapphire Plaza,<br />
                    TechZone 4, Greater Noida West,<br />
                    Gautam Buddha Nagar, Uttar Pradesh 201306, India
                  </div>
                </div>
              </div>

              {/* Google Maps Interactive Card */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  padding: '14px 18px',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconMapPinFilled size={18} color="#064e3b" />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Google Maps Location</span>
                  </div>
                  <a
                    href="https://maps.google.com/?q=Galaxy+Blue+Sapphire+Plaza+Greater+Noida+West"
                    target="_blank"
                    rel="noopener noreferrer"
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
                    <span>Open in Maps ↗</span>
                  </a>
                </div>
                <div style={{ width: '100%', height: '260px', backgroundColor: '#e2e8f0' }}>
                  <iframe
                    title="SchoolKarma Technologies Google Maps Location"
                    src="https://maps.google.com/maps?q=Galaxy%20Blue%20Sapphire%20Plaza%2C%20TechZone%204%2C%20Greater%20Noida%20West%2C%20Uttar%20Pradesh%20201306&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0, display: 'block' }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Interactive Support Form */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              Send Us a Message
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>
              We typically respond within 2 business hours.
            </p>

            {isSuccess ? (
              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1.5px solid #86efac',
                borderRadius: '10px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px'
                }}>
                  <IconCheck size={24} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#14532d', margin: '0 0 4px' }}>
                  Thank you! Message Received
                </h3>
                <p style={{ fontSize: '13px', color: '#166534', margin: 0 }}>
                  An advisor will reach out to <strong>{formData.phone}</strong> shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {errorMsg && (
                  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '8px 12px', borderRadius: '6px', fontSize: '12.5px' }}>
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="e.g. 9811223344"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                      I am a...
                    </label>
                    <select
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="parent">Parent / Student</option>
                      <option value="school">School Principal / Trustee</option>
                      <option value="other">General Enquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g. rahul@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Your Query / Message *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={3}
                    placeholder="Tell us which school, city, or ERP module you are inquiring about..."
                    value={formData.message}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: '#064e3b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(6, 78, 59, 0.25)',
                    marginTop: '4px'
                  }}
                >
                  {isSubmitting ? <IconLoader2 size={16} className="spin-animate" /> : <IconSend size={16} />}
                  <span>{isSubmitting ? 'Sending Query...' : 'Submit Message'}</span>
                </button>

              </form>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}

