import React, { useState } from 'react';
import { 
  IconBriefcase, 
  IconBuildingSkyscraper, 
  IconPhone, 
  IconMail, 
  IconMapPin, 
  IconUsers, 
  IconCalendar,
  IconSearch,
  IconCheck,
  IconClock
} from '@tabler/icons-react';

export default function ErpLeadsView() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('ckr_sa_token') || localStorage.getItem('sa_access_token');
      const q = new URLSearchParams();
      if (statusFilter !== 'all') q.set('status', statusFilter);
      if (search.trim()) q.set('search', search.trim());

      const res = await fetch(`/api/marketplace/erp-leads?${q.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load ERP leads', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads();
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Institutional ERP Purchase Leads
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
            Inbound demo inquiries and module requests submitted by school trustees, principals, and admins.
          </p>
        </div>
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#064e3b',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: '700',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <IconBriefcase size={18} />
          {leads.length} Total Inbound Requests
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '20px',
        backgroundColor: '#ffffff',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
          <IconSearch size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search school name, principal, city, phone..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '9px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#334155',
            outline: 'none',
            backgroundColor: '#ffffff'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="new">New Inquiries</option>
          <option value="contacted">Contacted</option>
          <option value="demo_scheduled">Demo Scheduled</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      {/* Leads Table / Cards */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading ERP demo inquiries...
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <IconBriefcase size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>No ERP Inquiries Found</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>New purchase leads submitted via the portal will appear here.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#064e3b', color: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>School & Location</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Contact Executive</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Student Strength</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Requested Modules</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Received At</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const modules = Array.isArray(lead.interested_modules) ? lead.interested_modules : [];
                return (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>{lead.school_name}</div>
                      {lead.city && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                          <IconMapPin size={13} /> {lead.city}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>
                        {lead.contact_person} {lead.designation && <span style={{ color: '#64748b', fontWeight: '500' }}>({lead.designation})</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#064e3b', fontWeight: '700', fontSize: '12px', marginTop: '3px' }}>
                        <IconPhone size={13} /> <a href={`tel:${lead.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{lead.phone}</a>
                      </div>
                      {lead.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                          <IconMail size={13} /> {lead.email}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155', fontWeight: '600' }}>
                      {lead.student_strength ? `${lead.student_strength} students` : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                        {modules.length > 0 ? modules.map((m, idx) => (
                          <span key={idx} style={{
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '2px 7px',
                            borderRadius: '4px'
                          }}>
                            {m}
                          </span>
                        )) : <span style={{ color: '#94a3b8' }}>All Suite</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: lead.status === 'new' ? '#dcfce7' : '#f1f5f9',
                        color: lead.status === 'new' ? '#166534' : '#475569',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        textTransform: 'uppercase'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: lead.status === 'new' ? '#22c55e' : '#94a3b8' }} />
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px' }}>
                      {new Date(lead.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
