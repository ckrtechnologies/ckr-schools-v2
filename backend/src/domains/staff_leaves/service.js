import * as repo from './repository.js';

export async function getMyLeaveSummary(tenantId, staffId, academicYear = '2026-27') {
  const balance = await repo.getOrCreateLeaveBalance(tenantId, staffId, academicYear);
  const applications = await repo.getMyApplications(tenantId, staffId);

  const casualTotal = Number(balance.casual_leave_total || 12);
  const casualUsed = Number(balance.casual_leave_used || 0);
  const sickTotal = Number(balance.sick_leave_total || 10);
  const sickUsed = Number(balance.sick_leave_used || 0);
  const earnedTotal = Number(balance.earned_leave_total || 15);
  const earnedUsed = Number(balance.earned_leave_used || 0);
  const unpaidUsed = Number(balance.unpaid_leave_used || 0);

  const formattedBalance = {
    casual: {
      total: casualTotal,
      used: casualUsed,
      remaining: Math.max(0, casualTotal - casualUsed)
    },
    sick: {
      total: sickTotal,
      used: sickUsed,
      remaining: Math.max(0, sickTotal - sickUsed)
    },
    earned: {
      total: earnedTotal,
      used: earnedUsed,
      remaining: Math.max(0, earnedTotal - earnedUsed)
    },
    unpaid: {
      used: unpaidUsed
    }
  };

  return {
    academicYear,
    balance: formattedBalance,
    applications
  };
}

export async function applyLeave(tenantId, staffId, data) {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);

  if (endDate < startDate) {
    const error = new Error('End date cannot be earlier than start date.');
    error.status = 400;
    throw error;
  }

  let calculatedDays = data.days_count;
  if (!calculatedDays) {
    if (data.leave_type === 'Half Day') {
      calculatedDays = 0.5;
    } else {
      const diffTime = Math.abs(endDate - startDate);
      calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const application = await repo.createLeaveApplication(tenantId, staffId, {
    ...data,
    days_count: calculatedDays
  });

  return application;
}

export async function cancelLeave(tenantId, applicationId, staffId) {
  const existing = await repo.getApplicationById(tenantId, applicationId);
  if (!existing) {
    const error = new Error('Leave application not found.');
    error.status = 404;
    throw error;
  }

  if (existing.staff_id !== staffId) {
    const error = new Error('You can only cancel your own leave applications.');
    error.status = 403;
    throw error;
  }

  if (existing.status !== 'Pending') {
    const error = new Error(`Cannot cancel application that is already ${existing.status}.`);
    error.status = 400;
    throw error;
  }

  const cancelled = await repo.cancelApplication(tenantId, applicationId, staffId);
  return cancelled;
}

export async function getAllLeaveApplications(tenantId, status = 'All') {
  return await repo.getAllApplications(tenantId, status);
}

export async function reviewLeaveApplication(tenantId, applicationId, { status, admin_remarks }, adminUserId) {
  const existing = await repo.getApplicationById(tenantId, applicationId);
  if (!existing) {
    const error = new Error('Leave application not found.');
    error.status = 404;
    throw error;
  }

  if (existing.status !== 'Pending') {
    const error = new Error(`Application has already been reviewed (current status: ${existing.status}).`);
    error.status = 400;
    throw error;
  }

  const updated = await repo.updateApplicationStatus(tenantId, applicationId, status, adminUserId, admin_remarks);

  // If Approved, deduct balance & auto-mark staff_attendance
  if (status === 'Approved') {
    try {
      await repo.deductLeaveBalance(tenantId, existing.staff_id, existing.leave_type, existing.days_count);
    } catch (e) {
      console.warn('⚠️ Could not deduct leave balance:', e.message);
    }

    try {
      await repo.batchMarkAttendanceLeave(
        tenantId,
        existing.staff_id,
        existing.start_date,
        existing.end_date,
        `Approved Leave (${existing.leave_type}): ${existing.reason || ''}`,
        adminUserId
      );
    } catch (e) {
      console.warn('⚠️ Could not batch mark attendance as leave:', e.message);
    }
  }

  return updated;
}

export async function getLeavePolicy(tenantId, academicYear = '2026-27') {
  return await repo.getLeavePolicy(tenantId, academicYear);
}

export async function updateLeavePolicy(tenantId, data) {
  const policy = await repo.upsertLeavePolicy(tenantId, data);
  let updatedStaffCount = 0;
  if (data.apply_to_existing_staff) {
    updatedStaffCount = await repo.bulkUpdateStaffBalances(tenantId, data.academic_year || '2026-27', {
      casual_leave_annual: data.casual_leave_annual,
      sick_leave_annual: data.sick_leave_annual,
      earned_leave_annual: data.earned_leave_annual
    });
  }
  return { policy, updatedStaffCount };
}

