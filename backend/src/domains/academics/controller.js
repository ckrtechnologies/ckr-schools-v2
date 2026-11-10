import * as service from './service.js';

// Classes
export async function getClassesHandler(req, res, next) {
  try {
    const data = await service.getClasses(req.tenant.id);
    return res.status(200).json({ success: true, count: data.length, classes: data, data });
  } catch (err) {
    next(err);
  }
}

export async function getClassByIdHandler(req, res, next) {
  try {
    const data = await service.getClass(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createClassHandler(req, res, next) {
  try {
    const data = await service.addClass(req.tenant.id, req.body);
    return res.status(201).json({ success: true, message: 'Class created successfully', data });
  } catch (err) {
    if (err.code === 'CLASS_EXISTS' || err.status === 409) {
      return res.status(409).json({ success: false, message: 'Class already exists' });
    }
    next(err);
  }
}

export async function updateClassHandler(req, res, next) {
  try {
    const classId = (req.params.id && req.params.id !== 'updateClass' && req.params.id !== 'undefined')
      ? req.params.id
      : (req.body?.id || req.body?.data?.id);
    const data = await service.editClass(req.tenant.id, classId, req.body);
    return res.status(200).json({ success: true, message: 'Class updated successfully', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteClassHandler(req, res, next) {
  try {
    const classId = (req.params.id && req.params.id !== 'deleteClass' && req.params.id !== 'undefined')
      ? req.params.id
      : (req.body?.id || req.body?.data?.id || req.query?.id);
    const result = await service.removeClass(req.tenant.id, classId);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function addTeacherHandler(req, res, next) {
  try {
    const { classId, teacherId } = req.body;
    const data = await service.setClassTeacher(req.tenant.id, classId, teacherId);
    return res.status(200).json({ success: true, message: 'Class teacher assigned', data });
  } catch (err) {
    next(err);
  }
}

// Subjects
export async function getSubjectsHandler(req, res, next) {
  try {
    const data = await service.getSubjects(req.tenant.id);
    return res.status(200).json({ success: true, count: data.length, subjects: data, data });
  } catch (err) {
    next(err);
  }
}

export async function createSubjectHandler(req, res, next) {
  try {
    const data = await service.addSubject(req.tenant.id, req.body);
    return res.status(201).json({ success: true, message: 'Subject created successfully', data });
  } catch (err) {
    next(err);
  }
}

export async function updateSubjectHandler(req, res, next) {
  try {
    const data = await service.editSubject(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Subject updated successfully', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteSubjectHandler(req, res, next) {
  try {
    const result = await service.removeSubject(req.tenant.id, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// 2D Subject-Teachers Matrix
export async function getSubjectTeachersHandler(req, res, next) {
  try {
    const data = await service.getSubjectTeachers(req.tenant.id, req.query?.classId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function assignSubjectTeacherHandler(req, res, next) {
  try {
    const result = await service.assignSubjectTeacher(req.tenant.id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// Rooms
export async function getRoomsHandler(req, res, next) {
  try {
    const data = await service.getRooms(req.tenant.id);
    return res.status(200).json({ success: true, count: data.length, rooms: data, data });
  } catch (err) {
    next(err);
  }
}

export async function createRoomHandler(req, res, next) {
  try {
    const data = await service.addRoom(req.tenant.id, req.body);
    return res.status(201).json({ success: true, message: 'Room created successfully', data });
  } catch (err) {
    next(err);
  }
}

export async function updateRoomHandler(req, res, next) {
  try {
    const data = await service.editRoom(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Room updated successfully', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteRoomHandler(req, res, next) {
  try {
    const result = await service.removeRoom(req.tenant.id, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStatsHandler(req, res, next) {
  try {
    const stats = await service.getDashboardStats(req.tenant.id);
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}


