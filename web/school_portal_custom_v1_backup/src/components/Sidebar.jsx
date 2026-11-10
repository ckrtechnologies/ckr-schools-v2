import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab } from '../store/filtersSlice.js';
import { 
  IconLayoutDashboard, 
  IconChalkboard, 
  IconBook2, 
  IconDoor, 
  IconUsers, 
  IconUserCheck,
  IconUserPlus,
  IconReceipt2,
  IconCalendarEvent,
  IconSchool,
  IconCertificate
} from '@tabler/icons-react';

const MENU_ITEMS = [
  { label: 'Overview', icon: IconLayoutDashboard },
  { label: 'Classes', icon: IconChalkboard },
  { label: 'Subjects', icon: IconBook2 },
  { label: 'Rooms', icon: IconDoor },
  { label: 'Students', icon: IconUsers },
  { label: 'Staff', icon: IconUserCheck },
  { label: 'Admissions', icon: IconUserPlus },
  { label: 'Finance', icon: IconReceipt2 },
  { label: 'Timetable', icon: IconCalendarEvent },
  { label: 'Academics', icon: IconSchool },
  { label: 'Certificates', icon: IconCertificate }
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.filters.activeTab);
  const user = useSelector((state) => state.auth.user);

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
        padding: '0 16px',
        gap: '10px',
        borderBottom: '1px solid #1e293b'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: user?.themeColor || '#1e40af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <IconSchool size={20} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            fontWeight: '700',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }}>
            {user?.schoolName || 'Vision School'}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Admin Console</div>
        </div>
      </div>

      {/* Navigation (Strictly One-Word Options) */}
      <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
        <div style={{ 
          fontSize: '10px', 
          textTransform: 'uppercase', 
          color: '#64748b', 
          fontWeight: '700', 
          padding: '0 10px 8px 10px',
          letterSpacing: '0.5px'
        }}>
          Navigation
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
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#064e3b' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                fontWeight: isActive ? '600' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                marginBottom: '2px',
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
              <Icon size={17} stroke={1.75} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Tenant Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #1e293b',
        fontSize: '11px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
          <span>Tenant: {user?.schoolSlug || 'vision'}</span>
        </div>
        <div style={{ marginTop: '2px', color: '#475569' }}>CBSE Affiliation Active</div>
      </div>
    </aside>
  );
}

