import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Save, Upload, X, ImagePlus, FileText, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';
import { getProfile, updateProfile, uploadFile, resolveAssetUrl, marketplaceSchoolUrl } from '../services/api';
import { PageHeader, Field, Pill } from '../components/ui';
import SearchableSelect from '../components/SearchableSelect';

const EMPTY_FORM = {
  admission_status: '',
  tagline: '',
  about: '',
  established_year: '',
  fee_period: '',
  min_fee: '',
  max_fee: '',
  grades_offered: '',
  facilities: '',
  student_count_badge: '',
  teacher_count_badge: '',
  student_teacher_ratio: '',
  hero_image_url: '',
  brochure_url: '',
};

const ADMISSION_OPTIONS = [
  { value: '', label: 'Not published' },
  { value: 'Admissions Open', label: 'Admissions Open' },
  { value: 'Limited Seats Available', label: 'Limited Seats Available' },
  { value: 'Waitlist Only', label: 'Waitlist Only' },
  { value: 'Admissions Closed', label: 'Admissions Closed' },
];

const FEE_PERIODS = [
  { value: '', label: 'Not published' },
  { value: 'ANNUAL', label: 'Per annum' },
  { value: 'TERM', label: 'Per term' },
  { value: 'MONTHLY', label: 'Per month' },
];

const toForm = (profile) => ({
  admission_status: profile?.admission_status || '',
  tagline: profile?.tagline || '',
  about: profile?.about || '',
  established_year: profile?.established_year ?? '',
  fee_period: profile?.fee_period || '',
  min_fee: profile?.min_fee ?? '',
  max_fee: profile?.max_fee ?? '',
  grades_offered: profile?.grades_offered || '',
  facilities: Array.isArray(profile?.facilities) ? profile.facilities.join('\n') : '',
  student_count_badge: profile?.student_count_badge || '',
  teacher_count_badge: profile?.teacher_count_badge || '',
  student_teacher_ratio: profile?.student_teacher_ratio || '',
  hero_image_url: profile?.hero_image_url || '',
  brochure_url: profile?.brochure_url || '',
});

export default function Profile() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [prefilled, setPrefilled] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile();
        setProfile(res.data.data);
        setForm(toForm(res.data.data));
        setPrefilled(res.data.data?.prefilled || []);
      } catch (error) {
        toast.error(error.response?.data?.error?.message || 'Failed to load the marketplace profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleUpload = async (event, kind) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(kind);
    try {
      const url = await uploadFile(file, 'school', 'marketplace');
      setForm((prev) => ({ ...prev, [kind === 'hero' ? 'hero_image_url' : 'brochure_url']: url }));
      toast.success('File uploaded. Remember to save.');
    } catch (error) {
      toast.error('Upload failed. Please try a smaller file.');
    } finally {
      setUploading('');
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (form.min_fee && form.max_fee && Number(form.min_fee) > Number(form.max_fee)) {
      toast.error('Minimum fee cannot be greater than maximum fee.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile({
        ...form,
        established_year: form.established_year === '' ? null : Number(form.established_year),
        min_fee: form.min_fee === '' ? null : Number(form.min_fee),
        max_fee: form.max_fee === '' ? null : Number(form.max_fee),
        facilities: form.facilities ? form.facilities.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      });
      setProfile(res.data.data);
      setForm(toForm(res.data.data));
      setPrefilled([]);
      toast.success(res.data.message || 'Profile saved.');
    } catch (error) {
      const details = error.response?.data?.error?.details;
      toast.error(details?.[0]?.message || error.response?.data?.error?.message || 'Could not save the profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading profile...</p>;
  }

  const completeness = profile?.completeness;
  const heroUrl = resolveAssetUrl(form.hero_image_url);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <PageHeader
        title="Public Marketplace Profile"
        description="This is exactly what prospective parents see on the CKR Marketplace listing."
        actions={
          <>
            {profile?.is_published ? <Pill tone="green">● Live</Pill> : <Pill tone="amber">● Draft</Pill>}
            {profile?.slug && (
              <a
                href={marketplaceSchoolUrl(profile.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ fontSize: '12px', border: '1px solid var(--glass-border)', textDecoration: 'none' }}
              >
                <ExternalLink size={13} /> View public page
              </a>
            )}
            <button type="button" className="btn btn-primary" style={{ fontSize: '12px' }} onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      />

      {prefilled.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '9px 12px', borderRadius: 'var(--radius-md)', background: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: '12px', color: '#047857' }}>
          <Sparkles size={15} style={{ marginTop: '1px', flexShrink: 0 }} />
          <span>
            <strong>{prefilled.length} field{prefilled.length === 1 ? '' : 's'}</strong> were pre-filled from your school records
            ({prefilled.join(', ').replace(/_/g, ' ')}). Review them and press <strong>Save</strong> to publish these values.
          </span>
        </div>
      )}

      {completeness && completeness.missing.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '9px 12px', borderRadius: 'var(--radius-md)', background: '#fffbeb', border: '1px solid #fde68a', fontSize: '12px', color: '#92400e' }}>
          <AlertCircle size={15} style={{ marginTop: '1px', flexShrink: 0 }} />
          <span>
            Profile is {completeness.percent}% complete. Missing: {completeness.missing.join(', ')}.
          </span>
        </div>
      )}

      <section className="glass-card spoc-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
        <Field label="Admission status">
          <SearchableSelect
            value={form.admission_status}
            onChange={(value) => setForm((prev) => ({ ...prev, admission_status: value }))}
            options={ADMISSION_OPTIONS.slice(1)}
            allLabel="Not published"
            allValue=""
            placeholder="Not published"
            searchPlaceholder="Type a status…"
          />
        </Field>

        <Field label="Year established">
          <input type="number" className="input-glass" placeholder="e.g. 2012" value={form.established_year} onChange={setField('established_year')} />
        </Field>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="School tagline" hint="One line shown under the school name on cards and the profile.">
            <input type="text" className="input-glass" placeholder="e.g. Inspiring Excellence, Fostering Character" value={form.tagline} onChange={setField('tagline')} maxLength={255} />
          </Field>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="About the school" hint="Admissions introduction — pedagogy, legacy and student culture.">
            <textarea className="input-glass" rows={5} placeholder="Introduce the school to prospective parents..." value={form.about} onChange={setField('about')} />
          </Field>
        </div>

        <Field label="Fee period">
          <SearchableSelect
            value={form.fee_period}
            onChange={(value) => setForm((prev) => ({ ...prev, fee_period: value }))}
            options={FEE_PERIODS.slice(1)}
            allLabel="Not published"
            allValue=""
            placeholder="Not published"
            searchPlaceholder="Type a period…"
          />
        </Field>

        <Field label="Grades offered">
          <input type="text" className="input-glass" placeholder="e.g. Nursery – 12th" value={form.grades_offered} onChange={setField('grades_offered')} maxLength={120} />
        </Field>

        <Field label="Minimum fee (₹)">
          <input type="number" className="input-glass" placeholder="e.g. 45000" value={form.min_fee} onChange={setField('min_fee')} />
        </Field>

        <Field label="Maximum fee (₹)">
          <input type="number" className="input-glass" placeholder="e.g. 110000" value={form.max_fee} onChange={setField('max_fee')} />
        </Field>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Campus facilities" hint="One facility per line.">
            <textarea className="input-glass" rows={4} placeholder={'Robotics & AI Lab\nSwimming Pool\nGPS School Bus\nCCTV Campus'} value={form.facilities} onChange={setField('facilities')} />
          </Field>
        </div>

        <Field label="Student body badge">
          <input type="text" className="input-glass" placeholder="e.g. 1,450+ students" value={form.student_count_badge} onChange={setField('student_count_badge')} maxLength={60} />
        </Field>

        <Field label="Faculty badge">
          <input type="text" className="input-glass" placeholder="e.g. 65+ faculty" value={form.teacher_count_badge} onChange={setField('teacher_count_badge')} maxLength={60} />
        </Field>

        <Field label="Student–teacher ratio">
          <input type="text" className="input-glass" placeholder="e.g. 18:1" value={form.student_teacher_ratio} onChange={setField('student_teacher_ratio')} maxLength={30} />
        </Field>
      </section>

      <section className="glass-card spoc-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
        <div>
          <Field label="Cover image" hint="Used on marketplace cards and as the profile banner.">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="btn btn-ghost" style={{ border: '1px dashed #cbd5e1', cursor: 'pointer', fontSize: '12px' }}>
                <Upload size={13} />
                {uploading === 'hero' ? 'Uploading...' : 'Upload image'}
                <input type="file" accept="image/*" hidden onChange={(e) => handleUpload(e, 'hero')} />
              </label>
              {form.hero_image_url && (
                <button type="button" className="btn btn-ghost" style={{ fontSize: '12px', color: '#dc2626' }} onClick={() => setForm((prev) => ({ ...prev, hero_image_url: '' }))}>
                  <X size={13} /> Remove
                </button>
              )}
            </div>
          </Field>
          <div style={{ marginTop: '8px', height: '120px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {heroUrl ? (
              <img src={heroUrl} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ImagePlus size={14} /> No cover image uploaded
              </span>
            )}
          </div>
        </div>

        <div>
          <Field label="Prospectus / brochure (PDF)" hint="Parents download this after submitting their details.">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="btn btn-ghost" style={{ border: '1px dashed #cbd5e1', cursor: 'pointer', fontSize: '12px' }}>
                <FileText size={13} />
                {uploading === 'brochure' ? 'Uploading...' : 'Upload PDF'}
                <input type="file" accept="application/pdf" hidden onChange={(e) => handleUpload(e, 'brochure')} />
              </label>
              {form.brochure_url && (
                <button type="button" className="btn btn-ghost" style={{ fontSize: '12px', color: '#dc2626' }} onClick={() => setForm((prev) => ({ ...prev, brochure_url: '' }))}>
                  <X size={13} /> Remove
                </button>
              )}
            </div>
          </Field>
          <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: '#f8fafc', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {form.brochure_url ? (
              <a href={resolveAssetUrl(form.brochure_url)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                Open current prospectus
              </a>
            ) : (
              'No prospectus uploaded yet — the button is hidden on the public profile.'
            )}
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Saving...' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}
