import React, { useState } from 'react';
import { 
  IconSearch, 
  IconPlus, 
  IconFileSpreadsheet, 
  IconFileText, 
  IconArrowUp, 
  IconArrowDown,
  IconDotsVertical,
  IconUser,
  IconCircleCheck,
  IconCircleX
} from '@tabler/icons-react';

export default function StudentsTable({
  students = [],
  classes = [],
  isLoading,
  onSelectStudent,
  onOpenEnroll,
  onDeleteStudent
}) {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // CKR 5 Standard default: 50
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  // Filter & Sort
  const filtered = students.filter((s) => {
    const matchesSearch = 
      (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
      (s.admission_number && s.admission_number.toLowerCase().includes(search.toLowerCase())) ||
      (s.father_name && s.father_name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesClass = classFilter === 'all' || 
      (s.classes && s.classes.includes(classFilter)) ||
      (s.class_id === classFilter);

    return matchesSearch && matchesClass;
  }).sort((a, b) => {
    if (sortBy === 'roll_number') {
      const rollA = parseInt(a.roll_number || a.house || '0', 10);
      const rollB = parseInt(b.roll_number || b.house || '0', 10);
      return sortOrder === 'asc' ? rollA - rollB : rollB - rollA;
    }
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
    const headers = ['Roll No', 'Admission No', 'Name', 'Class', 'Father Name', 'Phone', 'Status'];
    const rows = filtered.map(s => [
      `"${s.roll_number || s.house || ''}"`,
      `"${s.admission_number || ''}"`,
      `"${s.name || ''}"`,
      `"${s.class_name ? s.class_name + ' ' + (s.class_section || '') : ''}"`,
      `"${s.father_name || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.status || 'active'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ckr_students_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    window.print();
  };

  return (
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
        {/* Left: Search & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '6px 12px',
            gap: '8px',
            width: '100%',
            maxWidth: '320px'
          }}>
            <IconSearch size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search student name, adm no, parent..."
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

          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '7px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              fontSize: '13px',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Classes & Sections</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section ? `— ${c.section}` : ''}
              </option>
            ))}
          </select>
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

          <button
            onClick={onOpenEnroll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#064e3b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(6, 78, 59, 0.2)'
            }}
          >
            <IconPlus size={16} />
            <span>Enroll Student</span>
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
                onClick={() => handleSort('roll_number')}
                style={{ padding: '0 16px', cursor: 'pointer', whiteSpace: 'nowrap', width: '80px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Roll No</span>
                  {sortBy === 'roll_number' && (sortOrder === 'asc' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />)}
                </div>
              </th>

              <th 
                onClick={() => handleSort('name')}
                style={{ padding: '0 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Student Name</span>
                  {sortBy === 'name' && (sortOrder === 'asc' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />)}
                </div>
              </th>

              <th style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>Class & Section</th>
              
              <th 
                onClick={() => handleSort('admission_number')}
                style={{ padding: '0 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Admission No</span>
                  {sortBy === 'admission_number' && (sortOrder === 'asc' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />)}
                </div>
              </th>

              <th style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>Father / Guardian</th>
              <th style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>Contact Phone</th>
              <th style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '0 16px', whiteSpace: 'nowrap', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>

          {/* 1. Strict 38px Single-Line Rows, 6. Row Hover */}
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ height: '120px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Loading enrolled students roster...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ height: '120px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No students found matching current filters.
                </td>
              </tr>
            ) : (
              paginated.map((student) => {
                const isDropdownOpen = dropdownOpenId === student.id;
                return (
                  <tr
                    key={student.id}
                    onClick={() => onSelectStudent(student)}
                    style={{
                      height: '38px',
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: '12px',
                      color: '#0f172a',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ecfdf5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '0 16px', fontWeight: '700', color: '#064e3b', fontFamily: 'monospace' }}>
                      {student.roll_number || student.house || '—'}
                    </td>

                    <td style={{ padding: '0 16px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#ecfdf5',
                          color: '#064e3b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          {student.name ? student.name.slice(0, 1).toUpperCase() : 'S'}
                        </div>
                        <span>{student.name}</span>
                      </div>
                    </td>

                    <td style={{ padding: '0 16px', color: '#1e3a8a', fontWeight: '500' }}>
                      {student.class_name ? `${student.class_name} ${student.class_section || ''}` : 'General'}
                    </td>

                    <td style={{ padding: '0 16px', color: '#475569', fontFamily: 'monospace' }}>
                      {student.admission_number || '—'}
                    </td>

                    <td style={{ padding: '0 16px', color: '#334155' }}>
                      {student.father_name || '—'}
                    </td>

                    <td style={{ padding: '0 16px', color: '#64748b' }}>
                      {student.phone || '—'}
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
                        backgroundColor: student.status === 'active' ? '#ecfdf5' : '#fee2e2',
                        color: student.status === 'active' ? '#065f46' : '#991b1b'
                      }}>
                        {student.status === 'active' ? <IconCircleCheck size={12} /> : <IconCircleX size={12} />}
                        <span>{student.status === 'active' ? 'Enrolled' : 'Inactive'}</span>
                      </span>
                    </td>

                    <td 
                      style={{ padding: '0 16px', textAlign: 'center', position: 'relative' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setDropdownOpenId(isDropdownOpen ? null : student.id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: '#64748b',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                      >
                        <IconDotsVertical size={16} />
                      </button>

                      {isDropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          right: '16px',
                          top: '32px',
                          width: '150px',
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          border: '1px solid #e2e8f0',
                          zIndex: 50,
                          padding: '4px'
                        }}>
                          <button
                            onClick={() => {
                              setDropdownOpenId(null);
                              onSelectStudent(student);
                            }}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              textAlign: 'left',
                              border: 'none',
                              background: 'transparent',
                              fontSize: '12px',
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            View 360° Profile
                          </button>

                          <button
                            onClick={() => {
                              setDropdownOpenId(null);
                              onDeleteStudent(student.id);
                            }}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              textAlign: 'left',
                              border: 'none',
                              background: 'transparent',
                              fontSize: '12px',
                              color: '#dc2626',
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            Remove Record
                          </button>
                        </div>
                      )}
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
  );
}

