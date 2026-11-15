'use client';

import React from 'react';

export default function SchoolKarmaLogo({ variant = 'light', size = 'default' }) {
  const isDark = variant === 'dark';
  const height = size === 'small' ? 36 : size === 'large' ? 52 : 42;
  const scale = height / 42;
  const width = 230 * scale;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', userSelect: 'none', gap: '10px' }}>
      {/* Visual Mark: Sun + Wisdom Book Emblem */}
      <svg width={height} height={height} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect
          width="44"
          height="44"
          rx="12"
          fill={isDark ? '#047857' : '#064e3b'}
          stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}
          strokeWidth="1"
        />
        {/* Left Book Page (Warm Gold) */}
        <path d="M11 31C16 29 20 29 22 31V16C20 14 16 14 11 16V31Z" fill="#f59e0b" />
        {/* Right Book Page (Emerald Mint) */}
        <path d="M33 31C28 29 24 29 22 31V16C24 14 28 14 33 16V31Z" fill="#34d399" />
        {/* Wisdom Sun / Core Beacon */}
        <circle cx="22" cy="11" r="3" fill="#f59e0b" />
        {/* Center Spine Beam */}
        <line x1="22" y1="14" x2="22" y2="31" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Typography */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          fontSize: `${20 * scale}px`,
          fontWeight: '900',
          letterSpacing: '-0.5px'
        }}>
          <span style={{ color: isDark ? '#ffffff' : '#0f172a' }}>School</span>
          <span style={{ color: '#059669', marginLeft: '1px' }}>Karma</span>
          <span style={{
            display: 'inline-block',
            width: `${5 * scale}px`,
            height: `${5 * scale}px`,
            borderRadius: '50%',
            backgroundColor: '#f59e0b',
            marginLeft: '3px',
            transform: 'translateY(-2px)'
          }} />
        </div>
        <div style={{
          fontSize: `${9 * scale}px`,
          fontWeight: '800',
          color: isDark ? '#a7f3d0' : '#64748b',
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
          marginTop: '3px'
        }}>
          Verified School Network
        </div>
      </div>
    </div>
  );
}

