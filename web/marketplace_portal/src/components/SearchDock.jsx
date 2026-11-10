import React from 'react';
import { IconSearch, IconMapPin, IconCertificate, IconCurrencyRupee, IconRefresh } from '@tabler/icons-react';

export default function SearchDock({ filters, onFilterChange, onReset }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
      margin: '-28px auto 36px',
      maxWidth: '1240px',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr auto',
        gap: '14px',
        alignItems: 'center'
      }}>
        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            SEARCH CAMPUS
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <IconSearch size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="e.g. Vision International, STEM lab..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* City Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            LOCATION / CITY
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <IconMapPin size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
            <select
              value={filters.city}
              onChange={(e) => onFilterChange('city', e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="all">All Locations</option>
              <option value="Pune">Shirur / Pune, MH</option>
              <option value="Noida">Noida, UP</option>
            </select>
          </div>
        </div>

        {/* Board Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            AFFILIATION BOARD
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <IconCertificate size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
            <select
              value={filters.board}
              onChange={(e) => onFilterChange('board', e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="all">All Boards</option>
              <option value="CBSE">CBSE Board</option>
              <option value="ICSE">ICSE Board</option>
              <option value="IB">IB / Cambridge</option>
            </select>
          </div>
        </div>

        {/* Budget Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            ANNUAL BUDGET
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <IconCurrencyRupee size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
            <select
              value={filters.budgetRange}
              onChange={(e) => onFilterChange('budgetRange', e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="all">Any Fee Range</option>
              <option value="under50k">Under ₹50,000 / yr</option>
              <option value="50k_to_100k">₹50,000 – ₹1,00,000 / yr</option>
              <option value="above100k">Above ₹1,00,000 / yr</option>
            </select>
          </div>
        </div>

        {/* Reset button */}
        <div style={{ alignSelf: 'flex-end' }}>
          <button
            onClick={onReset}
            title="Reset Filters"
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            <IconRefresh size={16} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

