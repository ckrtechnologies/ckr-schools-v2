import * as service from './service.js';

const resolveStudentId = (req) =>
  req.headers['x-student-id'] || req.query?.studentId || req.user.sub || req.user.id;

export async function getDashboardHandler(req, res, next) {
  try {
    const studentId = resolveStudentId(req);
    const data = await service.getDashboard(req.tenant.id, studentId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getQuoteHandler(req, res, next) {
  try {
    const data = await service.getQuote(req.tenant.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getRewardsHandler(req, res, next) {
  try {
    const studentId = resolveStudentId(req);
    const data = await service.getRewards(req.tenant.id, studentId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getTimetableHandler(req, res, next) {
  try {
    const studentId = resolveStudentId(req);
    const classId = req.query?.classId || req.params?.classId;
    const timeTables = await service.getTimetable(req.tenant.id, studentId, classId);
    return res.status(200).json({
      success: true,
      message: 'TimeTable fetched successfully',
      timeTables,
      data: timeTables,
    });
  } catch (err) {
    next(err);
  }
}

export async function getStudentAcademicsHandler(req, res, next) {
  try {
    const studentId = resolveStudentId(req);
    const academicYear = req.query?.academic_year || req.query?.academicYear || null;
    const result = await service.getStudentAcademics(req.tenant.id, studentId, academicYear);
    return res.status(200).json({
      success: true,
      grades: result.grades,
      upcomingExams: result.upcomingExams,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSiblingsHandler(req, res, next) {
  try {
    const userId = req.user.sub || req.user.id;
    const siblings = await service.getSiblings(req.tenant.id, userId);
    return res.status(200).json({
      success: true,
      data: siblings,
      siblings
    });
  } catch (err) {
    next(err);
  }
}


