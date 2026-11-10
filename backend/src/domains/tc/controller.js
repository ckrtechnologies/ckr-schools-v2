import { TCService } from './service.js';

export const getClasses = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const userId = req.user.sub || req.user.id;
    const role = req.user.role || req.user.type;
    const classes = await TCService.getClasses(tenantId, userId, role);
    return res.status(200).json({ success: true, data: classes });
  } catch (err) {
    next(err);
  }
};

export const getClassStudents = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { classId } = req.params;
    const students = await TCService.getClassStudents(tenantId, classId);
    return res.status(200).json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
};

export const getStudentPrefill = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { studentId } = req.params;
    const prefill = await TCService.getStudentPrefill(tenantId, studentId);
    return res.status(200).json({ success: true, data: prefill });
  } catch (err) {
    next(err);
  }
};

export const saveCertificate = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const userId = req.user.sub || req.user.id;
    const payload = req.body.data || req.body;
    const result = await TCService.saveCertificate(tenantId, userId, payload);
    return res.status(201).json({
      success: true,
      message: 'Transfer certificate saved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export const getRecords = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const records = await TCService.getRecords(tenantId, req.query);
    return res.status(200).json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
};

export const getTCById = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id || null;
    let identifier = req.params.tcNumber || req.params[0] || req.params.id || req.query?.tcNumber || req.query?.id;
    if (Array.isArray(identifier)) {
      identifier = identifier.join('/');
    }
    if (identifier && typeof identifier === 'string' && identifier.startsWith('verify/')) {
      identifier = identifier.replace(/^verify\//, '');
    }
    identifier = decodeURIComponent(identifier || '').trim();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'TC Number or ID is required' });
    }
    const record = await TCService.getTCById(tenantId, identifier);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

