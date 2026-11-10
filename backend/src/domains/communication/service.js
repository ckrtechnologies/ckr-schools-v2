import * as repo from './repository.js';
import { createCircularSchema, sendMessageSchema, complaintSchema } from './validation.js';

// Circulars
export async function getCirculars(tenantId, audience) {
  return await repo.listCirculars(tenantId, audience);
}

export async function addCircular(tenantId, publisherId, rawData) {
  const validated = createCircularSchema.parse(rawData);
  const created = await repo.createCircular(tenantId, publisherId, validated);
  if (validated.publish_to_marketplace && created?.id) {
    await repo.toggleCircularMarketplacePublish(tenantId, created.id, {
      isPublished: true,
      category: validated.marketplace_category || 'General'
    });
  }
  return created;
}

export async function removeCircular(tenantId, circularId) {
  const deleted = await repo.deleteCircular(tenantId, circularId);
  if (!deleted) {
    const error = new Error('Circular not found.');
    error.status = 404;
    error.code = 'CIRCULAR_NOT_FOUND';
    throw error;
  }
  return { success: true, message: 'Circular deleted' };
}

/**
 * Toggle publish status of a circular to/from the public marketplace newsroom.
 * @param {string} tenantId
 * @param {string} circularId
 * @param {boolean} isPublished - true = publish, false = unpublish
 * @param {string} category - 'General' | 'Academics' | 'Sports' | 'Event' | 'Achievement'
 */
export async function toggleCircularMarketplace(tenantId, circularId, isPublished, category) {
  const result = await repo.toggleCircularMarketplacePublish(tenantId, circularId, {
    isPublished: !!isPublished,
    category: category || 'General',
  });
  if (!result) {
    const error = new Error('Circular not found or not authorised.');
    error.status = 404;
    error.code = 'CIRCULAR_NOT_FOUND';
    throw error;
  }
  return { success: true, is_published: result.is_published, press_release_id: result.id };
}

// Communication & System Monitor
export async function postMessage(tenantId, senderId, rawData) {
  const validated = sendMessageSchema.parse(rawData);
  return await repo.insertMessage(tenantId, senderId, validated);
}

export async function getHistory(tenantId, user1, user2) {
  return await repo.getConversationHistory(tenantId, user1, user2);
}

export async function getSystemMonitor(tenantId) {
  return await repo.getSystemMonitorThreads(tenantId);
}

// Complaints
export async function getComplaints(tenantId, studentId = null) {
  return await repo.listComplaints(tenantId, studentId);
}

export async function getComplaintById(tenantId, complaintId) {
  return await repo.getComplaintById(tenantId, complaintId);
}

export async function addComplaint(tenantId, rawData) {
  const validated = complaintSchema.parse(rawData);
  return await repo.createComplaint(tenantId, validated);
}

export async function resolveComplaint(tenantId, complaintId, status) {
  const updated = await repo.updateComplaintStatus(tenantId, complaintId, status);
  if (!updated) {
    const error = new Error('Complaint not found.');
    error.status = 404;
    error.code = 'COMPLAINT_NOT_FOUND';
    throw error;
  }
  return updated;
}


// Notifications
export async function registerDeviceToken(tenantId, userId, fcmToken, deviceType) {
  return await repo.registerDeviceToken(tenantId, userId, fcmToken, deviceType);
}

export async function getUserNotifications(tenantId, userId, page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  return await repo.getUserNotifications(tenantId, userId, limit, offset);
}

export async function getAllNotifications(tenantId, page = 1, limit = 100) {
  const offset = (page - 1) * limit;
  return await repo.getAllSchoolNotifications(tenantId, limit, offset);
}

export async function markAsRead(tenantId, notificationId, userId) {
  return await repo.markNotificationAsRead(tenantId, notificationId, userId);
}
