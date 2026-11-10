import * as repo from './repository.js';
import { pgPool } from '../../config/db.js';
import { createFeeHeadSchema, collectFeeSchema, transactionSchema } from './validation.js';
import { calculateVirtualDues, getCurrentAcademicYear } from './virtualFeeCalculator.js';

// Student Dues & Fees Calculator (matches Vision FeesScreen.js contract)
export async function calculateStudentFees(tenantId, studentId, academicYear, includeFuture) {
  const year = academicYear || getCurrentAcademicYear();
  const result = await calculateVirtualDues(tenantId, studentId, year, includeFuture);
  return {
    fees: result.virtualDues,
    payments: result.payments,
    feeStructure: result.structures,
    lateFeePenalty: result.lateFeePenalty,
  };
}

// Student Balances (Finance Panel batch ledger balances)
export async function calculateStudentBalances(tenantId, studentList, academicYear) {
  const year = academicYear || getCurrentAcademicYear();
  let students = Array.isArray(studentList) ? studentList : [];

  if (students.length === 0) {
    students = await repo.listStudentsForBalances(tenantId);
  }

  const balances = await Promise.all(
    students.map(async (s) => {
      const studentId = s.id || s.student_id;
      if (!studentId) return null;

      try {
        const virtual = await calculateVirtualDues(tenantId, studentId, year, false);
        const totalDue = s.fee_exempted
          ? 0
          : (virtual.virtualDues || []).reduce((sum, d) => sum + (Number(d.fee?.amount) || 0), 0);

        const rawTotalPaid = (virtual.payments || []).reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
        const allocatedPaid = (virtual.virtualDues || []).reduce((sum, d) => sum + (Number(d.total_paid_amount) || 0), 0);
        const totalPaid = Math.max(rawTotalPaid, allocatedPaid);

        const balance = s.fee_exempted ? 0 : Math.max(0, totalDue - totalPaid);

        return {
          student_id: studentId,
          id: studentId,
          totalDue,
          totalPaid,
          balance,
          total_due: totalDue,
          total_paid: totalPaid,
        };
      } catch (err) {
        return {
          student_id: studentId,
          id: studentId,
          totalDue: 0,
          totalPaid: 0,
          balance: 0,
          total_due: 0,
          total_paid: 0,
        };
      }
    })
  );

  return balances.filter(Boolean);
}

// Fee Structures (Finance Panel)
export async function getFeeStructures(tenantId, academicYear) {
  return await repo.listFeeStructures(tenantId, academicYear);
}

export async function addFeeStructure(tenantId, data) {
  const payload = data?.data || data;
  return await repo.createFeeStructure(tenantId, payload);
}

export async function editFeeStructure(tenantId, id, data) {
  const payload = data?.data || data;
  const updated = await repo.updateFeeStructure(tenantId, id, payload);
  if (!updated) {
    const error = new Error('Fee structure not found.');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  return updated;
}

export async function removeFeeStructure(tenantId, id) {
  const deleted = await repo.deleteFeeStructure(tenantId, id);
  if (!deleted) {
    const error = new Error('Fee structure not found.');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  return { success: true, message: 'Fee structure deleted successfully' };
}

export async function getAllPayments(tenantId) {
  return await repo.listAllPayments(tenantId);
}

export async function getFinanceDashboardStats(tenantId, filters = {}) {
  return await repo.getFinanceStats(tenantId, filters);
}

// Categories
export async function getCategories(tenantId, type) {
  return await repo.listCategories(tenantId, type);
}

export async function addCategory(tenantId, data) {
  return await repo.createCategory(tenantId, data);
}

export async function editCategory(tenantId, id, data) {
  return await repo.updateCategory(tenantId, id, data);
}

export async function removeCategory(tenantId, id) {
  return await repo.deleteCategory(tenantId, id);
}

// Fee Heads
export async function getFeeHeads(tenantId) {
  return await repo.listFeeHeads(tenantId);
}

export async function addFeeHead(tenantId, rawData) {
  const validated = createFeeHeadSchema.parse(rawData);
  return await repo.createFeeHead(tenantId, validated);
}

export async function removeFeeHead(tenantId, feeId) {
  const deleted = await repo.deleteFeeHead(tenantId, feeId);
  if (!deleted) {
    const error = new Error('Fee head not found.');
    error.status = 404;
    error.code = 'FEE_NOT_FOUND';
    throw error;
  }
  return { success: true, message: 'Fee head deleted successfully' };
}

// Student Dues & Payment POS
export async function getStudentDues(tenantId, studentId) {
  return await repo.getStudentFeeDues(tenantId, studentId);
}

export async function getStudentLedger(tenantId, studentId, academicYear, includeFuture) {
  const year = academicYear || getCurrentAcademicYear();
  const result = await calculateVirtualDues(tenantId, studentId, year, includeFuture);

  const { rows } = await pgPool.query(
    `SELECT id, name, admission_number, admission_date, fee_exempted, bus_fee,
            TO_CHAR(bus_start_date, 'YYYY-MM-DD') as bus_start_date,
            father_name, mother_name, phone, email, address, created_at
     FROM "user" WHERE id = $1 AND tenant_id = $2 LIMIT 1;`,
    [studentId, tenantId]
  );
  const studentDetails = rows[0] || null;

  return {
    fees: result.virtualDues || [],
    payments: result.payments || [],
    feeStructure: result.structures || [],
    studentDetails,
    lateFeePenalty: result.lateFeePenalty || 10,
  };
}

export async function collectFee(tenantId, collectedBy, rawData) {
  const validated = collectFeeSchema.parse(rawData);
  return await repo.recordFeePayment(tenantId, collectedBy, validated);
}

// Transactions
export async function getTransactions(tenantId, filters) {
  return await repo.listTransactions(tenantId, filters);
}

export async function addTransaction(tenantId, loggedBy, rawData) {
  const validated = transactionSchema.parse(rawData);
  return await repo.createTransaction(tenantId, loggedBy, validated);
}

export async function editFeeHead(tenantId, id, data) {
  return await repo.updateFeeHead(tenantId, id, data);
}

export async function getAccountantStats(tenantId, accountantId) {
  return await repo.getAccountantStats(tenantId, accountantId);
}

export async function editTransaction(tenantId, id, data) {
  return await repo.updateTransaction(tenantId, id, data);
}

export async function removeTransaction(tenantId, id) {
  return await repo.deleteTransaction(tenantId, id);
}

export async function editPayment(tenantId, id, data) {
  return await repo.updatePayment(tenantId, id, data);
}

export async function removePayment(tenantId, id) {
  return await repo.deletePayment(tenantId, id);
}

export async function setStudentBusFee(tenantId, studentId, data) {
  return await repo.updateStudentBusFee(tenantId, studentId, data);
}

export async function removeStudentFee(tenantId, id) {
  return await repo.deleteStudentFee(tenantId, id);
}

export async function closeFinancialYear(tenantId, currentYear, newYear) {
  const students = await repo.listStudentsForBalances(tenantId);
  const balances = await calculateStudentBalances(tenantId, students, currentYear);
  const arrearsStudents = balances.filter(b => b.balance > 0);

  let carriedCount = 0;
  for (const item of arrearsStudents) {
    const feeRow = await pgPool.query(
      `INSERT INTO fee (tenant_id, title, amount, due_date, fee_type)
       VALUES ($1, $2, $3, CURRENT_DATE, 'One Time') RETURNING id;`,
      [tenantId, `Arrears (${currentYear})`, item.balance]
    );
    const feeId = feeRow.rows[0].id;
    await pgPool.query(
      `INSERT INTO student_fees (tenant_id, student_id, fee_id, payment_status, total_paid_amount)
       VALUES ($1, $2, $3, 'pending', 0);`,
      [tenantId, item.student_id, feeId]
    );
    carriedCount++;
  }

  return {
    success: true,
    message: `Successfully closed ${currentYear}. Carried forward arrears for ${carriedCount} student(s) to ${newYear}.`,
    carriedCount
  };
}


