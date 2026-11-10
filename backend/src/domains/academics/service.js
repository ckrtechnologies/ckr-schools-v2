import * as repo from './repository.js';
import {
  createClassSchema,
  updateClassSchema,
  createSubjectSchema,
  updateSubjectSchema,
  assignSubjectTeacherSchema,
  roomSchema
} from './validation.js';

// Classes
export async function getClasses(tenantId) {
  return await repo.listClasses(tenantId);
}

export async function getClass(tenantId, classId) {
  const item = await repo.getClassById(tenantId, classId);
  if (!item) {
    const error = new Error('Class not found.');
    error.status = 404;
    error.code = 'CLASS_NOT_FOUND';
    throw error;
  }
  return item;
}

export async function addClass(tenantId, rawData) {
  const data = rawData?.data || rawData;
  const validated = createClassSchema.parse(data);
  return await repo.createClass(tenantId, validated);
}

export async function editClass(tenantId, classId, rawData) {
  const data = rawData?.data || rawData;
  const validated = updateClassSchema.parse(data);
  const targetId = (classId && classId !== 'updateClass' && classId !== 'undefined') ? classId : (data?.id || rawData?.id);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!targetId || !uuidRegex.test(targetId)) {
    const error = new Error('Valid Class ID (UUID) is required to update class.');
    error.status = 400;
    error.code = 'INVALID_CLASS_ID';
    throw error;
  }

  const updated = await repo.updateClass(tenantId, targetId, validated);
  if (!updated) {
    const error = new Error('Class not found or unauthorized.');
    error.status = 404;
    error.code = 'CLASS_NOT_FOUND';
    throw error;
  }
  return updated;
}

export async function removeClass(tenantId, classId) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!classId || !uuidRegex.test(classId)) {
    const error = new Error('Valid Class ID (UUID) is required to delete class.');
    error.status = 400;
    error.code = 'INVALID_CLASS_ID';
    throw error;
  }
  const deleted = await repo.deleteClass(tenantId, classId);
  if (!deleted) {
    const error = new Error('Class not found or unauthorized.');
    error.status = 404;
    error.code = 'CLASS_NOT_FOUND';
    throw error;
  }
  return { success: true, message: 'Class deleted successfully' };
}

export async function setClassTeacher(tenantId, classId, teacherId) {
  return await repo.assignClassTeacher(tenantId, classId, teacherId);
}

// Subjects
export async function getSubjects(tenantId) {
  return await repo.listSubjects(tenantId);
}

export async function addSubject(tenantId, rawData) {
  const data = rawData?.data || rawData;
  const validated = createSubjectSchema.parse(data);
  return await repo.createSubject(tenantId, validated);
}

export async function editSubject(tenantId, subjectId, rawData) {
  const data = rawData?.data || rawData;
  const validated = updateSubjectSchema.parse(data);
  const targetId = subjectId || data?.id;
  const updated = await repo.updateSubject(tenantId, targetId, validated);
  if (!updated) {
    const error = new Error('Subject not found or unauthorized.');
    error.status = 404;
    error.code = 'SUBJECT_NOT_FOUND';
    throw error;
  }
  return updated;
}

export async function removeSubject(tenantId, subjectId) {
  const deleted = await repo.deleteSubject(tenantId, subjectId);
  if (!deleted) {
    const error = new Error('Subject not found or unauthorized.');
    error.status = 404;
    error.code = 'SUBJECT_NOT_FOUND';
    throw error;
  }
  return { success: true, message: 'Subject deleted successfully' };
}

// 2D Matrix
export async function getSubjectTeachers(tenantId, classId) {
  return await repo.getSubjectTeachers(tenantId, classId);
}

export async function assignSubjectTeacher(tenantId, rawData) {
  const data = rawData.data || rawData; // Support { data: { ... } } from Vision or direct { ... }
  const validated = assignSubjectTeacherSchema.parse(data);
  return await repo.assignSubjectTeacher(tenantId, validated);
}

// Rooms
export async function getRooms(tenantId) {
  return await repo.listRooms(tenantId);
}

export async function addRoom(tenantId, rawData) {
  const data = rawData?.data || rawData;
  const validated = roomSchema.parse(data);
  return await repo.createRoom(tenantId, validated);
}

export async function editRoom(tenantId, roomId, rawData) {
  const data = rawData?.data || rawData;
  const validated = roomSchema.parse(data);
  const updated = await repo.updateRoom(tenantId, roomId, validated);
  if (!updated) {
    const error = new Error('Room not found or unauthorized.');
    error.status = 404;
    error.code = 'ROOM_NOT_FOUND';
    throw error;
  }
  return updated;
}

export async function removeRoom(tenantId, roomId) {
  const deleted = await repo.deleteRoom(tenantId, roomId);
  if (!deleted) {
    const error = new Error('Room not found or unauthorized.');
    error.status = 404;
    error.code = 'ROOM_NOT_FOUND';
    throw error;
  }
  return { success: true, message: 'Room removed successfully' };
}

// School Overview Dashboard
export async function getDashboardStats(tenantId) {
  return await repo.getSchoolDashboardStats(tenantId);
}


