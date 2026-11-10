import React, { useState, useEffect } from 'react';
import {
  IconSearch,
  IconReceipt2,
  IconCurrencyRupee,
  IconAlertCircle,
  IconCheck,
  IconUser,
  IconCalendar,
  IconCreditCard,
  IconCash,
  IconBuildingBank
} from '@tabler/icons-react';

const PAYMENT_MODES = [
  { id: 'CASH', label: 'Cash', icon: IconCash },
  { id: 'UPI', label: 'UPI / QR', icon: IconCreditCard },
  { id: 'CHEQUE', label: 'Cheque', icon: IconBuildingBank },
  { id: 'BANK_TRANSFER', label: 'Bank NEFT', icon: IconBuildingBank },
  { id: 'CARD', label: 'Debit/Credit Card', icon: IconCreditCard }
];

export default function FeeCounter({ students = [], onCollectFee, isLoading, onReceiptGenerated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [remarks, setRemarks] = useState('');

  // Filter students based on search term
  const filteredStudents = searchTerm.trim()
    ? students.filter(s =>
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.admission_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone || '').includes(searchTerm)
      ).slice(0, 8)
    : [];

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchTerm('');
    // Default fee amount from student's monthly fee or standard ₹3,500
    const defaultFee = student.monthly_fee || 3500;
    setAmount(String(defaultFee));
    setRemarks(`Monthly tuition fees for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`);
  };

  const handleClearSelection = () => {
    setSelectedStudent(null);
    setAmount('');
    setRemarks('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !amount || Number(amount) <= 0) return;

    try {
      const res = await onCollectFee({
        studentId: selectedStudent.id,
        totalAmount: Number(amount),
        paymentMode,
        remarks: remarks || `Tuition fee collection for ${selectedStudent.name}`
      });

      if (res?.data?.receipt || res?.data?.data) {
        const receipt = res.data.receipt || res.data.data;
        onReceiptGenerated(receipt, selectedStudent);
        handleClearSelection();
      }
    } catch (err) {
      console.error('Error during fee collection:', err);
    }
  };

  const formatRupee = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
      {/* Left Column: Student Search & Dues Radar */}
      <div>
        {/* Search Header */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px 0' }}>
            Student Search & POS Lookup
          </h3>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center'
            }}>
              <IconSearch size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by student name, admission number (e.g. VIS-2026), or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            {/* Dropdown Results */}
            {filteredStudents.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                border: '1px solid #cbd5e1',
                marginTop: '4px',
                zIndex: 50,
                maxHeight: '260px',
                overflowY: 'auto'
              }}>
                {filteredStudents.map(student => (
                  <div
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    <div>
                      <strong style={{ color: '#0f172a' }}>{student.name}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Adm No: <span style={{ fontFamily: 'monospace' }}>{student.admission_number || 'N/A'}</span> • Class: {student.class_name || 'General'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: '#ecfdf5',
                        color: '#065f46',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}>
                        Select Student →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Student Banner */}
        {selectedStudent ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: '#064e3b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '18px'
                }}>
                  {selectedStudent.name ? selectedStudent.name.charAt(0) : 'S'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                    {selectedStudent.name}
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Admission No: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{selectedStudent.admission_number || 'N/A'}</strong> • Class: {selectedStudent.class_name || 'Class 1-A'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearSelection}
                style={{
                  fontSize: '12px',
                  color: '#ef4444',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Clear Selection
              </button>
            </div>

            {/* Dues Waterfall Matrix */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                  Monthly Tuition
                </span>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {formatRupee(selectedStudent.monthly_fee || 3500)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                  Transport / Bus
                </span>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {formatRupee(selectedStudent.bus_fee || 0)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                  Late Penalty
                </span>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a', marginTop: '2px' }}>
                  ₹0
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#ecfdf5',
              borderRadius: '8px',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <IconCheck size={18} color="#059669" />
              <div style={{ fontSize: '12px', color: '#065f46' }}>
                Account verified. Ready to log official collection into partition-routed ledger.
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '2px dashed #cbd5e1',
            padding: '48px 20px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <IconUser size={36} color="#94a3b8" />
            <div style={{ fontWeight: '600', fontSize: '14px', marginTop: '10px', color: '#334155' }}>
              No Student Selected
            </div>
            <p style={{ fontSize: '12px', maxWidth: '340px', margin: '6px auto 0 auto' }}>
              Use the quick search box above to locate an enrolled student and load their fee profile.
            </p>
          </div>
        )}
      </div>

      {/* Right Column: POS Collection Action Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        height: 'fit-content'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '14px',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#064e3b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconCurrencyRupee size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Payment Collection Counter
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Generate official numbered receipt</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Amount Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Amount to Collect (₹) *
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                fontWeight: '700'
              }}>
                ₹
              </div>
              <input
                type="number"
                required
                min="1"
                step="50"
                placeholder="Enter amount (e.g. 3500)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!selectedStudent}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 30px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Payment Mode Pills */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              Payment Mode *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {PAYMENT_MODES.map(mode => {
                const isSelected = paymentMode === mode.id;
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMode(mode.id)}
                    disabled={!selectedStudent}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #064e3b' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                      color: isSelected ? '#065f46' : '#475569',
                      fontSize: '12px',
                      fontWeight: isSelected ? '700' : '500',
                      cursor: selectedStudent ? 'pointer' : 'not-allowed',
                      textAlign: 'left'
                    }}
                  >
                    <Icon size={16} />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Remarks */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Payment Remarks / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Paid in full for March 2026"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={!selectedStudent}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedStudent || isLoading || !amount}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#064e3b',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '700',
              cursor: (!selectedStudent || isLoading || !amount) ? 'not-allowed' : 'pointer',
              opacity: (!selectedStudent || isLoading || !amount) ? 0.6 : 1,
              transition: 'background-color 0.15s ease'
            }}
          >
            <IconReceipt2 size={18} />
            <span>{isLoading ? 'Recording Collection...' : 'Collect & Issue Receipt'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

