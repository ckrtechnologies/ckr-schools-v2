import * as service from './service.js';
import { pgPool } from '../../config/db.js';

// Circulars
export async function getCircularsHandler(req, res, next) {
  try {
    const data = await service.getCirculars(req.tenant.id, req.query?.target_audience);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createCircularHandler(req, res, next) {
  try {
    const data = await service.addCircular(req.tenant.id, req.user.sub, req.body);
    return res.status(201).json({ success: true, message: 'Circular published', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteCircularHandler(req, res, next) {
  try {
    const result = await service.removeCircular(req.tenant.id, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function toggleCircularMarketplaceHandler(req, res, next) {
  try {
    const { is_published = true, category = 'General' } = req.body || {};
    const result = await service.toggleCircularMarketplace(
      req.tenant.id,
      req.params.id,
      is_published,
      category
    );
    return res.status(200).json({
      success: true,
      message: result.is_published
        ? 'Circular published to Marketplace Newsroom'
        : 'Circular unpublished from Marketplace Newsroom',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

// Communication & Chat
export async function sendMessageHandler(req, res, next) {
  try {
    const data = await service.postMessage(req.tenant.id, req.user.sub, req.body);
    return res.status(201).json({ success: true, message: 'Message sent', data });
  } catch (err) {
    next(err);
  }
}

export async function getChatByTypeHandler(req, res, next) {
  try {
    const { type } = req.params;
    const { rows } = await pgPool.query(
      `SELECT * FROM communication WHERE tenant_id = $1 AND type = $2 ORDER BY created_at ASC;`,
      [req.tenant.id, type]
    );
    return res.status(200).json({
      success: true,
      message: 'Successfully get',
      chats: rows,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
}

export async function getHistoryHandler(req, res, next) {
  try {
    const { user1, user2 } = req.params;
    const data = await service.getHistory(req.tenant.id, user1, user2);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getSystemMonitorHandler(req, res, next) {
  try {
    const data = await service.getSystemMonitor(req.tenant.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// Complaints
export async function getComplaintsHandler(req, res, next) {
  try {
    const studentId = req.query?.studentId || req.query?.student_id || req.query?.userId || null;
    const complaints = await service.getComplaints(req.tenant.id, studentId);
    return res.status(200).json({
      success: true,
      complaint: complaints || [],
      complaints: complaints || [],
      data: complaints || [],
    });
  } catch (err) {
    next(err);
  }
}

export async function getComplaintByIdHandler(req, res, next) {
  try {
    const complaint = await service.getComplaintById(req.tenant.id, req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    return res.status(200).json({ success: true, complaint, data: complaint });
  } catch (err) {
    next(err);
  }
}

export async function createComplaintHandler(req, res, next) {
  try {
    const data = await service.addComplaint(req.tenant.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Complaint created successfully',
      complaint: data,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateComplaintStatusHandler(req, res, next) {
  try {
    const data = await service.resolveComplaint(req.tenant.id, req.params.id, req.body.status);
    return res.status(200).json({ success: true, message: 'Complaint status updated', data });
  } catch (err) {
    next(err);
  }
}


// Notifications
export async function registerTokenHandler(req, res, next) {
  try {
    const fcm_token = req.body?.fcm_token || req.body?.fcmToken || req.body?.token;
    const device_type = req.body?.device_type || req.body?.deviceType || 'android';
    const userId = req.user.sub || req.user.id;
    if (!fcm_token) {
      return res.status(400).json({ success: false, message: 'fcm_token is required' });
    }
    await service.registerDeviceToken(req.tenant.id, userId, fcm_token, device_type);
    return res.status(200).json({ success: true, message: 'Token registered successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getUserNotificationsHandler(req, res, next) {
  try {
    const userId = req.user.sub || req.user.id;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const result = await service.getUserNotifications(req.tenant.id, userId, page, limit);
    return res.status(200).json({ success: true, data: result.data, total: result.total });
  } catch (err) {
    next(err);
  }
}

export async function getAllNotificationsHandler(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '100', 10);
    const result = await service.getAllNotifications(req.tenant.id, page, limit);
    return res.status(200).json({ success: true, data: result.data, total: result.total });
  } catch (err) {
    next(err);
  }
}

export async function markAsReadHandler(req, res, next) {
  try {
    const userId = req.user.sub || req.user.id;
    if (req.params.id === 'all' || req.originalUrl.includes('/all/read')) {
      return markAllNotificationsReadHandler(req, res, next);
    }
    await service.markAsRead(req.tenant.id, req.params.id, userId);
    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsReadHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    await pgPool.query('UPDATE notifications SET is_read = true WHERE tenant_id = $1', [tenantId]);
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

export async function broadcastNotificationHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const {
      title,
      body,
      message,
      targetAudience,
      targetUserIds,
      routeScreen,
      routeParams
    } = req.body;

    const notifTitle = title || 'Announcement';
    let notifMessage = message || body || '';

    // Encode route navigation payload if provided so mobile apps navigate on tap
    if (routeScreen) {
      const navMeta = {
        routeScreen,
        routeParams: routeParams || {}
      };
      notifMessage = `${notifMessage} ||| ${JSON.stringify(navMeta)}`;
    }

    let insertQuery;
    let queryParams;

    if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
      // Send to specific target user IDs
      insertQuery = `
        INSERT INTO notifications (tenant_id, user_id, title, message, type, is_read, created_at)
        SELECT $1, u.id, $2, $3, 'broadcast', false, NOW()
        FROM "user" u
        WHERE u.tenant_id = $1 AND u.id = ANY($4::uuid[])
      `;
      queryParams = [tenantId, notifTitle, notifMessage, targetUserIds];
    } else if (targetAudience && targetAudience !== 'all') {
      // Send to role-based audience: 'students', 'teachers', 'parents', etc.
      let roleFilter = targetAudience.toLowerCase();
      if (roleFilter === 'teachers') roleFilter = 'teacher';
      if (roleFilter === 'students') roleFilter = 'student';
      if (roleFilter === 'parents') roleFilter = 'parent';

      insertQuery = `
        INSERT INTO notifications (tenant_id, user_id, title, message, type, is_read, created_at)
        SELECT $1, u.id, $2, $3, 'broadcast', false, NOW()
        FROM "user" u
        WHERE u.tenant_id = $1 AND LOWER(u.type) = $4
      `;
      queryParams = [tenantId, notifTitle, notifMessage, roleFilter];
    } else {
      // Broadcast to all active users in the school tenant
      insertQuery = `
        INSERT INTO notifications (tenant_id, user_id, title, message, type, is_read, created_at)
        SELECT $1, u.id, $2, $3, 'broadcast', false, NOW()
        FROM "user" u
        WHERE u.tenant_id = $1
      `;
      queryParams = [tenantId, notifTitle, notifMessage];
    }

    await pgPool.query(insertQuery, queryParams);

    // Realtime notification broadcast across tenant sockets if connected
    try {
      const { getIO } = await import('../../sockets/socketManager.js');
      const io = getIO();
      if (io) {
        io.to(`tenant:${tenantId}`).emit('new_notification', {
          title: notifTitle,
          message: notifMessage,
          routeScreen,
          routeParams,
          created_at: new Date().toISOString()
        });
      }
    } catch (sockErr) {
      // Non-fatal if socket not ready
    }

    return res.status(200).json({ success: true, message: 'Broadcast notification sent successfully' });
  } catch (err) {
    next(err);
  }
}
