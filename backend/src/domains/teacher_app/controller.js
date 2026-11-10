import * as service from './service.js';

export async function getTeacherProfileHandler(req, res, next) {
  try {
    const teacherId = req.user.sub || req.user.id;
    const data = await service.getTeacherProfile(req.tenant.id, teacherId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getTeacherClassesHandler(req, res, next) {
  try {
    const teacherId = req.user.sub || req.user.id;
    const data = await service.getTeacherClasses(req.tenant.id, teacherId);
    return res.status(200).json({ success: true, classes: data, data });
  } catch (err) {
    next(err);
  }
}

export async function getClassStudentsHandler(req, res, next) {
  try {
    const data = await service.getClassStudents(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, students: data, data });
  } catch (err) {
    next(err);
  }
}

export async function getClassPerformanceHandler(req, res, next) {
  try {
    const data = await service.getClassPerformance(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getTeacherTimetableHandler(req, res, next) {
  try {
    const teacherId = req.user.sub || req.user.id;
    const classId = req.query?.classId || null;
    const timeTables = await service.getTeacherTimetable(req.tenant.id, teacherId, classId);
    return res.status(200).json({
      success: true,
      message: 'Teacher TimeTable fetched successfully',
      count: timeTables.length,
      timeTables,
      data: timeTables
    });
  } catch (err) {
    next(err);
  }
}

