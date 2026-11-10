import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Images,
  Eye,
  EyeOff,
  Save,
  Video,
  ExternalLink,
  Upload,
  Plus,
  Trash2,
  Pencil,
  Search,
  X,
} from 'lucide-react';
import {
  getGallery,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  deleteCdnFile,
  uploadFile,
  resolveAssetUrl,
} from '../services/api';
import { PageHeader, StatTile, Pill, EmptyState, Field, Modal, useDebounced } from '../components/ui';

const EMPTY_FORM = { title: '', description: '', media_url: '', media_type: 'image', is_marketplace_visible: true };

const youtubeId = (url = '') => {
  const match = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : null;
};

const previewSrc = (item) => {
  const id = youtubeId(item.image_url || item.media_url);
  if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return resolveAssetUrl(item.image_url || item.media_url);
};

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [typeFilter, setTypeFilter] = useState('all');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [sourceMode, setSourceMode] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGallery();
      setItems(res.data.data || []);
      setDrafts({});
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to load the gallery.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter === 'youtube' && !youtubeId(item.image_url || item.media_url)) return false;
      if (typeFilter === 'video' && (item.media_type !== 'video' || youtubeId(item.image_url || item.media_url))) return false;
      if (typeFilter === 'image' && item.media_type === 'video') return false;
      if (typeFilter === 'hidden' && item.is_marketplace_visible) return false;
      if (typeFilter === 'visible' && !item.is_marketplace_visible) return false;
      if (!needle) return true;
      return (
        String(item.title || '').toLowerCase().includes(needle) ||
        String(item.description || '').toLowerCase().includes(needle)
      );
    });
  }, [items, debouncedSearch, typeFilter]);

  const visibleCount = items.filter((item) => item.is_marketplace_visible).length;
  const videoCount = items.filter((item) => item.media_type === 'video').length;
  const youtubeCount = items.filter((item) => youtubeId(item.image_url || item.media_url)).length;

  const setDraft = (id, patch) => {
    const item = items.find((i) => String(i.id) === String(id));
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        title: item?.title || '',
        description: item?.description || '',
        is_marketplace_visible: !!item?.is_marketplace_visible,
        ...(prev[id] || {}),
        ...patch,
      },
    }));
  };

  const saveDraft = async (item) => {
    const draft = drafts[item.id];
    if (!draft) return;
    setSavingId(item.id);
    try {
      const res = await updateGalleryItem(item.id, draft);
      setItems((prev) => prev.map((row) => (String(row.id) === String(item.id) ? { ...row, ...res.data.data } : row)));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      toast.success('Gallery updated.');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not update this media.');
    } finally {
      setSavingId(null);
    }
  };

  const toggleVisible = async (item) => {
    const next = !item.is_marketplace_visible;
    setSavingId(item.id);
    try {
      const res = await updateGalleryItem(item.id, { is_marketplace_visible: next });
      setItems((prev) => prev.map((row) => (String(row.id) === String(item.id) ? { ...row, ...res.data.data } : row)));
      toast.success(next ? 'Now visible on the public profile.' : 'Hidden from the public profile.');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not update this media.');
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title || 'this media'}"? This cannot be undone.`)) return;
    setSavingId(item.id);
    try {
      await deleteGalleryItem(item.id);

      const url = item.image_url || item.media_url;
      if (url && !youtubeId(url)) {
        try {
          await deleteCdnFile(url);
        } catch (e) {
          /* the CDN file may already be gone — the gallery row is what matters */
        }
      }

      toast.success('Media deleted.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not delete this media.');
    } finally {
      setSavingId(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSourceMode('upload');
    setEditorOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    const url = item.image_url || item.media_url || '';
    setSourceMode(youtubeId(url) ? 'link' : 'upload');
    setForm({
      title: item.title || '',
      description: item.description || '',
      media_url: url,
      media_type: item.media_type || 'image',
      is_marketplace_visible: !!item.is_marketplace_visible,
    });
    setEditorOpen(true);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'school', 'gallery');
      setForm((prev) => ({
        ...prev,
        media_url: url,
        media_type: file.type.startsWith('video/') ? 'video' : 'image',
      }));
      toast.success('File uploaded. Add a title and save.');
    } catch (error) {
      toast.error('Upload failed. Please try a smaller file.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const submitEditor = async () => {
    if (!form.media_url.trim()) {
      toast.error('Upload a file or paste a media link.');
      return;
    }

    const detected = youtubeId(form.media_url);
    const payload = { ...form, media_type: detected ? 'video' : form.media_type };

    setBusy(true);
    try {
      if (editing) {
        await updateGalleryItem(editing.id, payload);
        toast.success('Media updated.');
      } else {
        await createGalleryItem(payload);
        toast.success('Media added to the gallery.');
      }
      setEditorOpen(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not save this media.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <PageHeader
        title="Public Gallery"
        description="Upload campus photos and videos, edit captions, and choose what parents see on the marketplace listing."
        actions={
          <button type="button" className="btn btn-primary" style={{ fontSize: '12px' }} onClick={openCreate}>
            <Plus size={14} /> Add media
          </button>
        }
      />

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <StatTile label="Total Media" value={items.length} hint="Photos and videos" icon={Images} color="#db2777" bg="rgba(219, 39, 119, 0.1)" />
        <StatTile label="On Profile" value={visibleCount} hint="Visible to parents" icon={Eye} color="#15803d" bg="rgba(21, 128, 61, 0.1)" />
        <StatTile label="Hidden" value={items.length - visibleCount} hint="Internal only" icon={EyeOff} color="#64748b" bg="rgba(100, 116, 139, 0.12)" />
        <StatTile label="Videos" value={videoCount} hint="Uploads and YouTube" icon={Video} color="#7c3aed" bg="rgba(124, 58, 237, 0.1)" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            className="input-glass"
            placeholder="Search media by title or caption"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '260px', paddingLeft: '26px' }}
          />
        </div>

        {[
          { value: 'all', label: 'All' },
          { value: 'image', label: 'Photos' },
          { value: 'youtube', label: `YouTube (${youtubeCount})` },
          { value: 'video', label: 'Direct videos' },
          { value: 'visible', label: 'On profile' },
          { value: 'hidden', label: 'Hidden' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTypeFilter(option.value)}
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '999px',
              border: '1px solid',
              borderColor: typeFilter === option.value ? 'var(--accent-primary)' : 'var(--glass-border)',
              background: typeFilter === option.value ? 'var(--accent-light)' : '#ffffff',
              color: typeFilter === option.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading gallery...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? 'No campus media yet' : 'No media matches this filter'}
          description={
            items.length === 0
              ? 'Upload campus photos and videos here — they appear on your public profile immediately.'
              : 'Try clearing the search or the type filter.'
          }
          icon={Images}
          action={
            items.length === 0 ? (
              <button type="button" className="btn btn-primary" style={{ fontSize: '12px', marginTop: '6px' }} onClick={openCreate}>
                <Plus size={14} /> Add the first media
              </button>
            ) : null
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: '12px' }}>
          {filtered.map((item) => {
            const draft = drafts[item.id];
            const visible = draft ? draft.is_marketplace_visible : item.is_marketplace_visible;
            const isVideo = item.media_type === 'video';
            const isYoutube = !!youtubeId(item.image_url || item.media_url);
            const src = previewSrc(item);
            const dirty = !!draft;

            return (
              <div key={item.id} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setPreviewItem(item)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPreviewItem(item); }}
                  title="Preview media"
                  style={{ position: 'relative', height: '152px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-in' }}>
                  {isVideo && !isYoutube && src ? (
                    <video
                      src={src}
                      muted
                      playsInline
                      preload="metadata"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: visible ? 'none' : 'grayscale(0.9) opacity(0.6)' }}
                    />
                  ) : src ? (
                    <img
                      src={src}
                      alt={item.title || 'Campus media'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: visible ? 'none' : 'grayscale(0.9) opacity(0.6)' }}
                    />
                  ) : isVideo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <Video size={22} />
                      <span style={{ fontSize: '11.5px' }}>Video</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Preview unavailable</span>
                  )}

                  {isVideo && (
                    <div style={{ position: 'absolute', bottom: '8px', left: '8px' }}>
                      <Pill tone="purple">{youtubeId(item.image_url || item.media_url) ? 'YouTube' : 'Video'}</Pill>
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                    {visible ? <Pill tone="green">On profile</Pill> : <Pill tone="neutral">Hidden</Pill>}
                  </div>

                  {src && !isVideo && (
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.9)', borderRadius: '6px', padding: '4px', display: 'flex', color: '#475569' }}
                      title="Open full size"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Field label="Caption">
                    <input
                      className="input-glass"
                      value={draft ? draft.title : item.title || ''}
                      placeholder="e.g. Science Laboratory"
                      onChange={(e) => setDraft(item.id, { title: e.target.value })}
                    />
                  </Field>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: '11.5px', padding: '3px 0', color: visible ? '#b45309' : '#15803d' }}
                      onClick={() => toggleVisible(item)}
                      disabled={savingId === item.id}
                    >
                      {visible ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                    </button>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button type="button" className="ckr-icon-btn" title="Edit media" onClick={() => openEdit(item)}>
                        <Pencil size={12} />
                      </button>
                      <button type="button" className="ckr-icon-btn" title="Delete media" onClick={() => remove(item)} disabled={savingId === item.id} style={{ color: '#dc2626' }}>
                        <Trash2 size={12} />
                      </button>
                      <button type="button" className="ckr-icon-btn" title="Save caption" onClick={() => saveDraft(item)} disabled={!dirty || savingId === item.id}>
                        <Save size={12} />
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={editorOpen}
        title={editing ? 'Edit media' : 'Add media'}
        subtitle="Photos and videos appear on your public CKR Marketplace profile."
        width={640}
        onClose={() => setEditorOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditorOpen(false)} disabled={busy}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={submitEditor} disabled={busy || uploading}>
              {busy ? 'Saving...' : editing ? 'Save changes' : 'Add to gallery'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 'upload', label: 'Upload file' },
            { value: 'link', label: 'Paste link' },
          ].map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setSourceMode(mode.value)}
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '999px',
                border: '1px solid',
                borderColor: sourceMode === mode.value ? 'var(--accent-primary)' : 'var(--glass-border)',
                background: sourceMode === mode.value ? 'var(--accent-light)' : '#ffffff',
                color: sourceMode === mode.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {sourceMode === 'upload' ? (
          <Field label="Upload photo or video" hint="JPG, PNG, MP4 or WebM. Files upload to the school CDN.">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <label className="btn btn-ghost" style={{ border: '1px dashed #cbd5e1', cursor: 'pointer', fontSize: '12px' }}>
                <Upload size={13} />
                {uploading ? 'Uploading...' : 'Choose file'}
                <input type="file" accept="image/*,video/*" hidden onChange={handleUpload} />
              </label>
              {form.media_url && sourceMode === 'upload' && !youtubeId(form.media_url) && (
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                  {form.media_url.split('/').pop()}
                </span>
              )}
            </div>
          </Field>
        ) : (
          <Field label="Media URL" hint="Direct image/video link or a YouTube URL — YouTube links are auto-detected.">
            <input
              className="input-glass"
              value={form.media_url}
              placeholder="https://youtube.com/watch?v=… or https://cdn.example.com/photo.jpg"
              onChange={(e) => setForm((prev) => ({ ...prev, media_url: e.target.value }))}
            />
          </Field>
        )}

          <div className="spoc-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
            <Field label="Type">
              <select
                className="input-glass"
                value={form.media_type}
                onChange={(e) => setForm((prev) => ({ ...prev, media_type: e.target.value }))}
              >
                <option value="image">Photo</option>
                <option value="video">Video</option>
              </select>
            </Field>

            <Field label="Visibility">
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', paddingTop: '8px' }}>
                <input
                  type="checkbox"
                  checked={form.is_marketplace_visible}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_marketplace_visible: e.target.checked }))}
                />
                Show to parents
              </label>
            </Field>
          </div>

          <Field label="Caption">
            <input
              className="input-glass"
              value={form.title}
              placeholder="e.g. Science Laboratory"
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </Field>

          <Field label="Description">
            <textarea
              className="input-glass"
              rows={3}
              maxLength={500}
              value={form.description}
              placeholder="Optional caption shown under the media."
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </Field>

          {form.media_url && (
            <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--glass-border)', background: '#f8fafc' }}>
              {youtubeId(form.media_url) ? (
                <a
                  href={form.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', position: 'relative' }}
                  title="Open on YouTube"
                >
                  <img src={previewSrc({ image_url: form.media_url })} alt="Video preview" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.28)', color: '#ffffff', fontWeight: 700, fontSize: '12.5px' }}>
                    Watch on YouTube
                  </span>
                </a>
              ) : form.media_type === 'video' ? (
                <video src={resolveAssetUrl(form.media_url)} controls style={{ width: '100%', maxHeight: '220px', display: 'block', background: '#0f172a' }} />
              ) : (
                <img src={resolveAssetUrl(form.media_url)} alt="Preview" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
              )}
            </div>
          )}

          {form.media_url && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#dc2626' }}
              onClick={() => setForm((prev) => ({ ...prev, media_url: '' }))}
            >
              <X size={13} /> Clear media
            </button>
          )}
        </div>
      </Modal>

      <Modal
        open={!!previewItem}
        title={previewItem?.title || 'Media preview'}
        subtitle={previewItem?.description || (previewItem?.media_type === 'video' ? 'Video' : 'Photo')}
        width={860}
        onClose={() => setPreviewItem(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setPreviewItem(null)}>Close</button>
            {previewItem && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const item = previewItem;
                  setPreviewItem(null);
                  openEdit(item);
                }}
              >
                <Pencil size={13} /> Edit media
              </button>
            )}
          </>
        }
      >
        {previewItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {youtubeId(previewItem.image_url || previewItem.media_url) ? (
              <iframe
                title={previewItem.title || 'YouTube video'}
                src={`https://www.youtube.com/embed/${youtubeId(previewItem.image_url || previewItem.media_url)}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', aspectRatio: '16 / 9', border: 'none', borderRadius: 'var(--radius-sm)', background: '#0f172a' }}
              />
            ) : previewItem.media_type === 'video' ? (
              <video src={resolveAssetUrl(previewItem.image_url || previewItem.media_url)} controls style={{ width: '100%', maxHeight: '460px', borderRadius: 'var(--radius-sm)', background: '#0f172a' }} />
            ) : (
              <img
                src={resolveAssetUrl(previewItem.image_url || previewItem.media_url)}
                alt={previewItem.title || 'Campus media'}
                style={{ width: '100%', maxHeight: '460px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', background: '#f8fafc' }}
              />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {previewItem.is_marketplace_visible ? <Pill tone="green">On profile</Pill> : <Pill tone="neutral">Hidden</Pill>}
              <Pill tone="purple">{youtubeId(previewItem.image_url || previewItem.media_url) ? 'YouTube' : previewItem.media_type === 'video' ? 'Video' : 'Photo'}</Pill>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
