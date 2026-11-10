import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IconChevronDown, IconSearch, IconCheck, IconX } from '@tabler/icons-react';

/**
 * CKR searchable combobox.
 *
 * Never use a native <select> for a list that can grow (cities, boards, vendors,
 * products…). Native selects render an OS-controlled popup that cannot be searched,
 * so with many options the user is forced to scroll.
 *
 * Behaviour:
 *  - click opens an in-page panel with a type-to-filter search box (auto-focused)
 *  - ArrowUp / ArrowDown / Enter / Escape keyboard support
 *  - "All" option pinned at the top, optional "no matches" state
 *  - closes on outside click, blur and selection
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  allLabel = 'All',
  allValue = 'all',
  placeholder = 'Select…',
  searchPlaceholder = 'Type to filter…',
  icon: Icon = null,
  label = null,
  id = null,
  minWidth = '100%',
  disabled = false,
  nullable = true,
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);

  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const normalized = useMemo(() => options.map((option) => (
    typeof option === 'string' ? { value: option, label: option } : option
  )), [options]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const items = needle
      ? normalized.filter((option) => option.label.toLowerCase().includes(needle))
      : normalized;
    if (!nullable) return items;
    const showAll = !needle || allLabel.toLowerCase().includes(needle);
    return showAll ? [{ value: allValue, label: allLabel }, ...items] : items;
  }, [normalized, query, allLabel, allValue, nullable]);

  const selected = normalized.find((option) => String(option.value) === String(value));
  const isEmpty = value === '' || value === null || value === undefined;
  const isAll = nullable && String(value) === String(allValue);
  const displayLabel = isEmpty || isAll
    ? (nullable ? allLabel : placeholder)
    : (selected?.label || String(value));

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlighted(0);
      const timer = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector(`[data-index="${highlighted}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [highlighted, open]);

  const commit = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((current) => Math.min(current + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filtered[highlighted]) commit(filtered[highlighted]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', minWidth, width: '100%' }}>
      {label && (
        <label
          htmlFor={id || undefined}
          style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}
        >
          {label}
        </label>
      )}

      <button
        id={id || undefined}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => !disabled && setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen((current) => !current);
          }
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: compact ? '7px 10px' : '9px 12px',
          borderRadius: compact ? '6px' : '8px',
          border: `1px solid ${open ? '#064e3b' : '#cbd5e1'}`,
          backgroundColor: disabled ? '#f1f5f9' : '#ffffff',
          fontSize: '13px',
          color: '#0f172a',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          boxShadow: open ? '0 0 0 3px rgba(6, 78, 59, 0.12)' : 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        {Icon && <Icon size={16} color="#94a3b8" style={{ flexShrink: 0 }} />}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        {(nullable ? value !== allValue : true) && !isEmpty && !disabled ? (
          <span
            role="button"
            tabIndex={-1}
            title="Clear"
            onClick={(event) => {
              event.stopPropagation();
              onChange(allValue);
              setOpen(false);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', color: '#94a3b8' }}
          >
            <IconX size={13} />
          </span>
        ) : (
          <IconChevronDown
            size={15}
            color="#94a3b8"
            style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 60,
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            minWidth: '220px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            boxShadow: '0 16px 36px -12px rgba(15, 23, 42, 0.28)',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>
            <IconSearch size={14} color="#94a3b8" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setHighlighted(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              style={{ border: 'none', outline: 'none', fontSize: '13px', width: '100%', backgroundColor: 'transparent' }}
            />
          </div>

          <div ref={listRef} role="listbox" style={{ maxHeight: '238px', overflowY: 'auto', padding: '4px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '10px', fontSize: '12.5px', color: '#94a3b8' }}>
                No match for “{query}”
              </div>
            ) : (
              filtered.map((option, index) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <div
                    key={String(option.value)}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => commit(option)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 9px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: isSelected ? '#064e3b' : '#334155',
                      fontWeight: isSelected ? 700 : 500,
                      backgroundColor: index === highlighted ? '#ecfdf5' : 'transparent',
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {option.label}
                    </span>
                    {isSelected && <IconCheck size={14} color="#047857" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
