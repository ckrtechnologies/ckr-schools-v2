import React, { useState } from 'react';
import { IconAlertTriangle, IconTrash, IconX } from '@tabler/icons-react';

export default function DeleteSchoolModal({ school, isOpen, onClose, onConfirmDelete, isLoading }) {
  const [confirmSlug, setConfirmSlug] = useState('');

  if (!isOpen || !school) return null;

  const isConfirmed = confirmSlug.trim().toLowerCase() === school.slug.toLowerCase();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isConfirmed) return;
    onConfirmDelete(school.id);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      backdropFilter: 'blur(4px)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '520px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #fee2e2'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fef2f2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconAlertTriangle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#991b1b' }}>
                Cascade Delete School Tenant
              </h2>
              <p style={{ fontSize: '11px', color: '#b91c1c' }}>
                Permanent destructive action — cannot be undone
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#991b1b' }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#881337',
            lineHeight: 1.5
          }}>
            <p style={{ fontWeight: '700', marginBottom: '6px' }}>
              Warning: Deleting &ldquo;{school.name}&rdquo; ({school.slug}.ckrschools.online) will immediately:
            </p>
            <ul style={{ paddingLeft: '18px', margin: 0 }}>
              <li><strong>Cascade purge all database records:</strong> students, teachers, admins, classes, attendance, exams, fees, and receipts.</li>
              <li><strong>Permanently delete all CDN files & physical assets:</strong> uploads/{school.slug}-{school.id}/ and all school avatars/documents.</li>
              <li>Revoke all user credentials and session tokens immediately.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Type <strong style={{ color: '#dc2626', userSelect: 'all' }}>{school.slug}</strong> to confirm deletion:
            </label>
            <input
              type="text"
              placeholder={`Type ${school.slug}`}
              value={confirmSlug}
              onChange={(e) => setConfirmSlug(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'monospace'
              }}
              autoFocus
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '16px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isConfirmed || isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isConfirmed ? '#dc2626' : '#fca5a5',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: isConfirmed && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s ease'
              }}
            >
              <IconTrash size={16} />
              <span>{isLoading ? 'Purging School...' : 'Delete School & Purge Assets'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

