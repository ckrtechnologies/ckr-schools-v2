import * as service from './service.js';

export async function getGradingScalesHandler(req, res, next) {
  try {
    const data = await service.listGradingScales(req.tenant.id);
    return res.status(200).json({ success: true, data, scales: data });
  } catch (err) {
    next(err);
  }
}

export async function createGradingScaleHandler(req, res, next) {
  try {
    const data = await service.addGradingScale(req.tenant.id, req.body);
    return res.status(201).json({ success: true, message: 'Grading scale created', data });
  } catch (err) {
    next(err);
  }
}

export async function updateGradingScaleHandler(req, res, next) {
  try {
    const data = await service.editGradingScale(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Grading scale updated', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteGradingScaleHandler(req, res, next) {
  try {
    await service.removeGradingScale(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, message: 'Grading scale deleted' });
  } catch (err) {
    next(err);
  }
}

export async function getAggregatedResultsHandler(req, res, next) {
  try {
    const data = await service.getAggregatedResults(req.tenant.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function cloneDateSheetHandler(req, res, next) {
  try {
    const result = await service.cloneDateSheet(req.tenant.id, req.body);
    return res.status(200).json({ success: true, message: result.message, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getExamsHandler(req, res, next) {
  try {
    const data = await service.getExams(req.tenant.id, req.query?.classId, req.user);
    return res.status(200).json({ success: true, exams: data, data });
  } catch (err) {
    next(err);
  }
}

export async function createExamHandler(req, res, next) {
  try {
    const data = await service.addExam(req.tenant.id, req.body);
    return res.status(201).json({ success: true, message: 'Exam schedule created', data });
  } catch (err) {
    next(err);
  }
}

export async function updateExamHandler(req, res, next) {
  try {
    const data = await service.editExam(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Exam updated successfully', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteExamHandler(req, res, next) {
  try {
    await service.removeExam(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, message: 'Exam deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getExamGradesHandler(req, res, next) {
  try {
    const examId = req.query?.examId || req.params?.examId;
    const studentId = req.query?.studentId;

    if (!examId && !studentId) {
      return res.status(400).json({ success: false, message: 'studentId or examId is required' });
    }

    const grades = await service.getStudentOrExamGrades(req.tenant.id, { examId, studentId });
    return res.status(200).json({ success: true, grades, data: grades });
  } catch (err) {
    next(err);
  }
}

export async function getExamDistributionHandler(req, res, next) {
  try {
    const result = await service.getExamDistribution(req.tenant.id, req.params.id);
    return res.status(200).json({
      success: true,
      distribution: result.distribution,
      grading_scales: result.grading_scales,
      exam: result.exam
    });
  } catch (err) {
    next(err);
  }
}

export async function getDateSheetGradesHandler(req, res, next) {
  try {
    const result = await service.getDateSheetGrades(req.tenant.id, req.params.title, req.params.class_id);
    return res.status(200).json({
      success: true,
      subjects: result.subjects,
      results: result.results
    });
  } catch (err) {
    next(err);
  }
}

export async function saveGradesBulkHandler(req, res, next) {
  try {
    const data = await service.saveExamMarksBulk(req.tenant.id, req.body, req.user);
    return res.status(200).json({ success: true, message: 'Grades updated successfully', count: data.length, data });
  } catch (err) {
    next(err);
  }
}

export async function getCoScholasticHandler(req, res, next) {
  try {
    const classId = req.query.class_id || req.query.classId;
    const term = req.query.term;
    const academicYear = req.query.academic_year || req.query.academicYear || '2026-27';

    if (!classId || !term) {
      return res.status(400).json({
        success: false,
        message: 'class_id and term query parameters are required',
      });
    }

    const result = await service.getCoScholastic(req.tenant.id, classId, term, academicYear, req.user);
    return res.status(200).json({
      success: true,
      data: result.students,
      students: result.students,
      allowed_activities: result.allowed_activities,
      is_class_teacher: result.is_class_teacher,
    });
  } catch (err) {
    next(err);
  }
}

export async function saveCoScholasticBulkHandler(req, res, next) {
  try {
    const classId = req.body.class_id || req.body.classId;
    const term = req.body.term;
    const academicYear = req.body.academic_year || req.body.academicYear || '2026-27';
    const grades = req.body.grades;

    if (!classId || !term || !Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'class_id, term, and non-empty grades array are required',
      });
    }

    const result = await service.saveCoScholasticBulk(req.tenant.id, req.user?.id || req.user?.sub, {
      class_id: classId,
      term,
      academic_year: academicYear,
      grades,
    });

    return res.status(200).json({
      success: true,
      count: grades.length,
      message: `Successfully saved co-scholastic grades for ${grades.length} students.`,
      result,
    });
  } catch (err) {
    next(err);
  }
}

