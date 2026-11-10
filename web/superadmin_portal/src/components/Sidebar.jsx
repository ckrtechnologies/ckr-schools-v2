import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab } from '../store/filtersSlice.js';
import { 
  IconLayoutDashboard, 
  IconSchool, 
  IconTarget,
  IconStar,
  IconReceipt2, 
  IconShieldCheck,
  IconBuildingSkyscraper
} from '@tabler/icons-react';

const MENU_ITEMS = [
  { label: 'Overview', icon: IconLayoutDashboard },
  { label: 'Schools', icon: IconSchool },
  { label: 'Leads', icon: IconTarget },
  { label: 'Reviews', icon: IconStar },
  { label: 'Billing', icon: IconReceipt2 },
  { label: 'Audit', icon: IconShieldCheck }
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.filters.activeTab);

  return (
    <aside style={{
      width: '220px',
      height: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
      borderRight: '1px solid #1e293b'
    }}>
      {/* Brand Header */}
      <div style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '10px',
        borderBottom: '1px solid #1e293b'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: '#064e3b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#34d399'
        }}>
          <IconBuildingSkyscraper size={20} />
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '14px', letterSpacing: '-0.2px' }}>CKR Schools</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Super Admin</div>
        </div>
      </div>

      {/* Navigation (Strictly One-Word Options) */}
      <nav style={{ padding: '16px 10px', flex: 1 }}>
        <div style={{ 
          fontSize: '10px', 
          textTransform: 'uppercase', 
          color: '#64748b', 
          fontWeight: '700', 
          padding: '0 10px 10px 10px',
          letterSpacing: '0.5px'
        }}>
          Platform
        </div>
        {MENU_ITEMS.map(({ label, icon: Icon }) => {
          const isActive = activeTab === label;
          return (
            <button
              key={label}
              onClick={() => dispatch(setActiveTab(label))}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#064e3b' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                fontWeight: isActive ? '600' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                marginBottom: '4px',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#1e293b';
                  e.currentTarget.style.color = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              <Icon size={18} stroke={1.75} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Server & Environment Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #1e293b',
        fontSize: '11px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
          <span>Engine: Express 5 + pg</span>
        </div>
        <div style={{ marginTop: '4px', color: '#475569' }}>Region: Asia/Kolkata</div>
      </div>
    </aside>
  );
}

