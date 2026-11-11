import React, { useState } from 'react';
import { IconX, IconBuildingPlus, IconCheck, IconPhoto, IconUpload, IconLoader2 } from '@tabler/icons-react';

export default function OnboardSchoolModal({ isOpen, onClose, onSubmit, isLoading, errorMessage }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    motto: '',
    logoUrl: '',
    themeColor: '#064e3b',
    accentColor: '#10b981',
    affiliationBoard: 'CBSE',
    planTier: 'GROWTH_CAMPUS',
    officialEmail: '',
    officialPhone: '',
    city: '',
    state: '',
    pincode: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: ''
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name' && !formData.slug) {
      // Auto-generate slug from school name
      const autoSlug = value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40);
      setFormData(prev => ({ ...prev, name: value, slug: autoSlug }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setUploadError('');

    try {
      const data = new FormData();
      data.append('file', file);
      const token = localStorage.getItem('ckr_sa_token') || localStorage.getItem('token');

      const targetSlug = formData.slug ? formData.slug.trim() : 'campus';
      const headers = {
        'x-tenant-subdomain': 'superadmin'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/upload/file?category=logo&tenantSlug=${encodeURIComponent(targetSlug)}`, {
        method: 'POST',
        headers,
        body: data
      });

      const result = await res.json().catch(() => ({}));
      if (res.ok && result.success && result.url) {
        setFormData(prev => ({ ...prev, logoUrl: result.url }));
        setUploadError('');
      } else {
        setUploadError(result.message || result.error?.message || `Logo upload failed (Status: ${res.status})`);
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to upload logo. Please check server connectivity.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(3px)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              color: '#064e3b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconBuildingPlus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                Onboard New School Campus
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Provisions tenant database space, custom branding, and administrator credentials
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {errorMessage && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontSize: '12px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              {errorMessage}
            </div>
          )}

          {/* Section 1: School Identity */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '8px' }}>
              1. School Campus Profile
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  School Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Heritage International School"
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Subdomain Slug *
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    name="slug"
                    required
                    placeholder="heritage"
                    value={formData.slug}
                    onChange={handleChange}
                    style={{
                      width: '60%',
                      padding: '8px 10px',
                      borderRadius: '6px 0 0 6px',
                      border: '1px solid #cbd5e1',
                      borderRight: 'none',
                      fontSize: '13px'
                    }}
                  />
                  <span style={{
                    width: '40%',
                    padding: '8px 6px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0 6px 6px 0',
                    fontSize: '11px',
                    color: '#64748b'
                  }}>
                    .ckrschools.online
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Affiliation Board
                </label>
                <select
                  name="affiliationBoard"
                  value={formData.affiliationBoard}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="CBSE">CBSE (Central Board)</option>
                  <option value="ICSE">ICSE / CISCE</option>
                  <option value="STATE_BOARD">State Board</option>
                  <option value="CAMBRIDGE">Cambridge (IGCSE)</option>
                  <option value="IB">International Baccalaureate (IB)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Subscription Plan Tier
                </label>
                <select
                  name="planTier"
                  value={formData.planTier}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="GROWTH_CAMPUS">Growth Campus (₹9,999/mo)</option>
                  <option value="PRO_CAMPUS">Pro Campus (₹24,999/mo)</option>
                  <option value="ENTERPRISE_AI">Enterprise AI (₹49,999/mo)</option>
                  <option value="FREE_TRIAL">Free Trial (14 Days)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Custom Logo, Tagline & Theme Color */}
          <div style={{
            marginBottom: '18px',
            padding: '14px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '10px' }}>
              2. Custom Branding (Favicon, Logo & Tagline)
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                School Tagline / Motto
              </label>
              <input
                type="text"
                name="motto"
                placeholder="e.g. Inspiring Excellence, Empowering Minds"
                value={formData.motto}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                  marginBottom: '12px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  School Logo (Used as Favicon & Login Header)
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    name="logoUrl"
                    placeholder="Enter Logo URL or upload below"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#334155',
                    cursor: uploadingLogo ? 'not-allowed' : 'pointer'
                  }}>
                    {uploadingLogo ? <IconLoader2 size={16} className="animate-spin" /> : <IconUpload size={16} color="#064e3b" />}
                    <span>{uploadingLogo ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                {uploadError && (
                  <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>{uploadError}</div>
                )}
              </div>

              {/* Logo Preview */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  border: '2px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                }}>
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl.startsWith('http') ? formData.logoUrl : formData.logoUrl}
                      alt="Logo preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <IconPhoto size={24} color="#94a3b8" />
                  )}
                </div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Preview</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Brand Theme Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    name="themeColor"
                    value={formData.themeColor}
                    onChange={handleChange}
                    style={{ width: '38px', height: '34px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    name="themeColor"
                    value={formData.themeColor}
                    onChange={handleChange}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Accent Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleChange}
                    style={{ width: '38px', height: '34px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleChange}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Location */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '8px' }}>
              3. Campus Contact & Address
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Official Email *
                </label>
                <input
                  type="email"
                  name="officialEmail"
                  required
                  placeholder="admin@heritageschool.edu.in"
                  value={formData.officialEmail}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Official Phone *
                </label>
                <input
                  type="tel"
                  name="officialPhone"
                  required
                  placeholder="9876543210"
                  value={formData.officialPhone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="Noida"
                  value={formData.city}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  required
                  placeholder="Uttar Pradesh"
                  value={formData.state}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Pincode (6 digits) *
                </label>
                <input
                  type="text"
                  name="pincode"
                  required
                  maxLength={6}
                  placeholder="201301"
                  value={formData.pincode}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Primary School Administrator */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', textTransform: 'uppercase', marginBottom: '8px' }}>
              4. School Principal / Primary Admin Credentials
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Administrator Full Name *
                </label>
                <input
                  type="text"
                  name="adminName"
                  required
                  placeholder="Dr. Rajesh Gupta"
                  value={formData.adminName}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Admin Email (Login ID) *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  required
                  placeholder="principal@heritageschool.edu.in"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Admin Mobile Number *
                </label>
                <input
                  type="tel"
                  name="adminPhone"
                  required
                  placeholder="9811223344"
                  value={formData.adminPhone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Initial Password *
                </label>
                <input
                  type="password"
                  name="adminPassword"
                  required
                  placeholder="Min 6 characters"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '16px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#064e3b',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              <IconCheck size={16} />
              <span>{isLoading ? 'Provisioning...' : 'Provision Campus'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
