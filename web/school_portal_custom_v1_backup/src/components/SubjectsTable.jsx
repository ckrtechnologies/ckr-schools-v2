import React, { useState } from 'react';
import { 
  IconSearch, 
  IconPlus, 
  IconFileSpreadsheet, 
  IconFileText, 
  IconArrowUp, 
  IconArrowDown,
  IconTrash,
  IconBook2,
  IconX,
  IconCheck
} from '@tabler/icons-react';

export default function SubjectsTable({
  subjects = [],
  isLoading,
  onCreateSubject,
  onDeleteSubject
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // CKR 5 Standard default: 50

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [category, setCategory] = useState('Scholastic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Sort
  const filtered = subjects.filter((s) => {
    const matchesSearch = s.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    const valA = (a[sortBy] || '').toLowerCase();
    const valB = (b[sortBy] || '').toLowerCase();
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

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateSubject({ name: subjectName.trim(), category });
      setSubjectName('');
      setCategory('Scholastic');
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to add subject: ' + (err.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Subject Name', 'Category', 'Created Date'];
    const rows = filtered.map(s => [
      `"${s.name}"`,
      `"${s.category || 'Scholastic'}"`,
      `"${s.created_at ? s.created_at.slice(0, 10) : ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ckr_subjects_export_${new Date().toISOString().slice(0, 10)}.csv`);
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
              placeholder="Search subjects..."
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
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
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
            <option value="all">All Categories</option>
            <option value="Scholastic">Scholastic (Core)</option>
            <option value="Co-Scholastic">Co-Scholastic (Arts/Sports)</option>
            <option value="Vocational">Vocational / Skill</option>
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
            onClick={() => setIsModalOpen(true)}
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
            <span>Add Subject</span>
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
          {/* 2. Solid Brand Header: #064e3b solid background with bold uppercase white text */}
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
                  <span>Subject Name</span>
                  {sortBy === 'name' && (sortOrder === 'asc' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />)}
                </div>
              </th>

              <th 
                onClick={() => handleSort('category')}
                style={{ padding: '0 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Category</span>
                  {sortBy === 'category' && (sortOrder === 'asc' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />)}
                </div>
              </th>

              <th style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>Department</th>
              <th style={{ padding: '0 16px', whiteSpace: 'nowrap', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>

          {/* 1. Strict 38px Single-Line Rows, 6. Row Hover */}
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" style={{ height: '120px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Loading subject master list...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ height: '120px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No subjects found. Click "Add Subject" to create one.
                </td>
              </tr>
            ) : (
              paginated.map((subj) => (
                <tr
                  key={subj.id}
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
                      <IconBook2 size={16} color="#064e3b" />
                      <span>{subj.name}</span>
                    </div>
                  </td>

                  <td style={{ padding: '0 16px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: subj.category === 'Co-Scholastic' ? '#eff6ff' : '#f0fdf4',
                      color: subj.category === 'Co-Scholastic' ? '#1d4ed8' : '#15803d'
                    }}>
                      {subj.category || 'Scholastic'}
                    </span>
                  </td>

                  <td style={{ padding: '0 16px', color: '#64748b' }}>
                    Academic Faculty
                  </td>

                  <td style={{ padding: '0 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => onDeleteSubject(subj.id)}
                      title="Delete Subject"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
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

      {/* Add Subject Modal */}
      {isModalOpen && (
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
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                Add New Subject
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubject}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics, Physics, English Core"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="Scholastic">Scholastic (Major)</option>
                  <option value="Co-Scholastic">Co-Scholastic (Arts/Physical Ed)</option>
                  <option value="Vocational">Vocational / IT / Skill</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '13px',
                    cursor: 'pointer'
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
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  <IconCheck size={16} />
                  <span>{isSubmitting ? 'Adding...' : 'Add Subject'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

