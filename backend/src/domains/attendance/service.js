import * as repo from './repository.js';
import { mobileAttendanceRecordSchema, markAttendanceSchema, plannerEventSchema } from './validation.js';

export async function getAttendance(tenantId, filters) {
  return await repo.getAttendanceRecords(tenantId, filters);
}

export async function getClassRollCall(tenantId, classId, date) {
  return await repo.getClassAttendanceSheet(tenantId, classId, date);
}

export async function getOverview(tenantId, date) {
  return await repo.getDailyAttendanceOverview(tenantId, date);
}

export async function getAbsentees(tenantId, date) {
  return await repo.getSchoolAbsenteesToday(tenantId, date);
}

export async function getMonthlyMatrix(tenantId, classId, month, year) {
  return await repo.getMonthlyClassMatrix(tenantId, classId, month, year);
}

export async function markBulk(tenantId, userId, rawData) {
  let recordsArray = [];
  if (Array.isArray(rawData)) {
    recordsArray = rawData;
  } else if (rawData?.data && Array.isArray(rawData.data)) {
    recordsArray = rawData.data;
  } else if (rawData?.records && Array.isArray(rawData.records) && rawData?.date) {
    recordsArray = rawData.records.map(r => ({ ...r, date: rawData.date }));
  } else {
    throw new Error('Attendance records array is required');
  }

  if (recordsArray.length === 0) {
    return [];
  }

  // Validate and normalize records
  const validatedRecords = recordsArray.map(r => mobileAttendanceRecordSchema.parse(r));
  return await repo.batchSaveAttendance(tenantId, userId, validatedRecords);
}

export async function updateSingle(tenantId, markedBy, targetUserId, rawData) {
  const data = rawData?.data || rawData;
  if (!data?.date) {
    throw new Error('Date is required');
  }

  if (!data.status || data.status === 'delete' || data.status === 'unmarked') {
    return await repo.deleteSingleAttendance(tenantId, targetUserId, data.date);
  }

  const validated = markAttendanceSchema.parse({
    user_id: targetUserId,
    date: data.date,
    status: data.status
  });

  return await repo.upsertSingleAttendance(tenantId, targetUserId, validated.date, validated.status, markedBy);
}

// Planner
export async function getEvents(tenantId, startDate, endDate) {
  return await repo.listPlannerEvents(tenantId, startDate, endDate);
}

export async function addEvent(tenantId, rawData) {
  const validated = plannerEventSchema.parse(rawData);
  return await repo.createPlannerEvent(tenantId, validated);
}

export async function editEvent(tenantId, eventId, rawData) {
  return await repo.updatePlannerEvent(tenantId, eventId, rawData);
}

export async function removeEvent(tenantId, eventId) {
  const deleted = await repo.deletePlannerEvent(tenantId, eventId);
  if (!deleted) {
    const error = new Error('Planner event not found.');
    error.status = 404;
    error.code = 'EVENT_NOT_FOUND';
    throw error;
  }
  return { success: true, message: 'Event deleted successfully' };
}

export async function getEventConsentReport(tenantId, eventId) {
  return await repo.getEventConsents(tenantId, eventId);
}

export async function updateEventConsentStatus(tenantId, consentId, status) {
  return await repo.updateEventConsent(tenantId, consentId, status);
}

