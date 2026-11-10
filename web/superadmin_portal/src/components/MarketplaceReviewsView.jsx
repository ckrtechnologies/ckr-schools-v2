import React, { useState } from 'react';
import { 
  useGetMarketplaceReviewsQuery, 
  useUpdateMarketplaceReviewStatusMutation, 
  useDeleteMarketplaceReviewMutation,
  useGetTenantsQuery 
} from '../store/superadminApi.js';
import { 
  IconStar, 
  IconCheck, 
  IconX, 
  IconTrash, 
  IconFilter, 
  IconMessageCircle, 
  IconShieldCheck,
  IconClock
} from '@tabler/icons-react';

export default function MarketplaceReviewsView() {
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: tenantsData } = useGetTenantsQuery({ limit: 100 });
  const schools = tenantsData?.data || [];

  const { data: reviewsData, isLoading, refetch } = useGetMarketplaceReviewsQuery({
    tenantId: selectedSchool,
    isApproved: selectedStatus === 'all' ? undefined : selectedStatus === 'approved' ? true : false
  });

  const [updateStatus, { isLoading: isUpdating }] = useUpdateMarketplaceReviewStatusMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteMarketplaceReviewMutation();

  const reviews = reviewsData?.data || [];
  const stats = reviewsData?.stats || { total: 0, approved_count: 0, pending_count: 0 };

  const handleToggleApproval = async (id, currentStatus) => {
    try {
      await updateStatus({ id, is_approved: !currentStatus }).unwrap();
      refetch();
    } catch (err) {
      alert('Failed to update review status: ' + (err.data?.error?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this parent review? This action cannot be undone.')) {
      try {
        await deleteReview(id).unwrap();
        refetch();
      } catch (err) {
        alert('Failed to delete review: ' + (err.data?.error?.message || err.message));
      }
    }
  };

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#f59e0b' }}>
        {[...Array(5)].map((_, i) => (
          <IconStar 
            key={i} 
            size={13} 
            fill={i < rating ? '#f59e0b' : 'transparent'} 
            color="#f59e0b" 
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Marketplace Review Moderation Desk
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Moderate and curate authentic 5-axis parent ratings and testimonials across verified campuses.
          </p>
        </div>
      </div>

      {/* 3 KPI Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total Reviews</span>
            <span style={{ padding: '4px', borderRadius: '6px', background: '#f1f5f9', color: '#0f172a' }}>
              <IconMessageCircle size={16} />
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '8px' }}>
            {stats.total || 0}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Submitted across all schools</span>
        </div>

        <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Live & Published</span>
            <span style={{ padding: '4px', borderRadius: '6px', background: '#ecfdf5', color: '#059669' }}>
              <IconShieldCheck size={16} />
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '8px' }}>
            {stats.approved_count || 0}
          </div>
          <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>Active on public marketplace</span>
        </div>

        <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Pending Moderation</span>
            <span style={{ padding: '4px', borderRadius: '6px', background: '#fffbeb', color: '#d97706' }}>
              <IconClock size={16} />
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706', marginTop: '8px' }}>
            {stats.pending_count || 0}
          </div>
          <span style={{ fontSize: '11px', color: '#d97706', fontWeight: '600' }}>Awaiting editorial approval</span>
        </div>
      </div>

      {/* Filters Dock */}
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '12px 16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
          <IconFilter size={16} /> Filter by:
        </div>

        <select
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            background: '#fff',
            color: '#0f172a'
          }}
        >
          <option value="all">All Schools</option>
          {schools.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            background: '#fff',
            color: '#0f172a'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="approved">Approved & Live</option>
          <option value="pending">Pending / Hidden</option>
        </select>
      </div>

      {/* CKR Standard 5-Standard Tabular Table */}
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{
                background: '#064e3b',
                color: '#fff',
                height: '38px',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <th style={{ padding: '0 12px', width: '100px' }}>Date</th>
                <th style={{ padding: '0 12px', width: '160px' }}>Reviewer</th>
                <th style={{ padding: '0 12px', width: '160px' }}>School</th>
                <th style={{ padding: '0 12px', width: '110px' }}>Rating</th>
                <th style={{ padding: '0 12px' }}>Review Snippet</th>
                <th style={{ padding: '0 12px', width: '90px' }}>Status</th>
                <th style={{ padding: '0 12px', width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Loading parent reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No reviews match the selected filters.
                  </td>
                </tr>
              ) : (
                reviews.map((r, idx) => {
                  const dateStr = new Date(r.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr 
                      key={r.id} 
                      style={{ 
                        height: '38px',
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8fafc'}
                    >
                      <td style={{ padding: '0 12px', color: '#64748b', whiteSpace: 'nowrap', fontSize: '12px' }}>
                        {dateStr}
                      </td>

                      <td style={{ padding: '0 12px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{r.reviewer_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {r.relationship || 'Parent'} {r.is_verified && <span style={{ color: '#059669', fontWeight: '700' }}>✓ Verified</span>}
                        </div>
                      </td>

                      <td style={{ padding: '0 12px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{r.school_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{r.school_city}</div>
                      </td>

                      <td style={{ padding: '0 12px', whiteSpace: 'nowrap' }}>
                        {renderStars(r.overall_rating)}
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a', marginLeft: '4px' }}>
                          {r.overall_rating}.0
                        </span>
                      </td>

                      <td style={{ padding: '0 12px', maxWidth: '350px' }}>
                        {r.title && <span style={{ fontWeight: '700', color: '#0f172a', marginRight: '6px' }}>"{r.title}"</span>}
                        <span style={{ color: '#475569', fontSize: '12px' }}>
                          {r.review_text?.length > 90 ? r.review_text.substring(0, 90) + '...' : r.review_text}
                        </span>
                      </td>

                      <td style={{ padding: '0 12px', whiteSpace: 'nowrap' }}>
                        {r.is_approved ? (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0'
                          }}>
                            ● Live
                          </span>
                        ) : (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: '#fffbeb',
                            color: '#d97706',
                            border: '1px solid #fde68a'
                          }}>
                            ● Hidden
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleToggleApproval(r.id, r.is_approved)}
                            title={r.is_approved ? 'Hide from public marketplace' : 'Approve for public marketplace'}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: r.is_approved ? '1px solid #fca5a5' : '1px solid #86efac',
                              background: r.is_approved ? '#fef2f2' : '#f0fdf4',
                              color: r.is_approved ? '#dc2626' : '#16a34a',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            {r.is_approved ? <IconX size={12} /> : <IconCheck size={12} />}
                            {r.is_approved ? 'Hide' : 'Approve'}
                          </button>

                          <button
                            onClick={() => handleDelete(r.id)}
                            title="Permanently delete review"
                            style={{
                              padding: '4px 6px',
                              borderRadius: '4px',
                              border: '1px solid #e2e8f0',
                              background: '#fff',
                              color: '#94a3b8',
                              cursor: 'pointer'
                            }}
                          >
                            <IconTrash size={12} />
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
      </div>
    </div>
  );
}

