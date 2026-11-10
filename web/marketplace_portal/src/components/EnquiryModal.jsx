import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconX, IconCheck, IconSchool, IconShieldCheck, IconPhone, IconUser, IconMail } from '@tabler/icons-react';
import { useSubmitEnquiryMutation } from '../store/marketplaceApi.js';
import { getCurrentAcademicYear, getCurrentAcademicYearShort } from '../utils/academicYear.js';
import { openLogin, buildPrefill, fillIfEmpty } from '../store/authSlice.js';
import SearchableSelect from './SearchableSelect.jsx';

const GRADE_OPTIONS = [
  { value: 'Nursery', label: 'Nursery / Pre-School' },
  { value: 'LKG', label: 'LKG / Lower Kindergarten' },
  { value: 'UKG', label: 'UKG / Upper Kindergarten' },
  ...Array.from({ length: 10 }, (_, i) => ({ value: `Grade ${i + 1}`, label: `Grade ${i + 1}` })),
  { value: 'Grade 11 - Science', label: 'Grade 11 (Science)' },
  { value: 'Grade 11 - Commerce', label: 'Grade 11 (Commerce)' },
  { value: 'Grade 11 - Arts', label: 'Grade 11 (Arts / Humanities)' }
];

export default function EnquiryModal({ school, isOpen, onClose, onEnquirySuccess }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const prefill = useMemo(() => buildPrefill(user), [user]);

  const [studentName, setStudentName] = useState(() => prefill.studentName);
  const [parentName, setParentName] = useState(() => prefill.parentName);
  const [phone, setPhone] = useState(() => prefill.phone);
  const [email, setEmail] = useState(() => prefill.email);
  const [grade, setGrade] = useState(() => prefill.grade || 'Grade 1');
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [message, setMessage] = useState('');

  const [submitEnquiry, { isLoading, isSuccess }] = useSubmitEnquiryMutation();
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedLead, setSubmittedLead] = useState(null);
  const gradeTouched = useRef(false);

  useEffect(() => {
    setParentName(prev => fillIfEmpty(prev, prefill.parentName));
    setStudentName(prev => fillIfEmpty(prev, prefill.studentName));
    setPhone(prev => fillIfEmpty(prev, prefill.phone));
    setEmail(prev => fillIfEmpty(prev, prefill.email));
    if (!gradeTouched.current && prefill.grade) setGrade(prefill.grade);
  }, [prefill]);

  const handleChildSelect = (childId) => {
    const child = prefill.children.find(item => String(item.id) === String(childId));
    if (!child) return;
    setStudentName(child.name || '');
    if (child.className) {
      const match = String(child.className).match(/\d+/);
      if (match) setGrade(`Grade ${Number(match[0])}`);
    }
  };

  if (!isOpen || !school) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!parentName.trim() || !studentName.trim() || !phone.trim()) {
      setErrorMessage('Please fill in parent name, student name, and a valid phone number.');
      return;
    }

    if (phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    try {
      const res = await submitEnquiry({
        slug: school.slug,
        student_name: studentName,
        parent_name: parentName,
        phone,
        email: email || null,
        grade,
        academic_year: academicYear,
        message: message || undefined
      }).unwrap();

      if (res.success) {
        setSubmittedLead(res.data);
        if (onEnquirySuccess) onEnquirySuccess(res.data);
      }
    } catch (err) {
      setErrorMessage(err.data?.error?.message || err.data?.message || 'Failed to submit admission enquiry.');
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
        maxWidth: '560px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#064e3b',
          color: '#ffffff'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a7f3d0', fontWeight: '700', letterSpacing: '0.5px' }}>
              DIRECT ADMISSION ENQUIRY · {getCurrentAcademicYearShort()}
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '700' }}>
              {school.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a7f3d0',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {submittedLead ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <IconCheck size={32} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                Enquiry Successfully Registered!
              </h3>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', maxWidth: '420px', margin: '0 auto 20px' }}>
                Thank you, <strong>{parentName}</strong>. Your enquiry for <strong>{studentName}</strong> ({grade}) has been received. Our admission counselor will connect with you via WhatsApp/Phone shortly.
              </p>
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: '#64748b',
                display: 'inline-block',
                marginBottom: '24px'
              }}>
                Enquiry Reference ID: <strong style={{ color: '#0f172a' }}>{submittedLead.id?.slice(0, 8).toUpperCase()}</strong>
              </div>
              <div>
                <button
                  onClick={onClose}
                  style={{
                    backgroundColor: '#064e3b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errorMessage && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}>
                  {errorMessage}
                </div>
              )}

              {/* Verified Trust Strip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '18px',
                fontSize: '12px',
                color: '#166534'
              }}>
                <IconShieldCheck size={18} />
                <span>Your enquiry goes directly to the school's admission desk.</span>
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
                  <span>Pre-filled from your account. You can edit any field before submitting.</span>
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

              {prefill.hasMultipleChildren && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    WHICH CHILD IS THIS ENQUIRY FOR?
                  </label>
                  <SearchableSelect
                    value={prefill.children.find(child => child.name === studentName)?.id || ''}
                    onChange={(value) => handleChildSelect(value)}
                    options={prefill.children.map(child => ({
                      value: child.id,
                      label: `${child.name}${child.className ? ` · ${child.className}${child.classSection ? ` ${child.classSection}` : ''}` : ''}`
                    }))}
                    nullable={false}
                    placeholder="Select a child"
                    searchPlaceholder="Type a child's name…"
                  />
                </div>
              )}

              {/* Grid 1: Parent & Student Name */}
              <div className="mk-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
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

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    STUDENT NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Student's full name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
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
              </div>

              {/* Grid 2: Phone & Email */}
              <div className="mk-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    MOBILE NUMBER (WHATSAPP) *
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

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    EMAIL ADDRESS
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
              </div>

              {/* Grid 3: Grade & Academic Year */}
              <div className="mk-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    GRADE APPLIED FOR
                  </label>
                  <SearchableSelect
                    value={grade}
                    onChange={(value) => { gradeTouched.current = true; setGrade(value); }}
                    options={GRADE_OPTIONS}
                    nullable={false}
                    placeholder="Select a grade"
                    searchPlaceholder="Type a grade…"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    ACADEMIC SESSION
                  </label>
                  <SearchableSelect
                    value={academicYear}
                    onChange={(value) => setAcademicYear(value)}
                    options={[
                      { value: academicYear, label: `${academicYear.replace('-', ' – ')} (Current Session)` },
                      { value: 'Next Session', label: `${Number(academicYear.split('-')[0]) + 1} – ${Number(academicYear.split('-')[0]) + 2} (Next Session)` },
                      { value: 'Immediate Mid-Term', label: 'Immediate Mid-Term Transfer' }
                    ]}
                    nullable={false}
                    placeholder="Select a session"
                    searchPlaceholder="Type a session…"
                  />
                </div>
              </div>

              {/* Message */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                  SPECIFIC REQUIREMENTS / REMARKS (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. School bus route, hostel facility, or a specific programme you would like to know about..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    backgroundColor: '#064e3b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 22px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? 'Submitting...' : 'Submit Admission Enquiry'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

