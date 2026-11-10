import React, { useState, useMemo } from 'react';
import {
  IconPlus,
  IconTrash,
  IconX,
  IconCheck,
  IconCash,
  IconArrowUp,
  IconArrowDown
} from '@tabler/icons-react';

const COMMON_CATEGORIES = [
  'Monthly Tuition',
  'Annual Development Fee',
  'Admission Fee',
  'Transport / Bus Fee',
  'Computer & Science Lab',
  'Examination Fee',
  'Sports & Activities',
  'Library Fee'
];

export default function FeeStructures({
  structures = [],
  classes = [],
  isLoading,
  onCreateStructure,
  onDeleteStructure
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [sortField, setSortField] = useState('fee_category');
  const [sortAsc, setSortAsc] = useState(true);

  // Form State
  const [category, setCategory] = useState('Monthly Tuition');
  const [className, setClassName] = useState('');
  const [amount, setAmount] = useState('3500');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedStructures = useMemo(() => {
    return [...structures].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'amount') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [structures, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateStructure({
        feeCategory: category,
        className: className || null,
        amount: Number(amount) || 0,
        academicYear
      });
      setIsAddOpen(false);
      setCategory('Monthly Tuition');
      setClassName('');
      setAmount('3500');
    } catch (err) {
      console.error('Error creating fee structure:', err);
    } finally {
      setIsSubmitting(false);
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
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden'
    }}>
      {/* Header Toolbar */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fafbfc'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
            Fee Head Matrix & Class Structures
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Configure standard fee amounts applied automatically to student billing
          </span>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#064e3b',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <IconPlus size={16} />
          <span>Add Fee Head</span>
        </button>
      </div>

      {/* CKR 5 Tabular Standards (38px Rows, #064e3b Solid Brand Header) */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#064e3b', color: '#ffffff', height: '38px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
              <th
                onClick={() => handleSort('fee_category')}
                style={{ padding: '0 16px', height: '38px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Fee Category</span>
                  {sortField === 'fee_category' && (sortAsc ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />)}
                </div>
              </th>

              <th
                onClick={() => handleSort('class_name')}
                style={{ padding: '0 16px', height: '38px', cursor: 'pointer', userSelect: 'none', width: '220px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Applicable Class</span>
                  {sortField === 'class_name' && (sortAsc ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />)}
                </div>
              </th>

              <th
                onClick={() => handleSort('amount')}
                style={{ padding: '0 16px', height: '38px', cursor: 'pointer', userSelect: 'none', textAlign: 'right', width: '150px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <span>Amount (₹)</span>
                  {sortField === 'amount' && (sortAsc ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />)}
                </div>
              </th>

              <th style={{ padding: '0 16px', height: '38px', width: '150px' }}>Academic Year</th>
              <th style={{ padding: '0 16px', height: '38px', textAlign: 'center', width: '90px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Loading fee structures...
                </td>
              </tr>
            ) : sortedStructures.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No fee structures configured. Click "Add Fee Head" to create one.
                </td>
              </tr>
            ) : (
              sortedStructures.map((struct, idx) => (
                <tr
                  key={struct.id || idx}
                  style={{
                    height: '38px', // CKR 38px Standard Single-Line Row
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    transition: 'background-color 0.1s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ecfdf5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc'}
                >
                  <td style={{ padding: '0 16px', height: '38px', fontWeight: '600', color: '#0f172a' }}>
                    {struct.fee_category}
                  </td>
                  <td style={{ padding: '0 16px', height: '38px', color: '#475569' }}>
                    {struct.class_name ? (
                      <span style={{
                        backgroundColor: '#e2e8f0',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {struct.class_name}
                      </span>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: '600', fontSize: '12px' }}>
                        All Classes (Universal)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0 16px', height: '38px', textAlign: 'right', fontWeight: '700', color: '#064e3b' }}>
                    {formatRupee(struct.amount)}
                  </td>
                  <td style={{ padding: '0 16px', height: '38px', color: '#64748b', fontSize: '12px' }}>
                    {struct.academic_year || '2026-2027'}
                  </td>
                  <td style={{ padding: '0 16px', height: '38px', textAlign: 'center' }}>
                    <button
                      onClick={() => onDeleteStructure(struct.id)}
                      title="Delete Fee Structure"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: '4px'
                      }}
                    >
                      <IconTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Fee Head Modal */}
      {isAddOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#064e3b',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCash size={20} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                  Create Fee Structure Head
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ffffff' }}
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Fee Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                >
                  {COMMON_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Applicable Class (Leave blank for All Classes)
                </label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                >
                  <option value="">All Classes (Universal)</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#064e3b',
                    color: '#ffffff',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  <IconCheck size={16} />
                  <span>{isSubmitting ? 'Saving...' : 'Save Fee Head'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

