import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconX, IconCheck, IconSchool, IconShieldCheck, IconUsers, IconUser } from '@tabler/icons-react';
import { useSubmitMultiEnquiryMutation } from '../store/marketplaceApi.js';
import { openLogin, buildPrefill, fillIfEmpty } from '../store/authSlice.js';
import SearchableSelect from './SearchableSelect.jsx';

const MULTI_GRADE_OPTIONS = [
  { value: 'Pre-Primary', label: 'Pre-Primary' },
  ...Array.from({ length: 12 }, (_, i) => ({ value: `Grade ${i + 1}`, label: `Grade ${i + 1}` }))
];

export default function MultiEnquiryModal({ selectedSchools = [], isOpen, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const prefill = useMemo(() => buildPrefill(user), [user]);

  const [studentName, setStudentName] = useState(() => prefill.studentName);
  const [parentName, setParentName] = useState(() => prefill.parentName);
  const [phone, setPhone] = useState(() => prefill.phone);
  const [email, setEmail] = useState(() => prefill.email);
  const [grade, setGrade] = useState(() => prefill.grade || 'Grade 1');
  const gradeTouched = useRef(false);
  const [activeSchools, setActiveSchools] = useState(selectedSchools.map(s => s.slug));

  const [submitMulti, { isLoading }] = useSubmitMultiEnquiryMutation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  if (!isOpen || selectedSchools.length === 0) return null;

  const toggleSchool = (slug) => {
    if (activeSchools.includes(slug)) {
      if (activeSchools.length > 1) {
        setActiveSchools(activeSchools.filter(s => s !== slug));
      }
    } else {
      setActiveSchools([...activeSchools, slug]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!parentName.trim() || !studentName.trim() || !phone.trim()) {
      setErrorMessage('Please fill in parent name, student name, and mobile number.');
      return;
    }

    try {
      const res = await submitMulti({
        school_slugs: activeSchools,
        student_name: studentName,
        parent_name: parentName,
        phone,
        ...(email?.trim() ? { email: email.trim() } : {}),
        grade,
        message: '1-Click Multi-School admission enquiry'
      }).unwrap();

      if (res.success) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setErrorMessage(err.data?.error?.message || err.data?.message || 'Failed to submit multi-school enquiry.');
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
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'visible'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#064e3b',
          color: '#ffffff'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a7f3d0', fontWeight: '700' }}>
              1-CLICK MULTI-SCHOOL ADMISSION ENQUIRY
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: '700' }}>
              Applying to {activeSchools.length} Selected Schools
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
        <div style={{ padding: '24px' }}>
          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
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
              <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                Enquiries Dispatched Successfully!
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto 20px' }}>
                Your enquiry for <strong>{studentName}</strong> has been transmitted to {activeSchools.length} chosen school campuses. The admission coordinators will reach out to you shortly.
              </p>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#064e3b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Selected Schools Badges */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                  TARGET SCHOOLS (SELECT TO INCLUDE)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedSchools.map(s => {
                    const isChecked = activeSchools.includes(s.slug);
                    return (
                      <div
                        key={s.slug}
                        onClick={() => toggleSchool(s.slug)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: isChecked ? '1px solid #064e3b' : '1px solid #cbd5e1',
                          backgroundColor: isChecked ? '#ecfdf5' : '#f8fafc',
                          color: isChecked ? '#064e3b' : '#64748b',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        {s.name} ({s.city})
                      </div>
                    );
                  })}
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

              {prefill.parentName ? (
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
              ) : (
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
              )}

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

              <div className="mk-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    PARENT NAME *
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
                      fontSize: '13px'
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
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div className="mk-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    PHONE NUMBER *
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
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    TARGET GRADE
                  </label>
                  <SearchableSelect
                    value={grade}
                    onChange={(value) => { gradeTouched.current = true; setGrade(value); }}
                    options={MULTI_GRADE_OPTIONS}
                    nullable={false}
                    placeholder="Select a grade"
                    searchPlaceholder="Type a grade…"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '9px 16px',
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
                    padding: '9px 20px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? 'Submitting...' : `Enquire to ${activeSchools.length} Schools Now`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

