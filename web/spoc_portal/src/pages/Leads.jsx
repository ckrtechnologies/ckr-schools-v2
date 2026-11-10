import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { UserPlus, Phone, Download, Search, FileText, Users, MessageSquare, Copy } from 'lucide-react';
import { getLeads } from '../services/api';
import DataTable from '../components/DataTable';
import { PageHeader, StatTile, Pill, Modal, EmptyState, useDebounced } from '../components/ui';

const LEAD_LABELS = {
  enquiry: 'Admission enquiry',
  brochure_download: 'Brochure download',
  comparison: 'Comparison',
  multi_enquiry: 'Multi-school',
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const downloadCsv = (rows) => {
  const header = ['Date', 'Parent', 'Student', 'Phone', 'Email', 'Grade', 'Academic Year', 'Type', 'Message'];
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) => [
    formatDate(r.created_at),
    r.parent_name,
    r.student_name || '',
    r.phone,
    r.email || '',
    r.grade || '',
    r.academic_year || '',
    LEAD_LABELS[r.lead_type] || r.lead_type,
    r.message || '',
  ].map(escape).join(','));
  const blob = new Blob([[header.map(escape).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `marketplace-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default function Leads() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ by_type: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeads({ search: debouncedSearch || undefined, limit: 200, page: 1 });
      setRows(res.data.leads || []);
      setStats(res.data.stats || { by_type: {} });
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to load leads.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const byType = stats?.by_type || {};
  const enquiryCount = byType.enquiry || 0;
  const brochureCount = byType.brochure_download || 0;
  const multiCount = (byType.multi_enquiry || 0) + (byType.comparison || 0);

  const copyPhone = async (phone) => {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success('Phone number copied.');
    } catch (e) {
      toast.error('Could not copy the number.');
    }
  };

  const columns = useMemo(() => [
    { key: 'created_at', label: 'Date', width: '100px', render: (r) => formatDate(r.created_at) },
    { key: 'parent_name', label: 'Parent', width: '170px', render: (r) => <span style={{ fontWeight: 600 }}>{r.parent_name}</span> },
    {
      key: 'student_name',
      label: 'Student',
      width: '150px',
      render: (r) => r.student_name || <span style={{ color: 'var(--text-secondary)' }}>—</span>,
    },
    { key: 'phone', label: 'Phone', width: '130px', render: (r) => <span style={{ fontFamily: 'monospace' }}>{r.phone}</span> },
    { key: 'grade', label: 'Grade', width: '92px', render: (r) => r.grade || '—' },
    {
      key: 'lead_type',
      label: 'Type',
      width: '160px',
      render: (r) => (
        <Pill tone={r.lead_type === 'enquiry' ? 'blue' : r.lead_type === 'brochure_download' ? 'purple' : 'neutral'}>
          {LEAD_LABELS[r.lead_type] || r.lead_type}
        </Pill>
      ),
    },
    {
      key: 'message',
      label: 'Notes',
      sortable: false,
      render: (r) => (
        <span title={r.message || ''} style={{ display: 'inline-block', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom', color: 'var(--text-secondary)' }}>
          {r.message || '—'}
        </span>
      ),
    },
  ], []);

  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          className="input-glass"
          placeholder="Search parent, student, phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '250px', paddingLeft: '26px' }}
        />
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        {rows.length} lead{rows.length === 1 ? '' : 's'} released by CKR
      </span>
      <button type="button" className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '12px', border: '1px solid var(--glass-border)' }} onClick={() => downloadCsv(rows)}>
        <Download size={13} /> Export CSV
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <PageHeader
        title="Released Leads"
        description="CKR captures marketplace enquiries centrally and releases qualified leads to your school. Contact details appear here once released."
      />

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <StatTile label="Released Leads" value={rows.length} hint="All time" icon={UserPlus} color="#2563eb" bg="rgba(37, 99, 235, 0.1)" />
        <StatTile label="Enquiries" value={enquiryCount} hint="Admission enquiries" icon={MessageSquare} color="#0891b2" bg="rgba(8, 145, 178, 0.1)" />
        <StatTile label="Brochures" value={brochureCount} hint="Prospectus downloads" icon={FileText} color="#7c3aed" bg="rgba(124, 58, 237, 0.1)" />
        <StatTile label="Multi-school" value={multiCount} hint="Comparison requests" icon={Users} color="#d97706" bg="rgba(217, 119, 6, 0.1)" />
      </div>

      {rows.length === 0 && !loading ? (
        <EmptyState
          title="No leads released yet"
          description="When CKR qualifies and releases a marketplace enquiry to your school, the parent's details appear here."
          icon={UserPlus}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          initialSort={{ key: 'created_at', direction: 'desc' }}
          emptyText={loading ? 'Loading leads...' : 'No leads released yet.'}
          toolbar={toolbar}
          onRowClick={(row) => setSelected(row)}
        />
      )}

      <Modal
        open={!!selected}
        title={selected?.parent_name || 'Lead'}
        subtitle={selected ? `${LEAD_LABELS[selected.lead_type] || selected.lead_type} · ${formatDate(selected.created_at)}` : ''}
        onClose={() => setSelected(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
            {selected?.phone && (
              <a className="btn btn-primary" href={`tel:${selected.phone}`} style={{ textDecoration: 'none' }}>
                <Phone size={13} /> Call parent
              </a>
            )}
          </>
        }
      >
        {selected && (
          <div className="spoc-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 16px', fontSize: '12.5px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Phone</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontFamily: 'monospace' }}>
                {selected.phone}
                <button type="button" className="ckr-icon-btn" title="Copy" onClick={() => copyPhone(selected.phone)}>
                  <Copy size={11} />
                </button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Email</div>
              <div style={{ marginTop: '2px' }}>{selected.email || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Student</div>
              <div style={{ marginTop: '2px' }}>{selected.student_name || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Grade</div>
              <div style={{ marginTop: '2px' }}>{selected.grade || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Academic year</div>
              <div style={{ marginTop: '2px' }}>{selected.academic_year || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Lead type</div>
              <div style={{ marginTop: '2px' }}>{LEAD_LABELS[selected.lead_type] || selected.lead_type}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Message</div>
              <div style={{ marginTop: '4px', padding: '9px 11px', background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                {selected.message || 'No message left by the parent.'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
