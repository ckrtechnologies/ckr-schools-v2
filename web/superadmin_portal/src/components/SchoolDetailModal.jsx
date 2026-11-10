import React from 'react';
import { 
  IconX, 
  IconSchool, 
  IconUser, 
  IconPhone, 
  IconMail, 
  IconMapPin, 
  IconWorld,
  IconCircleCheck,
  IconCircleX,
  IconUsers,
  IconChalkboardTeacher,
  IconEdit,
  IconTrash,
  IconExternalLink
} from '@tabler/icons-react';

export default function SchoolDetailModal({ school, isOpen, onClose, onToggleStatus, onEditSchool, onDeleteSchool }) {
  if (!isOpen || !school) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(3px)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '620px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#064e3b',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {school.logo_url ? (
                <img 
                  src={school.logo_url.startsWith('http') ? school.logo_url : `http://localhost:5006${school.logo_url}`} 
                  alt={school.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <IconSchool size={22} color="#ffffff" />
              )}
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700' }}>
                {school.name}
              </h2>
              <p style={{ fontSize: '12px', color: '#a7f3d0' }}>
                Subdomain: {school.slug}.ckrschools.online
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ffffff' }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px' }}>
          {/* Quick Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>PLAN TIER</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                {school.plan_tier?.replace('_', ' ')}
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
              <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: '600' }}>STUDENTS</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a8a', marginTop: '2px' }}>
                {(school.student_count || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>CAMPUS STATUS</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: school.is_active ? '#15803d' : '#dc2626', marginTop: '2px' }}>
                {school.is_active ? 'ACTIVE' : 'SUSPENDED'}
              </div>
            </div>
          </div>

          {/* School Details */}
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
              Campus Affiliation & Location
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <div><strong>Board:</strong> {school.affiliation_board || 'CBSE'}</div>
              <div><strong>School Code:</strong> {school.school_code || '—'}</div>
              <div><strong>City:</strong> {school.city || '—'}</div>
              <div><strong>State:</strong> {school.state || '—'}</div>
              <div><strong>Official Email:</strong> {school.official_email || '—'}</div>
              <div><strong>Official Phone:</strong> {school.official_phone || '—'}</div>
            </div>
          </div>

          {/* Primary Administrator */}
          <div style={{
            padding: '14px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px'
          }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Registered School Administrator
            </h4>
            {school.primary_admin ? (
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Name:</strong> {school.primary_admin.name}</div>
                <div><strong>Email:</strong> {school.primary_admin.email}</div>
                <div><strong>Phone:</strong> {school.primary_admin.phone || '—'}</div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>No primary admin record found.</div>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '16px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onToggleStatus(school.id, !school.is_active)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: school.is_active ? '#fef3c7' : '#ecfdf5',
                  color: school.is_active ? '#b45309' : '#065f46',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {school.is_active ? <IconCircleX size={15} /> : <IconCircleCheck size={15} />}
                <span>{school.is_active ? 'Suspend School' : 'Activate School'}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onEditSchool) onEditSchool(school);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0369a1',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <IconEdit size={15} />
                <span>Edit School</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onDeleteSchool) onDeleteSchool(school);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <IconTrash size={15} />
                <span>Delete School</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <a
                href={`http://localhost:5174/login?tenant=${encodeURIComponent(school.slug)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#064e3b',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(6, 78, 59, 0.2)'
                }}
              >
                <IconExternalLink size={15} />
                <span>Launch Admin Portal</span>
              </a>

              <button
                onClick={onClose}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

