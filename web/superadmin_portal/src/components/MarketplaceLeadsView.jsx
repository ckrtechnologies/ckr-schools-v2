import React, { useState } from 'react';
import { 
  IconTarget, 
  IconUsers, 
  IconFileText, 
  IconCurrencyRupee, 
  IconSearch, 
  IconFilter, 
  IconDownload, 
  IconExternalLink, 
  IconEye, 
  IconSchool,
  IconCheck,
  IconFileSpreadsheet
} from '@tabler/icons-react';
import { 
  useGetMarketplaceLeadsQuery, 
  useUpdateMarketplaceLeadMutation,
  useTransferMarketplaceLeadMutation,
  useGetTenantsQuery 
} from '../store/superadminApi.js';
import LeadDetailModal from './LeadDetailModal.jsx';
import SchoolDossierModal from './SchoolDossierModal.jsx';

function formatIndianNumber(val) {
  if (val === undefined || val === null) return '0';
  return Number(val).toLocaleString('en-IN');
}

function formatPaiseToRupees(paise) {
  if (!paise) return '₹0';
  const rupees = Math.round(Number(paise) / 100);
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export default function MarketplaceLeadsView() {
  const [selectedTenantId, setSelectedTenantId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50); // CKR standard 50-row pagination default

  const [activeLead, setActiveLead] = useState(null);
  const [dossierTenantId, setDossierTenantId] = useState(null);

  // Fetch school tenants for filter dropdown
  const { data: tenantsResponse } = useGetTenantsQuery({ limit: 100 });
  const schools = tenantsResponse?.data || [];

  // Fetch leads
  const { data: leadsResponse, isLoading } = useGetMarketplaceLeadsQuery({
    tenantId: selectedTenantId,
    status: statusFilter,
    leadType: leadTypeFilter,
    search,
    page,
    limit
  });

  const [updateLead, { isLoading: isUpdating }] = useUpdateMarketplaceLeadMutation();
  const [transferLead, { isLoading: isTransferring }] = useTransferMarketplaceLeadMutation();

  const leads = leadsResponse?.data || [];
  const stats = leadsResponse?.stats || {};
  const pagination = leadsResponse?.pagination || {};

  const handleUpdateLead = async (updateData) => {
    try {
      await updateLead(updateData).unwrap();
      setActiveLead(null);
    } catch (err) {
      alert('Failed to update lead: ' + (err.data?.message || err.message));
    }
  };

  const handleTransferLead = async (leadId, adminNotes) => {
    try {
      const res = await transferLead({ id: leadId, admin_notes: adminNotes }).unwrap();
      alert(`Success! ${res.message || 'Lead transferred to school CRM.'}`);
      setActiveLead(null);
    } catch (err) {
      alert('Failed to release lead: ' + (err.data?.message || err.message));
    }
  };

  const handleExportCSV = () => {
    if (!leads.length) return;
    const headers = ['Date', 'School', 'Lead Type', 'Parent Name', 'Phone', 'Email', 'Student Name', 'Grade', 'Status', 'Fee (₹)', 'Admin Notes'];
    const rows = leads.map(l => [
      new Date(l.created_at).toLocaleDateString('en-IN'),
      `"${l.school_name}"`,
      l.lead_type,
      `"${l.parent_name}"`,
      l.phone,
      l.email || '',
      `"${l.student_name || ''}"`,
      l.grade || '',
      l.status,
      Math.round((l.monetization_fee_paise || 0) / 100),
      `"${(l.admin_notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CKR_Marketplace_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusBadges = {
    new: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'New' },
    qualified: { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'Qualified' },
    school_contacted: { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff', label: 'Contacted' },
    transferred: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Transferred' },
    archived: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', label: 'Archived' }
  };

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      {/* 4 Clickable KPI Tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Tile 1: Total Leads */}
        <div 
          onClick={() => { setStatusFilter('all'); setLeadTypeFilter('all'); }}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Total Inbound Leads</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#064e3b' }}>
              <IconTarget size={20} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '8px 0 2px' }}>
            {isLoading ? '...' : formatIndianNumber(stats.total_leads || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {stats.new_leads || 0} uncontacted / new
          </div>
        </div>

        {/* Tile 2: Admission Enquiries */}
        <div 
          onClick={() => { setLeadTypeFilter('enquiry'); }}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Admission Enquiries</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
              <IconUsers size={20} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1d4ed8', margin: '8px 0 2px' }}>
            {isLoading ? '...' : formatIndianNumber(stats.admission_enquiries || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            High-intent parent leads
          </div>
        </div>

        {/* Tile 3: Brochure Downloads */}
        <div 
          onClick={() => { setLeadTypeFilter('brochure_download'); }}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Brochure Downloads</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
              <IconFileText size={20} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#b45309', margin: '8px 0 2px' }}>
            {isLoading ? '...' : formatIndianNumber(stats.brochure_downloads || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Gated prospectus leads
          </div>
        </div>

        {/* Tile 4: Revenue Potential */}
        <div 
          onClick={() => { setStatusFilter('qualified'); }}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Lead Monetization Pool</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#047857' }}>
              <IconCurrencyRupee size={20} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#047857', margin: '8px 0 2px' }}>
            {isLoading ? '...' : formatPaiseToRupees(stats.total_pipeline_paise || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {stats.transferred_leads || 0} successfully transferred
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '14px 20px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <IconSearch size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search parent, student, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {/* School Selector */}
          <select
            value={selectedTenantId}
            onChange={(e) => { setSelectedTenantId(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="all">All School Campuses</option>
            {schools.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="all">All Lead Statuses</option>
            <option value="new">New (Uncontacted)</option>
            <option value="qualified">Qualified</option>
            <option value="school_contacted">School Contacted</option>
            <option value="transferred">Transferred & Billed</option>
            <option value="archived">Archived</option>
          </select>

          {/* Lead Type Filter */}
          <select
            value={leadTypeFilter}
            onChange={(e) => { setLeadTypeFilter(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="all">All Lead Types</option>
            <option value="enquiry">Direct Enquiry</option>
            <option value="brochure_download">Brochure Download</option>
            <option value="comparison">Comparison Request</option>
            <option value="multi_enquiry">Multi-School Enquiry</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            disabled={!leads.length}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f1f5f9',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: leads.length ? 'pointer' : 'not-allowed'
            }}
          >
            <IconDownload size={15} />
            Export CSV
          </button>

          {selectedTenantId !== 'all' && (
            <button
              onClick={() => setDossierTenantId(selectedTenantId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#064e3b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <IconFileSpreadsheet size={15} />
              School Pitch Dossier
            </button>
          )}
        </div>
      </div>

      {/* CKR 5-Standard Tabular Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
                textAlign: 'left',
                height: '38px'
              }}>
                <th style={{ padding: '0 16px', fontWeight: '600', width: '100px' }}>Date</th>
                <th style={{ padding: '0 16px', fontWeight: '600' }}>Parent & Student</th>
                <th style={{ padding: '0 16px', fontWeight: '600' }}>Contact</th>
                <th style={{ padding: '0 16px', fontWeight: '600' }}>Target School</th>
                <th style={{ padding: '0 16px', fontWeight: '600' }}>Lead Type</th>
                <th style={{ padding: '0 16px', fontWeight: '600' }}>Grade</th>
                <th style={{ padding: '0 16px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '0 16px', fontWeight: '600', textAlign: 'right' }}>Lead Fee</th>
                <th style={{ padding: '0 16px', fontWeight: '600', textAlign: 'center', width: '90px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading Marketplace Leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No leads found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead, idx) => {
                  const badge = statusBadges[lead.status] || statusBadges.new;
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setActiveLead(lead)}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid #f1f5f9',
                        height: '38px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc'}
                    >
                      {/* Date */}
                      <td style={{ padding: '0 16px', color: '#64748b', whiteSpace: 'nowrap', fontSize: '12px' }}>
                        {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>

                      {/* Parent & Student */}
                      <td style={{ padding: '0 16px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{lead.parent_name}</div>
                        {lead.student_name && lead.student_name !== lead.parent_name && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Student: {lead.student_name}</div>
                        )}
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '0 16px', color: '#334155' }}>
                        <div style={{ fontWeight: '500' }}>+91 {lead.phone}</div>
                        {lead.email && <div style={{ fontSize: '11px', color: '#64748b' }}>{lead.email}</div>}
                      </td>

                      {/* Target School */}
                      <td style={{ padding: '0 16px' }}>
                        <div style={{ fontWeight: '600', color: '#064e3b' }}>{lead.school_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{lead.school_city}</div>
                      </td>

                      {/* Lead Type */}
                      <td style={{ padding: '0 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: lead.lead_type === 'enquiry' ? '#eff6ff' : lead.lead_type === 'brochure_download' ? '#fef3c7' : '#f3e8ff',
                          color: lead.lead_type === 'enquiry' ? '#1d4ed8' : lead.lead_type === 'brochure_download' ? '#b45309' : '#7e22ce'
                        }}>
                          {lead.lead_type === 'enquiry' ? 'Enquiry' : lead.lead_type === 'brochure_download' ? 'Brochure' : 'Comparison'}
                        </span>
                      </td>

                      {/* Grade */}
                      <td style={{ padding: '0 16px', color: '#334155', fontWeight: '500' }}>
                        {lead.grade || '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Lead Fee */}
                      <td style={{ padding: '0 16px', textAlign: 'right', fontWeight: '700', color: '#047857' }}>
                        {formatPaiseToRupees(lead.monetization_fee_paise || 0)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0 16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveLead(lead)}
                          title="View & Edit Lead"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#064e3b',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                        >
                          <IconEye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* CKR 50-Row Pagination */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: '#64748b'
        }}>
          <div>
            Showing <strong>{leads.length}</strong> of <strong>{pagination.total || 0}</strong> leads
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: page <= 1 ? '#f8fafc' : '#ffffff',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                color: '#334155'
              }}
            >
              Previous
            </button>
            <span>Page {page} of {pagination.totalPages || 1}</span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages || 1, p + 1))}
              disabled={page >= (pagination.totalPages || 1)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: page >= (pagination.totalPages || 1) ? '#f8fafc' : '#ffffff',
                cursor: page >= (pagination.totalPages || 1) ? 'not-allowed' : 'pointer',
                color: '#334155'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <LeadDetailModal
        lead={activeLead}
        isOpen={Boolean(activeLead)}
        onClose={() => setActiveLead(null)}
        onUpdateLead={handleUpdateLead}
        isUpdating={isUpdating}
        onOpenDossier={(tId) => {
          setActiveLead(null);
          setDossierTenantId(tId);
        }}
        onTransferLead={handleTransferLead}
        isTransferring={isTransferring}
      />

      {/* School Dossier Modal */}
      <SchoolDossierModal
        tenantId={dossierTenantId}
        isOpen={Boolean(dossierTenantId)}
        onClose={() => setDossierTenantId(null)}
      />
    </div>
  );
}

