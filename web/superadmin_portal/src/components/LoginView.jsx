import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice.js';
import { useLoginMutation } from '../store/superadminApi.js';
import { IconBuildingSkyscraper, IconLock, IconMail, IconArrowRight } from '@tabler/icons-react';

export default function LoginView() {
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState('superadmin@ckrschools.online');
  const [password, setPassword] = useState('Admin@123');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await login({ email, password }).unwrap();
      if (res.success && res.data?.accessToken) {
        dispatch(setCredentials({
          token: res.data.accessToken,
          user: res.data.user
        }));
      } else {
        setErrorMsg('Invalid login response from server.');
      }
    } catch (err) {
      setErrorMsg(err.data?.error?.message || err.data?.message || 'Authentication failed. Please check credentials.');
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        margin: '20px'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#064e3b',
            color: '#34d399',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <IconBuildingSkyscraper size={28} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
            CKR Schools
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Platform Super Admin Console
          </p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '8px',
            fontSize: '12px',
            marginBottom: '18px',
            lineHeight: '1.4'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Super Admin Email
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 12px',
              gap: '8px'
            }}>
              <IconMail size={18} color="#94a3b8" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@ckrschools.online"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  width: '100%',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Master Password
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 12px',
              gap: '8px'
            }}>
              <IconLock size={18} color="#94a3b8" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  width: '100%',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '11px',
              backgroundColor: '#064e3b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Super Admin'}</span>
            {!isLoading && <IconArrowRight size={16} />}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: '11px',
          color: '#94a3b8'
        }}>
          Multi-Tenant Isolation • Express 5 • PostgreSQL
        </div>
      </div>
    </div>
  );
}

