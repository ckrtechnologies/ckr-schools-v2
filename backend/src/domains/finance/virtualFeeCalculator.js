import { pgPool } from '../../config/db.js';

export const getCurrentAcademicYear = () => {
  const today = new Date();
  const month = today.getMonth(); // 0 = Jan, 3 = April
  let year = today.getFullYear();
  if (month < 3) year -= 1;
  return `${year}-${year + 1}`;
};

export const calculateVirtualDues = async (
  tenantId,
  studentId,
  academicYear = getCurrentAcademicYear(),
  includeFuture = false
) => {
  // 1. Fetch student details
  const studentRes = await pgPool.query(
    `SELECT id, name, admission_number, admission_date, fee_exempted, created_at
     FROM "user" WHERE id = $1 AND tenant_id = $2 LIMIT 1;`,
    [studentId, tenantId]
  );
  if (!studentRes.rows.length) {
    return { virtualDues: [], payments: [], structures: [], lateFeePenalty: 10 };
  }
  const student = studentRes.rows[0];
  if (student.fee_exempted) {
    return { virtualDues: [], payments: [], structures: [], lateFeePenalty: 10 };
  }

  // 2. Fetch class name
  const classRes = await pgPool.query(
    `SELECT c.name FROM class_students cs
     JOIN class c ON cs.class_id = c.id
     WHERE cs.student_id = $1 AND cs.tenant_id = $2
     LIMIT 1;`,
    [studentId, tenantId]
  );
  const className = classRes.rows[0]?.name || null;

  // 3. Fetch fee structures
  const structRes = await pgPool.query(
    `SELECT * FROM fee_structures
     WHERE tenant_id = $1 AND (class_name = $2 OR class_name IS NULL)
     ORDER BY id ASC;`,
    [tenantId, className]
  );
  const structures = structRes.rows.map(s => ({
    ...s,
    amount: Number(s.amount)
  }));

  const virtualDues = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthStart = new Date(currentYear, currentMonth, 1);

  // 4. Generate dues from fee_structures
  structures.forEach(struct => {
    const structAcademicYear = struct.academic_year;
    if (!structAcademicYear) return;
    if (academicYear !== 'ALL' && structAcademicYear !== academicYear) return;

    const sessionStartYear = parseInt(structAcademicYear.split('-')[0], 10);
    let monthsPassed;
    if (includeFuture) {
      monthsPassed = 12;
    } else {
      monthsPassed = (currentYear - sessionStartYear) * 12 + (currentMonth - 3) + 1;
      if (monthsPassed < 0) monthsPassed = 0;
      if (monthsPassed > 12) monthsPassed = 12;
    }

    let frequency = 'monthly';
    let baseCategory = struct.fee_category;
    if (struct.fee_category.endsWith('_annual')) {
      frequency = 'annual';
      baseCategory = struct.fee_category.replace('_annual', '');
    } else if (struct.fee_category.endsWith('_one_time')) {
      frequency = 'one_time';
      baseCategory = struct.fee_category.replace('_one_time', '');
    } else if (struct.fee_category.endsWith('_monthly')) {
      frequency = 'monthly';
      baseCategory = struct.fee_category.replace('_monthly', '');
    }

    const categoryTitle = baseCategory
      .split(/[_ ]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    let joinMonthStart = new Date(sessionStartYear, 3, 1);
    const admissionDateStr = student.admission_date || student.created_at;
    if (admissionDateStr) {
      const admissionDate = new Date(admissionDateStr);
      if (admissionDate > joinMonthStart) {
        joinMonthStart = new Date(admissionDate.getFullYear(), admissionDate.getMonth(), 1);
      }
    }

    if (frequency === 'annual') {
      if (monthsPassed > 0) {
        const monthIndex = 3; // April
        const year = sessionStartYear;
        const dueDate = `${year}-04-10`;
        const sessionEndDate = new Date(year + 1, 2, 31);

        if (sessionEndDate >= joinMonthStart) {
          const dueMonthStartAnnual = new Date(year, monthIndex, 1);
          virtualDues.push({
            id: `virtual-${struct.id}-${monthIndex}-${year}`,
            academic_year: structAcademicYear,
            is_future: dueMonthStartAnnual > currentMonthStart,
            fee: {
              title: `${categoryTitle} - ${year}-${year + 1}`,
              base_title: `${categoryTitle} - ${year}-${year + 1}`,
              amount: struct.amount,
              due_date: dueDate,
              fee_type: 'Annual',
            },
            status: 'pending',
            total_paid_amount: 0,
            category: struct.fee_category,
            month: monthIndex,
            year,
          });
        }
      }
    } else if (frequency === 'one_time') {
      if (monthsPassed > 0) {
        let monthIndex = 3;
        let year = sessionStartYear;
        const sessionEndDate = new Date(year + 1, 2, 31);

        if (sessionEndDate >= joinMonthStart) {
          if (struct.created_at) {
            const createdDate = new Date(struct.created_at);
            if (createdDate > new Date(sessionStartYear, 3, 1)) {
              monthIndex = createdDate.getMonth() + 1;
              year = createdDate.getFullYear();
              if (monthIndex > 11) {
                monthIndex = 0;
                year += 1;
              }
            }
          }
          const dueDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-10`;
          const dueMonthStartOneTime = new Date(year, monthIndex, 1);
          virtualDues.push({
            id: `virtual-${struct.id}-${monthIndex}-${year}`,
            academic_year: structAcademicYear,
            is_future: dueMonthStartOneTime > currentMonthStart,
            fee: {
              title: `${categoryTitle} - ${year}-${year + 1}`,
              base_title: `${categoryTitle} - ${year}-${year + 1}`,
              amount: struct.amount,
              due_date: dueDate,
              fee_type: 'One-time',
            },
            status: 'pending',
            total_paid_amount: 0,
            category: struct.fee_category,
            month: monthIndex,
            year,
          });
        }
      }
    } else {
      // Monthly
      for (let i = 0; i < monthsPassed; i++) {
        const monthIndex = (3 + i) % 12;
        const year = (3 + i) > 11 ? sessionStartYear + 1 : sessionStartYear;
        const dueMonthStart = new Date(year, monthIndex, 1);

        if (dueMonthStart >= joinMonthStart) {
          const dueDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-10`;
          virtualDues.push({
            id: `virtual-${struct.id}-${monthIndex}-${year}`,
            academic_year: structAcademicYear,
            is_future: dueMonthStart > currentMonthStart,
            fee: {
              title: `${categoryTitle} - ${monthNames[monthIndex]} ${year}`,
              base_title: `${categoryTitle} - ${monthNames[monthIndex]} ${year}`,
              amount: struct.amount,
              due_date: dueDate,
              fee_type: 'Monthly',
            },
            status: 'pending',
            total_paid_amount: 0,
            category: struct.fee_category,
            month: monthIndex,
            year,
          });
        }
      }
    }
  });

  // 5. Fetch Physical Ad-Hoc fees from student_fees + fee
  const physicalRes = await pgPool.query(
    `SELECT sf.id as sf_id, sf.fee_id, sf.payment_status, sf.total_paid_amount,
            f.title, f.amount, f.due_date, f.fee_type
     FROM student_fees sf
     INNER JOIN fee f ON sf.fee_id = f.id AND f.tenant_id = sf.tenant_id
     WHERE sf.student_id = $1 AND sf.tenant_id = $2
     ORDER BY f.due_date ASC NULLS LAST;`,
    [studentId, tenantId]
  );

  physicalRes.rows.forEach(row => {
    const feeTitle = row.title || 'Ad-Hoc Fee';
    const dueMonth = row.due_date ? new Date(row.due_date).getMonth() : new Date().getMonth();
    const dueYear = row.due_date ? new Date(row.due_date).getFullYear() : new Date().getFullYear();
    const dueMonthStart = new Date(dueYear, dueMonth, 1);
    const isFuture = dueMonthStart > currentMonthStart;

    if (!includeFuture && isFuture) return;

    if (academicYear !== 'ALL') {
      const startYear = parseInt(academicYear.split('-')[0], 10);
      const academicStart = new Date(startYear, 3, 1);
      const academicEnd = new Date(startYear + 1, 2, 31, 23, 59, 59);
      if (row.due_date) {
        const dueDate = new Date(row.due_date);
        if (dueDate < academicStart || dueDate > academicEnd) return;
      }
    }

    const dueDateStr = row.due_date
      ? new Date(row.due_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    virtualDues.push({
      id: `physical-${row.sf_id}`,
      is_future: isFuture,
      fee: {
        id: row.fee_id,
        title: feeTitle,
        base_title: feeTitle,
        amount: Number(row.amount || 0),
        due_date: dueDateStr,
        fee_type: row.fee_type || 'Ad-Hoc',
      },
      status: row.payment_status || 'pending',
      total_paid_amount: Number(row.total_paid_amount || 0),
      category: feeTitle.toLowerCase().includes('transport') ? 'transport' : 'ad-hoc',
      month: dueMonth,
      year: dueYear,
    });
  });

  // 6. Fetch payments from payments_ledger + receipts
  const paymentsRes = await pgPool.query(
    `SELECT pl.id, pl.receipt_id, pl.amount_paid, pl.payment_mode, pl.remarks, pl.created_at,
            r.receipt_number, r.total_amount as receipt_total_amount,
            r.payment_mode as receipt_payment_mode, r.remarks as receipt_remarks,
            r.created_at as receipt_created_at
     FROM payments_ledger pl
     LEFT JOIN receipts r ON pl.receipt_id = r.id AND r.tenant_id = pl.tenant_id
     WHERE pl.student_id = $1 AND pl.tenant_id = $2
     ORDER BY pl.created_at ASC;`,
    [studentId, tenantId]
  );

  const rawPayments = paymentsRes.rows;

  // 7. Fetch Late Fee Penalty from school_settings
  const settingsRes = await pgPool.query(
    `SELECT late_fee_penalty FROM school_settings WHERE tenant_id = $1 LIMIT 1;`,
    [tenantId]
  );
  const lateFeePenaltyAmount = settingsRes.rows[0]?.late_fee_penalty !== undefined && settingsRes.rows[0]?.late_fee_penalty !== null
    ? Number(settingsRes.rows[0].late_fee_penalty)
    : 0;

  // Helper for IST day calculation
  const toISTDayNumber = (date) => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    return Math.floor((date.getTime() + IST_OFFSET_MS) / (1000 * 60 * 60 * 24));
  };
  const todayISTDay = toISTDayNumber(today);

  // Late fee calculations
  virtualDues.forEach(due => {
    const relatedPayments = rawPayments.filter(p => p.remarks && p.remarks.includes(due.fee.base_title));
    const dueDateObj = new Date(due.fee.due_date + 'T00:00:00+05:30');
    const dueDayNumber = toISTDayNumber(dueDateObj);
    let penaltyEndDayNumber = todayISTDay;

    if (relatedPayments.length > 0) {
      const sortedPayments = [...relatedPayments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      penaltyEndDayNumber = toISTDayNumber(new Date(sortedPayments[0].created_at));
      const latestPayment = [...relatedPayments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      due.payment_date = latestPayment.created_at;
    }

    if (penaltyEndDayNumber > dueDayNumber) {
      const daysLate = penaltyEndDayNumber - dueDayNumber;
      if (daysLate > 0) {
        const penalty = daysLate * lateFeePenaltyAmount;
        if (penalty > 0) {
          due.fee.amount += penalty;
          due.fee.penalty = penalty;
          due.fee.title += ` (+₹${penalty} Late Fee)`;
        }
      }
    }
  });

  // Waterfall Allocation
  const paymentBalances = rawPayments.map(p => ({
    ...p,
    remaining: Number(p.amount_paid || 0),
  }));

  // Sort dues chronologically by due date
  virtualDues.sort((a, b) => new Date(a.fee.due_date) - new Date(b.fee.due_date));

  // Pass 1: Explicit matching
  virtualDues.forEach(due => {
    due.total_paid_amount = 0;
    due.status = 'pending';

    const matchingPayments = paymentBalances.filter(
      p => p.remaining > 0 && p.remarks && p.remarks.includes(due.fee.base_title)
    );

    matchingPayments.forEach(p => {
      const amountNeeded = due.fee.amount - due.total_paid_amount;
      if (amountNeeded <= 0) return;
      const amountToApply = Math.min(p.remaining, amountNeeded);
      due.total_paid_amount += amountToApply;
      p.remaining -= amountToApply;
    });

    if (due.total_paid_amount >= due.fee.amount) {
      due.status = 'paid';
    } else {
      const dueDateObj = new Date(due.fee.due_date + 'T23:59:59');
      if (dueDateObj < today) {
        due.status = 'overdue';
      }
    }
  });

  // Pass 2: Global waterfall for unallocated pool
  let unallocatedPaymentPool = paymentBalances.reduce((sum, p) => sum + p.remaining, 0);
  if (unallocatedPaymentPool > 0) {
    virtualDues.forEach(due => {
      if (unallocatedPaymentPool <= 0) return;
      const amountNeeded = due.fee.amount - due.total_paid_amount;
      if (amountNeeded > 0) {
        const amountToApply = Math.min(unallocatedPaymentPool, amountNeeded);
        due.total_paid_amount += amountToApply;
        unallocatedPaymentPool -= amountToApply;

        if (due.total_paid_amount >= due.fee.amount) {
          due.status = 'paid';
        } else {
          const dueDateObj = new Date(due.fee.due_date + 'T23:59:59');
          if (dueDateObj < today) {
            due.status = 'overdue';
          }
        }
      }
    });
  }

  // Format payments with receipts nested object
  const formattedPayments = rawPayments.map(p => ({
    id: p.id,
    receipt_id: p.receipt_id,
    amount_paid: Number(p.amount_paid || 0),
    payment_mode: p.payment_mode,
    remarks: p.remarks,
    created_at: p.created_at,
    receipts: p.receipt_number ? {
      receipt_number: p.receipt_number,
      total_amount: Number(p.receipt_total_amount || p.amount_paid),
      payment_mode: p.receipt_payment_mode || p.payment_mode,
      created_at: p.receipt_created_at || p.created_at,
      remarks: p.receipt_remarks || p.remarks,
    } : null,
    fee_title: p.fee_title || p.remarks || 'Fee Payment',
    fee: { title: p.fee_title || p.remarks || 'Fee Payment' },
  }));

  const filteredVirtualDues = virtualDues.filter(
    due => !due.academic_year || academicYear === 'ALL' || due.academic_year === academicYear
  );
  const filteredStructures = structures.filter(
    s => !s.academic_year || academicYear === 'ALL' || s.academic_year === academicYear
  );

  return {
    virtualDues: filteredVirtualDues,
    payments: formattedPayments,
    structures: filteredStructures,
    lateFeePenalty: lateFeePenaltyAmount,
  };
};

