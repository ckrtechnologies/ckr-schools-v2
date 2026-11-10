import React, { useState } from 'react';
import { IconSchool } from '@tabler/icons-react';

function readGallery(gallery) {
  if (!gallery) return [];
  if (typeof gallery === 'string') {
    try {
      return JSON.parse(gallery || '[]');
    } catch {
      return [];
    }
  }
  return gallery;
}

/**
 * Marketplace cover image.
 *
 * Priority: cover image managed in the school portal (hero_image_url) -> school logo
 * -> first school-uploaded gallery photo -> neutral placeholder.
 * The logo is used before gallery photos because gallery entries may be event or
 * portrait shots that are unsuitable as a cover.
 */
export default function SchoolImage({
  src,
  school,
  alt,
  height = '180px',
  borderRadius = 0,
  objectFit = 'cover',
  logoPadding = '20px 28px',
  style = {}
}) {
  const [failedSrc, setFailedSrc] = useState(null);

  const galleryImages = readGallery(school?.gallery_images);
  const firstGallery =
    galleryImages[0]?.url ||
    galleryImages[0] ||
    school?.community?.gallery?.[0]?.url ||
    school?.gallery_preview ||
    null;

  const candidates = [
    { url: src || school?.hero_image_url, kind: 'cover' },
    { url: school?.logo_url, kind: 'logo' },
    { url: firstGallery, kind: 'gallery' }
  ].filter(candidate => !!candidate.url && candidate.url !== failedSrc);

  const label = alt || school?.name || 'School';

  if (candidates.length > 0) {
    const { url, kind } = candidates[0];
    return (
      <img
        src={url}
        alt={kind === 'logo' ? `${label} logo` : label}
        onError={() => setFailedSrc(url)}
        style={{
          width: '100%',
          height,
          objectFit: kind === 'logo' ? 'contain' : objectFit,
          borderRadius,
          backgroundColor: kind === 'logo' ? '#f0fdf4' : '#ecfdf5',
          padding: kind === 'logo' ? logoPadding : 0,
          boxSizing: 'border-box',
          ...style
        }}
      />
    );
  }

  const initials = (school?.name || label)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div
      role="img"
      aria-label={`${label} — cover image not provided`}
      style={{
        width: '100%',
        height,
        borderRadius,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        color: '#047857',
        ...style
      }}
    >
      {initials ? (
        <span style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '0.5px' }}>{initials}</span>
      ) : (
        <IconSchool size={34} />
      )}
      <span style={{ fontSize: '11px', fontWeight: '600', color: '#0f766e' }}>Cover image not provided</span>
    </div>
  );
}
