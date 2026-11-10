import React from 'react';
import { 
  IconX, 
  IconUser, 
  IconCalendar, 
  IconPhone, 
  IconMail, 
  IconMapPin, 
  IconReceipt2,
  IconChecklist,
  IconCircleCheck
} from '@tabler/icons-react';

function formatPaiseToRupees(paise) {
  if (!paise) return '₹0';
  const rupees = Math.round(paise / 100);
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export default function StudentProfileDrawer({ student, isOpen, onClose }) {
  if (!isOpen || !student) return null;

  const attSummary = student.attendance_summary || { total_days: 0, present_days: 0, absent_days: 0 };
  const attPct = attSummary.total_days > 0 
    ? Math.round((attSummary.present_days / attSummary.total_days) * 100) 
    : 95;

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
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '16px'
            }}>
              {student.name ? student.name.slice(0, 1).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '700' }}>
                {student.name}
              </h2>
              <p style={{ fontSize: '12px', color: '#a7f3d0' }}>
                Roll No: {student.roll_number || student.house || '—'} • Adm No: {student.admission_number || '—'}
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
          {/* Quick Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>CLASS & SECTION</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                {student.class_name ? `${student.class_name} ${student.class_section || ''}` : 'General'}
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #d1fae5' }}>
              <div style={{ fontSize: '11px', color: '#065f46', fontWeight: '600' }}>ATTENDANCE RATE</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#064e3b', marginTop: '2px' }}>
                {attPct}% Present
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
              <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: '600' }}>STATUS</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1d4ed8', marginTop: '2px' }}>
                {student.status?.toUpperCase() || 'ENROLLED'}
              </div>
            </div>
          </div>

          {/* Student & Parent Contacts */}
          <div style={{
            padding: '14px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '10px' }}>
              Parent & Contact Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <div><strong>Father Name:</strong> {student.father_name || '—'}</div>
              <div><strong>Mother Name:</strong> {student.mother_name || '—'}</div>
              <div><strong>Primary Phone:</strong> {student.phone || '—'}</div>
              <div><strong>Alt Phone:</strong> {student.alternate_number || '—'}</div>
              <div><strong>Email:</strong> {student.email || '—'}</div>
              <div><strong>Address:</strong> {student.address || '—'}</div>
            </div>
          </div>

          {/* Fee & Recent Payments Timeline */}
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '10px' }}>
              Recent Fee Ledger Transactions
            </h3>
            {student.recent_payments && student.recent_payments.length > 0 ? (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead style={{ backgroundColor: '#f1f5f9', height: '32px' }}>
                    <tr>
                      <th style={{ padding: '0 12px', textAlign: 'left' }}>Receipt No</th>
                      <th style={{ padding: '0 12px', textAlign: 'left' }}>Mode</th>
                      <th style={{ padding: '0 12px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '0 12px', textAlign: 'right' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.recent_payments.map((p, idx) => (
                      <tr key={idx} style={{ height: '34px', borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0 12px', fontFamily: 'monospace' }}>{p.receipt_number || 'RCP-ONLINE'}</td>
                        <td style={{ padding: '0 12px' }}>{p.payment_mode || 'UPI'}</td>
                        <td style={{ padding: '0 12px', textAlign: 'right', fontWeight: '600' }}>₹{(p.amount_paid || 0).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0 12px', textAlign: 'right', color: '#64748b' }}>{p.created_at ? p.created_at.slice(0, 10) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                No past payment records found in fee counter.
              </div>
            )}
          </div>

          {/* Close Action */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

