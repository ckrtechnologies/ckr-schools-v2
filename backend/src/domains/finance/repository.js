import { pgPool } from '../../config/db.js';

/**
 * Finance & Fees Repository (ADO)
 */

// ============================================================================
// 1. FEE HEADS & STRUCTURES
// ============================================================================

export async function listFeeStructures(tenantId, academicYear = null) {
  let query = `
    SELECT id, fee_category, class_name, amount, academic_year, created_at
    FROM fee_structures
    WHERE tenant_id = $1
  `;
  const values = [tenantId];
  if (academicYear) {
    query += ` AND academic_year = $2`;
    values.push(academicYear);
  }
  query += ` ORDER BY id ASC;`;
  const { rows } = await pgPool.query(query, values);
  return rows.map(r => ({ ...r, amount: Number(r.amount) }));
}

export async function createFeeStructure(tenantId, data) {
  const query = `
    INSERT INTO fee_structures (tenant_id, fee_category, class_name, amount, academic_year)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [tenantId, data.fee_category, data.class_name || null, data.amount, data.academic_year || '2026-2027'];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function updateFeeStructure(tenantId, id, data) {
  const query = `
    UPDATE fee_structures
    SET fee_category = COALESCE($3, fee_category),
        class_name = COALESCE($4, class_name),
        amount = COALESCE($5, amount),
        academic_year = COALESCE($6, academic_year)
    WHERE id = $1 AND tenant_id = $2
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [
    id, tenantId,
    data.fee_category || null,
    data.class_name || null,
    data.amount || null,
    data.academic_year || null
  ]);
  return rows[0] || null;
}

export async function deleteFeeStructure(tenantId, id) {
  const query = `DELETE FROM fee_structures WHERE id = $1 AND tenant_id = $2 RETURNING id;`;
  const { rows } = await pgPool.query(query, [id, tenantId]);
  return rows[0] || null;
}

export async function listAllPayments(tenantId) {
  const query = `
    SELECT 
      pl.id, pl.receipt_id, pl.student_id, pl.fee_id, pl.amount_paid,
      pl.payment_mode, pl.remarks, pl.created_at,
      COALESCE(f.title, pl.remarks, 'General Fee') as fee_title,
      r.receipt_number, r.total_amount as receipt_total_amount,
      u.name as student_name, u.admission_number,
      cls.name as class_name, cls.section as class_section
    FROM payments_ledger pl
    LEFT JOIN fee f ON pl.fee_id = f.id AND f.tenant_id = pl.tenant_id
    LEFT JOIN receipts r ON pl.receipt_id = r.id AND r.tenant_id = pl.tenant_id
    LEFT JOIN "user" u ON pl.student_id = u.id AND u.tenant_id = pl.tenant_id
    LEFT JOIN class_students cs ON u.id = cs.student_id AND cs.tenant_id = pl.tenant_id
    LEFT JOIN class cls ON cs.class_id = cls.id AND cls.tenant_id = pl.tenant_id
    WHERE pl.tenant_id = $1
    ORDER BY pl.created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows.map(p => ({
    ...p,
    amount_paid: Number(p.amount_paid),
    fee: {
      id: p.fee_id,
      title: p.fee_title || p.remarks || 'General Fee'
    },
    receipts: p.receipt_number ? {
      receipt_number: p.receipt_number,
      total_amount: Number(p.receipt_total_amount || p.amount_paid),
      payment_mode: p.payment_mode,
      created_at: p.created_at,
      remarks: p.remarks,
    } : null,
  }));
}

export async function getFinanceStats(tenantId, filters = {}) {
  const { startDate, endDate } = filters || {};

  // Payments / Collected fee
  let revQuery = `SELECT COALESCE(SUM(amount_paid), 0)::numeric as total_collected FROM payments_ledger WHERE tenant_id = $1`;
  const revVals = [tenantId];
  if (startDate) {
    revVals.push(startDate);
    revQuery += ` AND (created_at AT TIME ZONE 'Asia/Kolkata')::date >= $${revVals.length}::date`;
  }
  if (endDate) {
    revVals.push(endDate);
    revQuery += ` AND (created_at AT TIME ZONE 'Asia/Kolkata')::date <= $${revVals.length}::date`;
  }
  const { rows: revRows } = await pgPool.query(revQuery + ';', revVals);

  // Today collected
  const { rows: todayRows } = await pgPool.query(
    `SELECT COALESCE(SUM(amount_paid), 0)::numeric as today_collected FROM payments_ledger WHERE tenant_id = $1 AND (created_at AT TIME ZONE 'Asia/Kolkata')::date = CURRENT_DATE;`,
    [tenantId]
  );

  // Total students
  const { rows: studentCountRows } = await pgPool.query(
    `SELECT COUNT(*)::int as total_students FROM "user" WHERE tenant_id = $1 AND type = 'student';`,
    [tenantId]
  );

  // Exempted students
  const { rows: exemptedRows } = await pgPool.query(
    `SELECT COUNT(*)::int as exempted FROM "user" WHERE tenant_id = $1 AND type = 'student' AND fee_exempted = TRUE;`,
    [tenantId]
  );

  // Balance / Outstanding dues
  const { rows: balanceRows } = await pgPool.query(
    `SELECT COALESCE(SUM(GREATEST(0, (COALESCE(u.monthly_fee, 0) * 12 + COALESCE(u.bus_fee, 0) * 12) - COALESCE(p.paid, 0))), 0)::numeric as total_balance
     FROM "user" u
     LEFT JOIN (
       SELECT student_id, SUM(amount_paid) as paid
       FROM payments_ledger
       WHERE tenant_id = $1
       GROUP BY student_id
     ) p ON u.id = p.student_id
     WHERE u.tenant_id = $1 AND u.type = 'student' AND (u.fee_exempted IS FALSE OR u.fee_exempted IS NULL);`,
    [tenantId]
  );

  // Other income from transactions
  let otherIncQuery = `SELECT COALESCE(SUM(amount), 0)::numeric as other_income FROM transactions WHERE tenant_id = $1 AND type = 'INCOME'`;
  const incVals = [tenantId];
  if (startDate) {
    incVals.push(startDate);
    otherIncQuery += ` AND (transaction_date AT TIME ZONE 'Asia/Kolkata')::date >= $${incVals.length}::date`;
  }
  if (endDate) {
    incVals.push(endDate);
    otherIncQuery += ` AND (transaction_date AT TIME ZONE 'Asia/Kolkata')::date <= $${incVals.length}::date`;
  }
  const { rows: otherIncRows } = await pgPool.query(otherIncQuery + ';', incVals);

  // Expenses from transactions
  let expQuery = `SELECT COALESCE(SUM(amount), 0)::numeric as total_expenses FROM transactions WHERE tenant_id = $1 AND type = 'EXPENSE'`;
  const expVals = [tenantId];
  if (startDate) {
    expVals.push(startDate);
    expQuery += ` AND (transaction_date AT TIME ZONE 'Asia/Kolkata')::date >= $${expVals.length}::date`;
  }
  if (endDate) {
    expVals.push(endDate);
    expQuery += ` AND (transaction_date AT TIME ZONE 'Asia/Kolkata')::date <= $${expVals.length}::date`;
  }
  const { rows: expRows } = await pgPool.query(expQuery + ';', expVals);

  // Itemized Incomes
  let incomesQuery = `
    SELECT t.id, t.type, t.amount::numeric as amount, TO_CHAR(t.transaction_date, 'YYYY-MM-DD') as transaction_date,
           t.description, t.payment_method, t.reference_number, t.created_at,
           COALESCE(tc.name, t.description, 'Other Inflow') as category_name
    FROM transactions t
    LEFT JOIN transaction_categories tc ON t.category_id = tc.id AND tc.tenant_id = t.tenant_id
    WHERE t.tenant_id = $1 AND t.type = 'INCOME'
  `;
  const incItemVals = [tenantId];
  if (startDate) {
    incItemVals.push(startDate);
    incomesQuery += ` AND (t.transaction_date AT TIME ZONE 'Asia/Kolkata')::date >= $${incItemVals.length}::date`;
  }
  if (endDate) {
    incItemVals.push(endDate);
    incomesQuery += ` AND (t.transaction_date AT TIME ZONE 'Asia/Kolkata')::date <= $${incItemVals.length}::date`;
  }
  incomesQuery += ` ORDER BY t.transaction_date DESC, t.created_at DESC;`;
  const { rows: incItemRows } = await pgPool.query(incomesQuery, incItemVals);

  // Itemized Expenses
  let expensesQuery = `
    SELECT t.id, t.type, t.amount::numeric as amount, TO_CHAR(t.transaction_date, 'YYYY-MM-DD') as transaction_date,
           t.description, t.payment_method, t.reference_number, t.created_at,
           COALESCE(tc.name, t.description, 'Operating Expense') as category_name
    FROM transactions t
    LEFT JOIN transaction_categories tc ON t.category_id = tc.id AND tc.tenant_id = t.tenant_id
    WHERE t.tenant_id = $1 AND t.type = 'EXPENSE'
  `;
  const expItemVals = [tenantId];
  if (startDate) {
    expItemVals.push(startDate);
    expensesQuery += ` AND (t.transaction_date AT TIME ZONE 'Asia/Kolkata')::date >= $${expItemVals.length}::date`;
  }
  if (endDate) {
    expItemVals.push(endDate);
    expensesQuery += ` AND (t.transaction_date AT TIME ZONE 'Asia/Kolkata')::date <= $${expItemVals.length}::date`;
  }
  expensesQuery += ` ORDER BY t.transaction_date DESC, t.created_at DESC;`;
  const { rows: expItemRows } = await pgPool.query(expensesQuery, expItemVals);

  const formattedIncomes = incItemRows.map(r => ({
    ...r,
    amount: Number(r.amount),
    category: { name: r.category_name }
  }));

  const formattedExpenses = expItemRows.map(r => ({
    ...r,
    amount: Number(r.amount),
    category: { name: r.category_name }
  }));

  const totalFeeCollected = Number(revRows[0]?.total_collected || 0);
  const totalOtherIncome = Number(otherIncRows[0]?.other_income || 0);
  const totalExpenses = Number(expRows[0]?.total_expenses || 0);
  const totalIncome = totalFeeCollected + totalOtherIncome;
  const netRevenue = totalIncome - totalExpenses;
  const balance = Number(balanceRows[0]?.total_balance || 0);
  const totalStudents = Number(studentCountRows[0]?.total_students || 0);
  const exemptedStudents = Number(exemptedRows[0]?.exempted || 0);
  const todayRevenue = Number(todayRows[0]?.today_collected || 0);

  return {
    totalRevenue: totalFeeCollected,
    totalPaid: totalFeeCollected,
    totalFeeCollected,
    totalFeeIncome: totalFeeCollected,
    totalOtherIncome,
    totalIncome,
    totalExpenses,
    totalExpense: totalExpenses,
    netRevenue,
    balance,
    todayRevenue,
    totalStudents,
    exemptedStudents,
    incomes: formattedIncomes,
    expenses: formattedExpenses
  };
}

export async function listCategories(tenantId, type = null) {
  let query = `
    SELECT id, name, type, description, created_at
    FROM transaction_categories
    WHERE tenant_id = $1
  `;
  const values = [tenantId];
  if (type) {
    query += ` AND type = $2`;
    values.push(type.toUpperCase());
  }
  query += ` ORDER BY name ASC;`;
  const { rows } = await pgPool.query(query, values);
  return rows;
}

export async function createCategory(tenantId, data) {
  const query = `
    INSERT INTO transaction_categories (
      tenant_id, name, type, description
    ) VALUES (
      $1, $2, $3, $4
    )
    RETURNING id, name, type, description, created_at;
  `;
  const values = [
    tenantId,
    data.name,
    (data.type || 'EXPENSE').toUpperCase(),
    data.description || null
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function updateCategory(tenantId, id, data) {
  const query = `
    UPDATE transaction_categories
    SET name = COALESCE($3, name),
        type = COALESCE($4, type),
        description = COALESCE($5, description)
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, name, type, description, created_at;
  `;
  const { rows } = await pgPool.query(query, [
    id,
    tenantId,
    data.name,
    data.type ? data.type.toUpperCase() : null,
    data.description
  ]);
  return rows[0] || null;
}

export async function deleteCategory(tenantId, id) {
  const query = `
    DELETE FROM transaction_categories
    WHERE id = $1 AND tenant_id = $2
    RETURNING id;
  `;
  const { rows } = await pgPool.query(query, [id, tenantId]);
  return rows[0] || null;
}

export async function listFeeHeads(tenantId) {
  const query = `
    SELECT id, title, amount, due_date, fee_type, created_at
    FROM fee
    WHERE tenant_id = $1
    ORDER BY created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows;
}

export async function createFeeHead(tenantId, data) {
  const query = `
    INSERT INTO fee (tenant_id, title, amount, due_date, fee_type)
    VALUES ($1, $2, $3, $4::date, $5)
    RETURNING *;
  `;
  const values = [tenantId, data.title, data.amount, data.due_date || null, data.fee_type];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function deleteFeeHead(tenantId, feeId) {
  const query = `
    DELETE FROM fee
    WHERE id = $1 AND tenant_id = $2
    RETURNING id;
  `;
  const { rows } = await pgPool.query(query, [feeId, tenantId]);
  return rows[0] || null;
}

// ============================================================================
// 2. STUDENT DUES & LEDGER
// ============================================================================

export async function getStudentFeeDues(tenantId, studentId) {
  const query = `
    SELECT 
      sf.id, sf.fee_id, sf.payment_status, sf.total_paid_amount,
      f.title, f.amount as total_due_amount, f.due_date, f.fee_type
    FROM student_fees sf
    INNER JOIN fee f ON sf.fee_id = f.id AND f.tenant_id = sf.tenant_id
    WHERE sf.tenant_id = $1 AND sf.student_id = $2
    ORDER BY f.due_date ASC NULLS LAST;
  `;
  const { rows } = await pgPool.query(query, [tenantId, studentId]);
  return rows;
}

export async function getStudentPaymentHistory(tenantId, studentId) {
  const query = `
    SELECT 
      r.id as receipt_id, r.receipt_number, r.total_amount, r.payment_mode,
      r.remarks, r.created_at,
      u_cashier.name as cashier_name
    FROM receipts r
    LEFT JOIN "user" u_cashier ON r.collected_by = u_cashier.id AND u_cashier.tenant_id = r.tenant_id
    WHERE r.tenant_id = $1 AND r.student_id = $2
    ORDER BY r.created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, studentId]);
  return rows;
}

// ============================================================================
// 3. FEE COLLECTION POS (ACID Transaction across partitioned ledger)
// ============================================================================

export async function recordFeePayment(tenantId, collectedBy, data) {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // 1. Generate sequential receipt number per tenant
    const { rows: numRows } = await client.query(
      `SELECT COALESCE(MAX(receipt_number), 1000) + 1 as next_no FROM receipts WHERE tenant_id = $1;`,
      [tenantId]
    );
    const receiptNumber = numRows[0].next_no;

    // 2. Insert into receipts
    const receiptQuery = `
      INSERT INTO receipts (
        tenant_id, receipt_number, student_id, total_amount,
        payment_mode, remarks, collected_by
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7
      )
      RETURNING *;
    `;
    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const cashierUuid = isUuid(collectedBy) ? collectedBy : null;

    const receiptValues = [
      tenantId,
      receiptNumber,
      data.student_id,
      data.total_amount,
      data.payment_mode,
      data.remarks || null,
      cashierUuid
    ];
    const { rows: receiptRows } = await client.query(receiptQuery, receiptValues);
    const receipt = receiptRows[0];

    // 3. Insert into payments_ledger (automatically routes to physical partition e.g. payments_ledger_2026)
    const ledgerQuery = `
      INSERT INTO payments_ledger (
        tenant_id, student_id, receipt_id, fee_id,
        amount_paid, payment_mode, remarks, collected_by
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8
      )
      RETURNING *;
    `;
    const createdPayments = [];
    if (data.allocations && data.allocations.length > 0) {
      for (const alloc of data.allocations) {
        const itemRemarks = alloc.remarks || alloc.title || data.remarks || null;
        const { rows: pRows } = await client.query(ledgerQuery, [
          tenantId,
          data.student_id,
          receipt.id,
          alloc.fee_id || null,
          alloc.amount_paid,
          data.payment_mode,
          itemRemarks,
          cashierUuid
        ]);
        if (pRows[0]) createdPayments.push(pRows[0]);

        if (alloc.fee_id) {
          // Update student_fees status
          await client.query(`
            UPDATE student_fees
            SET total_paid_amount = total_paid_amount + $1,
                payment_status = CASE 
                  WHEN (total_paid_amount + $1) >= (SELECT amount FROM fee WHERE id = $2) THEN 'Paid'
                  ELSE 'Partial'
                END
            WHERE tenant_id = $3 AND student_id = $4 AND fee_id = $2;
          `, [alloc.amount_paid, alloc.fee_id, tenantId, data.student_id]);
        }
      }
    } else {
      // General ledger entry
      const { rows: pRows } = await client.query(ledgerQuery, [
        tenantId,
        data.student_id,
        receipt.id,
        null,
        data.total_amount,
        data.payment_mode,
        data.remarks || null,
        cashierUuid
      ]);
      if (pRows[0]) createdPayments.push(pRows[0]);
    }

    await client.query('COMMIT');
    return { receipt, payments: createdPayments };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ============================================================================
// 4. TRANSACTIONS & P&L
// ============================================================================

export async function listTransactions(tenantId, { startDate, endDate, type }) {
  let query = `
    SELECT 
      t.id, t.type, t.amount, TO_CHAR(t.transaction_date, 'YYYY-MM-DD') as transaction_date, t.description,
      t.payment_method, t.reference_number, t.created_at, t.category_id,
      COALESCE(tc.name, t.description, 'General') as category_name,
      jsonb_build_object('id', t.category_id, 'name', COALESCE(tc.name, t.description, 'General')) as category
    FROM transactions t
    LEFT JOIN transaction_categories tc ON t.category_id = tc.id AND tc.tenant_id = t.tenant_id
    WHERE t.tenant_id = $1
  `;
  const values = [tenantId];
  let idx = 2;

  if (type) {
    query += ` AND t.type = $${idx++}`;
    values.push(type);
  }
  if (startDate) {
    query += ` AND t.transaction_date >= $${idx++}::date`;
    values.push(startDate);
  }
  if (endDate) {
    query += ` AND t.transaction_date <= $${idx++}::date`;
    values.push(endDate);
  }

  query += ` ORDER BY t.transaction_date DESC, t.created_at DESC;`;
  const { rows } = await pgPool.query(query, values);
  return rows;
}

export async function createTransaction(tenantId, loggedBy, data) {
  const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  let loggedByUuid = null;
  if (isUuid(loggedBy)) {
    const { rows: uRows } = await pgPool.query(
      `SELECT id FROM "user" WHERE id = $1 AND tenant_id = $2 LIMIT 1;`,
      [loggedBy, tenantId]
    );
    if (uRows[0]) loggedByUuid = loggedBy;
  }
  const txDate = data.transaction_date || new Date().toISOString().split('T')[0];

  const query = `
    INSERT INTO transactions (
      tenant_id, type, category_id, amount,
      transaction_date, description, payment_method, reference_number, logged_by
    ) VALUES (
      $1, $2, $3, $4,
      $5::date, $6, $7, $8, $9
    )
    RETURNING id, tenant_id, type, category_id, amount, TO_CHAR(transaction_date, 'YYYY-MM-DD') as transaction_date, description, payment_method, reference_number, logged_by, created_at;
  `;
  const values = [
    tenantId,
    (data.type || 'EXPENSE').toUpperCase(),
    data.category_id || null,
    Number(data.amount || 0),
    txDate,
    data.description,
    data.payment_method || 'Cash',
    data.reference_number || null,
    loggedByUuid
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function getAccountantStats(tenantId, accountantId) {
  const query = `
    SELECT 
      pl.*,
      json_build_object('id', u.id, 'name', u.name, 'admission_number', u.admission_number) as student,
      json_build_object('id', f.id, 'title', f.title) as fee
    FROM payments_ledger pl
    LEFT JOIN "user" u ON pl.student_id = u.id AND u.tenant_id = pl.tenant_id
    LEFT JOIN fee f ON pl.fee_id = f.id AND f.tenant_id = pl.tenant_id
    WHERE pl.tenant_id = $1 AND pl.collected_by = $2
    ORDER BY pl.created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, accountantId]);
  let totalCollected = 0;
  for (const r of rows) {
    totalCollected += Number(r.amount_paid || 0);
  }
  return {
    totalTransactions: rows.length,
    totalCollected,
    payments: rows
  };
}

export async function updateFeeHead(tenantId, id, data) {
  const query = `
    UPDATE fee
    SET title = COALESCE($3, title),
        amount = COALESCE($4, amount),
        due_date = COALESCE($5::date, due_date),
        fee_type = COALESCE($6, fee_type)
    WHERE tenant_id = $1 AND id = $2
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [tenantId, id, data.title, data.amount, data.due_date, data.fee_type]);
  return rows[0] || null;
}

export async function updateTransaction(tenantId, id, data) {
  const query = `
    UPDATE transactions
    SET amount = COALESCE($3, amount),
        category_id = COALESCE($4, category_id),
        transaction_date = COALESCE($5::date, transaction_date),
        description = COALESCE($6, description),
        payment_method = COALESCE($7, payment_method),
        reference_number = COALESCE($8, reference_number)
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, type, category_id, amount, TO_CHAR(transaction_date, 'YYYY-MM-DD') as transaction_date, description, payment_method, reference_number, created_at;
  `;
  const { rows } = await pgPool.query(query, [
    id,
    tenantId,
    data.amount !== undefined ? Number(data.amount) : null,
    data.category_id || null,
    data.transaction_date || null,
    data.description || null,
    data.payment_method || null,
    data.reference_number || null
  ]);
  return rows[0] || null;
}

export async function deleteTransaction(tenantId, id) {
  const query = `
    DELETE FROM transactions
    WHERE id = $1 AND tenant_id = $2
    RETURNING id;
  `;
  const { rows } = await pgPool.query(query, [id, tenantId]);
  return rows[0] || null;
}

export async function updatePayment(tenantId, id, data) {
  const query = `
    UPDATE payments_ledger
    SET amount_paid = COALESCE($3, amount_paid),
        payment_mode = COALESCE($4, payment_mode),
        remarks = COALESCE($5, remarks)
    WHERE id = $1 AND tenant_id = $2
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [
    id,
    tenantId,
    data.amount_paid !== undefined ? Number(data.amount_paid) : null,
    data.payment_mode || null,
    data.remarks || null
  ]);
  return rows[0] || null;
}

export async function deletePayment(tenantId, id) {
  const query = `
    DELETE FROM payments_ledger
    WHERE id = $1 AND tenant_id = $2
    RETURNING id;
  `;
  const { rows } = await pgPool.query(query, [id, tenantId]);
  return rows[0] || null;
}

export async function updateStudentBusFee(tenantId, studentId, data) {
  const query = `
    UPDATE "user"
    SET bus_fee = $3,
        bus_start_date = $4::date
    WHERE id = $1 AND tenant_id = $2 AND type = 'student'
    RETURNING id, name, bus_fee, TO_CHAR(bus_start_date, 'YYYY-MM-DD') as bus_start_date;
  `;
  const { rows } = await pgPool.query(query, [
    studentId,
    tenantId,
    Number(data.bus_fee || 0),
    data.bus_start_date || null
  ]);
  return rows[0] || null;
}

export async function listStudentsForBalances(tenantId) {
  const query = `
    SELECT id, name, admission_number, fee_exempted, bus_fee, admission_date, created_at
    FROM "user"
    WHERE tenant_id = $1 AND type = 'student' AND (status = 'active' OR status IS NULL);
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows;
}

export async function deleteStudentFee(tenantId, id) {
  const query = `DELETE FROM student_fees WHERE id = $1 AND tenant_id = $2 RETURNING *;`;
  const { rows } = await pgPool.query(query, [id, tenantId]);
  return rows[0] || null;
}




