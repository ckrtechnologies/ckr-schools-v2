import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, Eye, EyeOff, Newspaper, Download } from 'lucide-react';
import {
  getPressReleases,
  createPressRelease,
  updatePressRelease,
  deletePressRelease,
} from '../services/api';
import DataTable from '../components/DataTable';
import { PageHeader, Pill, Modal, Field, EmptyState } from '../components/ui';
import SearchableSelect from '../components/SearchableSelect';

const CATEGORIES = ['General', 'Academics', 'Sports', 'Event', 'Achievement'];

const EMPTY_FORM = {
  title: '',
  category: 'General',
  summary: '',
  content_html: '',
  featured_image_url: '',
  published_date: new Date().toISOString().slice(0, 10),
  is_published: true,
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const downloadCsv = (rows) => {
  const header = ['Title', 'Category', 'Published Date', 'State', 'Summary'];
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) => [r.title, r.category, formatDate(r.published_date), r.is_published ? 'Published' : 'Draft', r.summary || ''].map(escape).join(','));
  const blob = new Blob([[header.map(escape).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `marketplace-press-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default function Press() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPressReleases();
      setRows(res.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to load press releases.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      title: row.title || '',
      category: row.category || 'General',
      summary: row.summary || '',
      content_html: row.content_html || '',
      featured_image_url: row.featured_image_url || '',
      published_date: row.published_date ? String(row.published_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      is_published: !!row.is_published,
    });
    setEditorOpen(true);
  };

  const setField = (key) => (event) =>
    setForm((prev) => ({
      ...prev,
      [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }));

  const save = async () => {
    if (!form.title.trim() || form.content_html.trim().length < 10) {
      toast.error('Add a title and at least a short press release body.');
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await updatePressRelease(editing.id, form);
        toast.success('Press release updated.');
      } else {
        await createPressRelease(form);
        toast.success('Press release created.');
      }
      setEditorOpen(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not save the press release.');
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (row) => {
    setBusy(true);
    try {
      await updatePressRelease(row.id, { is_published: !row.is_published });
      toast.success(row.is_published ? 'Moved to draft.' : 'Published to the newsroom.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not update the press release.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deletePressRelease(row.id);
      toast.success('Press release deleted.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not delete the press release.');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'published_date', label: 'Date', width: '102px', render: (r) => formatDate(r.published_date) },
    {
      key: 'title',
      label: 'Headline',
      render: (r) => (
        <span title={r.title} style={{ display: 'inline-block', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom', fontWeight: 600 }}>
          {r.title}
        </span>
      ),
    },
    { key: 'category', label: 'Category', width: '118px', render: (r) => <Pill tone="purple">{r.category}</Pill> },
    {
      key: 'summary',
      label: 'Summary',
      sortable: false,
      render: (r) => (
        <span title={r.summary || ''} style={{ display: 'inline-block', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom', color: 'var(--text-secondary)' }}>
          {r.summary || '—'}
        </span>
      ),
    },
    { key: 'is_published', label: 'State', width: '104px', render: (r) => (r.is_published ? <Pill tone="green">Published</Pill> : <Pill tone="amber">Draft</Pill>) },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: '106px',
      align: 'right',
      render: (r) => (
        <span style={{ display: 'inline-flex', gap: '5px' }}>
          <button type="button" className="ckr-icon-btn" title="Edit" onClick={() => openEdit(r)}>
            <Pencil size={12} />
          </button>
          <button type="button" className="ckr-icon-btn" title={r.is_published ? 'Unpublish' : 'Publish'} onClick={() => togglePublished(r)} disabled={busy}>
            {r.is_published ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
          <button type="button" className="ckr-icon-btn" title="Delete" onClick={() => remove(r)} disabled={busy} style={{ color: '#dc2626' }}>
            <Trash2 size={12} />
          </button>
        </span>
      ),
    },
  ];

  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <button type="button" className="btn btn-primary" style={{ fontSize: '12px' }} onClick={openCreate}>
        <Plus size={14} /> New release
      </button>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        {rows.filter((r) => r.is_published).length} published · {rows.filter((r) => !r.is_published).length} draft
      </span>
      <button type="button" className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '12px', border: '1px solid var(--glass-border)' }} onClick={() => downloadCsv(rows)}>
        <Download size={13} /> Export CSV
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <PageHeader
        title="Public Newsroom"
        description="Press releases and school news shown on the marketplace listing."
      />

      {rows.length === 0 && !loading ? (
        <EmptyState
          title="No press releases yet"
          description="Publish achievements, admissions news or campus events to the public newsroom."
          icon={Newspaper}
          action={<button type="button" className="btn btn-primary" style={{ fontSize: '12px', marginTop: '6px' }} onClick={openCreate}><Plus size={14} /> Create the first one</button>}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          initialSort={{ key: 'published_date', direction: 'desc' }}
          emptyText={loading ? 'Loading press releases...' : 'No press releases yet.'}
          toolbar={toolbar}
        />
      )}

      <Modal
        open={editorOpen}
        title={editing ? 'Edit press release' : 'New press release'}
        subtitle="Published instantly to the public newsroom on the marketplace."
        width={720}
        onClose={() => setEditorOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditorOpen(false)} disabled={busy}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>
              {busy ? 'Saving...' : editing ? 'Save changes' : 'Publish'}
            </button>
          </>
        }
      >
        <div className="spoc-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Headline">
              <input className="input-glass" value={form.title} onChange={setField('title')} maxLength={255} placeholder="e.g. Grade X students win the district science olympiad" />
            </Field>
          </div>

          <Field label="Category">
            <SearchableSelect
              value={form.category}
              onChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
              options={CATEGORIES}
              nullable={false}
              placeholder="Select a category"
              searchPlaceholder="Type a category…"
            />
          </Field>

          <Field label="Publish date">
            <input type="date" className="input-glass" value={form.published_date} onChange={setField('published_date')} />
          </Field>

          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Summary" hint="One or two lines shown on the newsroom card.">
              <textarea className="input-glass" rows={2} maxLength={500} value={form.summary} onChange={setField('summary')} />
            </Field>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Press release body" hint="Basic HTML is allowed (p, strong, ul, li, a).">
              <textarea className="input-glass" rows={8} value={form.content_html} onChange={setField('content_html')} placeholder="<p>...</p>" />
            </Field>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Featured image URL" hint="Optional. Use the uploader in the Profile section to host an image URL.">
              <input className="input-glass" value={form.featured_image_url} onChange={setField('featured_image_url')} placeholder="/cdn/..." />
            </Field>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={form.is_published} onChange={setField('is_published')} />
            Publish to the public newsroom
          </label>
        </div>
      </Modal>
    </div>
  );
}
