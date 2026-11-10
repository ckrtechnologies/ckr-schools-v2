import * as repo from './repository.js';
import { timetableSettingsSchema, addPeriodSchema, assignProxySchema } from './validation.js';

// Settings
export async function getSettings(tenantId, academicYear) {
  const settings = await repo.getSettings(tenantId, academicYear);
  if (!settings) {
    // Return default settings if none saved yet
    return {
      academic_year: academicYear || '2026-2027',
      school_start_time: '08:00 AM',
      period_duration_minutes: 50,
      assembly_duration_minutes: 20,
      recess_after_period: 4,
      recess_duration_minutes: 20,
      lunch_after_period: 6,
      lunch_duration_minutes: 40,
      periods_per_day: 8,
      saturday_periods: 5,
      max_daily_subject_periods: 1,
      is_active: true
    };
  }
  return settings;
}

export async function saveSettings(tenantId, rawData) {
  const validated = timetableSettingsSchema.parse(rawData);
  return await repo.upsertSettings(tenantId, validated);
}

// Class Timetable
export async function resolveStudentClassId(tenantId, studentId) {
  return await repo.getStudentClassId(tenantId, studentId);
}

export async function getTimetable(tenantId, classId) {
  return await repo.getClassTimetable(tenantId, classId);
}

export async function getAllTimetables(tenantId, classId = null) {
  return await repo.getAllTimetablesGrouped(tenantId, classId);
}

export async function editPeriod(tenantId, periodId, data) {
  const updated = await repo.updatePeriod(tenantId, periodId, data);
  if (!updated) {
    const error = new Error('Period not found.');
    error.status = 404;
    error.code = 'PERIOD_NOT_FOUND';
    throw error;
  }
  return updated;
}

export async function duplicateDay(tenantId, data) {
  const payload = data?.data || data;
  return await repo.duplicateDaySchedule(tenantId, payload);
}

export async function addPeriod(tenantId, rawData) {
  const payload = rawData?.data || rawData;
  if (Array.isArray(payload?.timeTables)) {
    const results = [];
    for (const t of payload.timeTables) {
      const single = {
        ...t,
        classId: payload.classId || payload.class_id,
        date: payload.date
      };
      const validated = addPeriodSchema.parse(single);
      const inserted = await repo.createPeriod(tenantId, validated);
      results.push(inserted);
    }
    return results;
  }

  const validated = addPeriodSchema.parse(payload);
  return await repo.createPeriod(tenantId, validated);
}

export async function removePeriod(tenantId, periodId) {
  const deleted = await repo.deletePeriod(tenantId, periodId);
  if (!deleted) {
    const error = new Error('Period not found.');
    error.status = 404;
    error.code = 'PERIOD_NOT_FOUND';
    throw error;
  }
  return { success: true, message: 'Period removed successfully' };
}

// Daily Proxies
export async function getDailyProxies(tenantId, date) {
  return await repo.listDailyProxies(tenantId, date);
}

export async function assignProxy(tenantId, createdBy, rawData) {
  const validated = assignProxySchema.parse(rawData);
  return await repo.createProxy(tenantId, createdBy, validated);
}

export async function cancelProxy(tenantId, proxyId) {
  const deleted = await repo.removeProxy(tenantId, proxyId);
  if (!deleted) {
    const error = new Error('Proxy record not found.');
    error.status = 404;
    error.code = 'PROXY_NOT_FOUND';
    throw error;
  }
  return { success: true, message: 'Proxy substitution cancelled' };
}

export async function getFreeTeachers(tenantId, filters) {
  return await repo.getFreeTeachers(tenantId, filters);
}

export async function assignAllotment(tenantId, data) {
  return await repo.assignAllotment(tenantId, data);
}

// Teacher Schedules, Workload & Quota Matrix
export async function getTeachersWithStats(tenantId) {
  return await repo.listTeachersWithScheduleStats(tenantId);
}

export async function getTeacherWeeklyRoutine(tenantId, teacherId, filters) {
  return await repo.getTeacherWeeklyRoutine(tenantId, teacherId, filters);
}

export async function getTeacherFullYearSchedule(tenantId, teacherId, filters) {
  return await repo.getTeacherFullYearSchedule(tenantId, teacherId, filters);
}

export async function getWorkloadMatrix(tenantId) {
  return await repo.getWorkloadMatrix(tenantId);
}

export async function getMasterAllotmentMatrix(tenantId) {
  return await repo.getMasterAllotmentMatrix(tenantId);
}

export async function getSubjectQuotas(tenantId) {
  return await repo.getSubjectQuotas(tenantId);
}

export async function saveSubjectQuotas(tenantId, payload) {
  return await repo.saveSubjectQuotas(tenantId, payload);
}

export async function getTeacherQuotas(tenantId) {
  return await repo.getTeacherQuotas(tenantId);
}

export async function saveTeacherQuotas(tenantId, payload) {
  return await repo.saveTeacherQuotas(tenantId, payload);
}


