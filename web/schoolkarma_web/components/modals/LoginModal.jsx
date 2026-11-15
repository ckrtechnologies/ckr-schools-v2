import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { IconX, IconPhone, IconLock, IconShieldCheck, IconUser, IconMail, IconMapPin, IconSchool } from '@tabler/icons-react';
import { useLoginMutation, useSignupMutation } from '../../lib/store/marketplaceApi.js';
import { setCredentials, closeLogin } from '../../lib/store/authSlice.js';

export default function LoginModal({ isOpen, onClose, onSuccess, schoolName }) {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'

  // Login form state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupCity, setSignupCity] = useState('');
  const [signupGrade, setSignupGrade] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [signup, { isLoading: isSignupLoading }] = useSignupMutation();

  if (!isOpen) return null;

  const close = () => {
    setErrorMessage('');
    if (onClose) onClose();
    else dispatch(closeLogin());
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!phone.trim() || !password) {
      setErrorMessage('Please enter your phone number and password.');
      return;
    }

    try {
      const res = await login({ phone: phone.trim(), password }).unwrap();
      dispatch(setCredentials({ token: res.token, user: res.user }));
      setPhone('');
      setPassword('');
      if (onSuccess) onSuccess(res.user);
      close();
    } catch (err) {
      setErrorMessage(err.data?.error?.message || err.data?.message || 'Invalid phone number or password.');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!signupName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!signupPhone.trim() || signupPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!signupPassword || signupPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    try {
      const res = await signup({
        name: signupName.trim(),
        phone: signupPhone.trim(),
        email: signupEmail.trim() || undefined,
        password: signupPassword,
        city: signupCity.trim() || undefined,
        child_grade: signupGrade.trim() || undefined
      }).unwrap();

      dispatch(setCredentials({ token: res.token, user: res.user }));
      setSignupName('');
      setSignupPhone('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupCity('');
      setSignupGrade('');
      if (onSuccess) onSuccess(res.user);
      close();
    } catch (err) {
      setErrorMessage(err.data?.error?.message || err.data?.message || 'Could not create account. Please try again.');
    }
  };

  const isLoading = isLoginLoading || isSignupLoading;

  return (
    <div
      className="mk-modal-overlay"
      style={{ zIndex: 1300, alignItems: 'flex-start', paddingTop: 'max(48px, 8vh)' }}
      onClick={close}
    >
      <div
        className="mk-modal-card animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '100%',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div className="mk-modal-header" style={{ backgroundColor: '#064e3b', color: '#ffffff', padding: '16px 20px', borderBottom: '1px solid #047857' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#a7f3d0', letterSpacing: '0.6px' }}>
              Parent & Community Desk
            </div>
            <h2 style={{ margin: '3px 0 0', fontSize: '16px', fontWeight: '800', wordBreak: 'break-word', color: '#ffffff' }}>
              {activeTab === 'login' ? 'Parent & Visitor Sign In' : 'Create Parent Account'}
            </h2>
          </div>
          <button
            onClick={close}
            aria-label="Close modal"
            style={{ background: 'transparent', border: 'none', color: '#a7f3d0', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
            style={{
              flex: 1,
              padding: '13px 8px',
              border: 'none',
              borderBottom: activeTab === 'login' ? '2.5px solid #064e3b' : '2.5px solid transparent',
              backgroundColor: activeTab === 'login' ? '#ffffff' : 'transparent',
              color: activeTab === 'login' ? '#064e3b' : '#64748b',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'center',
              minWidth: 0
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setErrorMessage(''); }}
            style={{
              flex: 1,
              padding: '13px 8px',
              border: 'none',
              borderBottom: activeTab === 'signup' ? '2.5px solid #064e3b' : '2.5px solid transparent',
              backgroundColor: activeTab === 'signup' ? '#ffffff' : 'transparent',
              color: activeTab === 'signup' ? '#064e3b' : '#64748b',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'center',
              minWidth: 0
            }}
          >
            Create Account
          </button>
        </div>

        {/* Body */}
        <div className="mk-modal-body" style={{ padding: '20px' }}>
          {errorMessage && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              marginBottom: '16px'
            }}>
              {errorMessage}
            </div>
          )}

          {activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#064e3b',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                <IconShieldCheck size={18} style={{ flexShrink: 0, color: '#059669' }} />
                <span>Sign in to fast-track admissions and manage your verified school reviews.</span>
              </div>

              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>
                Mobile Number *
              </label>
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <IconPhone size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                <input
                  type="tel"
                  name="parent_signin_phone"
                  autoComplete="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#059669'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                />
              </div>

              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>
                Password *
              </label>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <IconLock size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                <input
                  type="password"
                  name="parent_signin_password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#059669'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  backgroundColor: isLoading ? '#94a3b8' : '#064e3b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(6, 78, 59, 0.25)',
                  transition: 'opacity 0.15s ease'
                }}
              >
                {isLoading ? 'Signing in…' : 'Sign In'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '14px' }}>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('signup'); setErrorMessage(''); }}
                  style={{ background: 'none', border: 'none', color: '#064e3b', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer', padding: 0 }}
                >
                  Create one now →
                </button>
              </div>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSignup}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                border: '1px solid #a7f3d0',
                color: '#064e3b',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                <IconShieldCheck size={18} style={{ flexShrink: 0, color: '#059669' }} />
                <span>Create your free parent profile to fast-track admission enquiries across top campuses.</span>
              </div>

              {/* Name */}
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>
                Full Name *
              </label>
              <div style={{ position: 'relative', marginBottom: '13px' }}>
                <IconUser size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                <input
                  type="text"
                  name="parent_signup_name"
                  autoComplete="name"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#059669'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                />
              </div>

              {/* Phone */}
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>
                Mobile Number *
              </label>
              <div style={{ position: 'relative', marginBottom: '13px' }}>
                <IconPhone size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                <input
                  type="tel"
                  name="parent_signup_phone"
                  autoComplete="tel"
                  inputMode="numeric"
                  required
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#059669'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                />
              </div>

              {/* Email (Optional) */}
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>
                Email Address (Optional)
              </label>
              <div style={{ position: 'relative', marginBottom: '13px' }}>
                <IconMail size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                <input
                  type="email"
                  name="parent_signup_email"
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="e.g. ramesh@gmail.com"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#059669'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                />
              </div>

              {/* Password */}
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>
                Choose Password *
              </label>
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <IconLock size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                <input
                  type="password"
                  name="parent_signup_password"
                  autoComplete="new-password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#059669'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                />
              </div>

              {/* City and Child Grade (2 columns) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>
                    City
                  </label>
                  <div style={{ position: 'relative' }}>
                    <IconMapPin size={16} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      name="parent_signup_city"
                      value={signupCity}
                      onChange={(e) => setSignupCity(e.target.value)}
                      placeholder="e.g. Noida"
                      style={{
                        width: '100%',
                        padding: '10px 10px 10px 33px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '13.5px',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#059669'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>
                    Child's Grade
                  </label>
                  <div style={{ position: 'relative' }}>
                    <IconSchool size={16} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      name="parent_signup_grade"
                      value={signupGrade}
                      onChange={(e) => setSignupGrade(e.target.value)}
                      placeholder="e.g. Grade 5"
                      style={{
                        width: '100%',
                        padding: '10px 10px 10px 33px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '13.5px',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#059669'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  backgroundColor: isLoading ? '#94a3b8' : '#064e3b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(6, 78, 59, 0.28)',
                  transition: 'opacity 0.15s ease'
                }}
              >
                {isLoading ? 'Creating Account…' : 'Sign Up Free'}
              </button>

              <div style={{ textAlign: 'center', margin: '14px 0 0' }}>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
                  style={{ background: 'none', border: 'none', color: '#064e3b', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer', padding: 0 }}
                >
                  Sign In instead →
                </button>
              </div>
            </form>
          )}

          <p style={{ fontSize: '11px', color: '#64748b', margin: '16px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
            Direct admission enquiries and brochure downloads never require an account.
          </p>
        </div>
      </div>
    </div>
  );
}
