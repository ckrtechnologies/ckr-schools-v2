import React, { useState, useEffect } from 'react';
import { 
  IconX, 
  IconUser, 
  IconPhone, 
  IconMail, 
  IconSchool, 
  IconCurrencyRupee, 
  IconNotes, 
  IconCheck,
  IconFileSpreadsheet
} from '@tabler/icons-react';

export default function LeadDetailModal({ 
  lead, 
  isOpen, 
  onClose, 
  onUpdateLead, 
  isUpdating,
  onOpenDossier,
  onTransferLead,
  isTransferring
}) {
  if (!isOpen || !lead) return null;

  const [status, setStatus] = useState(lead.status || 'new');
  const [feeRupees, setFeeRupees] = useState(Math.round((lead.monetization_fee_paise || 0) / 100));
  const [adminNotes, setAdminNotes] = useState(lead.admin_notes || '');

  useEffect(() => {
    if (lead) {
      setStatus(lead.status || 'new');
      setFeeRupees(Math.round((lead.monetization_fee_paise || 0) / 100));
      setAdminNotes(lead.admin_notes || '');
    }
  }, [lead]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateLead({
      id: lead.id,
      status,
      monetization_fee_paise: Number(feeRupees) * 100,
      admin_notes: adminNotes
    });
  };

  const statusColors = {
    new: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'New Lead' },
    qualified: { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'Qualified Parent' },
    school_contacted: { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff', label: 'School Contacted' },
    transferred: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Transferred & Billed' },
    archived: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', label: 'Archived' }
  };

  const leadTypeLabels = {
    enquiry: 'Direct Admission Enquiry',
    brochure_download: 'Prospectus / Brochure Download',
    comparison: 'School Comparison Lead',
    multi_enquiry: '1-Click Multi-School Enquiry'
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a',
          color: '#ffffff'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.5px' }}>
              Centralized Lead Desk · {leadTypeLabels[lead.lead_type] || lead.lead_type}
            </div>
            <h2 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: '700' }}>
              {lead.parent_name} {lead.student_name ? `· Student: ${lead.student_name}` : ''}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Quick Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>TARGET SCHOOL</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
                <IconSchool size={16} color="#064e3b" />
                {lead.school_name || 'Vision International School'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {lead.school_city} ({lead.school_board || 'CBSE'})
              </div>
            </div>

            <div style={{
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>ADMISSION DETAILS</div>
              <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
                {lead.grade || 'Grade Not Specified'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Academic Year: {lead.academic_year || '2026-2027'}
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
              PARENT CONTACT INFORMATION
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                <IconPhone size={15} color="#047857" />
                <a href={`tel:${lead.phone}`} style={{ color: '#047857', fontWeight: '600', textDecoration: 'none' }}>
                  +91 {lead.phone}
                </a>
              </div>
              {lead.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                  <IconMail size={15} color="#2563eb" />
                  <a href={`mailto:${lead.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                    {lead.email}
                  </a>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                <IconUser size={15} />
                Parent: {lead.parent_name}
              </div>
            </div>

            {lead.message && (
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px dashed #e2e8f0',
                fontSize: '13px',
                color: '#475569',
                fontStyle: 'italic',
                backgroundColor: '#f8fafc',
                padding: '10px',
                borderRadius: '6px'
              }}>
                "{lead.message}"
              </div>
            )}
          </div>

          {/* Super Admin Management Form */}
          <form onSubmit={handleSubmit}>
            <div style={{
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#166534', marginBottom: '12px' }}>
                SUPER ADMIN MONETIZATION & QUALIFICATION CONTROLS
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                    LEAD STATUS
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="new">New (Uncontacted)</option>
                    <option value="qualified">Qualified (Parent Verified)</option>
                    <option value="school_contacted">School Contacted (Pitched)</option>
                    <option value="transferred">Transferred to School CRM (Billed)</option>
                    <option value="archived">Archived / Cold</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                    MONETIZATION FEE (₹)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '10px', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>₹</span>
                    <input
                      type="number"
                      value={feeRupees}
                      onChange={(e) => setFeeRupees(e.target.value)}
                      placeholder="e.g. 500"
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 24px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  ADMIN NOTES & VALUE PITCH LOG
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Spoke with parent on 10 Nov. Looking for bus pickup near Shirur bypass. Pitched to school coordinator."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => onOpenDossier && onOpenDossier(lead.tenant_id)}
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
                    cursor: 'pointer'
                  }}
                >
                  <IconFileSpreadsheet size={16} />
                  School Pitch Dossier
                </button>

                {lead.status !== 'transferred' && onTransferLead && (
                  <button
                    type="button"
                    disabled={isTransferring}
                    onClick={() => {
                      if (window.confirm(`Release this lead to ${lead.school_name}'s Admissions Desk? This will insert the student into their active CRM.`)) {
                        onTransferLead(lead.id, adminNotes);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                      borderRadius: '6px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: isTransferring ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <IconCheck size={16} />
                    {isTransferring ? 'Releasing...' : 'Release to School CRM'}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  style={{
                    backgroundColor: '#064e3b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <IconCheck size={16} />
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

