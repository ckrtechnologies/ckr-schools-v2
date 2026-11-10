import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  IconBuildingSkyscraper, 
  IconArrowsDiff, 
  IconPhoneCall, 
  IconUser,
  IconLogout
} from '@tabler/icons-react';
import { toggleComparisonTray } from '../store/comparisonSlice.js';
import { openLogin, logout } from '../store/authSlice.js';

export default function Navbar({ onNavigateHome, onNavigateCatalog, onOpenComparison, currentView }) {
  const dispatch = useDispatch();
  const comparedSchools = useSelector((state) => state.comparison.comparedSchools);
  const { user } = useSelector((state) => state.auth);
  const supportPhone = import.meta.env.VITE_SUPPORT_PHONE;

  return (
    <header className="mk-header" style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      <div className="mk-shell mk-header-inner">
        {/* Brand */}
        <div 
          onClick={onNavigateHome}
          className="mk-nav-brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            minWidth: 0
          }}
        >
          <div className="mk-nav-brand-mark" style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#064e3b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399',
            boxShadow: '0 2px 6px rgba(6, 78, 59, 0.25)',
            flexShrink: 0
          }}>
            <IconBuildingSkyscraper size={24} />
          </div>
          <div className="mk-nav-brand-text" style={{ minWidth: 0 }}>
            <div className="mk-nav-brand-title" style={{
              fontWeight: '800',
              fontSize: '18px',
              color: '#0f172a',
              letterSpacing: '-0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}>
              CKR Schools
              <span className="mk-nav-brand-badge" style={{
                fontSize: '10px',
                fontWeight: '700',
                backgroundColor: '#ecfdf5',
                color: '#064e3b',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #a7f3d0',
                whiteSpace: 'nowrap'
              }}>
                MARKETPLACE
              </span>
            </div>
            <div className="mk-nav-brand-sub" style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
              School Discovery &amp; Admission Portal
            </div>
          </div>
        </div>

        {/* Center Links */}
        <nav className="mk-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px, 2vw, 28px)' }}>
          <button
            onClick={onNavigateHome}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: currentView === 'home' ? '700' : '500',
              color: currentView === 'home' ? '#064e3b' : '#475569',
              cursor: 'pointer',
              padding: '6px 0',
              borderBottom: currentView === 'home' ? '2px solid #064e3b' : '2px solid transparent'
            }}
          >
            Explore Campuses
          </button>
          
          <button
            onClick={onNavigateCatalog}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: currentView === 'catalog' ? '700' : '500',
              color: currentView === 'catalog' ? '#064e3b' : '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 0',
              borderBottom: currentView === 'catalog' ? '2px solid #064e3b' : '2px solid transparent'
            }}
          >
            Campus Catalog
          </button>

          <button
            onClick={onOpenComparison}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: currentView === 'compare' ? '700' : '500',
              color: currentView === 'compare' ? '#064e3b' : '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 0',
              borderBottom: currentView === 'compare' ? '2px solid #064e3b' : '2px solid transparent'
            }}
          >
            Compare Schools
            {comparedSchools.length > 0 && (
              <span style={{
                backgroundColor: '#047857',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '700',
                borderRadius: '10px',
                padding: '1px 7px'
              }}>
                {comparedSchools.length}
              </span>
            )}
          </button>

          <a
            href="#faq"
            onClick={(e) => {
              if (currentView !== 'home') {
                e.preventDefault();
                onNavigateHome();
              }
            }}
            style={{
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              color: '#475569'
            }}
          >
            Admission FAQs
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="mk-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {comparedSchools.length > 0 && (
            <button
              onClick={() => dispatch(toggleComparisonTray())}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ecfdf5',
                color: '#064e3b',
                border: '1px solid #a7f3d0',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <IconArrowsDiff size={16} />
              <span className="mk-nav-btn-label">Compare ({comparedSchools.length})</span>
            </button>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#064e3b',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                maxWidth: '180px',
                minWidth: 0
              }}>
                <IconUser size={14} style={{ flexShrink: 0 }} />
                <span className="mk-nav-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name || 'Parent'}
                </span>
              </div>
              <button
                onClick={() => dispatch(logout())}
                title="Log out"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <IconLogout size={14} />
                <span className="mk-nav-btn-label">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => dispatch(openLogin())}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid #064e3b',
                backgroundColor: '#ffffff',
                color: '#064e3b',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <IconUser size={16} />
              <span className="mk-nav-btn-label">Parent Login</span>
            </button>
          )}

          {supportPhone && (
            <a
              href={`tel:${supportPhone}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                backgroundColor: '#064e3b',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(6, 78, 59, 0.2)'
              }}
            >
              <IconPhoneCall size={16} />
              <span className="mk-nav-btn-label">Admission Helpline</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

