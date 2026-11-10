import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react';

const PAGE_SIZES = [10, 25, 50, 100, 200];

/**
 * CKR 5-Standard tabular data table: 38px single-line rows, solid brand header,
 * interactive auto-sorting, sticky header and 50-row default pagination.
 */
export default function DataTable({
  columns,
  rows,
  initialSort = null,
  emptyText = 'Nothing to show yet.',
  rowKey = (row, index) => row.id ?? index,
  onRowClick,
  toolbar = null,
}) {
  const [sort, setSort] = useState(initialSort);
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [rows.length, pageSize]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const getValue = (row) => {
      const column = columns.find((c) => c.key === sort.key);
      if (column?.sortValue) return column.sortValue(row);
      return row[sort.key];
    };
    return [...rows].sort((a, b) => {
      let aValue = getValue(a);
      let bValue = getValue(b);
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';
      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const SortIcon = ({ columnKey }) => {
    if (sort?.key !== columnKey) return <ChevronsUpDown size={11} style={{ opacity: 0.65 }} />;
    return sort.direction === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toolbar}

      <div className="ckr-table-wrap">
        <table className="ckr-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.sortable === false ? 'no-sort' : ''}
                  style={{ width: column.width, textAlign: column.align || 'left' }}
                  onClick={column.sortable === false ? undefined : () => toggleSort(column.key)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    {column.label}
                    {column.sortable !== false && <SortIcon columnKey={column.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', height: '96px', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Inbox size={15} />
                    {emptyText}
                  </span>
                </td>
              </tr>
            ) : (
              pageRows.map((row, index) => (
                <tr
                  key={rowKey(row, index)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.key} style={{ textAlign: column.align || 'left' }}>
                      {column.render ? column.render(row) : row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="input-glass"
            style={{ width: '76px', padding: '3px 6px' }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span>
            {sorted.length === 0 ? '0' : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, sorted.length)}`} of {sorted.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="ckr-icon-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            title="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="ckr-icon-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            title="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
