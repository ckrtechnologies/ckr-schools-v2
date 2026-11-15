import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  IconArrowsDiff, 
  IconUser,
  IconLogout,
  IconSchool,
  IconMenu2,
  IconX,
  IconSparkles,
  IconBuildingCommunity,
  IconPhoneCall
} from '@tabler/icons-react';
import { toggleComparisonTray } from '../store/comparisonSlice.js';
import { openLogin, logout } from '../store/authSlice.js';
import SchoolKarmaLogo from './SchoolKarmaLogo.jsx';
import SchoolSelectorModal from './SchoolSelectorModal.jsx';
import ErpLeadModal from './ErpLeadModal.jsx';

export default function Navbar({ onNavigateHome, onNavigateCatalog, onOpenComparison, onNavigateServices, onOpenErpModal, currentView }) {
  const dispatch = useDispatch();
  const comparedSchools = useSelector((state) => state.comparison.comparedSchools);
  const { user } = useSelector((state) => state.auth);
  const [isSchoolSelectorOpen, setIsSchoolSelectorOpen] = useState(false);
  const [isErpModalOpen, setIsErpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileNav = (action) => {
    setIsMobileMenuOpen(false);
    if (action) action();
  };

  return (
    <>
      <header className="mk-header" style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        {/* FULL CANVAS CONTAINER: 100% width with fluid edge padding */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px clamp(12px, 2vw, 36px)',
          width: '100%',
          boxSizing: 'border-box',
          gap: '10px'
        }}>
          {/* Brand Logo */}
          <div 
            onClick={onNavigateHome}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <SchoolKarmaLogo variant="light" size="default" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="mk-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px, 1.8vw, 28px)' }}>
            <button
              onClick={onNavigateHome}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '14px',
                fontWeight: currentView === 'home' ? '700' : '600',
                color: currentView === 'home' ? '#064e3b' : '#475569',
                cursor: 'pointer',
                padding: '6px 0',
                borderBottom: currentView === 'home' ? '2.5px solid #064e3b' : '2.5px solid transparent'
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
                fontWeight: currentView === 'catalog' ? '700' : '600',
                color: currentView === 'catalog' ? '#064e3b' : '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 0',
                borderBottom: currentView === 'catalog' ? '2.5px solid #064e3b' : '2.5px solid transparent'
              }}
            >
              All Schools Catalog
            </button>

            <button
              onClick={onOpenComparison}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '14px',
                fontWeight: currentView === 'compare' ? '700' : '600',
                color: currentView === 'compare' ? '#064e3b' : '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 0',
                borderBottom: currentView === 'compare' ? '2.5px solid #064e3b' : '2.5px solid transparent'
              }}
            >
              Compare Matrix
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

            <button
              onClick={onNavigateServices}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '14px',
                fontWeight: currentView === 'services-for-schools' ? '700' : '600',
                color: currentView === 'services-for-schools' ? '#064e3b' : '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 0',
                borderBottom: currentView === 'services-for-schools' ? '2.5px solid #064e3b' : '2.5px solid transparent'
              }}
            >
              Services for Schools
              <span style={{
                backgroundColor: '#dcfce7',
                color: '#15803d',
                fontSize: '10px',
                fontWeight: '800',
                borderRadius: '6px',
                padding: '2px 6px',
                textTransform: 'uppercase'
              }}>
                ERP
              </span>
            </button>

            <a
              href="#faq"
              onClick={(e) => {
                e.preventDefault();
                if (currentView !== 'home') {
                  onNavigateHome();
                  setTimeout(() => {
                    const el = document.getElementById('faq');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 120);
                } else {
                  const el = document.getElementById('faq');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              FAQs &amp; Guidance
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="mk-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {comparedSchools.length > 0 && (
              <button
                className="mk-btn-compare-badge"
                onClick={() => dispatch(toggleComparisonTray())}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ecfdf5',
                  color: '#064e3b',
                  border: '1px solid #a7f3d0',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <IconArrowsDiff size={16} />
                <span className="mk-nav-text-hide">Compare ({comparedSchools.length})</span>
              </button>
            )}

            {/* Krishna's Institutional Live Helpline */}
            <a
              href="tel:+919821776412"
              className="mk-helpline-chip"
              title="Krishna - School Onboarding & ERP Support"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                color: '#064e3b',
                border: '1.5px solid #064e3b',
                padding: '7px 11px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              <span className="mk-helpline-text">Helpline: +91 98217 76412</span>
            </a>

            {/* Get School ERP CTA */}
            <button
              onClick={() => onOpenErpModal ? onOpenErpModal() : setIsErpModalOpen(true)}
              className="mk-erp-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#064e3b',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(6, 78, 59, 0.25)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#047857';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#064e3b';
              }}
            >
              <span>Get School ERP</span>
            </button>

            {/* School Login Button */}
            <button
              onClick={() => setIsSchoolSelectorOpen(true)}
              className="mk-school-login-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#064e3b',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(6, 78, 59, 0.25)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047857'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#064e3b'}
            >
              <IconSchool size={16} style={{ color: '#34d399' }} />
              <span className="mk-school-login-text">School Login</span>
            </button>

            {/* Parent Login Button / User Menu */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#064e3b',
                  padding: '7px 11px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  maxWidth: '140px'
                }}>
                  <IconUser size={14} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                    cursor: 'pointer'
                  }}
                >
                  <IconLogout size={14} />
                  <span className="mk-logout-text">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => dispatch(openLogin())}
                className="mk-parent-login-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#064e3b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(6, 78, 59, 0.25)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#064e3b'}
              >
                <IconUser size={15} />
                <span className="mk-parent-login-text">Parent Login</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle (Shows ≤ 1024px) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mk-hamburger-btn"
              aria-label="Toggle navigation menu"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                padding: '7px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {isMobileMenuOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer Menu */}
        {isMobileMenuOpen && (
          <div 
            className="mk-mobile-drawer animate-fade-in"
            style={{
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              padding: '16px 20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 12px 24px rgba(0,0,0,0.08)'
            }}
          >
            <button
              onClick={() => handleMobileNav(onNavigateHome)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: currentView === 'home' ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${currentView === 'home' ? '#bbf7d0' : '#e2e8f0'}`,
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                color: currentView === 'home' ? '#064e3b' : '#334155',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span>Explore Campuses</span>
              <IconSparkles size={16} color="#059669" />
            </button>

            <button
              onClick={() => handleMobileNav(onNavigateCatalog)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: currentView === 'catalog' ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${currentView === 'catalog' ? '#bbf7d0' : '#e2e8f0'}`,
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                color: currentView === 'catalog' ? '#064e3b' : '#334155',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span>All Schools Catalog</span>
              <IconBuildingCommunity size={16} color="#059669" />
            </button>

            <button
              onClick={() => handleMobileNav(onOpenComparison)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: currentView === 'compare' ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${currentView === 'compare' ? '#bbf7d0' : '#e2e8f0'}`,
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                color: currentView === 'compare' ? '#064e3b' : '#334155',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span>Compare Matrix</span>
              {comparedSchools.length > 0 && (
                <span style={{
                  backgroundColor: '#047857',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  padding: '2px 8px'
                }}>
                  {comparedSchools.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleMobileNav(onNavigateServices)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: currentView === 'services-for-schools' ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${currentView === 'services-for-schools' ? '#bbf7d0' : '#e2e8f0'}`,
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                color: currentView === 'services-for-schools' ? '#064e3b' : '#334155',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span>Services for Schools (ERP)</span>
              <span style={{
                backgroundColor: '#dcfce7',
                color: '#15803d',
                fontSize: '10px',
                fontWeight: '800',
                borderRadius: '6px',
                padding: '2px 6px'
              }}>
                ERP
              </span>
            </button>

            {/* Quick Mobile Action Links */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSchoolSelectorOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: '#064e3b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <IconSchool size={16} color="#34d399" />
                <span>School Login</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenErpModal ? onOpenErpModal() : setIsErpModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: '#10b981',
                  color: '#064e3b',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                <span>Get ERP Demo</span>
              </button>
            </div>

            <a
              href="tel:+919821776412"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#f8fafc',
                border: '1.5px solid #064e3b',
                color: '#064e3b',
                padding: '11px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '800',
                textDecoration: 'none',
                marginTop: '4px'
              }}
            >
              <IconPhoneCall size={16} />
              <span>Helpline: +91 98217 76412</span>
            </a>
          </div>
        )}
      </header>

      {/* School Selector Modal */}
      <SchoolSelectorModal
        isOpen={isSchoolSelectorOpen}
        onClose={() => setIsSchoolSelectorOpen(false)}
      />

      {/* ERP Lead Modal */}
      <ErpLeadModal
        isOpen={isErpModalOpen}
        onClose={() => setIsErpModalOpen(false)}
      />
    </>
  );
}
