import api from "./api";

/**
 * 1. Fetch Teachers List with assigned workload & classes
 */
export const fetchTeachers = async () => {
  const res = await api.get("/teacher_schedule/teachers");
  if (res.data?.success && res.data?.data) {
    return res.data.data;
  }
  return res.data || [];
};

/**
 * 2. Fetch Weekly Routine for a Teacher
 */
export const fetchTeacherWeeklyRoutine = async (teacherId, params = {}) => {
  const res = await api.get(`/teacher_schedule/${teacherId}/routine`, { params });
  if (res.data?.success && res.data?.data) {
    return res.data.data;
  }
  return res.data || { routine: {}, timeSlots: [], summary: {} };
};

/**
 * 3. Fetch Full-Year / Range-based schedule for a Teacher
 */
export const fetchTeacherFullYearSchedule = async (teacherId, params = {}) => {
  let startDate = params.startDate;
  let endDate = params.endDate;

  if (!startDate && !endDate && params.academicYear) {
    const match = params.academicYear.match(/(\d{4})\s*[-/]\s*(\d{4})/);
    if (match) {
      startDate = `${match[1]}-04-01`;
      endDate = `${match[2]}-03-31`;
    }
  }

  const queryParams = { ...params, startDate, endDate };
  const res = await api.get(`/teacher_schedule/${teacherId}/yearly`, { params: queryParams });
  if (res.data?.success && res.data?.data) {
    return res.data.data;
  }
  return res.data || { sessions: [], monthlyDistribution: {} };
};

/**
 * 4. Fetch Workload Matrix across all teachers
 */
export const fetchWorkloadMatrix = async (params = {}) => {
  const res = await api.get("/teacher_schedule/workload-matrix", { params });
  if (res.data?.success && res.data?.data) {
    return res.data.data;
  }
  return res.data || { matrix: [], timeSlots: [], days: [] };
};

/**
 * 5. Fetch Master Class-Subject-Teacher Allotment Matrix
 */
export const fetchMasterAllotmentMatrix = async () => {
  const res = await api.get("/teacher_schedule/allotment-matrix");
  if (res.data?.success && res.data?.data) {
    return res.data.data;
  }
  return res.data || { classes: [], subjects: [], matrix: {}, totals: {} };
};

/**
 * 6. Fetch Subject Weekly Quotas
 */
export const fetchSubjectQuotas = async () => {
  try {
    const res = await api.get("/teacher_schedule/subject-quotas");
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn("fetchSubjectQuotas API error:", err.message);
  }
  return {};
};

/**
 * 7. Save Subject Weekly Quotas
 */
export const saveSubjectQuotas = async (payload) => {
  const body = (payload && (payload.classId || payload.classSubjectQuotas)) ? payload : { quotas: payload };
  const res = await api.post("/teacher_schedule/subject-quotas", body);
  return res.data;
};

/**
 * 8. Fetch Teacher Weekly Quotas
 */
export const fetchTeacherQuotas = async () => {
  try {
    const res = await api.get("/teacher_schedule/teacher-quotas");
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn("fetchTeacherQuotas API error:", err.message);
  }
  return { teacherQuotas: {} };
};

/**
 * 9. Save Teacher Weekly Quotas
 */
export const saveTeacherQuotas = async (payload) => {
  const body = (payload && (payload.teacherId || payload.teacherQuotas)) ? payload : { teacherQuotas: payload };
  const res = await api.post("/teacher_schedule/teacher-quotas", body);
  return res.data;
};

/**
 * 10. Assign Class-Subject-Teacher & Quota (US-06)
 */
export const assignClassSubjectTeacher = async ({ classId, subjectId, teacherId, quota, subjectName }) => {
  const res = await api.post("/teacher_schedule/assign-allotment", {
    classId,
    subjectId,
    teacherId,
    quota,
    subjectName,
  });
  return res.data;
};

/**
 * 11. Fetch Free vs. Engaged Teachers Roster (US-07)
 */
export const fetchFreeTeachers = async ({ date, timeSlot, periodIndex } = {}) => {
  const params = {};
  if (date) params.date = date;
  if (timeSlot) params.timeSlot = timeSlot;
  if (periodIndex) params.periodIndex = periodIndex;

  try {
    const res = await api.get("/teacher_schedule/free-teachers", { params });
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return res.data;
  } catch (err) {
    console.warn("fetchFreeTeachers API error:", err.message);
    throw err;
  }
};

/**
 * 12. Assign 1-Click Substitution Proxy (US-08)
 */
export const assignProxySubstitution = async (payload) => {
  const res = await api.post("/teacher_schedule/assign-proxy", payload);
  return res.data;
};

/**
 * 13. Fetch Daily Proxies for a date (US-09)
 */
export const fetchDailyProxies = async (date) => {
  try {
    const res = await api.get("/teacher_schedule/daily-proxies", { params: { date } });
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return res.data || [];
  } catch (err) {
    console.warn("fetchDailyProxies API error:", err.message);
    return [];
  }
};

/**
 * 14. Cancel Proxy Assignment
 */
export const cancelProxyAssignment = async (proxyId) => {
  const res = await api.delete(`/teacher_schedule/cancel-proxy/${proxyId}`);
  return res.data;
};

/**
 * 15. Timetable Settings (US-01)
 */
export const fetchTimetableSettings = async () => {
  let cached = null;
  try {
    const raw = localStorage.getItem("timetable_settings");
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}

  try {
    const res = await api.get("/teacher_schedule/timetable-settings");
    if (res.data?.success && res.data?.data) {
      const merged = { ...cached, ...res.data.data };
      try {
        localStorage.setItem("timetable_settings", JSON.stringify(merged));
      } catch (e) {}
      return merged;
    }
  } catch (err) {
    console.warn("fetchTimetableSettings API error, using cached/default settings:", err.message);
  }

  if (cached) return cached;

  return {
    academic_year: "2026-2027",
    school_start_time: "08:00 AM",
    period_duration_minutes: 50,
    assembly_duration_minutes: 20,
    recess_after_period: 4,
    recess_duration_minutes: 20,
    lunch_after_period: 6,
    lunch_duration_minutes: 40,
    periods_per_day: 8,
    saturday_periods: 5,
    max_daily_subject_periods: 1,
  };
};

export const saveTimetableSettings = async (settings) => {
  try {
    localStorage.setItem("timetable_settings", JSON.stringify(settings));
  } catch (e) {}

  try {
    const res = await api.post("/teacher_schedule/timetable-settings", settings);
    return res.data;
  } catch (err) {
    console.warn("saveTimetableSettings API failed, preserved in localStorage:", err.message);
    return { success: true, data: settings };
  }
};
