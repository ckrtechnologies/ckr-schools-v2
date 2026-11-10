import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Download, 
  Filter, 
  Check, 
  X,
  User,
  MessageSquare,
  FileSpreadsheet,
  Settings
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { exportToExcel } from '../utils/exportUtils';

export default function StaffLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Pending'); // 'All', 'Pending', 'Approved', 'Rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Review modal state
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'Approved' | 'Rejected'
  const [adminRemarks, setAdminRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Policy Settings modal state
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    academic_year: '2026-27',
    casual_leave_annual: 12,
    sick_leave_annual: 10,
    earned_leave_annual: 15,
    max_consecutive_days: 3,
    require_doc_for_sick_days: 2,
    notice_days_casual: 1,
    apply_to_existing_staff: true
  });

  const fetchPolicy = async () => {
    setLoadingPolicy(true);
    try {
      const res = await api.get('/staff-leaves/admin/policy?academicYear=2026-27');
      if (res.data?.success && res.data.data) {
        setPolicyForm(prev => ({
          ...prev,
          ...res.data.data,
          apply_to_existing_staff: true
        }));
      }
    } catch (err) {
      console.error('Failed to fetch leave policy:', err);
    } finally {
      setLoadingPolicy(false);
    }
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      const res = await api.post('/staff-leaves/admin/policy', policyForm);
      if (res.data?.success) {
        toast.success(res.data.message || 'Leave policy updated successfully!');
        setPolicyModalOpen(false);
        fetchLeaves();
      }
    } catch (err) {
      console.error('Failed to update leave policy:', err);
      toast.error(err.response?.data?.error?.message || 'Failed to update leave policy');
    } finally {
      setSavingPolicy(false);
    }
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/staff-leaves/admin/list?status=${activeTab}`);
      if (res.data?.success) {
        setLeaves(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load leaves:', err);
      toast.error(err.response?.data?.error?.message || 'Failed to load staff leave applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchPolicy();
  }, [activeTab]);

  const stats = useMemo(() => {
    const pending = leaves.filter(l => l.status === 'Pending').length;
    const approved = leaves.filter(l => l.status === 'Approved').length;
    const rejected = leaves.filter(l => l.status === 'Rejected').length;
    return {
      total: leaves.length,
      pending,
      approved,
      rejected
    };
  }, [leaves]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter(item => {
      const matchesSearch = !searchQuery || 
        item.staff_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.staff_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || item.leave_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [leaves, searchQuery, typeFilter]);

  const openReviewModal = (leave, action) => {
    setSelectedLeave(leave);
    setReviewAction(action);
    setAdminRemarks(action === 'Approved' ? 'Approved by Administration' : 'Unable to approve due to scheduling constraints');
  };

  const closeReviewModal = () => {
    setSelectedLeave(null);
    setReviewAction(null);
    setAdminRemarks('');
  };

  const handleConfirmReview = async () => {
    if (!selectedLeave || !reviewAction) return;
    setIsSubmitting(true);
    try {
      const res = await api.post(`/staff-leaves/admin/${selectedLeave.id}/review`, {
        status: reviewAction,
        admin_remarks: adminRemarks
      });
      if (res.data?.success) {
        toast.success(`Leave application marked as ${reviewAction}!`);
        closeReviewModal();
        fetchLeaves();
      }
    } catch (err) {
      console.error('Failed to review leave:', err);
      toast.error(err.response?.data?.error?.message || 'Failed to review leave application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateStr = (dStr) => {
    if (!dStr) return '--';
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dStr;
    }
  };

  const handleExport = () => {
    const data = filteredLeaves.map(l => ({
      'Staff Name': l.staff_name,
      'Staff Email': l.staff_email || '--',
      'Role': l.staff_role,
      'Leave Type': l.leave_type,
      'Start Date': l.start_date,
      'End Date': l.end_date,
      'Days': l.days_count,
      'Reason': l.reason,
      'Status': l.status,
      'Applied On': formatDateStr(l.created_at),
      'Reviewed By': l.reviewed_by_name || '--',
      'Admin Remarks': l.admin_remarks || '--'
    }));
    exportToExcel(data, `Staff_Leaves_${activeTab}`);
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', padding: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Staff Leave Approvals Desk
            </h1>
            <span style={{ 
              background: 'rgba(245, 158, 11, 0.15)', 
              color: '#d97706', 
              fontSize: '0.8rem', 
              fontWeight: '700', 
              padding: '0.2rem 0.65rem', 
              borderRadius: '20px' 
            }}>
              {stats.pending} Action Required
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Review, approve or reject faculty leave applications. Approvals auto-mark daily staff attendance records.
          </p>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '3px' }}>
          {['Pending', 'Approved', 'Rejected', 'All'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                background: activeTab === tab ? 'var(--accent-light)' : 'transparent',
                border: 'none',
                fontWeight: activeTab === tab ? '700' : '500',
                cursor: 'pointer',
                color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: '0.82rem',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 4 KPI Tiles (Capped at 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Pending Requests */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending Reviews</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', color: '#f59e0b' }}>{stats.pending}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Awaiting administration review</div>
        </div>

        {/* Approved */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Approved</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', color: '#10b981' }}>{stats.approved}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Leaves sanctioned & deducted</div>
        </div>

        {/* Rejected */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rejected</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={18} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', color: '#ef4444' }}>{stats.rejected}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Declined with remarks</div>
        </div>

        {/* Total Applications */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total History</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.total}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Applications this academic year</div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'var(--bg-secondary)',
        padding: '0.85rem 1.25rem',
        borderRadius: '10px',
        border: '1px solid var(--glass-border)'
      }}>
        {/* Search & Leave Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', minWidth: '260px' }}>
            <Search size={15} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search by staff name, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                width: '100%'
              }}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '0.45rem 0.75rem',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Leave Types</option>
            <option value="Casual Leave">Casual Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Earned Leave">Earned Leave</option>
            <option value="Half Day">Half Day</option>
            <option value="Unpaid Leave">Unpaid Leave</option>
          </select>
        </div>

        {/* Right Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setPolicyModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--bg-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Settings size={14} color="#f59e0b" />
            Leave Policy
          </button>

          <button
            onClick={fetchLeaves}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--bg-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '0.45rem 0.75rem',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={handleExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--accent-primary)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Download size={14} />
            Export Excel
          </button>
        </div>
      </div>

      {/* CKR 5-Standard Tabular Table (38px single-line rows, solid brand header) */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--brand-header-bg, #047857)', color: '#ffffff', height: '40px' }}>
                <th style={{ padding: '0 1rem', fontWeight: '700', width: '260px' }}>Staff Member</th>
                <th style={{ padding: '0 1rem', fontWeight: '700', width: '130px' }}>Leave Type</th>
                <th style={{ padding: '0 1rem', fontWeight: '700', width: '200px' }}>Dates & Duration</th>
                <th style={{ padding: '0 1rem', fontWeight: '700' }}>Reason</th>
                <th style={{ padding: '0 1rem', fontWeight: '700', width: '120px' }}>Applied On</th>
                <th style={{ padding: '0 1rem', fontWeight: '700', width: '110px' }}>Status</th>
                <th style={{ padding: '0 1rem', fontWeight: '700', width: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                      <RefreshCw size={18} className="animate-spin" />
                      Loading leave applications...
                    </div>
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No leave applications found in {activeTab} view.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave, idx) => {
                  const isPending = leave.status === 'Pending';
                  const isApproved = leave.status === 'Approved';
                  const isRejected = leave.status === 'Rejected';

                  const badgeBg = isApproved ? 'rgba(16, 185, 129, 0.15)' 
                    : isPending ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)';

                  const badgeColor = isApproved ? '#10b981'
                    : isPending ? '#f59e0b'
                    : '#ef4444';

                  return (
                    <tr 
                      key={leave.id}
                      style={{
                        height: '38px',
                        borderBottom: '1px solid var(--glass-border)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Staff Member */}
                      <td style={{ padding: '0 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {leave.avatar_url ? (
                            <img 
                              src={leave.avatar_url} 
                              alt={leave.staff_name} 
                              style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <div style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: 'var(--accent-primary)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '0.75rem'
                            }}>
                              {leave.staff_name?.[0]?.toUpperCase() || 'S'}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>{leave.staff_name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{leave.staff_role}</span>
                          </div>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td style={{ padding: '0 1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#6366f1',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px'
                        }}>
                          {leave.leave_type}
                        </span>
                      </td>

                      {/* Dates & Duration */}
                      <td style={{ padding: '0 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {formatDateStr(leave.start_date)}
                            {leave.start_date !== leave.end_date && ` - ${formatDateStr(leave.end_date)}`}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            {leave.days_count}d
                          </span>
                        </div>
                      </td>

                      {/* Reason */}
                      <td style={{ padding: '0 1rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={leave.reason}>
                        <span style={{ color: 'var(--text-secondary)' }}>{leave.reason}</span>
                      </td>

                      {/* Applied On */}
                      <td style={{ padding: '0 1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {formatDateStr(leave.created_at)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '12px',
                          background: badgeBg,
                          color: badgeColor
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badgeColor }} />
                          {leave.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0 1rem' }}>
                        {isPending ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              onClick={() => openReviewModal(leave, 'Approved')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: '#10b981',
                                border: 'none',
                                color: '#ffffff',
                                padding: '0.25rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              <Check size={12} />
                              Approve
                            </button>
                            <button
                              onClick={() => openReviewModal(leave, 'Rejected')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                padding: '0.25rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              <X size={12} />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            <span>Reviewed by {leave.reviewed_by_name || 'Admin'}</span>
                            {leave.admin_remarks && (
                              <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>"{leave.admin_remarks}"</span>
                            )}
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
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Showing {filteredLeaves.length} of {leaves.length} applications</span>
          <span>Single-line 38px rows · Automatic balance deduction & attendance sync</span>
        </div>
      </div>

      {/* Review Modal */}
      {selectedLeave && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--glass-border)',
            width: '100%',
            maxWidth: '480px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: reviewAction === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {reviewAction === 'Approved' ? <Check size={18} color="#10b981" /> : <X size={18} color="#ef4444" />}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {reviewAction === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
                </h3>
              </div>
              <button onClick={closeReviewModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Leave Details Card */}
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '10px',
              padding: '1rem',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Staff Member:</span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{selectedLeave.staff_name} ({selectedLeave.staff_role})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Leave Type:</span>
                <span style={{ fontWeight: '700', color: '#6366f1' }}>{selectedLeave.leave_type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Duration:</span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                  {selectedLeave.start_date} to {selectedLeave.end_date} ({selectedLeave.days_count} Days)
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.25rem', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Reason:</span>
                <span style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>"{selectedLeave.reason}"</span>
              </div>
            </div>

            {/* Admin Remarks Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Admin Remarks / Note for Teacher:
              </label>
              <textarea
                rows={3}
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Enter remarks (visible to applicant)..."
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.75rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            {reviewAction === 'Approved' && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.78rem',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle2 size={16} />
                <span>Approving will deduct leave balance and mark daily attendance as "Leave".</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                onClick={closeReviewModal}
                disabled={isSubmitting}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                disabled={isSubmitting}
                style={{
                  background: reviewAction === 'Approved' ? '#10b981' : '#ef4444',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1.25rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {isSubmitting && <RefreshCw size={14} className="animate-spin" />}
                Confirm {reviewAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Policy & Quota Settings Modal */}
      {policyModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--glass-border)',
            width: '100%',
            maxWidth: '560px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Settings size={18} color="#f59e0b" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    Leave Policy & Annual Quotas
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Academic Year {policyForm.academic_year} · School Policy Settings
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setPolicyModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              {/* Annual Quota Inputs */}
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Annual Quotas per Staff Member (Days / Year)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {/* Casual Leave */}
                  <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#6366f1', marginBottom: '0.35rem' }}>
                      Casual Leave (CL)
                    </label>
                    <input 
                      type="number"
                      min={0}
                      max={60}
                      value={policyForm.casual_leave_annual}
                      onChange={(e) => setPolicyForm({ ...policyForm, casual_leave_annual: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Standard: 12 days</span>
                  </div>

                  {/* Sick Leave */}
                  <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#ef4444', marginBottom: '0.35rem' }}>
                      Sick Leave (SL)
                    </label>
                    <input 
                      type="number"
                      min={0}
                      max={60}
                      value={policyForm.sick_leave_annual}
                      onChange={(e) => setPolicyForm({ ...policyForm, sick_leave_annual: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Standard: 10 days</span>
                  </div>

                  {/* Earned Leave */}
                  <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#3b82f6', marginBottom: '0.35rem' }}>
                      Earned Leave (EL)
                    </label>
                    <input 
                      type="number"
                      min={0}
                      max={60}
                      value={policyForm.earned_leave_annual}
                      onChange={(e) => setPolicyForm({ ...policyForm, earned_leave_annual: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                      required
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Standard: 15 days</span>
                  </div>
                </div>
              </div>

              {/* Policy Rules */}
              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Institutional Rules
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      Max Consecutive Days
                    </label>
                    <input 
                      type="number"
                      min={1}
                      max={30}
                      value={policyForm.max_consecutive_days}
                      onChange={(e) => setPolicyForm({ ...policyForm, max_consecutive_days: parseInt(e.target.value) || 1 })}
                      style={{
                        width: '100%',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '6px',
                        padding: '0.35rem 0.6rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      Doctor's Note Required If Sick &gt;
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input 
                        type="number"
                        min={1}
                        max={10}
                        value={policyForm.require_doc_for_sick_days}
                        onChange={(e) => setPolicyForm({ ...policyForm, require_doc_for_sick_days: parseInt(e.target.value) || 1 })}
                        style={{
                          width: '70px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '6px',
                          padding: '0.35rem 0.6rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bulk Update Option */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem'
              }}>
                <input 
                  type="checkbox"
                  id="apply_existing"
                  checked={policyForm.apply_to_existing_staff}
                  onChange={(e) => setPolicyForm({ ...policyForm, apply_to_existing_staff: e.target.checked })}
                  style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                />
                <label htmlFor="apply_existing" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', cursor: 'pointer', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: '700' }}>Apply to all existing faculty members</span>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Will recalculate remaining balance quotas for active staff for academic year {policyForm.academic_year}.
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setPolicyModalOpen(false)}
                  disabled={savingPolicy}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPolicy}
                  style={{
                    background: 'var(--accent-primary)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1.25rem',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {savingPolicy && <RefreshCw size={14} className="animate-spin" />}
                  Save Policy Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

