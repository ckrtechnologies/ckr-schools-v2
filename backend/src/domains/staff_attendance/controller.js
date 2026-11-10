import * as service from './service.js';
import * as validation from './validation.js';

export async function getTodayAttendanceHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const staffId = req.user.sub || req.user.id;
    const data = await service.getTodayAttendance(tenantId, staffId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function checkInHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const staffId = req.user.sub || req.user.id;
    const validated = validation.checkInSchema.parse(req.body || {});
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || validated.ip_address || null;
    const data = await service.checkIn(tenantId, staffId, validated.remarks, ipAddress);
    return res.status(200).json({
      success: true,
      message: 'Check-in recorded successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function checkOutHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const staffId = req.user.sub || req.user.id;
    const validated = validation.checkOutSchema.parse(req.body || {});
    const data = await service.checkOut(tenantId, staffId, validated.remarks);
    return res.status(200).json({
      success: true,
      message: 'Check-out recorded successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyHistoryHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const staffId = req.user.sub || req.user.id;
    const query = validation.getHistoryQuerySchema.parse(req.query || {});
    const data = await service.getMyHistory(tenantId, staffId, query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getRosterHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const query = validation.getRosterQuerySchema.parse(req.query || {});
    const data = await service.getRoster(tenantId, query.date, query.role, query.search);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function overrideAttendanceHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const adminUserId = req.user.sub || req.user.id;
    const validated = validation.adminOverrideSchema.parse(req.body);
    const data = await service.overrideAttendance(tenantId, validated, adminUserId);
    return res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyMatrixHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const month = req.query.month;
    const data = await service.getMonthlyMatrix(tenantId, month);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

