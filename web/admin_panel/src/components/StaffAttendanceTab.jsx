import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  Clock, 
  Search, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { exportToExcel } from '../utils/exportUtils';

export default function StaffAttendanceTab() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [roster, setRoster] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    leave: 0,
    half_day: 0,
    unmarked: 0
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingStaffId, setUpdatingStaffId] = useState(null);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/staff-attendance/admin/roster?date=${selectedDate}`);
      if (res.data?.success) {
        setRoster(res.data.data.roster || []);
        setStats(res.data.data.stats || { total: 0, present: 0, absent: 0, leave: 0, half_day: 0, unmarked: 0 });
      }
    } catch (err) {
      console.error('Failed to load staff roster:', err);
      toast.error(err.response?.data?.error?.message || 'Failed to load staff attendance roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [selectedDate]);

  const handleStatusOverride = async (staffId, newStatus) => {
    setUpdatingStaffId(staffId);
    try {
      const res = await api.post('/staff-attendance/admin/override', {
        staff_id: staffId,
        date: selectedDate,
        status: newStatus,
        remarks: 'Admin roster override'
      });
      if (res.data?.success) {
        toast.success(`Marked as ${newStatus}`);
        fetchRoster();
      }
    } catch (err) {
      console.error('Failed to override status:', err);
      toast.error(err.response?.data?.error?.message || 'Failed to update attendance status');
    } finally {
      setUpdatingStaffId(null);
    }
  };

  const filteredRoster = useMemo(() => {
    return roster.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || item.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'unmarked' ? item.status === 'Unmarked' : item.status?.toLowerCase() === statusFilter.toLowerCase());
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roster, searchQuery, roleFilter, statusFilter]);

  const formatTimeStr = (isoString) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '--:--';
    }
  };

  const handleExport = () => {
    const data = filteredRoster.map(s => ({
      'Staff Name': s.name,
      'Email': s.email || '--',
      'Role': s.role,
      'Date': selectedDate,
      'Status': s.status,
      'Check In': formatTimeStr(s.check_in_time),
      'Check Out': formatTimeStr(s.check_out_time),
      'Source': s.source || '--',
      'Remarks': s.remarks || '--'
    }));
    exportToExcel(data, `Staff_Attendance_${selectedDate}`);
  };

  const presentPercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* 4 KPI Tiles (Capped at 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Total Staff */}
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
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Staff</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.total}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>All active staff members</div>
        </div>

        {/* Present Today */}
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
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Present Today</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', color: '#10b981' }}>
            {stats.present} <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>({presentPercentage}%)</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Checked in or approved</div>
        </div>

        {/* On Leave */}
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
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>On Leave</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', color: '#f59e0b' }}>{stats.leave}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Approved leave applications</div>
        </div>

        {/* Unmarked / Absent */}
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
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unmarked</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserX size={18} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: '800', color: '#ef4444' }}>{stats.unmarked}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pending check-in punch</div>
        </div>
      </div>

      {/* Action Bar: Date Picker, Search, Filters, Refresh & Export */}
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
        {/* Left: Date Picker & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <Calendar size={16} color="var(--accent-primary)" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', minWidth: '220px' }}>
            <Search size={15} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search staff by name or email..."
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

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
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
            <option value="all">All Staff</option>
            <option value="teacher">Teachers</option>
            <option value="academic_manager">Academic Managers</option>
            <option value="finance">Finance / Accounts</option>
            <option value="admission">Admission Counselors</option>
            <option value="timetable">Timetable Incharges</option>
            <option value="tc">TC Incharges</option>
            <option value="teachers_manager">Teacher Managers</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="leave">Leave</option>
            <option value="half_day">Half Day</option>
            <option value="unmarked">Unmarked</option>
          </select>
        </div>

        {/* Right: Export & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={fetchRoster}
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
                <th style={{ padding: '0 1rem', fontWeight: '700', width: '280px' }}>Staff Member</th>
                <th style={{ padding: '0 1rem', fontWeight: '700', width: '130px' }}>Role</th>
                <th style={{ padding: '0 1rem', fontWeight: '700', width: '120px' }}>Check In</th>
                <th style={{ padding: '0 1rem', fontWeight: '700', width: '120px' }}>Check Out</th>
                <th style={{ padding: '0 1rem', fontWeight: '700', width: '120px' }}>Status</th>
                <th style={{ padding: '0 1rem', fontWeight: '700', width: '100px' }}>Source</th>
                <th style={{ padding: '0 1rem', fontWeight: '700', width: '180px' }}>Override Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                      <RefreshCw size={18} className="animate-spin" />
                      Loading staff roster...
                    </div>
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No staff records found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((staff, idx) => {
                  const isPresent = staff.status === 'Present';
                  const isLeave = staff.status === 'Leave';
                  const isAbsent = staff.status === 'Absent';
                  const isHalfDay = staff.status === 'Half-day';

                  const badgeBg = isPresent ? 'rgba(16, 185, 129, 0.15)' 
                    : isLeave ? 'rgba(245, 158, 11, 0.15)'
                    : isAbsent ? 'rgba(239, 68, 68, 0.15)'
                    : isHalfDay ? 'rgba(99, 102, 241, 0.15)'
                    : 'rgba(107, 114, 128, 0.15)';

                  const badgeColor = isPresent ? '#10b981'
                    : isLeave ? '#f59e0b'
                    : isAbsent ? '#ef4444'
                    : isHalfDay ? '#6366f1'
                    : '#9ca3af';

                  return (
                    <tr 
                      key={staff.staff_id}
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
                          {staff.avatar_url ? (
                            <img 
                              src={staff.avatar_url} 
                              alt={staff.name} 
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
                              {staff.name?.[0]?.toUpperCase() || 'S'}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>{staff.name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{staff.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '0 1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          background: 'var(--bg-primary)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--text-secondary)'
                        }}>
                          {staff.role?.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Check In */}
                      <td style={{ padding: '0 1rem', fontFamily: 'monospace', fontWeight: '600', color: staff.check_in_time ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {formatTimeStr(staff.check_in_time)}
                      </td>

                      {/* Check Out */}
                      <td style={{ padding: '0 1rem', fontFamily: 'monospace', fontWeight: '600', color: staff.check_out_time ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {formatTimeStr(staff.check_out_time)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          background: badgeBg,
                          color: badgeColor
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badgeColor }} />
                          {staff.status}
                        </span>
                      </td>

                      {/* Source */}
                      <td style={{ padding: '0 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {staff.source === 'self_app' ? '📱 Mobile App' : staff.source === 'admin_override' ? '💻 Admin Override' : '--'}
                      </td>

                      {/* Override Status Dropdown */}
                      <td style={{ padding: '0 1rem' }}>
                        <select
                          disabled={updatingStaffId === staff.staff_id}
                          value={staff.status}
                          onChange={(e) => handleStatusOverride(staff.staff_id, e.target.value)}
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            color: 'var(--text-primary)',
                            fontSize: '0.8rem',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Present">Mark Present</option>
                          <option value="Absent">Mark Absent</option>
                          <option value="Half-day">Mark Half-day</option>
                          <option value="Leave">Mark Leave</option>
                          <option value="Unmarked">Reset Unmarked</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Showing {filteredRoster.length} of {roster.length} staff records</span>
          <span>Single-line 38px rows · Auto-synchronized with mobile check-ins</span>
        </div>
      </div>
    </div>
  );
}

