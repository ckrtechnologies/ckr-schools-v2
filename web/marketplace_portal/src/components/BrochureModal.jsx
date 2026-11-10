import React, { useState } from 'react';
import { IconX, IconDownload, IconFileText, IconCheck, IconShieldCheck } from '@tabler/icons-react';
import { useSubmitBrochureDownloadMutation } from '../store/marketplaceApi.js';

export default function BrochureModal({ school, isOpen, onClose }) {
  if (!isOpen || !school) return null;

  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [grade, setGrade] = useState('Grade 1');

  const [submitBrochure, { isLoading }] = useSubmitBrochureDownloadMutation();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!parentName.trim() || !phone.trim()) {
      setErrorMessage('Please provide your name and mobile number to unlock the prospectus.');
      return;
    }

    try {
      const res = await submitBrochure({
        slug: school.slug,
        parent_name: parentName,
        phone,
        email: email || null,
        grade
      }).unwrap();

      if (res.success) {
        setIsUnlocked(true);
        // Automatically open brochure URL
        const downloadUrl = school.brochure_url || 'https://vis-shirur.edu.in/prospectus-2026.pdf';
        window.open(downloadUrl, '_blank');
      }
    } catch (err) {
      setErrorMessage(err.data?.error?.message || err.data?.message || 'Failed to unlock brochure.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a',
          color: '#ffffff'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700' }}>
              OFFICIAL SCHOOL PROSPECTUS · 2026-27
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: '700' }}>
              {school.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {isUnlocked ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px'
              }}>
                <IconCheck size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                Brochure Download Unlocked!
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', marginBottom: '20px', lineHeight: '1.5' }}>
                The official prospectus for <strong>{school.name}</strong> has been opened in a new tab. If it did not open automatically, click the button below.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <a
                  href={school.brochure_url || 'https://vis-shirur.edu.in/prospectus-2026.pdf'}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    backgroundColor: '#064e3b',
                    color: '#ffffff',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <IconDownload size={16} />
                  Open PDF Again
                </a>
                <button
                  onClick={onClose}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '18px'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '6px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconFileText size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    Annual Prospectus & Fee Structure (PDF)
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Detailed curriculum, fee schedule, bus routes & calendar.
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '14px'
                }}>
                  {errorMessage}
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                  PARENT / GUARDIAN NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shalini Saxena"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                  MOBILE NUMBER *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '10px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>+91</span>
                  <input
                    type="tel"
                    required
                    placeholder="9811554433"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 42px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    EMAIL (OPTIONAL)
                  </label>
                  <input
                    type="email"
                    placeholder="shalini@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    TARGET GRADE
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="Pre-Primary">Pre-Primary</option>
                    <option value="Primary (1-5)">Primary (Grades 1-5)</option>
                    <option value="Middle (6-8)">Middle (Grades 6-8)</option>
                    <option value="Secondary (9-10)">Secondary (Grades 9-10)</option>
                    <option value="Senior Secondary (11-12)">Senior Secondary (11-12)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  backgroundColor: '#064e3b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '11px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <IconDownload size={16} />
                {isLoading ? 'Verifying & Unlocking...' : 'Unlock Instant Download'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

