import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Star,
  MessageSquareWarning,
  Images,
  UserPlus,
  Globe2,
  EyeOff,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { getOverview, getReviews, setPublished, marketplaceSchoolUrl } from '../services/api';
import { PageHeader, StatTile, Pill, Stars, EmptyState } from '../components/ui';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function Overview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, reviewsRes] = await Promise.all([
        getOverview(),
        getReviews({ limit: 5, page: 1, status: 'all' }),
      ]);
      setData(overviewRes.data.data);
      setRecent(reviewsRes.data.reviews || []);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to load overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const togglePublish = async () => {
    if (!data) return;
    const next = !data.school.is_published;
    if (!next && !window.confirm('Unpublish this school from the CKR Marketplace? Parents will no longer find it.')) return;
    setSaving(true);
    try {
      const res = await setPublished(next);
      toast.success(res.data.message || 'Updated.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not change the publish state.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return <EmptyState title="Loading overview..." description="Fetching your marketplace performance." />;
  }

  if (!data) {
    return <EmptyState title="Overview unavailable" description="Please reload the page." icon={AlertCircle} />;
  }

  const { school, completeness, stats } = data;
  const publicUrl = school.slug ? marketplaceSchoolUrl(school.slug) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        title={`${school.name} on the CKR Marketplace`}
        description={`${school.city || 'City not set'} · ${school.affiliation_board || 'Board not set'}`}
        actions={
          <>
            {school.is_published ? <Pill tone="green">● Live</Pill> : <Pill tone="amber">● Draft</Pill>}
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                <ExternalLink size={13} /> View public page
              </a>
            )}
          </>
        }
      />

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <StatTile
          label="Rating"
          value={stats.reviews_total ? Number(stats.average_rating).toFixed(1) : '—'}
          hint={stats.reviews_total ? `${stats.reviews_total} parent reviews` : 'No reviews yet'}
          icon={Star}
          color="#d97706"
          bg="rgba(217, 119, 6, 0.12)"
          onClick={() => navigate('/reviews')}
        />
        <StatTile
          label="Replies Due"
          value={stats.reviews_pending_reply}
          hint="Parent reviews without a reply"
          icon={MessageSquareWarning}
          color="#dc2626"
          bg="rgba(220, 38, 38, 0.1)"
          onClick={() => navigate('/reviews?status=pending_reply')}
        />
        <StatTile
          label="Public Photos"
          value={`${stats.gallery_published}/${stats.gallery_total}`}
          hint="Campus images on the listing"
          icon={Images}
          color="#db2777"
          bg="rgba(219, 39, 119, 0.1)"
          onClick={() => navigate('/gallery')}
        />
        <StatTile
          label="Leads"
          value={stats.leads_total}
          hint={`${stats.leads_last_30_days} released in 30 days`}
          icon={UserPlus}
          color="#2563eb"
          bg="rgba(37, 99, 235, 0.1)"
          onClick={() => navigate('/leads')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '12px', alignItems: 'start' }}>
        <section className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {school.is_published ? <Globe2 size={16} color="#15803d" /> : <EyeOff size={16} color="#b45309" />}
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Publication</h3>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '5px 12px' }}
              onClick={togglePublish}
              disabled={saving}
            >
              {saving ? 'Saving...' : school.is_published ? 'Unpublish' : 'Publish live'}
            </button>
          </div>

          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              <span>Profile completeness</span>
              <span>{completeness.percent}%</span>
            </div>
            <div style={{ height: '7px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden', marginTop: '5px' }}>
              <div
                style={{
                  width: `${completeness.percent}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background: completeness.percent >= 60 ? '#16a34a' : '#f59e0b',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {completeness.filled} of {completeness.total} profile sections filled.
            </p>
          </div>

          {completeness.missing.length > 0 ? (
            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {completeness.missing.map((item) => (
                <span key={item} className="ckr-pill" style={{ background: '#fef3c7', color: '#b45309' }}>{item}</span>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
              <CheckCircle2 size={14} /> Profile is complete
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="btn btn-ghost"
            style={{ marginTop: '12px', fontSize: '12px', padding: '4px 0', color: 'var(--accent-primary)' }}
          >
            Edit profile <ArrowRight size={13} />
          </button>
        </section>

        <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Latest reviews</h3>
            <button type="button" className="btn btn-ghost" style={{ fontSize: '12px', padding: '2px 0' }} onClick={() => navigate('/reviews')}>
              View all <ArrowRight size={13} />
            </button>
          </div>

          {recent.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No parent reviews yet. Reviews appear here once parents rate the school.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recent.map((review) => (
                <div key={review.id} style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700 }}>{review.reviewer_name}</span>
                    <Stars value={review.overall_rating} />
                  </div>
                  <div style={{ marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {review.is_verified && <Pill tone="green">Verified</Pill>}
                    {review.school_reply ? <Pill tone="blue">Replied</Pill> : <Pill tone="amber">Reply due</Pill>}
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{formatDate(review.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
