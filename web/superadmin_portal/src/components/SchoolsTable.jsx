import React, { useState } from 'react';
import { 
  IconSearch, 
  IconPlus, 
  IconFileSpreadsheet, 
  IconFileText, 
  IconArrowUp, 
  IconArrowDown,
  IconDotsVertical,
  IconCircleCheck,
  IconCircleX,
  IconEdit,
  IconTrash,
  IconEye,
  IconExternalLink,
  IconStar
} from '@tabler/icons-react';
import { getSchoolPortalUrl, resolveAssetUrl } from '../utils/urlHelper.js';

export default function SchoolsTable({
  schools = [],
  pagination = {},
  isLoading,
  search,
  onSearchChange,
  planFilter,
  onPlanFilterChange,
  page,
  onPageChange,
  limit,
  onLimitChange,
  sortBy,
  sortOrder,
  onSortChange,
  onOpenOnboard,
  onSelectSchool,
  onEditSchool,
  onDeleteSchool,
  onToggleStatus,
  onToggleFeatured
}) {
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  const handleSort = (column) => {
    if (sortBy === column) {
      onSortChange(column, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(column, 'asc');
    }
  };

  const exportCSV = () => {
    if (!schools.length) return;
    const headers = ['School Name', 'Slug', 'Board', 'Plan Tier', 'City', 'Students', 'Status'];
    const rows = schools.map(s => [
      `"${s.name}"`,
      `"${s.slug}"`,
      `"${s.affiliation_board}"`,
      `"${s.plan_tier}"`,
      `"${s.city || ''}"`,
      s.student_count || 0,
      s.is_active ? 'Active' : 'Suspended'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ckr_schools_export_${new Date().toISOString().slice(0, 10)}.csv`);
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
            maxWidth: '340px'
          }}>
            <IconSearch size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search school name, slug, or city..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
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

          
        </div>

        {/* Right: Actions (Onboard + Export CSV / PDF) */}
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
            onClick={onOpenOnboard}
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
            <span>Onboard School</span>
          </button>
        </div>
      </div>

      {/* Tabular Table (CKR 5 Standards) */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left'
        }}>
          {/* 2. Solid Brand Header: #064e3b background, bold uppercase white text */}
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
                  <span>School Name</span>
                  {sortBy === 'name' && (sortOrder === 'asc' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />)}
                </div>
              </th>

              <th 
                onClick={() => handleSort('slug')}
                style={{ padding: '0 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Subdomain / Slug</span>
                  {sortBy === 'slug' && (sortOrder === 'asc' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />)}
                </div>
              </th>

              <th style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>Board</th>
              
              

              <th style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>Location</th>
              <th style={{ padding: '0 16px', whiteSpace: 'nowrap', textAlign: 'right' }}>Students</th>
              <th style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '0 16px', whiteSpace: 'nowrap', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>

          {/* Table Body (1. Strict 38px Single-Line Rows, 6. Row Hover) */}
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ height: '120px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Loading school tenants...
                </td>
              </tr>
            ) : schools.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ height: '120px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No school tenants found matching current filters.
                </td>
              </tr>
            ) : (
              schools.map((school) => {
                const isDropdownOpen = dropdownOpenId === school.id;
                return (
                  <tr
                    key={school.id}
                    onClick={() => onSelectSchool(school)}
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
                    <td style={{ padding: '0 16px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(school.logo_url || school.logoUrl) ? (
                          <img 
                            src={resolveAssetUrl(school.logo_url || school.logoUrl)} 
                            alt={school.name} 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'inline-block';
                            }}
                            style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} 
                          />
                        ) : null}
                        <span style={{
                          display: (school.logo_url || school.logoUrl) ? 'none' : 'inline-block',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: school.theme_color || '#064e3b',
                          flexShrink: 0
                        }}></span>
                        <span>{school.name}</span>
                      </div>
                    </td>

                    <td style={{ padding: '0 16px' }} onClick={(e) => e.stopPropagation()}>
                      <a
                        href={getSchoolPortalUrl(school.slug)}
                        target="_blank"
                        rel="noreferrer"
                        title={`Launch ${school.name} Admin Portal`}
                        style={{
                          color: '#0284c7',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: '600'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        <span>{school.slug}.ckrschools.online</span>
                        <IconExternalLink size={12} color="#0284c7" />
                      </a>
                    </td>

                    <td style={{ padding: '0 16px', color: '#475569' }}>
                      {school.affiliation_board || 'CBSE'}
                    </td>

                    <td style={{ padding: '0 16px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: school.plan_tier === 'ENTERPRISE_AI' ? '#fdf4ff' : school.plan_tier === 'PRO_CAMPUS' ? '#eff6ff' : '#f0fdf4',
                        color: school.plan_tier === 'ENTERPRISE_AI' ? '#9333ea' : school.plan_tier === 'PRO_CAMPUS' ? '#1d4ed8' : '#15803d'
                      }}>
                        {school.plan_tier?.replace('_', ' ')}
                      </span>
                    </td>

                    <td style={{ padding: '0 16px', color: '#64748b' }}>
                      {school.city ? `${school.city}, ${school.state || ''}` : '—'}
                    </td>

                    <td style={{ padding: '0 16px', textAlign: 'right', fontWeight: '600' }}>
                      {(school.student_count || 0).toLocaleString('en-IN')}
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
                        backgroundColor: school.is_active ? '#ecfdf5' : '#fee2e2',
                        color: school.is_active ? '#065f46' : '#991b1b'
                      }}>
                        {school.is_active ? <IconCircleCheck size={12} /> : <IconCircleX size={12} />}
                        <span>{school.is_active ? 'Active' : 'Suspended'}</span>
                      </span>
                    </td>

                    <td 
                      style={{ padding: '0 16px', textAlign: 'center', position: 'relative' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => onToggleFeatured && onToggleFeatured(school.id, school.is_featured)}
                          title={school.is_featured ? 'Featured on Marketplace (Click to unfeature)' : 'Click to feature on Marketplace'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '3px 7px',
                            backgroundColor: school.is_featured ? '#fef3c7' : '#f8fafc',
                            color: school.is_featured ? '#b45309' : '#94a3b8',
                            border: school.is_featured ? '1px solid #fde68a' : '1px solid #e2e8f0',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          <IconStar size={12} fill={school.is_featured ? '#f59e0b' : 'transparent'} color={school.is_featured ? '#f59e0b' : '#94a3b8'} />
                          <span>{school.is_featured ? 'Featured' : 'Standard'}</span>
                        </button>

                        <a
                          href={getSchoolPortalUrl(school.slug)}
                          target="_blank"
                          rel="noreferrer"
                          title={`Launch ${school.name} Admin Portal`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            backgroundColor: '#ecfdf5',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textDecoration: 'none'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d1fae5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ecfdf5'}
                        >
                          <span>Launch</span>
                          <IconExternalLink size={12} />
                        </a>

                        <button
                          onClick={() => setDropdownOpenId(isDropdownOpen ? null : school.id)}
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
                      </div>

                      {isDropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          right: '16px',
                          top: '32px',
                          width: '185px',
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                          border: '1px solid #e2e8f0',
                          zIndex: 50,
                          padding: '4px'
                        }}>
                          <a
                            href={getSchoolPortalUrl(school.slug)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setDropdownOpenId(null)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              textAlign: 'left',
                              fontSize: '12px',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#065f46',
                              fontWeight: '600',
                              textDecoration: 'none',
                              boxSizing: 'border-box'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ecfdf5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <IconExternalLink size={14} color="#059669" />
                            <span>Launch Admin Portal</span>
                          </a>
                          <button
                            onClick={() => {
                              setDropdownOpenId(null);
                              onSelectSchool(school);
                            }}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              textAlign: 'left',
                              border: 'none',
                              background: 'transparent',
                              fontSize: '12px',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#334155'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <IconEye size={14} color="#64748b" />
                            <span>View Details</span>
                          </button>

                          <button
                            onClick={() => {
                              setDropdownOpenId(null);
                              if (onEditSchool) onEditSchool(school);
                            }}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              textAlign: 'left',
                              border: 'none',
                              background: 'transparent',
                              fontSize: '12px',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#0369a1'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <IconEdit size={14} color="#0284c7" />
                            <span>Edit School</span>
                          </button>

                          <button
                            onClick={() => {
                              setDropdownOpenId(null);
                              onToggleStatus(school.id, !school.is_active);
                            }}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              textAlign: 'left',
                              border: 'none',
                              background: 'transparent',
                              fontSize: '12px',
                              color: school.is_active ? '#d97706' : '#16a34a',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fefce8'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {school.is_active ? <IconCircleX size={14} /> : <IconCircleCheck size={14} />}
                            <span>{school.is_active ? 'Suspend School' : 'Activate School'}</span>
                          </button>

                          <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />

                          <button
                            onClick={() => {
                              setDropdownOpenId(null);
                              if (onDeleteSchool) onDeleteSchool(school);
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
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <IconTrash size={14} color="#dc2626" />
                            <span>Delete School</span>
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
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
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
            Showing {schools.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, pagination.total || 0)} of {pagination.total || 0}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
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
          <span>Page {page} of {pagination.totalPages || 1}</span>
          <button
            disabled={page >= (pagination.totalPages || 1)}
            onClick={() => onPageChange(page + 1)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: page >= (pagination.totalPages || 1) ? '#f1f5f9' : '#ffffff',
              color: page >= (pagination.totalPages || 1) ? '#94a3b8' : '#334155',
              cursor: page >= (pagination.totalPages || 1) ? 'not-allowed' : 'pointer',
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

