import React from 'react';
import { 
  IconX, 
  IconPrinter, 
  IconDownload, 
  IconSchool, 
  IconTarget, 
  IconFileText, 
  IconUsers,
  IconCurrencyRupee
} from '@tabler/icons-react';
import { useGetSchoolLeadDossierQuery } from '../store/superadminApi.js';

export default function SchoolDossierModal({ tenantId, isOpen, onClose }) {
  if (!isOpen || !tenantId) return null;

  const { data: response, isLoading } = useGetSchoolLeadDossierQuery(tenantId);
  const data = response?.data;
  const school = data?.school;
  const dossier = data?.dossier;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!dossier?.leads) return;
    const headers = ['Date', 'Lead Type', 'Parent Name', 'Phone', 'Email', 'Student Name', 'Grade', 'Status', 'Notes'];
    const rows = dossier.leads.map(l => [
      new Date(l.created_at).toLocaleDateString('en-IN'),
      l.lead_type,
      `"${l.parent_name}"`,
      l.phone,
      l.email || '',
      `"${l.student_name || ''}"`,
      l.grade || '',
      l.status,
      `"${(l.message || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CKR_Marketplace_Dossier_${school?.slug || 'school'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '840px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#064e3b',
          color: '#ffffff'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a7f3d0', fontWeight: '700', letterSpacing: '0.5px' }}>
              CKR Technologies · School Coordinator ROI Dossier
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '700' }}>
              {isLoading ? 'Loading School Dossier...' : school?.name}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExportCSV}
              disabled={isLoading || !dossier?.leads?.length}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <IconDownload size={14} />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <IconPrinter size={14} />
              Print
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a7f3d0',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <IconX size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Generating Dossier...</div>
          ) : (
            <>
              {/* Pitch Summary Banner */}
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534', marginBottom: '6px' }}>
                  🎯 VALUE DEMONSTRATION SUMMARY FOR SCHOOL COORDINATOR
                </div>
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                  During this admissions cycle, CKR Marketplace generated <strong>{dossier?.summary?.total_leads} prospective student enquiries</strong> for <strong>{school?.name}</strong> across {school?.city}. Below is the verified parent pipeline ready for school CRM onboarding.
                </div>
              </div>

              {/* 4 Summary Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>TOTAL LEADS</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                    {dossier?.summary?.total_leads || 0}
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '600' }}>DIRECT ENQUIRIES</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e40af', marginTop: '2px' }}>
                    {dossier?.summary?.direct_enquiries || 0}
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '600' }}>BROCHURE DOWNLOADS</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#92400e', marginTop: '2px' }}>
                    {dossier?.summary?.brochure_downloads || 0}
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '11px', color: '#047857', fontWeight: '600' }}>COMPARISON LEADS</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#065f46', marginTop: '2px' }}>
                    {dossier?.summary?.comparison_leads || 0}
                  </div>
                </div>
              </div>

              {/* Verified Leads Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'left', height: '36px' }}>
                      <th style={{ padding: '8px 12px', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '8px 12px', fontWeight: '600' }}>Parent Name</th>
                      <th style={{ padding: '8px 12px', fontWeight: '600' }}>Phone</th>
                      <th style={{ padding: '8px 12px', fontWeight: '600' }}>Student / Grade</th>
                      <th style={{ padding: '8px 12px', fontWeight: '600' }}>Lead Intent</th>
                      <th style={{ padding: '8px 12px', fontWeight: '600' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dossier?.leads?.map((lead, idx) => (
                      <tr 
                        key={lead.id}
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                          borderBottom: '1px solid #f1f5f9',
                          height: '38px'
                        }}
                      >
                        <td style={{ padding: '8px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: '600', color: '#0f172a' }}>
                          {lead.parent_name}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#334155' }}>
                          +91 {lead.phone}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#334155' }}>
                          {lead.student_name ? `${lead.student_name} (${lead.grade || 'N/A'})` : (lead.grade || 'N/A')}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: lead.lead_type === 'enquiry' ? '#eff6ff' : '#fef3c7',
                            color: lead.lead_type === 'enquiry' ? '#1d4ed8' : '#b45309'
                          }}>
                            {lead.lead_type}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: '#ecfdf5',
                            color: '#047857'
                          }}>
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

