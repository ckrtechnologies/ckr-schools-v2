import React from 'react';
import { IconCheck, IconBuildingCommunity, IconLockOpen, IconAward } from '@tabler/icons-react';

export default function BillingView({ stats }) {
  const activeCampuses = stats?.activeCampuses || 0;
  const totalStudents = stats?.totalStudents || 0;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
          Flat-Rate Campus Licensing & Services
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          All school campuses receive full, unrestricted access to the complete CKR Schools suite. Pricing is negotiated individually per campus contract.
        </p>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '28px 24px',
        maxWidth: '750px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(6, 78, 59, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconAward size={24} color="#064e3b" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              Full-Platform Campus License
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              All modules unlocked • Zero tier restrictions • Custom contract pricing
            </span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          margin: '20px 0',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>ACTIVE CAMPUSES LICENSED</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#064e3b', marginTop: '2px' }}>{activeCampuses}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>TOTAL ENROLLED STUDENTS</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{totalStudents}</div>
          </div>
        </div>

        <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '12px' }}>
          Included Across Every School Deployment:
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            'Admissions & CRM Counter',
            'Finance & Fees Ledger Counter',
            'Full Examination & Results Engine',
            'Transfer Certificate (TC) Portal',
            'Timetable & Proxy Automation Desk',
            'Teacher Manager & Scoring Desk',
            'Student & Teacher Mobile Apps (Android/iOS)',
            'Dedicated School Subdomain (e.g. <school>.ckrschools.online)',
            'Automated SMS, WhatsApp & Email Alerts',
            'Self-hosted Private Cloud CDN & Unlimited Storage'
          ].map((feature, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
              <IconCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
