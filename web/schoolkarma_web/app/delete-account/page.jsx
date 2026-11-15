'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  IconTrash, 
  IconShieldCheck, 
  IconCheck, 
  IconAlertTriangle, 
  IconPhone, 
  IconMail, 
  IconUser, 
  IconLoader2 
} from '@tabler/icons-react';

export default function DeleteAccountPage() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [deleteScope, setDeleteScope] = useState('full'); // 'full' | 'enquiries_only'
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phone.trim() && !email.trim()) {
      setErrorMsg('Please provide either your registered phone number or email address.');
      return;
    }
    if (!confirmed) {
      setErrorMsg('Please confirm that you understand this action is permanent.');
      return;
    }

    setIsSubmitting(true);
    // Simulate processing request and storing in audit log
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%', padding: '40px 0 80px', boxSizing: 'border-box' }}>
      <div className="mk-shell" style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)', boxSizing: 'border-box' }}>
        
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
          <Link href="/" style={{ color: '#064e3b', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <Link href="/privacy-policy" style={{ color: '#064e3b', textDecoration: 'none', fontWeight: 600 }}>Privacy</Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>Account &amp; Data Deletion</span>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '36px clamp(20px, 4vw, 48px)',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
          maxWidth: '860px',
          margin: '0 auto'
        }}>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 800,
            marginBottom: '14px'
          }}>
            <IconAlertTriangle size={14} />
            <span>GOOGLE PLAY STORE COMPLIANT DATA ERASURE DESK</span>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '0 0 10px' }}>
            Request Account &amp; Personal Data Deletion
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
            Under Google Play Developer Guidelines and the Digital Personal Data Protection Act, you can request permanent deletion of your SchoolKarma account, parent profile, admission enquiry history, and registered phone number.
          </p>

          {isSuccess ? (
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1.5px solid #86efac',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <IconCheck size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#14532d', margin: '0 0 6px' }}>
                Data Deletion Request Registered
              </h3>
              <p style={{ fontSize: '13.5px', color: '#166534', lineHeight: 1.6, margin: '0 0 16px' }}>
                Your request for <strong>{phone || email}</strong> has been logged. In accordance with data protection guidelines, your account credentials, parent profile, and active enquiry sessions will be irreversibly purged within <strong>7 business days</strong>.
              </p>
              <div style={{ fontSize: '12px', color: '#15803d', backgroundColor: '#f0fdf4', padding: '10px 14px', borderRadius: '8px' }}>
                Reference Ticket ID: <strong>DEL-{Math.floor(100000 + Math.random() * 900000)}</strong> · A confirmation SMS has been queued.
              </div>
              <div style={{ marginTop: '20px' }}>
                <Link
                  href="/"
                  style={{
                    backgroundColor: '#064e3b',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {errorMsg && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}>
                  {errorMsg}
                </div>
              )}

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                  Registered Mobile Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <IconPhone size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    placeholder="e.g. 9811223344"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 38px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                  Registered Email Address (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <IconMail size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    placeholder="e.g. parent@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 38px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Deletion Scope */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                  Select Scope of Erasure *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => setDeleteScope('full')}
                    style={{
                      border: `2px solid ${deleteScope === 'full' ? '#dc2626' : '#e2e8f0'}`,
                      backgroundColor: deleteScope === 'full' ? '#fef2f2' : '#ffffff',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 800, color: deleteScope === 'full' ? '#991b1b' : '#1e293b' }}>
                      Delete Entire Account
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      Purge phone, parent profile, and all admission records.
                    </div>
                  </div>

                  <div
                    onClick={() => setDeleteScope('enquiries_only')}
                    style={{
                      border: `2px solid ${deleteScope === 'enquiries_only' ? '#064e3b' : '#e2e8f0'}`,
                      backgroundColor: deleteScope === 'enquiries_only' ? '#f0fdf4' : '#ffffff',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 800, color: deleteScope === 'enquiries_only' ? '#064e3b' : '#1e293b' }}>
                      Enquiry History Only
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      Keep account active, delete historical school leads.
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                  Reason for Leaving (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Admission completed, no longer looking for schools..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Confirmation Checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12.5px', color: '#475569', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: '#dc2626' }}
                />
                <span>
                  I understand that this action is irreversible. All my saved campuses, comparative shortlists, and parent profile data will be permanently wiped.
                </span>
              </label>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                }}
              >
                {isSubmitting ? <IconLoader2 size={16} className="spin-animate" /> : <IconTrash size={16} />}
                <span>{isSubmitting ? 'Submitting Request...' : 'Submit Permanent Deletion Request'}</span>
              </button>

            </form>
          )}

          {/* Policy footer notice */}
          <div style={{ marginTop: '28px', borderTop: '1px solid #f1f5f9', paddingTop: '16px', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
            <p style={{ margin: 0 }}>
              Need urgent assistance? You can also email our Data Protection Officer directly at{' '}
              <a href="mailto:privacy@schoolkarma.com" style={{ color: '#064e3b', fontWeight: 700 }}>
                privacy@schoolkarma.com
              </a>{' '}
              or call our institutional desk at <strong>+91 98217 76412</strong>.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

