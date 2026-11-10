import * as service from './service.js';
import * as validation from './validation.js';

export async function getMyLeaveSummaryHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const staffId = req.user.sub || req.user.id;
    const academicYear = req.query.academicYear || '2026-27';
    const data = await service.getMyLeaveSummary(tenantId, staffId, academicYear);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function applyLeaveHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const staffId = req.user.sub || req.user.id;
    const validated = validation.applyLeaveSchema.parse(req.body);
    const data = await service.applyLeave(tenantId, staffId, validated);
    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelLeaveHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const staffId = req.user.sub || req.user.id;
    const { id } = req.params;
    const data = await service.cancelLeave(tenantId, id, staffId);
    return res.status(200).json({
      success: true,
      message: 'Leave application cancelled.',
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllLeaveApplicationsHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const query = validation.getLeaveListQuerySchema.parse(req.query || {});
    const data = await service.getAllLeaveApplications(tenantId, query.status);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function reviewLeaveApplicationHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const adminUserId = req.user.sub || req.user.id;
    const { id } = req.params;
    const validated = validation.reviewLeaveSchema.parse(req.body);
    const data = await service.reviewLeaveApplication(tenantId, id, validated, adminUserId);
    return res.status(200).json({
      success: true,
      message: `Leave application ${validated.status.toLowerCase()} successfully.`,
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function getLeavePolicyHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const academicYear = req.query.academicYear || '2026-27';
    const data = await service.getLeavePolicy(tenantId, academicYear);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateLeavePolicyHandler(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const validated = validation.updatePolicySchema.parse(req.body);
    const data = await service.updateLeavePolicy(tenantId, validated);
    return res.status(200).json({
      success: true,
      message: 'Staff leave policy updated successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
}

