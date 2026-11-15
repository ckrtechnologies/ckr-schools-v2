'use client';

import React, { useState } from 'react';

/**
 * Extracts 2-4 clean, bold initials for an Indian school.
 * e.g.,
 * "Delhi Public School, Knowledge Park V" -> "DPS"
 * "City Montessori School, Gomti Nagar" -> "CMS"
 * "Seth Anandram Jaipuria School" -> "SAJ"
 * "The ARC School" -> "ARC"
 * "The International School Bangalore (TISB)" -> "TISB"
 * "Amity International School" -> "AIS"
 */
export function getSchoolInitials(name) {
  if (!name) return 'SK';
  
  // Check if parentheses contain an acronym like (TISB)
  const parenMatch = name.match(/\(([A-Z]{2,5})\)/);
  if (parenMatch) return parenMatch[1];

  // Clean name: take part before comma or dash
  const clean = name.split(/[,–-]/)[0].trim();
  const words = clean.split(/\s+/).filter(w => {
    const lower = w.toLowerCase();
    return !['the', 'and', 'of', 'in', 'at', '&'].includes(lower);
  });

  if (words.length === 0) return 'SK';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  
  // If first word is ARC or acronym
  if (words[0].toUpperCase() === 'ARC') return 'ARC';
  if (words[0].toUpperCase() === 'DPS') return 'DPS';
  if (words[0].toUpperCase() === 'CMS') return 'CMS';

  // Take first letter of each significant word (up to 3 or 4)
  const initials = words.map(w => w[0].toUpperCase()).slice(0, 3).join('');
  return initials || 'SK';
}

export default function SchoolLogo({
  school,
  size = 68,
  borderRadius = '12px',
  style = {}
}) {
  const [hasError, setHasError] = useState(false);

  // Normalize logo URL
  let logoUrl = school?.logo_url;
  
  // ARC School special resolution
  const isArc = school?.slug === 'arc' || 
                school?.slug === 'vision' || 
                school?.name?.toLowerCase()?.includes('arc');
  if (isArc && (!logoUrl || hasError)) {
    logoUrl = '/thearcschoollogo.jpeg';
  }

  const initials = getSchoolInitials(school?.name);
  const fontSize = Math.max(13, Math.round(size * 0.3));

  // Detect transparent/inverted white logos (e.g. bny-wlg, wht, etc.)
  const isWhiteLogo = typeof logoUrl === 'string' && (
    logoUrl.toLowerCase().includes('wlg') || 
    logoUrl.toLowerCase().includes('wht') || 
    logoUrl.toLowerCase().includes('white') ||
    logoUrl.toLowerCase().includes('bny-wlg')
  );

  const containerBg = isWhiteLogo 
    ? (school?.theme_color || '#064e3b') 
    : '#ffffff';

  const containerBorder = isWhiteLogo 
    ? `1.5px solid ${school?.theme_color || '#064e3b'}` 
    : '1.5px solid #e2e8f0';

  if (logoUrl && !hasError) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          borderRadius,
          border: containerBorder,
          backgroundColor: containerBg,
          boxShadow: '0 2px 8px -1px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isWhiteLogo ? '8px' : '4px',
          boxSizing: 'border-box',
          ...style
        }}
      >
        <img
          src={logoUrl}
          alt={`${school?.name || 'School'} logo`}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </div>
    );
  }

  // High-visibility, crisp ARC-style emerald gradient avatar
  return (
    <div
      role="img"
      aria-label={`${school?.name || 'School'} avatar`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius,
        border: '1.5px solid #047857',
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)',
        color: '#ffffff',
        boxShadow: '0 2px 6px -1px rgba(6, 78, 59, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: `${fontSize}px`,
        letterSpacing: '0.8px',
        userSelect: 'none',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <span>{initials}</span>
      {size >= 64 && (
        <span
          style={{
            fontSize: '8.5px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: '#a7f3d0',
            marginTop: '1px'
          }}
        >
          Campus
        </span>
      )}
    </div>
  );
}

