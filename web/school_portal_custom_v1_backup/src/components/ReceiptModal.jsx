import React from 'react';
import { IconX, IconPrinter, IconCheck, IconReceipt } from '@tabler/icons-react';

export default function ReceiptModal({ isOpen, onClose, receipt, student }) {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const receiptDate = receipt.created_at
    ? new Date(receipt.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

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
      zIndex: 1100,
      backdropFilter: 'blur(3px)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Top Action Bar (Non-Printable) */}
        <div className="no-print" style={{
          padding: '12px 20px',
          backgroundColor: '#064e3b',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconReceipt size={20} />
            <span style={{ fontWeight: '700', fontSize: '14px' }}>
              Fee Collection Receipt #{receipt.receipt_number}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <IconPrinter size={16} />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <IconX size={20} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div id="printable-receipt" style={{ padding: '28px', backgroundColor: '#ffffff', color: '#0f172a' }}>
          {/* School Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #064e3b', paddingBottom: '16px', marginBottom: '18px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#064e3b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Vision International School
            </h1>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>
              Affiliated to CBSE, New Delhi • Sector 18, Greater Noida (UP)
            </p>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 10px',
              borderRadius: '12px',
              border: '1px solid #a7f3d0',
              marginTop: '6px'
            }}>
              OFFICIAL FEE PAYMENT RECEIPT
            </div>
          </div>

          {/* Receipt Metadata Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            backgroundColor: '#f8fafc',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            <div>
              <span style={{ color: '#64748b' }}>Receipt No: </span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>#{receipt.receipt_number}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Date & Time: </span>
              <strong style={{ color: '#0f172a' }}>{receiptDate}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Student Name: </span>
              <strong style={{ color: '#0f172a' }}>{student?.name || 'Student'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Admission No: </span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{student?.admission_number || '—'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Class / Section: </span>
              <strong style={{ color: '#0f172a' }}>
                {student?.class_name ? `${student.class_name} ${student.class_section ? '— ' + student.class_section : ''}` : 'General'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Payment Mode: </span>
              <strong style={{
                color: '#065f46',
                backgroundColor: '#d1fae5',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: '700'
              }}>
                {receipt.payment_mode || 'CASH'}
              </strong>
            </div>
          </div>

          {/* Ledger Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
            <thead>
              <tr style={{ backgroundColor: '#064e3b', color: '#ffffff' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Item / Description</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', width: '130px' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 12px', color: '#334155' }}>
                  {receipt.remarks || 'Monthly School Tuition & Operational Fees'}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                  {formattedAmount(receipt.total_amount)}
                </td>
              </tr>
              <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '800' }}>
                <td style={{ padding: '10px 12px', color: '#0f172a' }}>Total Amount Paid</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#064e3b', fontSize: '15px' }}>
                  {formattedAmount(receipt.total_amount)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Acknowledgement & Signatures */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '24px',
            marginTop: '20px',
            borderTop: '1px dashed #cbd5e1',
            fontSize: '11px',
            color: '#64748b'
          }}>
            <div>
              <p style={{ margin: 0 }}>* This is a computer-generated official receipt.</p>
              <p style={{ margin: '2px 0 0 0' }}>Fees once paid are non-refundable.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '140px', marginBottom: '6px' }}></div>
              <span style={{ fontWeight: '600', color: '#334155' }}>Authorized Cashier</span>
            </div>
          </div>
        </div>

        {/* Modal Close Button */}
        <div className="no-print" style={{
          padding: '12px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#f8fafc'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

