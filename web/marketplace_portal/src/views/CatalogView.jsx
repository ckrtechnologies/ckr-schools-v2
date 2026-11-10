import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  IconArrowsDiff,
  IconSearch,
  IconMapPin,
  IconCertificate,
  IconCurrencyRupee,
  IconRefresh,
  IconCheck,
  IconSchool,
  IconArrowRight,
  IconTrash
} from '@tabler/icons-react';
import { useGetFacetsQuery, useGetSchoolsQuery } from '../store/marketplaceApi.js';
import {
  addSchoolToCompare,
  removeSchoolFromCompare,
  clearComparison
} from '../store/comparisonSlice.js';
import SearchableSelect from '../components/SearchableSelect.jsx';

const MAX_COMPARE = 3;

function formatFee(num) {
  if (num === null || num === undefined || num === '' || Number(num) <= 0) return null;
  return `₹${Number(num).toLocaleString('en-IN')}`;
}

/**
 * Dedicated Campus Catalog: browse every listed school, filter it down and pick
 * up to 3 to compare side-by-side. Comparison is a first-class action here —
 * the page never dead-ends in an empty state.
 */
export default function CatalogView({ onSelectSchool, onOpenComparison, onOpenMultiEnquiry }) {
  const dispatch = useDispatch();
  const comparedSchools = useSelector((state) => state.comparison.comparedSchools);
  const comparedSlugs = useMemo(() => comparedSchools.map((school) => school.slug), [comparedSchools]);

  const [filters, setFilters] = useState({ search: '', city: 'all', board: 'all', budgetRange: 'all' });

  const { data: facetsRes } = useGetFacetsQuery();
  const facets = facetsRes?.data || { cities: [], boards: [] };

  let minFee;
  let maxFee;
  if (filters.budgetRange === 'under50k') maxFee = 50000;
  else if (filters.budgetRange === '50k_to_100k') { minFee = 50000; maxFee = 100000; }
  else if (filters.budgetRange === 'above100k') minFee = 100000;

  const { data: response, isLoading, isFetching } = useGetSchoolsQuery({
    search: filters.search,
    city: filters.city,
    board: filters.board,
    minFee,
    maxFee
  });

  const schools = response?.data || [];
  const isFull = comparedSchools.length >= MAX_COMPARE;

  const setFilter = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const resetFilters = () => setFilters({ search: '', city: 'all', board: 'all', budgetRange: 'all' });

  const toggle = (school) => {
    if (comparedSlugs.includes(school.slug)) dispatch(removeSchoolFromCompare(school.slug));
    else if (!isFull) dispatch(addSchoolToCompare(school));
  };

  const budgetOptions = [
    { value: 'under50k', label: 'Under ₹50,000 / yr' },
    { value: '50k_to_100k', label: '₹50,000 – ₹1,00,000 / yr' },
    { value: 'above100k', label: 'Above ₹1,00,000 / yr' }
  ];

  const activeFilterCount = [
    filters.search.trim() !== '',
    filters.city !== 'all',
    filters.board !== 'all',
    filters.budgetRange !== 'all'
  ].filter(Boolean).length;

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: comparedSchools.length ? '120px' : '60px' }}>
      {/* Page header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="mk-shell" style={{ paddingTop: '28px', paddingBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Campus Catalog
              </div>
              <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', margin: '4px 0 6px' }}>
                Compare Schools Side-by-Side
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, maxWidth: '620px' }}>
                Filter the full catalog, tick up to {MAX_COMPARE} campuses and compare fees, boards, facilities and parent ratings in one view.
              </p>
            </div>

            <button
              onClick={onOpenComparison}
              disabled={comparedSchools.length < 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: comparedSchools.length ? '#064e3b' : '#e2e8f0',
                color: comparedSchools.length ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '9px',
                padding: '11px 20px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: comparedSchools.length ? 'pointer' : 'not-allowed'
              }}
            >
              <IconArrowsDiff size={16} />
              Compare now{comparedSchools.length ? ` (${comparedSchools.length})` : ''}
              <IconArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="mk-shell" style={{ paddingTop: '20px' }}>
        {/* Filter dock */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '16px 18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -6px rgba(0, 0, 0, 0.06)',
            marginBottom: '20px'
          }}
        >
          <div className="filter-grid">
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                SEARCH CAMPUS
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <IconSearch size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="School name, tagline…"
                  value={filters.search}
                  onChange={(event) => setFilter('search')(event.target.value)}
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

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                LOCATION / CITY
              </label>
              <SearchableSelect
                value={filters.city}
                onChange={setFilter('city')}
                options={facets.cities}
                allLabel="All Locations"
                searchPlaceholder="Type your city or area…"
                icon={IconMapPin}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                BOARD
              </label>
              <SearchableSelect
                value={filters.board}
                onChange={setFilter('board')}
                options={facets.boards}
                allLabel="All Boards"
                searchPlaceholder="Type a board…"
                icon={IconCertificate}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                ANNUAL BUDGET
              </label>
              <SearchableSelect
                value={filters.budgetRange}
                onChange={setFilter('budgetRange')}
                options={budgetOptions}
                allLabel="Any Fee Range"
                searchPlaceholder="Type an amount…"
                icon={IconCurrencyRupee}
              />
            </div>

            <button
              className="filter-grid-action"
              onClick={resetFilters}
              title="Reset filters"
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
                fontWeight: 600,
                height: '38px'
              }}
            >
              <IconRefresh size={16} />
              Reset
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '12.5px', color: '#64748b', flexWrap: 'wrap' }}>
            <strong style={{ color: '#0f172a' }}>{schools.length}</strong> campus{schools.length === 1 ? '' : 'es'} match
            {activeFilterCount > 0 && (
              <>
                <span>·</span>
                <span>{activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} active</span>
              </>
            )}
            <span style={{ marginLeft: 'auto', fontWeight: 600, color: isFull ? '#b45309' : '#64748b' }}>
              {comparedSchools.length}/{MAX_COMPARE} selected for comparison
            </span>
          </div>
        </div>

        {/* Catalog list */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: '14px' }}>
            Loading campus catalog…
          </div>
        ) : schools.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '48px 20px', textAlign: 'center' }}>
            <IconSchool size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>No campuses match these filters</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              Widen the location or clear the budget range to see more schools.
            </p>
            <button
              onClick={resetFilters}
              style={{ backgroundColor: '#064e3b', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {schools.map((school) => {
              const isSelected = comparedSlugs.includes(school.slug);
              const disabled = !isSelected && isFull;
              const minF = formatFee(school.min_fee);
              const maxF = formatFee(school.max_fee);
              const facilities = typeof school.facilities === 'string'
                ? (() => { try { return JSON.parse(school.facilities || '[]'); } catch { return []; } })()
                : (school.facilities || []);

              return (
                <div
                  key={school.id}
                  className="catalog-row"
                  style={{
                    backgroundColor: '#ffffff',
                    border: isSelected ? '1.5px solid #064e3b' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    boxShadow: isSelected ? '0 0 0 3px rgba(6, 78, 59, 0.07)' : '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div
                    onClick={() => onSelectSchool(school.slug)}
                    style={{ width: '48px', height: '48px', borderRadius: '9px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {school.logo_url ? (
                      <img
                        src={school.logo_url}
                        alt={`${school.name} logo`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }}
                      />
                    ) : (
                      <IconSchool size={22} color="#94a3b8" />
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => onSelectSchool(school.slug)}
                        style={{ background: 'none', border: 'none', padding: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', cursor: 'pointer', letterSpacing: '-0.2px' }}
                      >
                        {school.name}
                      </button>
                      {school.is_verified && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', fontWeight: 700, color: '#047857', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '1px 7px' }}>
                          <IconCheck size={10} /> Verified
                        </span>
                      )}
                      {school.is_featured && (
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#b45309', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '1px 7px' }}>
                          Featured
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '4px', fontSize: '12.5px', color: '#64748b' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <IconMapPin size={13} /> {[school.city, school.state].filter(Boolean).join(', ') || 'Location not set'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <IconCertificate size={13} /> {school.affiliation_board || 'Board not set'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <IconCurrencyRupee size={13} /> {minF && maxF ? `${minF} – ${maxF} / yr` : 'Fees on enquiry'}
                      </span>
                      {Number(school.review_count) > 0 && (
                        <span style={{ color: '#b45309', fontWeight: 700 }}>
                          ★ {Number(school.avg_rating).toFixed(1)} ({school.review_count})
                        </span>
                      )}
                      {facilities.length > 0 && (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '340px' }}>
                          {facilities.slice(0, 3).join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="catalog-row-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => onSelectSchool(school.slug)}
                      style={{ backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 13px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      View profile
                    </button>
                    <button
                      onClick={() => toggle(school)}
                      disabled={disabled}
                      title={disabled ? `Compare up to ${MAX_COMPARE} schools — remove one first` : undefined}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: isSelected ? '#064e3b' : '#ffffff',
                        color: isSelected ? '#ffffff' : disabled ? '#94a3b8' : '#064e3b',
                        border: `1px solid ${isSelected ? '#064e3b' : disabled ? '#e2e8f0' : '#a7f3d0'}`,
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: disabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isSelected ? <IconCheck size={14} /> : <IconArrowsDiff size={14} />}
                      {isSelected ? 'Comparing' : 'Compare'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky comparison bar */}
      {comparedSchools.length > 0 && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            boxShadow: '0 -8px 24px -12px rgba(15, 23, 42, 0.25)',
            zIndex: 200
          }}
        >
          <div className="mk-shell" style={{ paddingTop: '12px', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, color: '#064e3b' }}>
              <IconArrowsDiff size={16} />
              {comparedSchools.length} of {MAX_COMPARE} selected
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
              {comparedSchools.map((school) => (
                <span
                  key={school.slug}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#064e3b',
                    borderRadius: '20px',
                    padding: '4px 8px 4px 12px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {school.name}
                  <button
                    onClick={() => dispatch(removeSchoolFromCompare(school.slug))}
                    title="Remove"
                    style={{ background: 'none', border: 'none', display: 'inline-flex', cursor: 'pointer', color: '#047857', padding: 0 }}
                  >
                    <IconTrash size={12} />
                  </button>
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => dispatch(clearComparison())}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear
              </button>
              <button
                onClick={comparedSchools.length > 1 ? onOpenComparison : undefined}
                disabled={comparedSchools.length < 2}
                title={comparedSchools.length < 2 ? 'Select at least 2 schools to compare' : undefined}
                style={{
                  backgroundColor: comparedSchools.length > 1 ? '#064e3b' : '#e2e8f0',
                  color: comparedSchools.length > 1 ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: comparedSchools.length > 1 ? 'pointer' : 'not-allowed'
                }}
              >
                Compare {comparedSchools.length} schools
              </button>
              <button
                onClick={onOpenMultiEnquiry}
                disabled={comparedSchools.length < 1}
                style={{
                  backgroundColor: '#ffffff',
                  color: comparedSchools.length ? '#064e3b' : '#94a3b8',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: comparedSchools.length ? 'pointer' : 'not-allowed'
                }}
              >
                Enquire to all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
