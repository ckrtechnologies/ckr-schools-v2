/**
 * Academic year helpers (Indian April–March cycle).
 */
export function getCurrentAcademicYear(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric'
  }).formatToParts(date);

  const year = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value);
  const startYear = month >= 4 ? year : year - 1;

  return `${startYear}-${startYear + 1}`;
}

export function getCurrentAcademicYearShort(date = new Date()) {
  const [start, end] = getCurrentAcademicYear(date).split('-');
  return `${start}-${end.slice(-2)}`;
}
