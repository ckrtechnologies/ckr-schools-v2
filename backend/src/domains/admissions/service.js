import * as repo from './repository.js';
import {
  createEnquirySchema,
  updateEnquiryStatusSchema,
  convertToStudentSchema,
  createTcSchema
} from './validation.js';

// Inquiries
export async function getEnquiries(tenantId, filters) {
  return await repo.listEnquiries(tenantId, filters);
}

export async function getEnquiry(tenantId, enquiryId) {
  const item = await repo.getEnquiryById(tenantId, enquiryId);
  if (!item) {
    const error = new Error('Enquiry not found.');
    error.status = 404;
    error.code = 'ENQUIRY_NOT_FOUND';
    throw error;
  }
  return item;
}

export async function addEnquiry(tenantId, rawData) {
  const payload = { ...(rawData?.data || rawData) };
  if (!payload.name && payload.student_name) payload.name = payload.student_name;
  if (!payload.parent) payload.parent = payload.father_name || payload.mother_name || payload.guardian_name;
  if (!payload.phone) payload.phone = payload.father_mobile || payload.mother_mobile || payload.mobile;
  if (!payload.email) payload.email = payload.parentEmail || payload.parent_email;
  const validated = createEnquirySchema.parse(payload);
  return await repo.createEnquiry(tenantId, validated);
}

export async function editEnquiry(tenantId, enquiryId, rawData) {
  const payload = rawData?.data || rawData;
  const updated = await repo.updateEnquiry(tenantId, enquiryId, payload);
  if (!updated) {
    const error = new Error('Enquiry not found.');
    error.status = 404;
    error.code = 'ENQUIRY_NOT_FOUND';
    throw error;
  }
  return updated;
}

export async function removeEnquiry(tenantId, enquiryId) {
  const deleted = await repo.deleteEnquiry(tenantId, enquiryId);
  if (!deleted) {
    const error = new Error('Enquiry not found.');
    error.status = 404;
    error.code = 'ENQUIRY_NOT_FOUND';
    throw error;
  }
  return { success: true, message: 'User deleted successfully' };
}

export async function editEnquiryStatus(tenantId, enquiryId, rawData) {
  const validated = updateEnquiryStatusSchema.parse(rawData);
  const updated = await repo.updateEnquiryStatus(tenantId, enquiryId, validated);
  if (!updated) {
    const error = new Error('Enquiry not found.');
    error.status = 404;
    error.code = 'ENQUIRY_NOT_FOUND';
    throw error;
  }
  return updated;
}

export async function enrollStudent(tenantId, enquiryId, rawData) {
  const validated = convertToStudentSchema.parse(rawData);
  return await repo.enrollStudentFromEnquiry(tenantId, enquiryId, validated);
}

// Transfer Certificates
export async function getTransferCertificates(tenantId) {
  return await repo.listTransferCertificates(tenantId);
}

export async function getTcDetails(tenantId, tcNumber) {
  const tc = await repo.getTcByNumber(tenantId, tcNumber);
  if (!tc) {
    const error = new Error(`Transfer Certificate '${tcNumber}' not found.`);
    error.status = 404;
    error.code = 'TC_NOT_FOUND';
    throw error;
  }
  return tc;
}

export async function issueTransferCertificate(tenantId, issuedBy, rawData) {
  const validated = createTcSchema.parse(rawData);
  return await repo.createTransferCertificate(tenantId, issuedBy, validated);
}

