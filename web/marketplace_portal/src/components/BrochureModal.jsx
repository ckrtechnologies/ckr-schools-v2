import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconX, IconDownload, IconFileText, IconCheck, IconShieldCheck, IconUser } from '@tabler/icons-react';
import { useSubmitBrochureDownloadMutation } from '../store/marketplaceApi.js';
import { openLogin, buildPrefill, fillIfEmpty } from '../store/authSlice.js';
import SearchableSelect from './SearchableSelect.jsx';

const GRADE_BUCKETS = [
  { value: 'Pre-Primary', label: 'Pre-Primary' },
  { value: 'Primary (1-5)', label: 'Primary (Grades 1-5)' },
  { value: 'Middle (6-8)', label: 'Middle (Grades 6-8)' },
  { value: 'Secondary (9-10)', label: 'Secondary (Grades 9-10)' },
  { value: 'Senior Secondary (11-12)', label: 'Senior Secondary (11-12)' }
];

export default function BrochureModal({ school, isOpen, onClose }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const prefill = useMemo(() => buildPrefill(user), [user]);

  const [parentName, setParentName] = useState(() => prefill.parentName);
  const [phone, setPhone] = useState(() => prefill.phone);
  const [email, setEmail] = useState(() => prefill.email);
  const [grade, setGrade] = useState(() => prefill.gradeBand || 'Primary (1-5)');
  const gradeTouched = useRef(false);

  useEffect(() => {
    setParentName(prev => fillIfEmpty(prev, prefill.parentName));
    setPhone(prev => fillIfEmpty(prev, prefill.phone));
    setEmail(prev => fillIfEmpty(prev, prefill.email));
    if (!gradeTouched.current && prefill.gradeBand) setGrade(prefill.gradeBand);
  }, [prefill]);

  const [submitBrochure, { isLoading }] = useSubmitBrochureDownloadMutation();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !school) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!parentName.trim() || !phone.trim()) {
      setErrorMessage('Please provide your name and mobile number to unlock the prospectus.');
      return;
    }

    if (!school.brochure_url) {
      setErrorMessage('The school has not uploaded a brochure yet.');
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
        window.open(school.brochure_url, '_blank');
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
              OFFICIAL SCHOOL PROSPECTUS
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
                  href={school.brochure_url}
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

              {prefill.parentName && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  marginBottom: '14px',
                  fontSize: '12px',
                  color: '#1e40af'
                }}>
                  <IconUser size={15} />
                  <span>Pre-filled from your account. You can edit any field.</span>
                </div>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '9px 12px',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '12px',
                color: '#475569'
              }}>
                <span>Already have a school account? Log in to auto-fill your details.</span>
                <button
                  type="button"
                  onClick={() => dispatch(openLogin())}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #064e3b',
                    color: '#064e3b',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Log In
                </button>
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
                  placeholder="e.g. Parent's full name"
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
                    placeholder="9876543210"
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

              <div className="mk-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    EMAIL (OPTIONAL)
                  </label>
                  <input
                    type="email"
                    placeholder="parent@example.com"
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
                  <SearchableSelect
                    value={grade}
                    onChange={(value) => { gradeTouched.current = true; setGrade(value); }}
                    options={GRADE_BUCKETS}
                    nullable={false}
                    placeholder="Select a grade"
                    searchPlaceholder="Type a grade…"
                  />
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

