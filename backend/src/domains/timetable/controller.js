import * as service from './service.js';

// Settings
export async function getSettingsHandler(req, res, next) {
  try {
    const data = await service.getSettings(req.tenant.id, req.query?.academicYear);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function saveSettingsHandler(req, res, next) {
  try {
    const data = await service.saveSettings(req.tenant.id, req.body);
    return res.status(200).json({ success: true, message: 'Timetable settings saved', data });
  } catch (err) {
    next(err);
  }
}

// Timetable
export async function getTimetableHandler(req, res, next) {
  try {
    let classId = req.query?.classId || req.params?.classId;
    if (!classId && (req.user?.role === 'student' || req.user?.type === 'student' || req.user?.type === 'parent')) {
      const targetStudentId = req.headers['x-student-id'] || req.query?.studentId || req.user?.sub || req.user?.id;
      if (targetStudentId) {
        classId = await service.resolveStudentClassId(req.tenant.id, targetStudentId);
      }
    }

    const data = await service.getAllTimetables(req.tenant.id, classId || null);
    return res.status(200).json({
      success: true,
      message: 'TimeTable fetched successfully',
      timeTables: data,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function addPeriodHandler(req, res, next) {
  try {
    const payload = req.body?.data || req.body;
    const data = await service.addPeriod(req.tenant.id, payload);
    return res.status(201).json({ success: true, message: 'Period added', data });
  } catch (err) {
    next(err);
  }
}

export async function updatePeriodHandler(req, res, next) {
  try {
    const data = await service.editPeriod(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Period updated', data });
  } catch (err) {
    next(err);
  }
}

export async function deletePeriodHandler(req, res, next) {
  try {
    const result = await service.removePeriod(req.tenant.id, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function duplicateDayHandler(req, res, next) {
  try {
    const result = await service.duplicateDay(req.tenant.id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// Proxies
export async function getDailyProxiesHandler(req, res, next) {
  try {
    const date = req.query?.date || new Date().toISOString().split('T')[0];
    const data = await service.getDailyProxies(req.tenant.id, date);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function assignProxyHandler(req, res, next) {
  try {
    const data = await service.assignProxy(req.tenant.id, req.user.sub, req.body);
    return res.status(201).json({ success: true, message: 'Proxy substitution assigned', data });
  } catch (err) {
    next(err);
  }
}

export async function cancelProxyHandler(req, res, next) {
  try {
    const result = await service.cancelProxy(req.tenant.id, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getFreeTeachersHandler(req, res, next) {
  try {
    const data = await service.getFreeTeachers(req.tenant.id, req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function assignAllotmentHandler(req, res, next) {
  try {
    const result = await service.assignAllotment(req.tenant.id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// Teacher Schedules, Workload & Quota Matrix
export async function getTeachersWithStatsHandler(req, res, next) {
  try {
    const data = await service.getTeachersWithStats(req.tenant.id);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

export async function getTeacherWeeklyRoutineHandler(req, res, next) {
  try {
    const data = await service.getTeacherWeeklyRoutine(req.tenant.id, req.params.teacherId, req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getTeacherFullYearScheduleHandler(req, res, next) {
  try {
    const data = await service.getTeacherFullYearSchedule(req.tenant.id, req.params.teacherId, req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getWorkloadMatrixHandler(req, res, next) {
  try {
    const data = await service.getWorkloadMatrix(req.tenant.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getMasterAllotmentMatrixHandler(req, res, next) {
  try {
    const data = await service.getMasterAllotmentMatrix(req.tenant.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getSubjectQuotasHandler(req, res, next) {
  try {
    const data = await service.getSubjectQuotas(req.tenant.id);
    return res.status(200).json({ success: true, data, ...data });
  } catch (err) {
    next(err);
  }
}

export async function saveSubjectQuotasHandler(req, res, next) {
  try {
    const payload = req.body?.data || req.body;
    const result = await service.saveSubjectQuotas(req.tenant.id, payload);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getTeacherQuotasHandler(req, res, next) {
  try {
    const data = await service.getTeacherQuotas(req.tenant.id);
    return res.status(200).json({ success: true, data, ...data });
  } catch (err) {
    next(err);
  }
}

export async function saveTeacherQuotasHandler(req, res, next) {
  try {
    const payload = req.body?.data || req.body;
    const result = await service.saveTeacherQuotas(req.tenant.id, payload);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}


