import React from 'react';
import { IconSparkles, IconAward, IconCheck, IconCalendarEvent, IconShieldCheck } from '@tabler/icons-react';

const TICKER_ITEMS = [
  { text: 'Search, compare and enquire with schools listed on CKR Marketplace', icon: IconSparkles, highlight: true },
  { text: 'Compare fees, boards and facilities side by side', icon: IconAward },
  { text: 'Download the official brochure directly from the school', icon: IconCheck },
  { text: 'Submit admission enquiries without creating an account', icon: IconCalendarEvent },
  { text: 'Parent ratings are tied to a signed-in account', icon: IconShieldCheck, highlight: true },
  { text: 'Every school profile is maintained by the school itself', icon: IconCheck }
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
