import React from 'react';
import { IconSearch, IconMapPin, IconCertificate, IconCurrencyRupee, IconRefresh } from '@tabler/icons-react';
import SearchableSelect from './SearchableSelect.jsx';
import { useGetFacetsQuery } from '../store/marketplaceApi.js';

const BUDGET_OPTIONS = [
  { value: 'under50k', label: 'Under ₹50,000 / yr' },
  { value: '50k_to_100k', label: '₹50,000 – ₹1,00,000 / yr' },
  { value: 'above100k', label: 'Above ₹1,00,000 / yr' }
];

export default function SearchDock({ filters, onFilterChange, onReset }) {
  const { data: facetsRes } = useGetFacetsQuery();
  const facets = facetsRes?.data || { cities: [], boards: [] };
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
      margin: '-28px auto 36px',
      maxWidth: '1720px',
      position: 'relative',
      zIndex: 10
    }}>
      <div className="filter-grid" style={{ alignItems: 'center' }}>
        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            SEARCH CAMPUS
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <IconSearch size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search school name or city…"
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

        {/* City Filter — searchable, never a native select */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            LOCATION / CITY
          </label>
          <SearchableSelect
            value={filters.city}
            onChange={(value) => onFilterChange('city', value)}
            options={facets.cities}
            allLabel="All Locations"
            allValue="all"
            placeholder="Select a city"
            searchPlaceholder="Type your city or area…"
            icon={IconMapPin}
          />
        </div>

        {/* Board Filter — searchable */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            AFFILIATION BOARD
          </label>
          <SearchableSelect
            value={filters.board}
            onChange={(value) => onFilterChange('board', value)}
            options={facets.boards}
            allLabel="All Boards"
            allValue="all"
            placeholder="Select a board"
            searchPlaceholder="Type a board…"
            icon={IconCertificate}
          />
        </div>

        {/* Budget Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            ANNUAL BUDGET
          </label>
          <SearchableSelect
            value={filters.budgetRange}
            onChange={(value) => onFilterChange('budgetRange', value)}
            options={BUDGET_OPTIONS}
            allLabel="Any Fee Range"
            allValue="all"
            placeholder="Select a budget"
            searchPlaceholder="Type an amount…"
            icon={IconCurrencyRupee}
          />
        </div>

        {/* Reset button */}
        <div className="filter-grid-action" style={{ alignSelf: 'flex-end' }}>
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

