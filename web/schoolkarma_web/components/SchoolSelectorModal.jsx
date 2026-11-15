import React, { useState } from 'react';
import { 
  IconSearch, 
  IconX, 
  IconSchool, 
  IconArrowRight, 
  IconExternalLink,
  IconShieldCheck,
  IconMapPin
} from '@tabler/icons-react';
import { useGetSchoolsQuery } from '../lib/store/marketplaceApi.js';

export default function SchoolSelectorModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: response, isLoading } = useGetSchoolsQuery({});
  const schools = response?.data || [];

  if (!isOpen) return null;

  const filteredSchools = schools.filter(s => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.slug && s.slug.toLowerCase().includes(q)) ||
      (s.affiliation_board && s.affiliation_board.toLowerCase().includes(q))
    );
  });

  const handleSelectSchool = (school) => {
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocal) {
      window.location.href = `http://localhost:5174/login?tenant=${encodeURIComponent(school.slug)}`;
    } else {
      window.location.href = `https://${school.slug}.schoolkarma.com`;
    }
  };

  return (
    <div className="mk-modal-overlay" onClick={onClose}>
      <div 
        className="mk-modal-card animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '620px'
        }}
      >
        {/* Header */}
        <div className="mk-modal-header" style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          color: '#0f172a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#064e3b',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(6, 78, 59, 0.2)',
              flexShrink: 0
            }}>
              <IconSchool size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                School Staff &amp; Admin Login
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Select your school to access dedicated SPOC portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '14px clamp(14px, 2.5vw, 24px)', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ position: 'relative' }}>
            <IconSearch size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search school name, city, or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '11px 16px 11px 42px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* School List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px clamp(14px, 2.5vw, 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '14px' }}>
              Loading accredited schools...
            </div>
          ) : filteredSchools.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <IconSchool size={36} color="#cbd5e1" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>No school found</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>
                Try searching with a different campus name or city.
              </div>
            </div>
          ) : (
            filteredSchools.map((s) => (
              <div
                key={s.slug}
                onClick={() => handleSelectSchool(s)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdf4';
                  e.currentTarget.style.borderColor = '#86efac';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {s.logo_url ? (
                      <img src={s.logo_url} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <IconSchool size={20} color="#047857" />
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontWeight: '700',
                      fontSize: '13.5px',
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {s.name}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: '#64748b',
                      marginTop: '2px',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      <IconMapPin size={11} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1 }}>
                        {s.city}{s.state ? `, ${s.state}` : ''}
                      </span>
                      <span style={{ flexShrink: 0, color: '#cbd5e1' }}>•</span>
                      <span style={{ color: '#047857', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 2 }}>
                        {s.slug}.schoolkarma.com
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#064e3b',
                  color: '#ffffff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(6, 78, 59, 0.15)'
                }}>
                  Login →
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '12px clamp(14px, 2.5vw, 24px)',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconShieldCheck size={15} color="#059669" />
            Verified SSL Encrypted Subdomains
          </span>
          <span>{filteredSchools.length} partner campuses</span>
        </div>
      </div>
    </div>
  );
}

