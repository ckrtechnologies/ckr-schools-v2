import React, { useState } from 'react';
import { IconX, IconUserCheck, IconCheck } from '@tabler/icons-react';

export default function ApproveAdmissionModal({ isOpen, onClose, enquiry, classes = [], onApprove, isLoading }) {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [classId, setClassId] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('3500');

  // When enquiry opens, pre-fill
  React.useEffect(() => {
    if (enquiry) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setAdmissionNumber(`VIS-2026-${randomSuffix}`);
      setRollNumber(String(Math.floor(1 + Math.random() * 45)));
      setClassId(enquiry.class_id || classes[0]?.id || '');
    }
  }, [enquiry, classes]);

  if (!isOpen || !enquiry) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onApprove({
      enquiryId: enquiry.id,
      admissionNumber,
      rollNumber,
      classId,
      monthlyFee: Number(monthlyFee) || 3500
    });
  };

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
        maxWidth: '520px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
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
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconUserCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700' }}>
                Approve & Matriculate Student
              </h2>
              <p style={{ fontSize: '12px', color: '#a7f3d0' }}>
                Converts applicant lead into active enrolled student
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {/* Applicant Summary */}
          <div style={{
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: '700', color: '#0f172a' }}>
              {enquiry.name}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Parent: {enquiry.parent || '—'} • Phone: {enquiry.phone || '—'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                Assigned Admission No *
              </label>
              <input
                type="text"
                required
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                Assigned Roll No *
              </label>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                Class & Section *
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  backgroundColor: '#ffffff'
                }}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section ? `— ${c.section}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                Monthly Tuition Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid #e2e8f0',
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
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#064e3b',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              <IconCheck size={16} />
              <span>{isLoading ? 'Matriculating...' : 'Confirm Matriculation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

