import * as service from './service.js';

export async function getStudentFeesHandler(req, res, next) {
  try {
    const studentId = req.headers['x-student-id'] || req.query?.studentId || req.params?.studentId || req.user.sub || req.user.id;
    const academicYear = req.query?.academic_year || req.query?.academicYear;
    const includeFuture = req.query?.include_future === 'true' || req.query?.includeFuture === 'true';

    const result = await service.calculateStudentFees(req.tenant.id, studentId, academicYear, includeFuture);
    return res.status(200).json({
      success: true,
      fees: result.fees,
      payments: result.payments,
      feeStructure: result.feeStructure,
      lateFeePenalty: result.lateFeePenalty,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getStudentBalancesHandler(req, res, next) {
  try {
    const studentList = req.body?.students || req.body?.data?.students || null;
    const academicYear = req.body?.academic_year || req.body?.academicYear || req.query?.academic_year || req.query?.academicYear;
    const balances = await service.calculateStudentBalances(req.tenant.id, studentList, academicYear);
    return res.status(200).json({
      success: true,
      count: balances.length,
      balances,
      data: balances,
    });
  } catch (err) {
    next(err);
  }
}

// Fee Structures (Finance Panel)
export async function getFeeStructuresHandler(req, res, next) {
  try {
    const academicYear = req.query?.academic_year || req.query?.academicYear || null;
    const structures = await service.getFeeStructures(req.tenant.id, academicYear);
    return res.status(200).json({
      success: true,
      count: structures.length,
      feeStructures: structures,
      structures: structures,
      data: structures,
    });
  } catch (err) {
    next(err);
  }
}

export async function createFeeStructureHandler(req, res, next) {
  try {
    const bodyData = req.body?.data || req.body;
    const payload = {
      fee_category: bodyData.fee_category || bodyData.feeCategory || bodyData.category,
      class_name: bodyData.class_name || bodyData.className || null,
      amount: Number(bodyData.amount || 0),
      academic_year: bodyData.academic_year || bodyData.academicYear || '2026-2027'
    };
    const created = await service.addFeeStructure(req.tenant.id, payload);
    return res.status(201).json({
      success: true,
      message: 'Fee structure created successfully',
      structure: created,
      data: created,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateFeeStructureHandler(req, res, next) {
  try {
    const bodyData = req.body?.data || req.body;
    const payload = {
      fee_category: bodyData.fee_category || bodyData.feeCategory,
      class_name: bodyData.class_name !== undefined ? bodyData.class_name : bodyData.className,
      amount: bodyData.amount !== undefined ? Number(bodyData.amount) : undefined,
      academic_year: bodyData.academic_year || bodyData.academicYear
    };
    const updated = await service.editFeeStructure(req.tenant.id, req.params.id, payload);
    return res.status(200).json({
      success: true,
      message: 'Fee structure updated successfully',
      structure: updated,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteFeeStructureHandler(req, res, next) {
  try {
    const result = await service.removeFeeStructure(req.tenant.id, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAllPaymentsHandler(req, res, next) {
  try {
    const payments = await service.getAllPayments(req.tenant.id);
    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
      data: payments,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStatsHandler(req, res, next) {
  try {
    const stats = await service.getFinanceDashboardStats(req.tenant.id, req.query);
    return res.status(200).json({
      success: true,
      stats,
      data: stats,
      dashboard: stats,
    });
  } catch (err) {
    next(err);
  }
}

// Categories (Income & Expense)
export async function getCategoriesHandler(req, res, next) {
  try {
    const { type } = req.query;
    const categories = await service.getCategories(req.tenant.id, type);
    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

export async function createCategoryHandler(req, res, next) {
  try {
    const category = await service.addCategory(req.tenant.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Category created',
      category,
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCategoryHandler(req, res, next) {
  try {
    const category = await service.editCategory(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Category updated',
      category,
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategoryHandler(req, res, next) {
  try {
    await service.removeCategory(req.tenant.id, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Category deleted',
    });
  } catch (err) {
    next(err);
  }
}

export async function getFeeHeadsHandler(req, res, next) {
  try {
    const data = await service.getFeeHeads(req.tenant.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createFeeHeadHandler(req, res, next) {
  try {
    const data = await service.addFeeHead(req.tenant.id, req.body);
    return res.status(201).json({ success: true, message: 'Fee head created', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteFeeHeadHandler(req, res, next) {
  try {
    const result = await service.removeFeeHead(req.tenant.id, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStudentDuesHandler(req, res, next) {
  try {
    const data = await service.getStudentDues(req.tenant.id, req.params.studentId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getStudentLedgerHandler(req, res, next) {
  try {
    const academicYear = req.query?.academic_year || req.query?.academicYear;
    const includeFuture = req.query?.include_future === 'true' || req.query?.includeFuture === 'true';
    const data = await service.getStudentLedger(req.tenant.id, req.params.studentId, academicYear, includeFuture);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function collectFeeHandler(req, res, next) {
  try {
    const cashierId = req.user?.sub || req.user?.id;
    const bodyData = req.body?.data || req.body;
    const rawPayments = bodyData.payments || bodyData.allocations || [];

    let totalAmount = Number(bodyData.total_amount ?? bodyData.totalAmount ?? bodyData.amount ?? 0);
    if ((!totalAmount || isNaN(totalAmount)) && Array.isArray(rawPayments) && rawPayments.length > 0) {
      totalAmount = rawPayments.reduce((sum, p) => sum + Number(p.amount ?? p.amount_paid ?? 0), 0);
    }

    const allocations = (Array.isArray(rawPayments) ? rawPayments : []).map(p => {
      let feeId = p.feeId ?? p.fee_id ?? null;
      let title = p.title ?? p.remarks ?? null;
      let cleanFeeId = null;

      if (feeId !== null && feeId !== undefined && feeId !== '') {
        const strId = String(feeId);
        if (strId.startsWith('physical-')) {
          const num = Number(strId.replace('physical-', ''));
          cleanFeeId = isNaN(num) ? null : Math.round(num);
        } else if (!strId.startsWith('virtual-')) {
          const num = Number(strId);
          cleanFeeId = isNaN(num) ? null : Math.round(num);
        }
      }

      return {
        fee_id: cleanFeeId,
        amount_paid: Number(p.amount ?? p.amount_paid ?? 0),
        remarks: title || p.remarks || null,
        title: title || null
      };
    }).filter(a => a.amount_paid > 0);

    const payload = {
      student_id: bodyData.student_id || bodyData.studentId,
      total_amount: totalAmount,
      payment_mode: (bodyData.payment_mode || bodyData.paymentMode || 'CASH').toUpperCase(),
      remarks: bodyData.remarks || null,
      allocations
    };

    const result = await service.collectFee(req.tenant.id, cashierId, payload);
    const receipt = result.receipt || result;
    const payments = result.payments || [receipt];

    return res.status(201).json({
      success: true,
      message: 'Fee collected successfully. Receipt generated.',
      receipt,
      payments,
      data: receipt
    });
  } catch (err) {
    next(err);
  }
}

export async function getTransactionsHandler(req, res, next) {
  try {
    const data = await service.getTransactions(req.tenant.id, req.query);
    return res.status(200).json({ success: true, count: data.length, data, transactions: data });
  } catch (err) {
    next(err);
  }
}

export async function createTransactionHandler(req, res, next) {
  try {
    const data = await service.addTransaction(req.tenant.id, req.user.sub, req.body);
    return res.status(201).json({ success: true, message: 'Transaction recorded', data });
  } catch (err) {
    next(err);
  }
}

export async function updateFeeHeadHandler(req, res, next) {
  try {
    const id = req.params.id || req.body.id || req.body.data?.id;
    const data = await service.editFeeHead(req.tenant.id, id, req.body.data || req.body);
    return res.status(200).json({ success: true, message: 'Fee updated successfully', data });
  } catch (err) {
    next(err);
  }
}

export async function getAccountantStatsHandler(req, res, next) {
  try {
    const data = await service.getAccountantStats(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, stats: data, data });
  } catch (err) {
    next(err);
  }
}

export async function updateTransactionHandler(req, res, next) {
  try {
    const data = await service.editTransaction(req.tenant.id, req.params.id, req.body?.data || req.body);
    return res.status(200).json({ success: true, message: 'Transaction updated successfully', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteTransactionHandler(req, res, next) {
  try {
    await service.removeTransaction(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updatePaymentHandler(req, res, next) {
  try {
    const data = await service.editPayment(req.tenant.id, req.params.id, req.body?.data || req.body);
    return res.status(200).json({ success: true, message: 'Payment updated successfully', data });
  } catch (err) {
    next(err);
  }
}

export async function deletePaymentHandler(req, res, next) {
  try {
    await service.removePayment(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, message: 'Payment deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updateStudentBusFeeHandler(req, res, next) {
  try {
    const data = await service.setStudentBusFee(req.tenant.id, req.params.studentId, req.body?.data || req.body);
    return res.status(200).json({ success: true, message: 'Transport fee updated successfully', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteStudentFeeHandler(req, res, next) {
  try {
    await service.removeStudentFee(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, message: 'Student fee deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function closeFinancialYearHandler(req, res, next) {
  try {
    const { currentAcademicYear, newAcademicYear } = req.body?.data || req.body;
    const result = await service.closeFinancialYear(req.tenant.id, currentAcademicYear, newAcademicYear);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}


