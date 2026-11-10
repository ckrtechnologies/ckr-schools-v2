import React from 'react';
import { IconSparkles, IconAward, IconCheck, IconCalendarEvent, IconShieldCheck } from '@tabler/icons-react';

const TICKER_ITEMS = [
  { text: 'ADMISSIONS OPEN 2026-27: Limited Seats Across Nursery to Grade IX & XI', icon: IconCalendarEvent, highlight: true },
  { text: 'CBSE Board Season: Partner Schools on CKR Schools Report Strong First-Class Results', icon: IconAward },
  { text: 'Junior Robotics & STEM Teams Across Partner Campuses Win National Olympiad Honours', icon: IconSparkles },
  { text: '100% Verified Parent Reviews & Official Campus Photo Galleries', icon: IconCheck },
  { text: 'Transparent Fee Structures & Zero Parent Brokerage or Hidden Charges', icon: IconCheck, highlight: true },
  { text: 'All Partner Schools Are CBSE-Accredited & Background-Verified by CKR', icon: IconShieldCheck, highlight: true }
];

export default function MarqueeTicker() {
  return (
    <div
      className="marquee-container"
      style={{
        backgroundColor: '#064e3b',
        color: '#f0fdf4',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        padding: '7px 0',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.2px',
        borderBottom: '1px solid #047857'
      }}
    >
      <div className="marquee-track">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 28px',
                color: item.highlight ? '#a7f3d0' : '#ffffff'
              }}
            >
              <Icon size={14} style={{ color: item.highlight ? '#34d399' : '#6ee7b7' }} />
              <span>{item.text}</span>
              <span style={{ color: '#047857', margin: '0 6px' }}>•</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
