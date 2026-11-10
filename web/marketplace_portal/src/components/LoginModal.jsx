import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { IconX, IconPhone, IconLock, IconShieldCheck } from '@tabler/icons-react';
import { useLoginMutation } from '../store/marketplaceApi.js';
import { setCredentials, closeLogin } from '../store/authSlice.js';

export default function LoginModal({ isOpen, onClose, onSuccess, schoolName }) {
  const dispatch = useDispatch();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [login, { isLoading }] = useLoginMutation();

  if (!isOpen) return null;

  const close = () => {
    setErrorMessage('');
    if (onClose) onClose();
    else dispatch(closeLogin());
  };

  const handleSubmit = async (e) => {
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '20px'
      }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#064e3b',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#a7f3d0' }}>
              Parent Login
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: '700' }}>
              {schoolName ? `Rate ${schoolName}` : 'Sign in to rate a school'}
            </h2>
          </div>
          <button
            onClick={close}
            aria-label="Close login"
            style={{ background: 'transparent', border: 'none', color: '#a7f3d0', cursor: 'pointer', padding: '4px' }}
          >
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#064e3b',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '12px',
            marginBottom: '18px'
          }}>
            <IconShieldCheck size={16} />
            Use the phone number and password issued by your school.
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

          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
            Phone Number *
          </label>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <IconPhone size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
            Password *
          </label>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <IconLock size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none'
              }}
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
              borderRadius: '8px',
              padding: '11px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>

          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', textAlign: 'center', lineHeight: 1.5 }}>
            Admission enquiries never require a login.
          </p>
        </form>
      </div>
    </div>
  );
}
