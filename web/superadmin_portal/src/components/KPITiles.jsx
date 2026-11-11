import React from 'react';
import { useDispatch } from 'react-redux';
import { setActiveTab } from '../store/filtersSlice.js';
import { 
  IconBuildingCommunity, 
  IconUsers, 
  IconActivityHeartbeat 
} from '@tabler/icons-react';

function formatIndianNumber(val) {
  if (val === undefined || val === null) return '0';
  return Number(val).toLocaleString('en-IN');
}

export default function KPITiles({ stats, isLoading }) {
  const dispatch = useDispatch();

  const tiles = [
    {
      id: 'schools',
      label: 'Schools',
      value: isLoading ? '...' : formatIndianNumber(stats?.total_schools || 0),
      subtitle: `${stats?.active_schools || 0} active campuses`,
      icon: IconBuildingCommunity,
      iconBg: '#ecfdf5',
      iconColor: '#064e3b',
      action: () => dispatch(setActiveTab('Schools'))
    },
    {
      id: 'students',
      label: 'Students',
      value: isLoading ? '...' : formatIndianNumber(stats?.total_students || 0),
      subtitle: 'Across all school tenants',
      icon: IconUsers,
      iconBg: '#eff6ff',
      iconColor: '#1d4ed8',
      action: () => dispatch(setActiveTab('Schools'))
    },
    {
      id: 'active',
      label: 'Tenant Health',
      value: isLoading ? '...' : `${stats?.active_schools || 0} / ${stats?.total_schools || 0}`,
      subtitle: 'Active & live cloud deployments',
      icon: IconActivityHeartbeat,
      iconBg: '#f0fdf4',
      iconColor: '#15803d',
      action: () => dispatch(setActiveTab('Schools'))
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '20px'
    }}>
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div
            key={tile.id}
            onClick={tile.action}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '110px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.borderColor = '#064e3b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                {tile.label}
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: tile.iconBg,
                color: tile.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={20} stroke={1.75} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.5px' }}>
                {tile.value}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {tile.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
