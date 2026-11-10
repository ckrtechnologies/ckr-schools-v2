import * as service from './service.js';

export async function getAttendanceHandler(req, res, next) {
  try {
    const { startDate, endDate, classId, studentId, date, view, month, year } = req.query;

    if (view === 'overview') {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const data = await service.getOverview(req.tenant.id, targetDate);
      return res.status(200).json({ success: true, data });
    }

    if (view === 'absentees') {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const data = await service.getAbsentees(req.tenant.id, targetDate);
      return res.status(200).json({ success: true, data });
    }

    if (view === 'matrix' && classId) {
      const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
      const currentYear = year ? Number(year) : new Date().getFullYear();
      const data = await service.getMonthlyMatrix(req.tenant.id, classId, currentMonth, currentYear);
      return res.status(200).json({ success: true, data });
    }

    let targetStudentId = req.headers['x-student-id'] || studentId;
    if (!targetStudentId && !classId && (req.user?.type === 'student' || req.user?.role === 'student' || req.user?.type === 'parent')) {
      targetStudentId = req.headers['x-student-id'] || req.user.sub || req.user.id;
    }

    // Date range or class query (Teacher & Student Mobile App & Reports)
    if (startDate || endDate || (classId && !view) || targetStudentId) {
      const records = await service.getAttendance(req.tenant.id, { startDate, endDate, classId, studentId: targetStudentId, date });
      return res.status(200).json({ success: true, records, attendance: records, data: records });
    }

    // Default: Return overview for today
    const targetDate = date || new Date().toISOString().split('T')[0];
    const data = await service.getOverview(req.tenant.id, targetDate);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function bulkUpdateAttendanceHandler(req, res, next) {
  try {
    const markedBy = req.user.sub || req.user.id;
    const data = await service.markBulk(req.tenant.id, markedBy, req.body);
    return res.status(200).json({
      success: true,
      message: 'Bulk attendance updated successfully',
      count: data.length,
      records: data,
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSingleAttendanceHandler(req, res, next) {
  try {
    const markedBy = req.user.sub || req.user.id;
    const result = await service.updateSingle(req.tenant.id, markedBy, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

// Planner
export async function getPlannerEventsHandler(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = await service.getEvents(req.tenant.id, startDate, endDate);
    return res.status(200).json({ success: true, data, events: data });
  } catch (err) {
    next(err);
  }
}

export async function createPlannerEventHandler(req, res, next) {
  try {
    const data = await service.addEvent(req.tenant.id, req.body);
    return res.status(201).json({ success: true, message: 'Event added to calendar', data });
  } catch (err) {
    next(err);
  }
}

export async function updatePlannerEventHandler(req, res, next) {
  try {
    const data = await service.editEvent(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Event updated', data });
  } catch (err) {
    next(err);
  }
}

export async function deletePlannerEventHandler(req, res, next) {
  try {
    const result = await service.removeEvent(req.tenant.id, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getConsentReportHandler(req, res, next) {
  try {
    const data = await service.getEventConsentReport(req.tenant.id, req.params.eventId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function sendConsentRemindersHandler(req, res) {
  return res.status(200).json({ success: true, message: "Reminders sent successfully!" });
}

export async function mockParentConsentHandler(req, res, next) {
  try {
    await service.updateEventConsentStatus(req.tenant.id, req.params.consentId, req.body.status);
    return res.status(200).json({ success: true, message: "Consent status updated" });
  } catch (err) {
    next(err);
  }
}

