import * as service from './service.js';

// Coursework
export async function getCourseworkHandler(req, res, next) {
  try {
    const classId = req.query?.classId || req.query?.class_id;
    const userRole = req.user?.role;
    let courses;

    if (userRole === 'student' && !classId) {
      const studentId = req.user.sub || req.user.id;
      courses = await service.getStudentCoursework(req.tenant.id, studentId);
    } else {
      courses = await service.getCoursework(req.tenant.id, classId);
    }

    return res.status(200).json({
      success: true,
      message: 'course get Successfully',
      count: courses.length,
      courses,
      data: courses,
    });
  } catch (err) {
    next(err);
  }
}

export async function getStudentCoursesHandler(req, res, next) {
  try {
    const studentId = req.headers['x-student-id'] || req.query?.studentId || req.user.sub || req.user.id;
    const courses = await service.getStudentCoursework(req.tenant.id, studentId);
    return res.status(200).json({
      success: true,
      message: 'course get Successfully',
      count: courses.length,
      courses,
      data: courses,
    });
  } catch (err) {
    next(err);
  }
}

export async function submitCourseworkHandler(req, res, next) {
  try {
    const studentId = req.user.sub || req.user.id;
    const payload = req.body?.data || req.body;
    await service.submitCourseAnswer(req.tenant.id, studentId, payload);
    return res.status(200).json({
      success: true,
      message: 'Successfully submitted.',
    });
  } catch (err) {
    next(err);
  }
}

export async function createCourseworkHandler(req, res, next) {
  try {
    const data = await service.addCoursework(req.tenant.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Course Created Successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCourseworkHandler(req, res, next) {
  try {
    const data = await service.editCoursework(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCourseworkHandler(req, res, next) {
  try {
    const result = await service.removeCoursework(req.tenant.id, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// Consents
export async function getConsentsHandler(req, res, next) {
  try {
    const userRole = req.user?.role;
    if (userRole === 'student') {
      const studentId = req.user.sub || req.user.id;
      const data = await service.getStudentConsents(req.tenant.id, studentId);
      return res.status(200).json({ success: true, data });
    }
    const data = await service.getConsents(req.tenant.id, req.query?.classId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getStudentConsentsHandler(req, res, next) {
  try {
    const studentId = req.headers['x-student-id'] || req.query?.studentId || req.user.sub || req.user.id;
    const data = await service.getStudentConsents(req.tenant.id, studentId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateStudentConsentStatusHandler(req, res, next) {
  try {
    const studentId = req.headers['x-student-id'] || req.query?.studentId || req.user.sub || req.user.id;
    const { id } = req.params;
    const { status } = req.body;
    const data = await service.updateStudentConsentStatus(req.tenant.id, studentId, id, status);
    return res.status(200).json({
      success: true,
      message: 'Consent status updated',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function createConsentHandler(req, res, next) {
  try {
    const data = await service.addConsent(req.tenant.id, req.user.sub, req.body);
    return res.status(201).json({ success: true, message: 'Consent slip created', data });
  } catch (err) {
    next(err);
  }
}

export async function updateConsentHandler(req, res, next) {
  try {
    const data = await service.editConsent(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Consent updated', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteConsentHandler(req, res, next) {
  try {
    await service.removeConsent(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, message: 'Consent deleted' });
  } catch (err) {
    next(err);
  }
}

export async function getConsentReportHandler(req, res, next) {
  try {
    const data = await service.getConsentReport(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function respondConsentHandler(req, res, next) {
  try {
    const studentId = req.user.sub;
    const data = await service.respondConsent(req.tenant.id, studentId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Response recorded', data });
  } catch (err) {
    next(err);
  }
}
