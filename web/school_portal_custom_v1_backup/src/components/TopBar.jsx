import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setDateRange } from '../store/filtersSlice.js';
import { logout } from '../store/authSlice.js';
import { IconLogout, IconUserCheck, IconCalendar } from '@tabler/icons-react';

const DATE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: '7days', label: '7 Days' },
  { id: '30days', label: '30 Days' },
  { id: 'all', label: 'All Time' }
];

export default function TopBar() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.filters.activeTab);
  const dateRange = useSelector((state) => state.filters.dateRange);
  const user = useSelector((state) => state.auth.user);

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  return (
    <header style={{
      height: '56px',
      position: 'sticky',
      top: 0,
      left: '220px',
      right: 0,
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 90
    }}>
      {/* Active Section Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
          {activeTab}
        </h1>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>•</span>
        <span style={{
          fontSize: '11px',
          fontWeight: '600',
          backgroundColor: '#ecfdf5',
          color: '#064e3b',
          padding: '2px 8px',
          borderRadius: '12px'
        }}>
          {user?.schoolName || 'Vision International School'}
        </span>
      </div>

      {/* Right Controls: Global Date Range Filter + Avatar Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Global Date Range Filter Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f1f5f9',
          padding: '3px',
          borderRadius: '8px',
          gap: '2px'
        }}>
          <div style={{ padding: '0 6px', color: '#64748b' }}>
            <IconCalendar size={14} />
          </div>
          {DATE_OPTIONS.map((opt) => {
            const isSelected = dateRange === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => dispatch(setDateRange(opt.id))}
                style={{
                  border: 'none',
                  background: isSelected ? '#ffffff' : 'transparent',
                  color: isSelected ? '#064e3b' : '#64748b',
                  fontWeight: isSelected ? '600' : '500',
                  fontSize: '12px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* User Avatar with Mouseover Popover */}
        <div 
          style={{ position: 'relative' }}
          onMouseEnter={() => setAvatarMenuOpen(true)}
          onMouseLeave={() => setAvatarMenuOpen(false)}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '8px'
          }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: user?.themeColor || '#1e40af',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ecfdf5'
            }}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VA'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', lineHeight: '1.2' }}>
                {user?.name || 'School Admin'}
              </span>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '500' }}>
                Principal Desk
              </span>
            </div>
          </div>

          {/* Mouseover Popover */}
          {avatarMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '44px',
              right: 0,
              width: '260px',
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              padding: '16px',
              zIndex: 200
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <IconUserCheck size={18} color="#064e3b" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                  {user?.name || 'School Administrator'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', wordBreak: 'break-all', marginBottom: '12px' }}>
                {user?.email || 'admin@visioninternationalschool.com'}
              </div>
              <div style={{
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '11px',
                fontWeight: '600',
                marginBottom: '16px',
                display: 'inline-block'
              }}>
                Role: CAMPUS_ADMINISTRATOR
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 12px 0' }} />

              <button
                onClick={() => dispatch(logout())}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
              >
                <IconLogout size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

