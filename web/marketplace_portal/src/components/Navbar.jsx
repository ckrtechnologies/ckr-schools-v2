import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  IconBuildingSkyscraper, 
  IconArrowsDiff, 
  IconSearch, 
  IconPhoneCall, 
  IconChecklist,
  IconShieldCheck
} from '@tabler/icons-react';
import { toggleComparisonTray } from '../store/comparisonSlice.js';

export default function Navbar({ onNavigateHome, onOpenComparison, currentView }) {
  const dispatch = useDispatch();
  const comparedSchools = useSelector((state) => state.comparison.comparedSchools);

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 20px',
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div 
          onClick={onNavigateHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#064e3b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399',
            boxShadow: '0 2px 6px rgba(6, 78, 59, 0.25)'
          }}>
            <IconBuildingSkyscraper size={24} />
          </div>
          <div>
            <div style={{
              fontWeight: '800',
              fontSize: '18px',
              color: '#0f172a',
              letterSpacing: '-0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              CKR Schools
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                backgroundColor: '#ecfdf5',
                color: '#064e3b',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #a7f3d0'
              }}>
                MARKETPLACE
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              India’s Verified School Discovery & Admission Portal
            </div>
          </div>
        </div>

        {/* Center Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              Compare ({comparedSchools.length})
            </button>
          )}

          <a
            href="tel:1800123456"
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
            Admission Helpline
          </a>
        </div>
      </div>
    </header>
  );
}

