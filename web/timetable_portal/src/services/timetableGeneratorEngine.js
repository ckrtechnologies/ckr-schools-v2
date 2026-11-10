/**
 * Automatic Timetable Generation Engine (v2.0)
 * Client: Vision International School, Shirur
 * Standards: 0-Clash Constraint Satisfaction Optimization, Hard & Soft Rules
 * US-15: Pre-Generation Capacity Audit
 * US-16: Algorithmic Timetable Generation
 * US-17: Master Schedule Publishing
 */

import { detectClashes } from "./clashDetector";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const CORE_SUBJECTS = ["math", "maths", "mathematics", "science", "physics", "chemistry", "biology", "english", "hindi", "social"];

const isCoreSubject = (subjectName = "") => {
  const s = subjectName.toLowerCase();
  return CORE_SUBJECTS.some((core) => s.includes(core));
};

/**
 * 1. US-15: Pre-Generation Capacity & Feasibility Audit
 * Verifies that total curriculum subject periods do not exceed faculty capacity
 * and flags unassigned subjects or faculty over-allocations.
 */
export const runPreGenerationAudit = ({
  classes = [],
  subjects = [],
  teachers = [],
  allotmentMatrix = {}, // matrix[classId][subjectId] -> { teacherId, quota, teacher }
  teacherQuotas = {},
  bellSettings = {},
  existingTimeTables = [],
}) => {
  let totalRequiredPeriods = 0;
  const unassignedSubjects = [];
  const highQuotaSubjects = [];
  const classOvercapacity = [];
  const teacherAllottedLoad = {}; // teacherId -> total periods assigned across all classes
  const teacherQuotaMap = {};

  // Check for already allocated periods in existing timetables
  const alreadyAllocatedSlots = [];
  const alreadyAllocatedByClass = {};
  (existingTimeTables || []).forEach((tt) => {
    if (!tt?.dates) return;
    const cid = tt.classId;
    const cObj = (classes || []).find((c) => String(c.id) === String(cid));
    const className = cObj?.label || `${cObj?.name || tt.className} ${cObj?.section || tt.section || ""}`.trim();

    Object.entries(tt.dates).forEach(([dateStr, pList]) => {
      if (!Array.isArray(pList) || pList.length === 0) return;
      const validPeriods = pList.filter(
        (p) => !p.isBreak && p.subject && p.subject !== "Unassigned" && p.subject !== "Holiday" && p.subject !== "Week Off"
      );
      if (validPeriods.length > 0) {
        if (!alreadyAllocatedByClass[cid]) {
          alreadyAllocatedByClass[cid] = { className, count: 0, dates: new Set() };
        }
        alreadyAllocatedByClass[cid].count += validPeriods.length;
        alreadyAllocatedByClass[cid].dates.add(dateStr);

        validPeriods.forEach((p) => {
          alreadyAllocatedSlots.push({
            classId: cid,
            className,
            date: dateStr,
            time: p.time,
            subject: p.subject,
            teacher: p.teacher,
          });
        });
      }
    });
  });

  const periodsPerDay = Number(bellSettings.periods_per_day) || 8;
  const saturdayPeriods = Number(bellSettings.saturday_periods) || 5;
  const totalWeeklyClassSlots = (5 * periodsPerDay) + saturdayPeriods; // 45 slots standard

  // Initialize teacher quotas
  (teachers || []).forEach((t) => {
    const q = teacherQuotas[t.id] ?? t.weeklyQuota ?? 28;
    teacherQuotaMap[t.id] = Number(q) || 28;
    teacherAllottedLoad[t.id] = 0;
  });

  // Check each class and subject in allotmentMatrix
  (classes || []).forEach((c) => {
    let classTotalRequested = 0;

    (subjects || []).forEach((s) => {
      const cell = allotmentMatrix[c.id]?.[s.id];
      const quota = cell?.quota ? Number(cell.quota) : 0;

      if (quota > 0) {
        totalRequiredPeriods += quota;
        classTotalRequested += quota;
        let teacherId = cell?.teacherId || cell?.teacher_id;

        // Fallback: If teacherId is missing, resolve by teacher name from active teachers list
        if (!teacherId && cell?.teacher && teachers.length > 0) {
          const tName = String(cell.teacher).toLowerCase().trim();
          const matched = teachers.find(
            (t) =>
              t.name?.toLowerCase().trim() === tName ||
              t.name?.toLowerCase().includes(tName) ||
              tName.includes((t.name || "").toLowerCase().trim())
          );
          if (matched) {
            teacherId = matched.id;
          }
        }

        const className = c.label || `${c.name}${c.section ? ` - ${c.section}` : ""}`;

        // Flag subjects where weekly quota > 6 (requires multiple daily lectures / double periods)
        if (quota > 6) {
          highQuotaSubjects.push({
            classId: c.id,
            className,
            subjectId: s.id,
            subjectName: s.name,
            quota,
            periodsPerDayNeeded: Math.ceil(quota / 6),
            teacherName: cell?.teacher || "Assigned Faculty",
          });
        }

        if (!teacherId) {
          unassignedSubjects.push({
            classId: c.id,
            className,
            subjectId: s.id,
            subjectName: s.name,
            quota,
          });
        } else {
          teacherAllottedLoad[teacherId] = (teacherAllottedLoad[teacherId] || 0) + quota;
        }
      }
    });

    // Check if class total requested periods exceed max weekly slot capacity
    if (classTotalRequested > totalWeeklyClassSlots) {
      const className = c.label || `${c.name}${c.section ? ` - ${c.section}` : ""}`;
      classOvercapacity.push({
        classId: c.id,
        className,
        totalRequested: classTotalRequested,
        availableSlots: totalWeeklyClassSlots,
        excess: classTotalRequested - totalWeeklyClassSlots,
      });
    }
  });

  // Calculate total faculty teaching capacity
  const totalFacultyCapacity = Object.values(teacherQuotaMap).reduce((acc, q) => acc + q, 0);

  // Check for over-allocated teachers
  const overAllocatedTeachers = [];
  Object.entries(teacherAllottedLoad).forEach(([tId, load]) => {
    const quota = teacherQuotaMap[tId] || 28;
    if (load > quota) {
      const teacherObj = teachers.find((t) => t.id === tId);
      overAllocatedTeachers.push({
        teacherId: tId,
        teacherName: teacherObj?.name || "Teacher",
        allottedLoad: load,
        weeklyQuota: quota,
        deficit: load - quota,
      });
    }
  });

  const isFeasible = unassignedSubjects.length === 0 && totalRequiredPeriods <= totalFacultyCapacity && classOvercapacity.length === 0;

  return {
    isFeasible,
    totalRequiredPeriods,
    totalFacultyCapacity,
    netBalance: totalFacultyCapacity - totalRequiredPeriods,
    unassignedSubjects,
    highQuotaSubjects,
    classOvercapacity,
    totalWeeklyClassSlots,
    overAllocatedTeachers,
    alreadyAllocatedSlots,
    alreadyAllocatedClasses: Object.values(alreadyAllocatedByClass),
    totalClasses: classes.length,
    totalTeachers: teachers.length,
  };
};

/**
 * Computes dynamic period clock timings and durations based on school bell settings.
 */
export const computeBellTimeSlots = (bellSettings = {}) => {
  const slots = [];
  const startTimeStr = bellSettings.school_start_time || "08:00 AM";
  const match = String(startTimeStr).match(/(\d+):(\d+)\s*(AM|PM)?/i);
  let startHour = match ? parseInt(match[1], 10) : 8;
  let startMin = match ? parseInt(match[2], 10) : 0;
  const isPM = match && match[3] && match[3].toUpperCase() === "PM";
  if (isPM && startHour < 12) startHour += 12;

  let currentMinutes = startHour * 60 + startMin;

  const formatTime = (mins) => {
    const h24 = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const ampm = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const assemblyDuration = Number(bellSettings.assembly_duration_minutes) || 0;
  if (assemblyDuration > 0) {
    currentMinutes += assemblyDuration;
  }

  const numPeriods = Number(bellSettings.periods_per_day) || 8;
  const pDuration = Number(bellSettings.period_duration_minutes) || 50;
  const recessAfter = Number(bellSettings.recess_after_period) || 4;
  const recessDuration = Number(bellSettings.recess_duration_minutes) || 0;
  const lunchAfter = Number(bellSettings.lunch_after_period) || 6;
  const lunchDuration = Number(bellSettings.lunch_duration_minutes) || 0;

  for (let p = 1; p <= Math.max(numPeriods, 12); p++) {
    const endPeriod = currentMinutes + pDuration;
    const startTime = formatTime(currentMinutes);
    const endTime = formatTime(endPeriod);
    slots.push({
      periodIndex: p,
      label: `Period ${p}`,
      startTime,
      endTime,
      timeRange: `${startTime} - ${endTime}`,
      durationMins: pDuration,
      durationLabel: `${pDuration} mins`,
      fullLabel: `Period ${p} (${startTime} - ${endTime})`,
    });
    currentMinutes = endPeriod;

    if (p === recessAfter && recessDuration > 0) {
      currentMinutes += recessDuration;
    }
    if (p === lunchAfter && lunchDuration > 0) {
      currentMinutes += lunchDuration;
    }
  }

  return slots;
};

/**
 * 2. US-16: Algorithmic Timetable Generation Engine
 * Generates a 0-clash weekly timetable draft enforcing all school constraints.
 */
export const generateDraftTimetable = ({
  classes = [],
  subjects = [],
  teachers = [],
  allotmentMatrix = {},
  bellSettings = {},
  weekDays = [],
  onProgress,
}) => {
  const periodsPerDay = Number(bellSettings.periods_per_day) || 8;
  const saturdayPeriods = Number(bellSettings.saturday_periods) || 5;

  const dynamicSlots = computeBellTimeSlots(bellSettings);
  const defaultSlots = dynamicSlots.map((s) => s.fullLabel);

  // Schedule Grid: schedule[classId][dayKey][slotIndex] -> { subject, teacherId, roomNumber, ... }
  const schedule = {};
  // Occupancy Tracking
  const teacherOccupancy = {}; // teacherOccupancy[dayKey][slotIndex][teacherId] = true
  const teacherDailyLoad = {}; // teacherDailyLoad[teacherId][dayKey] = count
  const teacherConsecutive = {}; // teacherConsecutive[teacherId][dayKey] = current consecutive count

  // Initialise data structures
  DAYS.forEach((d) => {
    teacherOccupancy[d] = {};
    for (let slot = 0; slot < periodsPerDay; slot++) {
      teacherOccupancy[d][slot] = {};
    }
  });

  (teachers || []).forEach((t) => {
    teacherDailyLoad[t.id] = {};
    DAYS.forEach((d) => {
      teacherDailyLoad[t.id][d] = 0;
    });
  });

  // Build subject lecture requirements queue per class
  // tasks = [ { classId, subjectId, subjectName, teacherId, isCore, allowDouble, ... }, ... ]
  const classSubjectTasks = {};

  (classes || []).forEach((c) => {
    schedule[c.id] = {};
    classSubjectTasks[c.id] = [];

    DAYS.forEach((d) => {
      schedule[c.id][d] = new Array(d === "saturday" ? saturdayPeriods : periodsPerDay).fill(null);
    });

    (subjects || []).forEach((s) => {
      const cell = allotmentMatrix[c.id]?.[s.id];
      const quota = cell?.quota ? Number(cell.quota) : 0;
      let teacherId = cell?.teacherId || cell?.teacher_id;

      // Fallback: If teacherId is missing, resolve by teacher name from active teachers list
      if (!teacherId && cell?.teacher && teachers.length > 0) {
        const tName = String(cell.teacher).toLowerCase().trim();
        const matched = teachers.find(
          (t) =>
            t.name?.toLowerCase().trim() === tName ||
            t.name?.toLowerCase().includes(tName) ||
            tName.includes((t.name || "").toLowerCase().trim())
        );
        if (matched) {
          teacherId = matched.id;
        }
      }

      if (quota > 0 && teacherId) {
        for (let q = 0; q < quota; q++) {
          classSubjectTasks[c.id].push({
            classId: c.id,
            className: `${c.name}${c.section ? ` - ${c.section}` : ""}`,
            subjectId: s.id,
            subjectName: s.name,
            teacherId,
            quota,
            isCore: isCoreSubject(s.name),
            allowDouble: !!s.allow_double_period,
            isLab: !!s.is_lab_required,
            roomNumber: c.name || "Classroom",
          });
        }
      }
    });

    // Interleave tasks across subjects to distribute subjects across the week
    // e.g. [English #1, Hindi #1, Math #1, Science #1, English #2, Hindi #2...]
    const tasksBySubject = {};
    (classSubjectTasks[c.id] || []).forEach((t) => {
      if (!tasksBySubject[t.subjectId]) tasksBySubject[t.subjectId] = [];
      tasksBySubject[t.subjectId].push(t);
    });

    const interleavedTasks = [];
    const subjectBuckets = Object.values(tasksBySubject);
    let hasMore = true;
    let round = 0;
    while (hasMore) {
      hasMore = false;
      for (const bucket of subjectBuckets) {
        if (round < bucket.length) {
          interleavedTasks.push(bucket[round]);
          if (round + 1 < bucket.length) hasMore = true;
        }
      }
      round++;
    }
    classSubjectTasks[c.id] = interleavedTasks;
  });

  // Solver: Iteratively assign lecture tasks across the week
  let totalTasksScheduled = 0;
  const unplacedTasks = [];

  (classes || []).forEach((c) => {
    const tasks = classSubjectTasks[c.id] || [];

    tasks.forEach((task) => {
      let placed = false;

      // Determine day candidate order (prefer days with fewer lectures for this subject)
      const dayCandidates = [...DAYS].sort((d1, d2) => {
        // Count how many times this subject is already placed in d1 vs d2 for this class
        const countD1 = schedule[c.id][d1].filter((p) => p && p.subjectId === task.subjectId).length;
        const countD2 = schedule[c.id][d2].filter((p) => p && p.subjectId === task.subjectId).length;
        if (countD1 !== countD2) return countD1 - countD2;
        // Saturday has fewer slots, so prefer weekdays first
        if (d1 === "saturday") return 1;
        if (d2 === "saturday") return -1;
        return 0;
      });

      for (const day of dayCandidates) {
        if (placed) break;

        const maxSlotsToday = day === "saturday" ? saturdayPeriods : periodsPerDay;
        // Check teacher daily cap (max 5)
        if (teacherDailyLoad[task.teacherId][day] >= 5) continue;

        // Candidate slot order: If core subject, prefer slots 0, 1, 2, 3 (Morning)
        const slotCandidates = [];
        for (let s = 0; s < maxSlotsToday; s++) {
          slotCandidates.push(s);
        }
        if (task.isCore) {
          slotCandidates.sort((s1, s2) => s1 - s2);
        } else {
          // Spread co-curricular into afternoon slots (periods 4 to 7)
          slotCandidates.sort((s1, s2) => s2 - s1);
        }

        for (const slot of slotCandidates) {
          // Check 1: Is classroom slot empty?
          if (schedule[c.id][day][slot] !== null) continue;

          // Check 2: Is teacher free in this slot across ALL classes?
          if (teacherOccupancy[day][slot][task.teacherId]) continue;

          // Check 3: Consecutiveness check (prevent > 3 consecutive periods)
          const prev1 = slot > 0 ? teacherOccupancy[day][slot - 1][task.teacherId] : false;
          const prev2 = slot > 1 ? teacherOccupancy[day][slot - 2][task.teacherId] : false;
          const prev3 = slot > 2 ? teacherOccupancy[day][slot - 3][task.teacherId] : false;
          if (prev1 && prev2 && prev3) continue; // 3 in a row already!

          // Check 4: Same subject repetition per day (respects user daily cap from bell settings)
          const sameSubjectCountToday = schedule[c.id][day].filter((p) => p && p.subjectId === task.subjectId).length;
          const userDailyLimit = bellSettings.max_daily_subject_periods !== undefined ? Number(bellSettings.max_daily_subject_periods) : 1;
          const maxDailyForSubject = task.allowDouble ? Math.max(2, userDailyLimit) : userDailyLimit;
          if (sameSubjectCountToday >= maxDailyForSubject) continue;

          // Check 5: Anti-back-to-back constraint (Classes of the SAME subject CANNOT be consecutive)
          // Unless explicitly marked as allowDouble or isLab (e.g., Computer Practical / Science Lab)
          if (!task.allowDouble && !task.isLab) {
            const prevSlotSubject = slot > 0 ? schedule[c.id][day][slot - 1]?.subjectId : null;
            const nextSlotSubject = slot < maxSlotsToday - 1 ? schedule[c.id][day][slot + 1]?.subjectId : null;
            if (prevSlotSubject === task.subjectId || nextSlotSubject === task.subjectId) {
              continue; // Reject: Same subject cannot be back-to-back!
            }
          }

          // Check 6: Dispersion / Separation for multiple periods of same subject in one day
          if (!task.allowDouble && !task.isLab && sameSubjectCountToday > 0) {
            const existingSlotsForSubject = [];
            for (let sIdx = 0; sIdx < maxSlotsToday; sIdx++) {
              if (schedule[c.id][day][sIdx]?.subjectId === task.subjectId) {
                existingSlotsForSubject.push(sIdx);
              }
            }
            // Require at least 2 periods separation (e.g. Period 1 and Period 4)
            const tooClose = existingSlotsForSubject.some((sIdx) => Math.abs(sIdx - slot) < 2);
            if (tooClose) continue;
          }

          // PLACE LECTURE!
          const slotMeta = dynamicSlots[slot] || {
            periodIndex: slot + 1,
            timeRange: "",
            durationMins: Number(bellSettings.period_duration_minutes) || 50,
            durationLabel: `${Number(bellSettings.period_duration_minutes) || 50} mins`,
            fullLabel: `Period ${slot + 1}`,
          };

          const periodObj = {
            id: `gen-${c.id}-${day}-${slot}-${Date.now()}`,
            classId: c.id,
            className: task.className,
            subjectId: task.subjectId,
            subject: task.subjectName,
            teacherId: task.teacherId,
            teacher: (teachers.find((t) => t.id === task.teacherId)?.name) || "Teacher",
            roomNumber: task.roomNumber,
            periodNumber: slot + 1,
            timeSlot: slotMeta.fullLabel || defaultSlots[slot] || `Period ${slot + 1}`,
            timeRange: slotMeta.timeRange || "",
            durationMins: slotMeta.durationMins || Number(bellSettings.period_duration_minutes) || 50,
            durationLabel: slotMeta.durationLabel || `${Number(bellSettings.period_duration_minutes) || 50} mins`,
            slotIndex: slot,
            dayOfWeek: day,
            isBreak: false,
          };

          schedule[c.id][day][slot] = periodObj;
          teacherOccupancy[day][slot][task.teacherId] = true;
          teacherDailyLoad[task.teacherId][day] += 1;
          totalTasksScheduled += 1;
          placed = true;
          break;
        }
      }

      if (!placed) {
        unplacedTasks.push(task);
      }
    });
  });

  // Pass 2: Relaxed placement for unplaced tasks (maintains strict 0-clash teacher occupancy)
  if (unplacedTasks.length > 0) {
    const stillUnplaced = [];
    unplacedTasks.forEach((task) => {
      let placed = false;
      for (const day of DAYS) {
        if (placed) break;
        const maxSlotsToday = day === "saturday" ? saturdayPeriods : periodsPerDay;
        for (let slot = 0; slot < maxSlotsToday; slot++) {
          if (schedule[task.classId][day][slot] !== null) continue;
          if (teacherOccupancy[day][slot][task.teacherId]) continue;

          // Strict Daily Cap: Never exceed configured max daily subject periods
          const sameSubjectCountToday = schedule[task.classId][day].filter((p) => p && p.subjectId === task.subjectId).length;
          const userDailyLimit = bellSettings.max_daily_subject_periods !== undefined ? Number(bellSettings.max_daily_subject_periods) : 1;
          if (sameSubjectCountToday >= userDailyLimit) continue;

          // Enforce non-consecutive even in Pass 2
          if (!task.allowDouble && !task.isLab) {
            const prev = slot > 0 ? schedule[task.classId][day][slot - 1]?.subjectId : null;
            const next = slot < maxSlotsToday - 1 ? schedule[task.classId][day][slot + 1]?.subjectId : null;
            if (prev === task.subjectId || next === task.subjectId) continue;
          }

          const slotMeta = dynamicSlots[slot] || {
            periodIndex: slot + 1,
            timeRange: "",
            durationMins: Number(bellSettings.period_duration_minutes) || 50,
            durationLabel: `${Number(bellSettings.period_duration_minutes) || 50} mins`,
            fullLabel: `Period ${slot + 1}`,
          };

          // Place lecture in free classroom slot
          const periodObj = {
            id: `gen-p2-${task.classId}-${day}-${slot}-${Date.now()}`,
            classId: task.classId,
            className: task.className,
            subjectId: task.subjectId,
            subject: task.subjectName,
            teacherId: task.teacherId,
            teacher: (teachers.find((t) => t.id === task.teacherId)?.name) || "Teacher",
            roomNumber: task.roomNumber,
            periodNumber: slot + 1,
            timeSlot: slotMeta.fullLabel || defaultSlots[slot] || `Period ${slot + 1}`,
            timeRange: slotMeta.timeRange || "",
            durationMins: slotMeta.durationMins || Number(bellSettings.period_duration_minutes) || 50,
            durationLabel: slotMeta.durationLabel || `${Number(bellSettings.period_duration_minutes) || 50} mins`,
            slotIndex: slot,
            dayOfWeek: day,
            isBreak: false,
          };

          schedule[task.classId][day][slot] = periodObj;
          teacherOccupancy[day][slot][task.teacherId] = true;
          totalTasksScheduled += 1;
          placed = true;
          break;
        }
      }
      if (!placed) stillUnplaced.push(task);
    });
    unplacedTasks.length = 0;
    unplacedTasks.push(...stillUnplaced);
  }

  // Format into class-based timetable array matching Portal structure
  const formattedClassTimetables = (classes || []).map((c) => {
    const dates = {};
    const sampleDates = {
      monday: "2026-11-02",
      tuesday: "2026-11-03",
      wednesday: "2026-11-04",
      thursday: "2026-11-05",
      friday: "2026-11-06",
      saturday: "2026-11-07",
    };

    DAYS.forEach((d) => {
      const dateKey = sampleDates[d];
      dates[dateKey] = (schedule[c.id]?.[d] || []).filter(Boolean);
    });

    return {
      classId: c.id,
      className: c.name,
      section: c.section || "",
      schedule: schedule[c.id] || {},
      dates,
    };
  });

  return {
    success: unplacedTasks.length === 0,
    totalScheduled: totalTasksScheduled,
    unplacedCount: unplacedTasks.length,
    unplacedTasks,
    classTimetables: formattedClassTimetables,
    schedule,
    clashes: [],
  };
};

