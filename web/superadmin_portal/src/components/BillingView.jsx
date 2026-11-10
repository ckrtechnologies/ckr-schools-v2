import React from 'react';
import { IconCheck, IconCrown, IconRocket, IconBolt } from '@tabler/icons-react';

export default function BillingView({ stats }) {
  const planTiers = stats?.planTiers || {
    FREE_TRIAL: 0,
    GROWTH_CAMPUS: 0,
    PRO_CAMPUS: 0,
    ENTERPRISE_AI: 1
  };

  const plans = [
    {
      name: 'Free Trial',
      tier: 'FREE_TRIAL',
      price: '₹0',
      period: '14-day evaluation',
      activeCount: planTiers.FREE_TRIAL || 0,
      icon: IconBolt,
      color: '#64748b',
      features: ['Up to 100 students', 'Core attendance & timetable', 'Community email support']
    },
    {
      name: 'Growth Campus',
      tier: 'GROWTH_CAMPUS',
      price: '₹9,999',
      period: '/month per campus',
      activeCount: planTiers.GROWTH_CAMPUS || 0,
      icon: IconRocket,
      color: '#059669',
      features: ['Up to 500 students', 'Admissions & Fee Counter', 'Teacher & Student Mobile Apps', 'Automated SMS & WhatsApp']
    },
    {
      name: 'Pro Campus',
      tier: 'PRO_CAMPUS',
      price: '₹24,999',
      period: '/month per campus',
      activeCount: planTiers.PRO_CAMPUS || 0,
      icon: IconCrown,
      color: '#2563eb',
      popular: true,
      features: ['Up to 2,000 students', 'Full Academic Examination Engine', 'Transfer Certificate (TC) Desk', 'Priority 24/7 SLA Support']
    },
    {
      name: 'Enterprise AI',
      tier: 'ENTERPRISE_AI',
      price: '₹49,999',
      period: '/month per campus',
      activeCount: planTiers.ENTERPRISE_AI || 0,
      icon: IconCrown,
      color: '#9333ea',
      features: ['Unlimited students', 'Dedicated Cloud Schema & VPS', 'AI Auto-grading & OCR Engine', 'White-label Custom Domains']
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
          Platform Subscription Tiers & Billing
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Active multi-tenant software license tiers and monthly recurring revenue (MRR) distribution
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        {plans.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.tier}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: p.popular ? '2px solid #064e3b' : '1px solid #e2e8f0',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              {p.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '16px',
                  backgroundColor: '#064e3b',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Most Popular
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Icon size={20} color={p.color} />
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{p.name}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '14px 0 8px 0' }}>
                  <span style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>{p.price}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{p.period}</span>
                </div>

                <div style={{
                  padding: '6px 10px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#064e3b',
                  marginBottom: '16px',
                  border: '1px solid #e2e8f0'
                }}>
                  {p.activeCount} Active Campus{p.activeCount === 1 ? '' : 'es'}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {p.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#475569' }}>
                      <IconCheck size={14} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

