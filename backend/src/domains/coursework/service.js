import * as repo from './repository.js';
import { createCourseworkSchema, updateCourseworkSchema, createConsentSchema, updateConsentSchema, updateConsentResponseSchema } from './validation.js';

// Coursework
export async function getCoursework(tenantId, classId) {
  return await repo.listCoursework(tenantId, classId);
}

export async function getStudentCoursework(tenantId, studentId) {
  return await repo.listStudentCoursework(tenantId, studentId);
}

export async function submitCourseAnswer(tenantId, studentId, data) {
  const content = data.content || data.file_url || data.answer;
  const targetStudentId = data.studentId || data.student_id || studentId;
  const courseId = data.id || data.course_id || data.courseId;

  if (!content || !targetStudentId || !courseId) {
    const error = new Error('Please provide all required information.');
    error.status = 400;
    error.code = 'INVALID_INPUT';
    throw error;
  }

  const result = await repo.submitCourseAnswer(tenantId, {
    courseId,
    studentId: targetStudentId,
    content
  });

  if (!result.success && result.alreadySubmitted) {
    const error = new Error(result.message);
    error.status = 400;
    error.code = 'ALREADY_SUBMITTED';
    throw error;
  }

  return result;
}

export async function addCoursework(tenantId, rawData) {
  const validated = createCourseworkSchema.parse(rawData);
  return await repo.createCoursework(tenantId, validated);
}

export async function editCoursework(tenantId, courseId, rawData) {
  const validated = updateCourseworkSchema.parse(rawData);
  const updated = await repo.updateCoursework(tenantId, courseId, validated);
  if (!updated) {
    const error = new Error('Coursework entry not found.');
    error.status = 404;
    error.code = 'COURSEWORK_NOT_FOUND';
    throw error;
  }
  return updated;
}

export async function removeCoursework(tenantId, courseId) {
  const deleted = await repo.deleteCoursework(tenantId, courseId);
  if (!deleted) {
    const error = new Error('Coursework entry not found.');
    error.status = 404;
    error.code = 'COURSEWORK_NOT_FOUND';
    throw error;
  }
  return { success: true, message: 'Course deleted successfully' };
}

// Consents
export async function getConsents(tenantId, classId) {
  return await repo.listConsents(tenantId, classId);
}

export async function addConsent(tenantId, createdBy, rawData) {
  const validated = createConsentSchema.parse(rawData);
  return await repo.createConsent(tenantId, createdBy, validated);
}

export async function editConsent(tenantId, id, rawData) {
  const data = rawData?.data || rawData;
  const validated = updateConsentSchema.parse(data);
  return await repo.updateConsent(tenantId, id, validated);
}

export async function removeConsent(tenantId, id) {
  return await repo.deleteConsent(tenantId, id);
}

export async function getConsentReport(tenantId, consentId) {
  return await repo.getConsentReport(tenantId, consentId);
}

export async function respondConsent(tenantId, studentId, consentId, rawData) {
  const validated = updateConsentResponseSchema.parse(rawData);
  return await repo.submitConsentResponse(tenantId, studentId, consentId, validated.status);
}

export async function getStudentConsents(tenantId, studentId) {
  return await repo.listStudentConsents(tenantId, studentId);
}

export async function updateStudentConsentStatus(tenantId, studentId, id, status) {
  if (!['accepted', 'declined', 'approved'].includes(status)) {
    const error = new Error('Invalid status. Must be accepted or declined.');
    error.status = 400;
    error.code = 'INVALID_STATUS';
    throw error;
  }
  return await repo.updateStudentConsentStatus(tenantId, studentId, id, status);
}
