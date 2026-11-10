import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconArrowsDiff, IconX, IconTrash, IconSchool, IconChecklist } from '@tabler/icons-react';
import { removeSchoolFromCompare, clearComparison } from '../store/comparisonSlice.js';

export default function ComparisonTray({ onOpenComparison, onOpenMultiEnquiry }) {
  const dispatch = useDispatch();
  const { comparedSchools, isTrayOpen } = useSelector((state) => state.comparison);

  if (!isTrayOpen || comparedSchools.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      borderRadius: '16px',
      padding: '12px 20px',
      boxShadow: '0 20px 40px -6px rgba(0, 0, 0, 0.35)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      zIndex: 900,
      border: '1px solid #334155',
      maxWidth: '90vw'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: '#064e3b',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <IconArrowsDiff size={20} />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700' }}>
            Comparing {comparedSchools.length} School{comparedSchools.length > 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Max 3 schools side-by-side
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {comparedSchools.map((s) => (
          <div
            key={s.slug}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #334155',
              fontSize: '12px'
            }}
          >
            <span style={{ fontWeight: '600', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {s.name}
            </span>
            <button
              onClick={() => dispatch(removeSchoolFromCompare(s.slug))}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex'
              }}
            >
              <IconX size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onOpenComparison}
          style={{
            backgroundColor: '#047857',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          Compare Now ({comparedSchools.length})
        </button>

        <button
          onClick={onOpenMultiEnquiry}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          1-Click Multi-Enquiry
        </button>

        <button
          onClick={() => dispatch(clearComparison())}
          title="Clear Selection"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px'
          }}
        >
          <IconTrash size={16} />
        </button>
      </div>
    </div>
  );
}

