import { TeachersManagerRepository } from './repository.js';

export const getParameters = async (req, res, next) => {
  try {
    const { academic_year } = req.query;
    const parameters = await TeachersManagerRepository.getParameters(req.tenant.id, academic_year || '2026-27');
    return res.status(200).json({ success: true, data: parameters });
  } catch (err) {
    next(err);
  }
};

export const createParameter = async (req, res, next) => {
  try {
    const newParam = await TeachersManagerRepository.createParameter(req.tenant.id, req.body);
    return res.status(201).json({ success: true, data: newParam, message: 'Parameter created successfully' });
  } catch (err) {
    next(err);
  }
};

export const updateParameter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await TeachersManagerRepository.updateParameter(req.tenant.id, id, req.body);
    return res.status(200).json({ success: true, data: updated, message: 'Parameter updated successfully' });
  } catch (err) {
    next(err);
  }
};

export const deleteParameter = async (req, res, next) => {
  try {
    const { id } = req.params;
    await TeachersManagerRepository.deleteParameter(req.tenant.id, id);
    return res.status(200).json({ success: true, message: 'Parameter deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const getTeachers = async (req, res, next) => {
  try {
    const teachers = await TeachersManagerRepository.getTeachers(req.tenant.id);
    return res.status(200).json({ success: true, data: teachers });
  } catch (err) {
    next(err);
  }
};

export const getMatrix = async (req, res, next) => {
  try {
    const { month, academic_year } = req.query;
    const matrix = await TeachersManagerRepository.getMatrix(req.tenant.id, month || 'August', academic_year || '2026-27');
    return res.status(200).json({ success: true, data: matrix });
  } catch (err) {
    next(err);
  }
};

export const saveBatchEvaluations = async (req, res, next) => {
  try {
    const { month, academic_year, evaluations } = req.body;
    const saved = await TeachersManagerRepository.saveBatchEvaluations(
      req.tenant.id,
      month || 'August',
      academic_year || '2026-27',
      evaluations || []
    );
    return res.status(200).json({ success: true, message: 'Evaluations saved successfully', data: saved });
  } catch (err) {
    next(err);
  }
};

export const getScorecard = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { month, academic_year } = req.query;
    const scorecard = await TeachersManagerRepository.getScorecard(
      req.tenant.id,
      teacherId,
      month || 'August',
      academic_year || '2026-27'
    );
    return res.status(200).json({ success: true, data: scorecard });
  } catch (err) {
    next(err);
  }
};

export const getTeacherAnalytics = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { academic_year } = req.query;
    const analytics = await TeachersManagerRepository.getTeacherAnalytics(
      req.tenant.id,
      teacherId,
      academic_year || '2026-27'
    );
    return res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
};

