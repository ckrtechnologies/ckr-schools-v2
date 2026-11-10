import { AcademicManagerRepository } from './repository.js';
import { createTermSchema, updateTermSchema } from './validation.js';
import { getCoScholasticHandler, saveCoScholasticBulkHandler } from '../exams/controller.js';

export const getAcademicMeta = async (req, res, next) => {
  try {
    const meta = await AcademicManagerRepository.getAcademicMeta(req.tenant.id);
    return res.status(200).json({ success: true, data: meta });
  } catch (err) {
    next(err);
  }
};

export const getTerms = async (req, res, next) => {
  try {
    const { academic_year } = req.query;
    const terms = await AcademicManagerRepository.listTerms(req.tenant.id, academic_year);
    return res.status(200).json({ success: true, data: terms });
  } catch (err) {
    next(err);
  }
};

export const createTerm = async (req, res, next) => {
  try {
    const payload = req.body?.data || req.body;
    const validated = createTermSchema.parse(payload);
    const created = await AcademicManagerRepository.createTerm(req.tenant.id, validated);
    return res.status(201).json({ success: true, message: 'Academic term created successfully', data: created });
  } catch (err) {
    next(err);
  }
};

export const updateTerm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body?.data || req.body;
    const validated = updateTermSchema.parse(payload);
    const updated = await AcademicManagerRepository.updateTerm(req.tenant.id, id, validated);
    return res.status(200).json({ success: true, message: 'Academic term updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteTerm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await AcademicManagerRepository.deleteTerm(req.tenant.id, id);
    return res.status(200).json({ success: true, message: `Term "${deleted.name}" deleted successfully`, data: deleted });
  } catch (err) {
    next(err);
  }
};

export const getDistributions = async (req, res, next) => {
  try {
    const distributions = await AcademicManagerRepository.getDistributions(req.tenant.id, req.query);
    return res.status(200).json({ success: true, data: distributions });
  } catch (err) {
    next(err);
  }
};

export const saveDistribution = async (req, res, next) => {
  try {
    const saved = await AcademicManagerRepository.saveDistribution(req.tenant.id, req.body);
    return res.status(201).json({ success: true, message: 'Distribution saved successfully', data: saved });
  } catch (err) {
    next(err);
  }
};

export const toggleLock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await AcademicManagerRepository.toggleLock(req.tenant.id, id);
    return res.status(200).json({ success: true, message: 'Lock toggled successfully', data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteDistribution = async (req, res, next) => {
  try {
    const { id } = req.params;
    await AcademicManagerRepository.deleteDistribution(req.tenant.id, id);
    return res.status(200).json({ success: true, message: 'Distribution deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const cloneDistribution = async (req, res, next) => {
  try {
    const result = await AcademicManagerRepository.cloneDistribution(req.tenant.id, req.body);
    return res.status(200).json({ success: true, message: result.message, data: result });
  } catch (err) {
    next(err);
  }
};

export const getGradingTracker = async (req, res, next) => {
  try {
    const tracker = await AcademicManagerRepository.getGradingTracker(req.tenant.id, req.query);
    return res.status(200).json({ success: true, data: tracker });
  } catch (err) {
    next(err);
  }
};

export const sendGradingReminder = async (req, res) => {
  return res.status(200).json({ success: true, message: 'Reminder sent to teacher' });
};

export { getCoScholasticHandler, saveCoScholasticBulkHandler };
