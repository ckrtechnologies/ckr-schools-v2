import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Star,
  MessageSquare,
  MessageSquareWarning,
  Flag,
  Search,
  Download,
  Reply,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  getReviews,
  replyToReview,
  deleteReviewReply,
  reportReview,
  withdrawReport,
} from '../services/api';
import DataTable from '../components/DataTable';
import { PageHeader, StatTile, Pill, Stars, Modal, Field, useDebounced, EmptyState } from '../components/ui';
import SearchableSelect from '../components/SearchableSelect';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending_reply', label: 'Reply due' },
  { value: 'replied', label: 'Replied' },
  { value: 'verified', label: 'Verified' },
  { value: 'reported', label: 'Reported' },
  { value: 'low_rating', label: '1–2 star' },
  { value: 'hidden', label: 'Hidden' },
];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const downloadCsv = (rows) => {
  const header = ['Date', 'Parent', 'Relationship', 'Overall', 'Academics', 'Infrastructure', 'Faculty', 'Safety', 'Value', 'Verified', 'Replied', 'Title', 'Review'];
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) => [
    formatDate(r.created_at),
    r.reviewer_name,
    r.relationship,
    r.overall_rating,
    r.academics_rating,
    r.infrastructure_rating,
    r.faculty_rating,
    r.safety_rating,
    r.value_for_money_rating,
    r.is_verified ? 'Yes' : 'No',
    r.school_reply ? 'Yes' : 'No',
    r.title || '',
    r.review_text || '',
  ].map(escape).join(','));
  const blob = new Blob([[header.map(escape).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `marketplace-reviews-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default function Reviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [rating, setRating] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReviews({
        status,
        rating: rating || undefined,
        search: debouncedSearch || undefined,
        limit: 200,
        page: 1,
      });
      setRows(res.data.reviews || []);
      setStats(res.data.stats || null);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [status, rating, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = (value) => {
    setStatus(value);
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete('status');
    else next.set('status', value);
    setSearchParams(next, { replace: true });
  };

  const openReply = (review) => {
    setReplyTarget(review);
    setReplyText(review.school_reply || '');
  };

  const submitReply = async () => {
    if (!replyText.trim()) {
      toast.error('Write a reply first.');
      return;
    }
    setBusy(true);
    try {
      await replyToReview(replyTarget.id, replyText.trim());
      toast.success('Reply published on the public profile.');
      setReplyTarget(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not publish the reply.');
    } finally {
      setBusy(false);
    }
  };

  const removeReply = async () => {
    if (!window.confirm('Remove your published reply? Parents will no longer see it.')) return;
    setBusy(true);
    try {
      await deleteReviewReply(replyTarget.id);
      toast.success('Reply removed.');
      setReplyTarget(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not remove the reply.');
    } finally {
      setBusy(false);
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Tell CKR why this review should be reviewed.');
      return;
    }
    setBusy(true);
    try {
      await reportReview(reportTarget.id, reportReason.trim());
      toast.success('Sent to CKR for moderation.');
      setReportTarget(null);
      setReportReason('');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not send the report.');
    } finally {
      setBusy(false);
    }
  };

  const undoReport = async (review) => {
    setBusy(true);
    try {
      await withdrawReport(review.id);
      toast.success('Report withdrawn.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not withdraw the report.');
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo(() => [
    { key: 'created_at', label: 'Date', width: '92px', render: (r) => formatDate(r.created_at) },
    {
      key: 'reviewer_name',
      label: 'Parent',
      width: '160px',
      render: (r) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 600 }}>{r.reviewer_name}</span>
          {r.is_verified && <ShieldCheck size={13} color="#15803d" title="Verified parent" />}
        </span>
      ),
    },
    { key: 'overall_rating', label: 'Rating', width: '110px', render: (r) => <Stars value={r.overall_rating} size={11} /> },
    {
      key: 'title',
      label: 'Title',
      width: '180px',
      render: (r) => (
        <span title={r.title || ''} style={{ display: 'inline-block', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom' }}>
          {r.title || <span style={{ color: 'var(--text-secondary)' }}>—</span>}
        </span>
      ),
    },
    {
      key: 'review_text',
      label: 'Review',
      sortable: false,
      render: (r) => (
        <span title={r.review_text} style={{ display: 'inline-block', maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom', color: 'var(--text-secondary)' }}>
          {r.review_text}
        </span>
      ),
    },
    {
      key: 'school_reply',
      label: 'Reply',
      width: '110px',
      render: (r) => (r.school_reply ? <Pill tone="blue">Replied</Pill> : <Pill tone="amber">Due</Pill>),
    },
    {
      key: 'is_reported',
      label: 'Flag',
      width: '96px',
      render: (r) => (r.is_reported ? <Pill tone="red">Reported</Pill> : <span style={{ color: 'var(--text-secondary)' }}>—</span>),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: '86px',
      align: 'right',
      render: (r) => (
        <span style={{ display: 'inline-flex', gap: '5px' }}>
          <button type="button" className="ckr-icon-btn" title={r.school_reply ? 'Edit reply' : 'Reply'} onClick={() => openReply(r)}>
            <Reply size={13} />
          </button>
          <button
            type="button"
            className="ckr-icon-btn"
            title={r.is_reported ? 'Withdraw report' : 'Report to CKR'}
            onClick={() => (r.is_reported ? undoReport(r) : (setReportTarget(r), setReportReason('')))}
            disabled={busy}
            style={r.is_reported ? { color: '#dc2626', borderColor: '#fca5a5' } : undefined}
          >
            <Flag size={13} />
          </button>
        </span>
      ),
    },
  ], [busy]);

  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          className="input-glass"
          placeholder="Search parent, title or review"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '240px', paddingLeft: '26px' }}
        />
      </div>

      <div style={{ width: '132px' }}>
        <SearchableSelect
          value={rating}
          onChange={setRating}
          options={[5, 4, 3, 2, 1].map((value) => ({ value: String(value), label: `${value} star` }))}
          allLabel="All ratings"
          allValue=""
          placeholder="All ratings"
          searchPlaceholder="Type a rating…"
          compact
        />
      </div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => changeStatus(filter.value)}
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '999px',
              border: '1px solid',
              borderColor: status === filter.value ? 'var(--accent-primary)' : 'var(--glass-border)',
              background: status === filter.value ? 'var(--accent-light)' : '#ffffff',
              color: status === filter.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <button type="button" className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '12px', border: '1px solid var(--glass-border)' }} onClick={() => downloadCsv(rows)}>
        <Download size={13} /> Export CSV
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <PageHeader
        title="Parent Reviews"
        description="Reviews are published as they arrive. Reply publicly, or flag a review for CKR moderation."
      />

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <StatTile
          label="Rating"
          value={stats?.total ? Number(stats.average_rating).toFixed(1) : '—'}
          hint={`${stats?.total || 0} live reviews`}
          icon={Star}
          color="#d97706"
          bg="rgba(217, 119, 6, 0.12)"
        />
        <StatTile
          label="Verified"
          value={stats?.verified || 0}
          hint="Reviews from own parents"
          icon={ShieldCheck}
          color="#15803d"
          bg="rgba(21, 128, 61, 0.1)"
        />
        <StatTile
          label="Reply Due"
          value={stats?.pending_reply || 0}
          hint="No public reply yet"
          icon={MessageSquareWarning}
          color="#dc2626"
          bg="rgba(220, 38, 38, 0.1)"
          onClick={() => changeStatus('pending_reply')}
        />
        <StatTile
          label="Reported"
          value={stats?.reported || 0}
          hint="Escalated to CKR"
          icon={Flag}
          color="#7c3aed"
          bg="rgba(124, 58, 237, 0.1)"
          onClick={() => changeStatus('reported')}
        />
      </div>

      {rows.length === 0 && !loading ? (
        <EmptyState
          title="No reviews match this filter"
          description="Try clearing the status or rating filter. Reviews appear as soon as parents submit them on the marketplace."
          icon={MessageSquare}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          initialSort={{ key: 'created_at', direction: 'desc' }}
          emptyText={loading ? 'Loading reviews...' : 'No reviews yet.'}
          toolbar={toolbar}
        />
      )}

      <Modal
        open={!!replyTarget}
        title={replyTarget?.school_reply ? 'Edit your public reply' : 'Reply to this review'}
        subtitle={replyTarget ? `${replyTarget.reviewer_name} · ${replyTarget.overall_rating} star` : ''}
        onClose={() => setReplyTarget(null)}
        footer={
          <>
            {replyTarget?.school_reply && (
              <button type="button" className="btn btn-ghost" style={{ color: '#dc2626' }} onClick={removeReply} disabled={busy}>
                <Trash2 size={13} /> Remove
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => setReplyTarget(null)} disabled={busy}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={submitReply} disabled={busy}>
              {busy ? 'Saving...' : 'Publish reply'}
            </button>
          </>
        }
      >
        {replyTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: '#f8fafc', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <strong style={{ fontSize: '12.5px' }}>{replyTarget.title || 'Parent review'}</strong>
                <Stars value={replyTarget.overall_rating} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{replyTarget.review_text}</p>
            </div>
            <Field label="Your public reply" hint="Shown directly under the parent review on the marketplace.">
              <textarea
                className="input-glass"
                rows={4}
                maxLength={2000}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Thank you for the feedback. We would love to hear more — please contact the school office."
              />
            </Field>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{replyText.length}/2000 characters</span>
          </div>
        )}
      </Modal>

      <Modal
        open={!!reportTarget}
        title="Report this review to CKR"
        subtitle={reportTarget ? `${reportTarget.reviewer_name} · ${formatDate(reportTarget.created_at)}` : ''}
        onClose={() => setReportTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setReportTarget(null)} disabled={busy}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={submitReport} disabled={busy}>
              {busy ? 'Sending...' : 'Send to CKR'}
            </button>
          </>
        }
      >
        <Field label="Reason" hint="CKR moderators review flagged content. The review stays visible until they act.">
          <textarea
            className="input-glass"
            rows={4}
            maxLength={500}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="e.g. Contains abusive language / not a parent of this school"
          />
        </Field>
      </Modal>
    </div>
  );
}
