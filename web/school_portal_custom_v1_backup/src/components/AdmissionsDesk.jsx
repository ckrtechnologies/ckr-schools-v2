import React, { useState } from 'react';
import { 
  IconSearch, 
  IconPlus, 
  IconFileSpreadsheet, 
  IconFileText, 
  IconArrowUp, 
  IconArrowDown,
  IconCheck,
  IconUserCheck,
  IconClock,
  IconCircleX,
  IconDotsVertical,
  IconTrash
} from '@tabler/icons-react';

const STATUS_STAGES = [
  { id: 'all', label: 'All Applicants' },
  { id: 'pending', label: 'Pending Review' },
  { id: 'interview', label: 'Interview Scheduled' },
  { id: 'approved', label: 'Approved & Enrolled' },
  { id: 'rejected', label: 'Rejected / Ineligible' }
];

export default function AdmissionsDesk({
  enquiries = [],
  classes = [],
  isLoading,
  onOpenNewEnquiry,
  onOpenApproveModal,
  onDeleteEnquiry
}) {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // CKR 5 Standard default: 50
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  // Filter & Sort
  const filtered = enquiries.filter((item) => {
    const matchesSearch = 
      (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
      (item.parent && item.parent.toLowerCase().includes(search.toLowerCase())) ||
      (item.phone && item.phone.includes(search));

    const matchesStage = stageFilter === 'all' || 
      (stageFilter === 'approved' && (item.status === 'approved' || item.status === 'admitted')) ||
      (item.status === stageFilter);

    return matchesSearch && matchesStage;
  }).sort((a, b) => {
    const valA = (a[sortBy] || '').toString().toLowerCase();
    const valB = (b[sortBy] || '').toString().toLowerCase();
    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Applicant Name', 'Parent Name', 'Phone', 'Email', 'Target Class', 'Stage', 'Date'];
    const rows = filtered.map(item => [
      `"${item.name || ''}"`,
      `"${item.parent || ''}"`,
      `"${item.phone || ''}"`,
      `"${item.email || ''}"`,
      `"${item.class_name || 'General'}"`,
      `"${item.status || 'pending'}"`,
      `"${item.created_at ? item.created_at.slice(0, 10) : ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ckr_admissions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    window.print();
  };

  return (
    <div>
      {/* Top Header & Metrics */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
            Admissions & Student Intake Desk
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Manage admission inquiries, verify applicant KYC documents, and approve student matriculation
          </p>
        </div>

        <button
          onClick={onOpenNewEnquiry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#064e3b',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(6, 78, 59, 0.2)'
          }}
        >
          <IconPlus size={16} />
          <span>New Application</span>
        </button>
      </div>

      {/* Stage Filter Capsules */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {STATUS_STAGES.map((st) => {
          const isSelected = stageFilter === st.id;
          const count = st.id === 'all' 
            ? enquiries.length 
            : enquiries.filter(e => st.id === 'approved' ? (e.status === 'approved' || e.status === 'admitted') : e.status === st.id).length;
          return (
            <button
              key={st.id}
              onClick={() => {
                setStageFilter(st.id);
                setPage(1);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                border: isSelected ? '1px solid #064e3b' : '1px solid #e2e8f0',
                backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                color: isSelected ? '#064e3b' : '#64748b',
                fontSize: '12px',
                fontWeight: isSelected ? '700' : '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{st.label}</span>
              <span style={{
                backgroundColor: isSelected ? '#064e3b' : '#f1f5f9',
                color: isSelected ? '#ffffff' : '#64748b',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* CKR 5 Tabular Standards Table Container */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* 4. Export Toolbar */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Left: Search input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '6px 12px',
            gap: '8px',
            width: '100%',
            maxWidth: '340px'
          }}>
            <IconSearch size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search applicant name, parent, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                width: '100%',
                color: '#0f172a'
              }}
            />
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={exportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <IconFileSpreadsheet size={15} color="#059669" />
              <span>CSV</span>
            </button>

            <button
              onClick={exportPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <IconFileText size={15} color="#dc2626" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* CKR 5 Tabular Standards Table */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left'
          }}>
            {/* 2. Solid Brand Header */}
            <thead>
              <tr style={{
                backgroundColor: '#064e3b',
                color: '#ffffff',
                height: '38px',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                <th 
                  onClick={() => handleSort('name')}
                  style={{ padding: '0 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Applicant Name</span>
                    {sortBy === 'name' && (sortOrder === 'asc' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />)}
                  </div>
                </th>

                <th style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>Parent / Guardian</th>
                <th style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>Target Grade</th>
                <th style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>Contact Phone</th>
                <th style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>Stage / Status</th>
                
                <th 
                  onClick={() => handleSort('created_at')}
                  style={{ padding: '0 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Applied Date</span>
                    {sortBy === 'created_at' && (sortOrder === 'asc' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />)}
                  </div>
                </th>

                <th style={{ padding: '0 16px', whiteSpace: 'nowrap', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>

            {/* 1. Strict 38px Single-Line Rows, 6. Row Hover */}
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ height: '120px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    Loading admissions pipeline...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ height: '120px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    No applicant records matching current stage filter.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => {
                  const isDropdownOpen = dropdownOpenId === item.id;
                  const isAdmitted = item.status === 'approved' || item.status === 'admitted';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        height: '38px',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '12px',
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ecfdf5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '0 16px', fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            {item.name ? item.name.slice(0, 1).toUpperCase() : 'A'}
                          </div>
                          <span>{item.name}</span>
                        </div>
                      </td>

                      <td style={{ padding: '0 16px', color: '#334155' }}>
                        {item.parent || '—'}
                      </td>

                      <td style={{ padding: '0 16px', color: '#1e3a8a', fontWeight: '500' }}>
                        {item.class_name ? item.class_name : 'Prospective Class'}
                      </td>

                      <td style={{ padding: '0 16px', color: '#64748b' }}>
                        {item.phone || '—'}
                      </td>

                      <td style={{ padding: '0 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: isAdmitted ? '#ecfdf5' : item.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                          color: isAdmitted ? '#065f46' : item.status === 'rejected' ? '#991b1b' : '#b45309'
                        }}>
                          {isAdmitted ? <IconUserCheck size={12} /> : item.status === 'rejected' ? <IconCircleX size={12} /> : <IconClock size={12} />}
                          <span>{isAdmitted ? 'Enrolled' : item.status?.toUpperCase() || 'PENDING'}</span>
                        </span>
                      </td>

                      <td style={{ padding: '0 16px', color: '#64748b' }}>
                        {item.created_at ? item.created_at.slice(0, 10) : '—'}
                      </td>

                      <td 
                        style={{ padding: '0 16px', textAlign: 'center', position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {!isAdmitted && (
                            <button
                              onClick={() => onOpenApproveModal(item)}
                              title="Approve & Matriculate Student"
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#064e3b',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <IconCheck size={13} />
                              <span>Enroll</span>
                            </button>
                          )}

                          <button
                            onClick={() => onDeleteEnquiry(item.id)}
                            title="Delete Application"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Mandatory 50 Rows Pagination */}
        <div style={{
          padding: '10px 18px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#64748b',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50 (Default)</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span>
              Showing {filtered.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: page <= 1 ? '#f1f5f9' : '#ffffff',
                color: page <= 1 ? '#94a3b8' : '#334155',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: page >= totalPages ? '#f1f5f9' : '#ffffff',
                color: page >= totalPages ? '#94a3b8' : '#334155',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

