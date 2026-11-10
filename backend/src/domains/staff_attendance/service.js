import * as repo from './repository.js';

export function getTodayDateString() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
  return parts; // Returns YYYY-MM-DD
}

export async function getTodayAttendance(tenantId, staffId) {
  const today = getTodayDateString();
  const record = await repo.getTodayAttendance(tenantId, staffId, today);
  return {
    date: today,
    record: record || {
      status: 'Unmarked',
      check_in_time: null,
      check_out_time: null
    }
  };
}

export async function checkIn(tenantId, staffId, remarks = null, ipAddress = null) {
  const today = getTodayDateString();
  const record = await repo.checkIn(tenantId, staffId, today, remarks, ipAddress);
  return record;
}

export async function checkOut(tenantId, staffId, remarks = null) {
  const today = getTodayDateString();
  const record = await repo.checkOut(tenantId, staffId, today, remarks);
  return record;
}

export async function getMyHistory(tenantId, staffId, { month, startDate, endDate }) {
  let start = startDate;
  let end = endDate;

  if (!start || !end) {
    const targetMonth = month || getTodayDateString().slice(0, 7); // 'YYYY-MM'
    const [year, m] = targetMonth.split('-').map(Number);
    start = `${targetMonth}-01`;
    const lastDay = new Date(year, m, 0).getDate();
    end = `${targetMonth}-${String(lastDay).padStart(2, '0')}`;
  }

  const records = await repo.getStaffHistory(tenantId, staffId, start, end);

  // Compute statistics
  const stats = {
    total: records.length,
    present: 0,
    absent: 0,
    leave: 0,
    half_day: 0,
    late: 0,
    holiday: 0,
  };

  records.forEach((r) => {
    const s = (r.status || '').toLowerCase();
    if (s === 'present') stats.present++;
    else if (s === 'absent') stats.absent++;
    else if (s === 'leave') stats.leave++;
    else if (s === 'half day') stats.half_day++;
    else if (s === 'late') stats.late++;
    else if (s === 'holiday') stats.holiday++;
  });

  return {
    startDate: start,
    endDate: end,
    stats,
    records,
  };
}

export async function getRoster(tenantId, date, role, search) {
  const targetDate = date || getTodayDateString();
  const records = await repo.getRoster(tenantId, targetDate, role, search);

  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === 'Present').length,
    absent: records.filter((r) => r.status === 'Absent').length,
    leave: records.filter((r) => r.status === 'Leave').length,
    half_day: records.filter((r) => r.status === 'Half Day').length,
    unmarked: records.filter((r) => r.status === 'Unmarked').length,
  };

  return {
    date: targetDate,
    stats,
    roster: records,
  };
}

export async function overrideAttendance(tenantId, { staff_id, date, status, remarks, check_in_time, check_out_time }, adminUserId) {
  return await repo.upsertOverride(
    tenantId,
    staff_id,
    date,
    status,
    adminUserId,
    remarks,
    check_in_time || null,
    check_out_time || null
  );
}

export async function getMonthlyMatrix(tenantId, month) {
  const targetMonth = month || getTodayDateString().slice(0, 7);
  const [year, m] = targetMonth.split('-').map(Number);
  const start = `${targetMonth}-01`;
  const lastDay = new Date(year, m, 0).getDate();
  const end = `${targetMonth}-${String(lastDay).padStart(2, '0')}`;

  const { staff, records } = await repo.getMonthlyMatrix(tenantId, start, end);

  // Group records by staff_id -> date -> status
  const staffMap = {};
  staff.forEach((s) => {
    staffMap[s.id] = {
      ...s,
      days: {},
      stats: { present: 0, absent: 0, leave: 0, half_day: 0, late: 0, unmarked: 0 }
    };
  });

  records.forEach((r) => {
    if (staffMap[r.staff_id]) {
      staffMap[r.staff_id].days[r.date] = r;
      const s = (r.status || '').toLowerCase();
      if (s === 'present') staffMap[r.staff_id].stats.present++;
      else if (s === 'absent') staffMap[r.staff_id].stats.absent++;
      else if (s === 'leave') staffMap[r.staff_id].stats.leave++;
      else if (s === 'half day') staffMap[r.staff_id].stats.half_day++;
      else if (s === 'late') staffMap[r.staff_id].stats.late++;
    }
  });

  return {
    month: targetMonth,
    daysInMonth: lastDay,
    staff: Object.values(staffMap),
  };
}

