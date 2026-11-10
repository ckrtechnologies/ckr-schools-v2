import React, { useState } from 'react';
import { 
  IconSearch, 
  IconPlus, 
  IconChalkboardTeacher, 
  IconPhone, 
  IconMail, 
  IconTrash,
  IconCircleCheck
} from '@tabler/icons-react';

export default function StaffView({
  staff = [],
  isLoading,
  onOpenAddTeacher,
  onDeleteTeacher
}) {
  const [search, setSearch] = useState('');

  const filtered = staff.filter(t => 
    (t.name && t.name.toLowerCase().includes(search.toLowerCase())) ||
    (t.email && t.email.toLowerCase().includes(search.toLowerCase())) ||
    (t.phone && t.phone.includes(search))
  );

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
            Faculty & Academic Staff Directory
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Teaching staff profiles, assigned class teacherships, and contact numbers
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '6px 12px',
            gap: '8px',
            width: '260px'
          }}>
            <IconSearch size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search faculty name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                width: '100%',
                color: '#0f172a'
              }}
            />
          </div>

          <button
            onClick={onOpenAddTeacher}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#064e3b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(6, 78, 59, 0.2)'
            }}
          >
            <IconPlus size={16} />
            <span>Add Teacher</span>
          </button>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading faculty directory...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <IconChalkboardTeacher size={48} color="#94a3b8" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '12px' }}>
            No teachers found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Click "Add Teacher" to onboard teaching faculty to your school campus.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {filtered.map((t) => (
            <div
              key={t.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#064e3b';
                e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#ecfdf5',
                      color: '#064e3b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}>
                      {t.name ? t.name.slice(0, 1).toUpperCase() : 'T'}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                        {t.name}
                      </h3>
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>
                        Teaching Faculty
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteTeacher(t.id)}
                    title="Remove Teacher"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>

                <div style={{
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  marginBottom: '12px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                    <IconMail size={14} color="#64748b" />
                    <span style={{ wordBreak: 'break-all' }}>{t.email || 'No email provided'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                    <IconPhone size={14} color="#64748b" />
                    <span>{t.phone || 'No phone recorded'}</span>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid #f1f5f9',
                fontSize: '11px',
                color: '#64748b'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: '600' }}>
                  <IconCircleCheck size={13} />
                  <span>Active Staff</span>
                </span>
                <span>Weekly Quota: 28p</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

