import React, { useState, useMemo } from 'react';
import {
  IconSearch,
  IconDownload,
  IconReceipt,
  IconArrowUp,
  IconArrowDown,
  IconPrinter
} from '@tabler/icons-react';

export default function CollectionLedger({ payments = [], isLoading, onPrintReceipt }) {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50); // Mandatory CKR default

  // Filtering
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Text search
      const matchesSearch =
        (p.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.admission_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (String(p.receipt_number || '')).includes(search) ||
        (p.payment_mode || '').toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      // Date filter
      if (dateFilter === 'ALL') return true;
      if (!p.created_at) return true;

      const pDate = new Date(p.created_at);
      const now = new Date();
      if (dateFilter === 'TODAY') {
        return pDate.toDateString() === now.toDateString();
      }
      if (dateFilter === '7DAYS') {
        const diff = (now - pDate) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }
      if (dateFilter === '30DAYS') {
        const diff = (now - pDate) / (1000 * 60 * 60 * 24);
        return diff <= 30;
      }
      return true;
    });
  }, [payments, search, dateFilter]);

  // Sorting
  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'amount_paid' || sortField === 'receipt_number') {
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
  }, [filteredPayments, sortField, sortAsc]);

  // Pagination (Default 50)
  const totalPages = Math.ceil(sortedPayments.length / rowsPerPage) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedPayments.slice(start, start + rowsPerPage);
  }, [sortedPayments, currentPage, rowsPerPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const formatRupee = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleExportCSV = () => {
    if (!sortedPayments.length) return;
    const headers = ['Receipt No', 'Date', 'Student Name', 'Admission No', 'Class', 'Payment Mode', 'Amount Paid (Rs)', 'Remarks'];
    const rows = sortedPayments.map(p => [
      p.receipt_number || 'N/A',
      p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '',
      `"${p.student_name || ''}"`,
      p.admission_number || '',
      `"${p.class_name || ''} ${p.class_section || ''}"`,
      p.payment_mode || 'CASH',
      p.amount_paid || 0,
      `"${p.remarks || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vision_Fee_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metric sums
  const totalCollectedSum = filteredPayments.reduce((acc, curr) => acc + Number(curr.amount_paid || 0), 0);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden'
    }}>
      {/* CKR Standard Export & Filter Toolbar */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#fafbfc'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <div style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center'
            }}>
              <IconSearch size={16} />
            </div>
            <input
              type="text"
              placeholder="Search student, receipt #..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '6px 12px 6px 32px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Date Filter Pills */}
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: '7DAYS', label: '7 Days' },
              { id: '30DAYS', label: '30 Days' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => {
                  setDateFilter(pill.id);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: dateFilter === pill.id ? '700' : '500',
                  backgroundColor: dateFilter === pill.id ? '#ffffff' : 'transparent',
                  color: dateFilter === pill.id ? '#064e3b' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: dateFilter === pill.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Aggregate & CSV Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '13px', color: '#475569' }}>
            Filtered Total: <strong style={{ color: '#064e3b', fontSize: '15px' }}>{formatRupee(totalCollectedSum)}</strong>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!filteredPayments.length}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '12px',
              fontWeight: '600',
              cursor: filteredPayments.length ? 'pointer' : 'not-allowed',
              opacity: filteredPayments.length ? 1 : 0.6
            }}
          >
            <IconDownload size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* CKR 5 Tabular Standard Table (38px Rows, #064e3b Solid Brand Header) */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#064e3b', color: '#ffffff', height: '38px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
              <th
                onClick={() => handleSort('receipt_number')}
                style={{ padding: '0 14px', height: '38px', cursor: 'pointer', userSelect: 'none', width: '120px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Receipt #</span>
                  {sortField === 'receipt_number' && (sortAsc ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />)}
                </div>
              </th>

              <th
                onClick={() => handleSort('created_at')}
                style={{ padding: '0 14px', height: '38px', cursor: 'pointer', userSelect: 'none', width: '140px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Date & Time</span>
                  {sortField === 'created_at' && (sortAsc ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />)}
                </div>
              </th>

              <th
                onClick={() => handleSort('student_name')}
                style={{ padding: '0 14px', height: '38px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Student Name</span>
                  {sortField === 'student_name' && (sortAsc ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />)}
                </div>
              </th>

              <th style={{ padding: '0 14px', height: '38px', width: '130px' }}>Adm No</th>
              <th style={{ padding: '0 14px', height: '38px', width: '120px' }}>Class</th>
              <th style={{ padding: '0 14px', height: '38px', width: '100px' }}>Mode</th>

              <th
                onClick={() => handleSort('amount_paid')}
                style={{ padding: '0 14px', height: '38px', cursor: 'pointer', userSelect: 'none', textAlign: 'right', width: '130px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <span>Amount Paid</span>
                  {sortField === 'amount_paid' && (sortAsc ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />)}
                </div>
              </th>

              <th style={{ padding: '0 14px', height: '38px', textAlign: 'center', width: '90px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Loading payment ledger records...
                </td>
              </tr>
            ) : paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No payment records found for the selected criteria.
                </td>
              </tr>
            ) : (
              paginatedPayments.map((payment, idx) => {
                const formattedDate = payment.created_at
                  ? new Date(payment.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : '—';

                return (
                  <tr
                    key={payment.id || idx}
                    style={{
                      height: '38px', // CKR 38px Standard Single-Line Row
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ecfdf5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc'}
                  >
                    <td style={{ padding: '0 14px', height: '38px', fontWeight: '700', fontFamily: 'monospace', color: '#064e3b' }}>
                      #{payment.receipt_number || payment.receipts?.receipt_number || '—'}
                    </td>
                    <td style={{ padding: '0 14px', height: '38px', color: '#64748b', fontSize: '12px' }}>
                      {formattedDate}
                    </td>
                    <td style={{ padding: '0 14px', height: '38px', fontWeight: '600', color: '#0f172a' }}>
                      {payment.student_name || 'Enrolled Student'}
                    </td>
                    <td style={{ padding: '0 14px', height: '38px', fontFamily: 'monospace', fontSize: '12px', color: '#334155' }}>
                      {payment.admission_number || '—'}
                    </td>
                    <td style={{ padding: '0 14px', height: '38px', color: '#475569', fontSize: '12px' }}>
                      {payment.class_name ? `${payment.class_name} ${payment.class_section ? '— ' + payment.class_section : ''}` : 'General'}
                    </td>
                    <td style={{ padding: '0 14px', height: '38px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: payment.payment_mode === 'CASH' ? '#ecfdf5' : '#eff6ff',
                        color: payment.payment_mode === 'CASH' ? '#065f46' : '#1e40af'
                      }}>
                        {payment.payment_mode || 'CASH'}
                      </span>
                    </td>
                    <td style={{ padding: '0 14px', height: '38px', textAlign: 'right', fontWeight: '700', color: '#064e3b' }}>
                      {formatRupee(payment.amount_paid)}
                    </td>
                    <td style={{ padding: '0 14px', height: '38px', textAlign: 'center' }}>
                      <button
                        onClick={() => onPrintReceipt && onPrintReceipt({
                          receipt_number: payment.receipt_number,
                          total_amount: payment.amount_paid,
                          payment_mode: payment.payment_mode,
                          remarks: payment.remarks,
                          created_at: payment.created_at
                        }, {
                          name: payment.student_name,
                          admission_number: payment.admission_number,
                          class_name: payment.class_name,
                          class_section: payment.class_section
                        })}
                        title="Print / View Receipt"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: '#064e3b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px'
                        }}
                      >
                        <IconPrinter size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CKR 5 Standard Pagination (Default: 50 rows per page) */}
      <div style={{
        padding: '10px 20px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fafbfc',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Showing {paginatedPayments.length} of {sortedPayments.length} payments</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="25">25 rows</option>
            <option value="50">50 rows (Default)</option>
            <option value="100">100 rows</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

