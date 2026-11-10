/**
 * Timetable Validation Engine
 * 
 * Strict conflict detection and constraint enforcement for:
 * 1. Single period assignments (Teacher double-booking, Room clashes, Class overlaps, Subject weekly quotas)
 * 2. Schedule duplication across future dates (Strict 3-month range cap, multi-date conflict simulation)
 */

/**
 * Calculates ISO date string for Monday (week start) and Sunday (week end)
 * of any given date string (YYYY-MM-DD).
 */
export const getWeekBounds = (dateStr) => {
  if (!dateStr) return { start: "", end: "" };
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  
  const toISO = (dateObj) => {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const dayStr = String(dateObj.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dayStr}`;
  };

  return {
    start: toISO(monday),
    end: toISO(sunday),
  };
};

/**
 * Calculates the strict maximum allowed target date (3 months / 90 days from sourceDate).
 */
export const getMaxDuplicationDate = (sourceDate) => {
  if (!sourceDate) return "";
  const d = new Date(sourceDate + "T00:00:00Z");
  // Exactly 90 days (approx. 3 months)
  d.setUTCDate(d.getUTCDate() + 90);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dayStr = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dayStr}`;
};

/**
 * Checks whether a given target date extends beyond the strict 3-month limit from sourceDate.
 */
export const isDateBeyond3Months = (sourceDate, targetDate) => {
  if (!sourceDate || !targetDate) return false;
  const max = getMaxDuplicationDate(sourceDate);
  return targetDate > max;
};

/**
 * Normalizes subject identifier for comparison (e.g. "mathematics" or id "math")
 */
export const normalizeSubjectKey = (subject) => {
  if (!subject) return "";
  return String(subject).trim().toLowerCase();
};

/**
 * Finds the weekly quota configured for a specific class and subject
 * Resilient against nested maps, flat compound keys, container objects, and metadata
 */
export const getSubjectQuotaForClass = (classId, subjectNameOrId, classSubjectQuotas = {}, subjects = []) => {
  if (!classId || !subjectNameOrId) return null;

  // Helper to extract numeric quota from value (supports numbers, strings, and objects)
  const extractQuota = (val) => {
    if (val === undefined || val === null || val === "") return null;
    if (typeof val === "number" && !isNaN(val)) return val;
    if (typeof val === "string" && !isNaN(Number(val))) return Number(val);
    if (typeof val === "object") {
      const q = val.weeklyQuota ?? val.weekly_quota ?? val.quota;
      if (q !== undefined && q !== null && q !== "" && !isNaN(Number(q))) return Number(q);
    }
    return null;
  };

  // 1. Unwrap container objects if present
  const source =
    classSubjectQuotas.classSubjectQuotas ||
    classSubjectQuotas.quotas ||
    classSubjectQuotas;

  // 2. Resolve target subject identifier and metadata
  const targetKey = normalizeSubjectKey(subjectNameOrId);
  const matchedSubject = (subjects || []).find((s) => {
    const sId = normalizeSubjectKey(s.id);
    const sName = normalizeSubjectKey(s.name || s.subject_name);
    return sId === targetKey || sName === targetKey;
  });
  const resolvedId = matchedSubject?.id;
  const resolvedName = matchedSubject?.name || matchedSubject?.subject_name;

  // 3. Check direct nested dictionary: source[classId]
  const classQuotas = source[classId] || classSubjectQuotas[classId];
  if (classQuotas && typeof classQuotas === "object") {
    // 3a. Direct key match (by subjectNameOrId)
    const q1 = extractQuota(classQuotas[subjectNameOrId]);
    if (q1 !== null) return q1;

    // 3b. Match by resolved ID or resolved Name
    if (resolvedId) {
      const q2 = extractQuota(classQuotas[resolvedId]);
      if (q2 !== null) return q2;
    }
    if (resolvedName) {
      const q3 = extractQuota(classQuotas[resolvedName]);
      if (q3 !== null) return q3;
    }

    // 3c. Case-insensitive key scan
    for (const [k, v] of Object.entries(classQuotas)) {
      const normK = normalizeSubjectKey(k);
      if (normK === targetKey || (resolvedId && normK === normalizeSubjectKey(resolvedId)) || (resolvedName && normK === normalizeSubjectKey(resolvedName))) {
        const q4 = extractQuota(v);
        if (q4 !== null) return q4;
      }
    }
  }

  // 4. Check flat key patterns: "classId__subjectId" or "classId__subjectName"
  const flatContainers = [
    classSubjectQuotas.flatQuotas,
    classSubjectQuotas.quotas,
    classSubjectQuotas,
    source
  ];

  for (const container of flatContainers) {
    if (!container || typeof container !== "object") continue;

    // Try compound keys
    const candidateKeys = [
      `${classId}__${subjectNameOrId}`,
      resolvedId ? `${classId}__${resolvedId}` : null,
      resolvedName ? `${classId}__${resolvedName}` : null,
    ].filter(Boolean);

    for (const ck of candidateKeys) {
      const q = extractQuota(container[ck]);
      if (q !== null) return q;
    }

    // Case-insensitive flat key scan
    const classPrefix = `${normalizeSubjectKey(classId)}__`;
    for (const [k, v] of Object.entries(container)) {
      const normK = normalizeSubjectKey(k);
      if (normK.startsWith(classPrefix)) {
        const subPart = normK.slice(classPrefix.length);
        if (subPart === targetKey || (resolvedId && subPart === normalizeSubjectKey(resolvedId)) || (resolvedName && subPart === normalizeSubjectKey(resolvedName))) {
          const q = extractQuota(v);
          if (q !== null) return q;
        }
      }
    }
  }

  // 5. Fallback: check if the subject metadata object itself carries weeklyQuota
  if (matchedSubject) {
    const q = extractQuota(matchedSubject.weeklyQuota ?? matchedSubject.weekly_quota ?? matchedSubject.quota);
    if (q !== null) return q;
  }

  return null;
};

/**
 * Counts periods currently scheduled for a class + subject within a specific week.
 */
export const countClassSubjectPeriodsInWeek = (
  classId,
  subjectNameOrId,
  weekStartDate,
  weekEndDate,
  timeTables = [],
  excludePeriodId = null
) => {
  if (!classId || !subjectNameOrId || !weekStartDate || !weekEndDate) return 0;

  const classTT = timeTables.find((tt) => String(tt.classId) === String(classId));
  if (!classTT || !classTT.dates) return 0;

  const targetKey = normalizeSubjectKey(subjectNameOrId);
  let count = 0;

  Object.entries(classTT.dates).forEach(([dateStr, periods]) => {
    if (dateStr >= weekStartDate && dateStr <= weekEndDate && Array.isArray(periods)) {
      periods.forEach((p) => {
        if (excludePeriodId && String(p.id) === String(excludePeriodId)) return;
        if (p.isBreak) return;
        if (normalizeSubjectKey(p.subject) === targetKey) {
          count++;
        }
      });
    }
  });

  return count;
};

/**
 * Finds the weekly quota configured for a specific teacher
 */
export const getTeacherQuota = (teacherId, teacherQuotas = {}, teachers = []) => {
  if (!teacherId) return null;
  const tid = String(teacherId);

  // 1. Direct match in teacherQuotas map
  if (teacherQuotas[tid] !== undefined && teacherQuotas[tid] !== null && teacherQuotas[tid] !== "") {
    return Number(teacherQuotas[tid]);
  }

  // 2. Direct match on teacher object metadata
  const teacherObj = (teachers || []).find((t) => String(t.id) === tid);
  if (teacherObj?.weeklyQuota !== undefined && teacherObj?.weeklyQuota !== null && teacherObj?.weeklyQuota !== "") {
    return Number(teacherObj.weeklyQuota);
  }
  if (teacherObj?.weekly_quota !== undefined && teacherObj?.weekly_quota !== null && teacherObj?.weekly_quota !== "") {
    return Number(teacherObj.weekly_quota);
  }

  return null;
};

/**
 * Counts non-break periods currently scheduled for a teacher across ALL classes within a specific week.
 */
export const countTeacherPeriodsInWeek = (
  teacherId,
  weekStartDate,
  weekEndDate,
  timeTables = [],
  excludePeriodId = null
) => {
  if (!teacherId || !weekStartDate || !weekEndDate) return 0;

  const tid = String(teacherId);
  let count = 0;

  (timeTables || []).forEach((tt) => {
    if (!tt.dates) return;
    Object.entries(tt.dates).forEach(([dateStr, periods]) => {
      if (dateStr >= weekStartDate && dateStr <= weekEndDate && Array.isArray(periods)) {
        periods.forEach((p) => {
          if (excludePeriodId && String(p.id) === String(excludePeriodId)) return;
          if (p.isBreak) return;
          if (String(p.teacher) === tid) {
            count++;
          }
        });
      }
    });
  });

  return count;
};

/**
 * Strict Validation for Single Period Assignment (Add or Edit)
 * 
 * Returns:
 * {
 *   isValid: boolean,
 *   blockers: Array<{ code, message, field }>,
 *   warnings: Array<{ code, message, field }>
 * }
 */
export const validatePeriodAssignment = ({
  classId,
  date,
  timeSlot,
  subject,
  teacherId,
  roomNumber,
  isBreak = false,
  excludePeriodId = null,
  timeTables = [],
  classSubjectQuotas = {},
  teacherQuotas = {},
  classes = [],
  teachers = [],
  subjects = [],
}) => {
  const blockers = [];
  const warnings = [];

  if (!timeSlot || !timeSlot.trim()) {
    blockers.push({
      code: "MISSING_TIME",
      field: "time",
      message: "Time slot is required.",
    });
  }

  if (!isBreak && (!subject || !subject.trim())) {
    blockers.push({
      code: "MISSING_SUBJECT",
      field: "subject",
      message: "Please select a subject or mark as break.",
    });
  }

  if (isBreak) {
    return {
      isValid: blockers.length === 0,
      blockers,
      warnings,
    };
  }

  const cleanTime = (timeSlot || "").trim().toLowerCase();
  const cleanRoom = (roomNumber || "").trim().toLowerCase();
  const currentClass = classes.find((c) => String(c.id) === String(classId));
  const currentClassName = currentClass ? `${currentClass.name} - ${currentClass.section || ""}` : "Current Class";
  const teacherObj = teachers.find((t) => String(t.id) === String(teacherId));
  const teacherName = teacherObj ? teacherObj.name : "Selected Teacher";

  // 1. Check Class Slot Collision (Same class cannot have duplicate periods at the same time slot)
  const currentClassTT = timeTables.find((tt) => String(tt.classId) === String(classId));
  if (currentClassTT?.dates?.[date]) {
    const existingSlot = currentClassTT.dates[date].find(
      (p) =>
        (p.time || "").trim().toLowerCase() === cleanTime &&
        (!excludePeriodId || String(p.id) !== String(excludePeriodId))
    );
    if (existingSlot) {
      blockers.push({
        code: "CLASS_SLOT_COLLISION",
        field: "time",
        message: `This class already has a period (${existingSlot.subject || "Break"}) at ${timeSlot} on ${date}.`,
      });
    }
  }

  // 2. Strict Teacher Double-Booking Check across all classes
  if (teacherId) {
    timeTables.forEach((tt) => {
      const periodsOnDate = tt.dates?.[date];
      if (Array.isArray(periodsOnDate)) {
        periodsOnDate.forEach((p) => {
          if (excludePeriodId && String(p.id) === String(excludePeriodId)) return;
          if (p.isBreak) return;

          const pTime = (p.time || "").trim().toLowerCase();
          if (String(p.teacher) === String(teacherId) && pTime === cleanTime) {
            const conflictingClass = `${tt.className || "Class"} ${tt.section || ""}`.trim();
            blockers.push({
              code: "TEACHER_CLASH",
              field: "teacher",
              message: `Strict Clash: ${teacherName} is already teaching ${conflictingClass} at ${timeSlot} on ${date}.`,
              details: {
                teacherId,
                teacherName,
                conflictingClass,
                timeSlot,
                date,
              },
            });
          }
        });
      }
    });
  }

  // 3. Strict Room Double-Booking Check across all classes
  if (cleanRoom) {
    timeTables.forEach((tt) => {
      // Don't flag clash with self if in same class
      if (String(tt.classId) === String(classId)) return;

      const periodsOnDate = tt.dates?.[date];
      if (Array.isArray(periodsOnDate)) {
        periodsOnDate.forEach((p) => {
          if (excludePeriodId && String(p.id) === String(excludePeriodId)) return;
          if (p.isBreak) return;

          const pRoom = (p.roomNumber || "").trim().toLowerCase();
          const pTime = (p.time || "").trim().toLowerCase();

          if (pRoom === cleanRoom && pTime === cleanTime) {
            const conflictingClass = `${tt.className || "Class"} ${tt.section || ""}`.trim();
            blockers.push({
              code: "ROOM_CLASH",
              field: "roomNumber",
              message: `Room Clash: Room ${roomNumber} is already occupied by ${conflictingClass} at ${timeSlot} on ${date}.`,
              details: {
                roomNumber,
                conflictingClass,
                timeSlot,
                date,
              },
            });
          }
        });
      }
    });
  }

  // 4. Strict Weekly Quota Validation
  if (subject && date) {
    const weeklyQuota = getSubjectQuotaForClass(classId, subject, classSubjectQuotas, subjects);
    if (weeklyQuota === null || weeklyQuota === undefined || Number(weeklyQuota) <= 0) {
      blockers.push({
        code: "NO_QUOTA_DEFINED",
        field: "subject",
        message: `Strict Policy Block: No weekly quota has been defined for '${subject}' in ${currentClassName}. Please define a weekly quota first in Quota settings before scheduling.`,
        details: {
          subject,
          classId,
          className: currentClassName,
        },
      });
    } else {
      const quotaNum = Number(weeklyQuota);
      const { start: weekStart, end: weekEnd } = getWeekBounds(date);
      const currentWeekCount = countClassSubjectPeriodsInWeek(
        classId,
        subject,
        weekStart,
        weekEnd,
        timeTables,
        excludePeriodId
      );

      if (currentWeekCount >= quotaNum) {
        blockers.push({
          code: "QUOTA_EXCEEDED",
          field: "subject",
          message: `Quota Exceeded: ${subject} is limited to ${quotaNum} periods/week for ${currentClassName}. Already scheduled: ${currentWeekCount}/${quotaNum} in week (${weekStart} to ${weekEnd}).`,
          details: {
            subject,
            weeklyQuota: quotaNum,
            currentWeekCount,
            weekStart,
            weekEnd,
          },
        });
      } else if (currentWeekCount + 1 === quotaNum) {
        warnings.push({
          code: "QUOTA_NEAR_LIMIT",
          field: "subject",
          message: `Quota Limit Notice: This assignment will reach the full weekly quota (${quotaNum}/${quotaNum}) for ${subject}.`,
        });
      }
    }
  }

  // 5. Strict Teacher Weekly Quota Validation
  if (teacherId && date) {
    const teacherQuota = getTeacherQuota(teacherId, teacherQuotas, teachers);
    if (teacherQuota === null || teacherQuota === undefined || Number(teacherQuota) <= 0) {
      blockers.push({
        code: "NO_TEACHER_QUOTA_DEFINED",
        field: "teacher",
        message: `Strict Policy Block: No weekly quota has been defined for teacher '${teacherName}'. Please define a weekly quota first in Teacher Quota settings before scheduling.`,
        details: {
          teacherId,
          teacherName,
        },
      });
    } else {
      const quotaNum = Number(teacherQuota);
      const { start: weekStart, end: weekEnd } = getWeekBounds(date);
      const currentWeekTeacherCount = countTeacherPeriodsInWeek(
        teacherId,
        weekStart,
        weekEnd,
        timeTables,
        excludePeriodId
      );

      if (currentWeekTeacherCount >= quotaNum) {
        blockers.push({
          code: "TEACHER_QUOTA_EXCEEDED",
          field: "teacher",
          message: `Teacher Quota Exceeded: ${teacherName} is limited to ${quotaNum} periods/week across all classes. Already scheduled: ${currentWeekTeacherCount}/${quotaNum} in week (${weekStart} to ${weekEnd}).`,
          details: {
            teacherId,
            teacherName,
            weeklyQuota: quotaNum,
            currentWeekCount: currentWeekTeacherCount,
            weekStart,
            weekEnd,
          },
        });
      } else if (currentWeekTeacherCount + 1 === quotaNum) {
        warnings.push({
          code: "TEACHER_QUOTA_NEAR_LIMIT",
          field: "teacher",
          message: `Teacher Quota Notice: This assignment will reach the full weekly quota (${quotaNum}/${quotaNum}) for ${teacherName}.`,
        });
      }
    }
  }

  return {
    isValid: blockers.length === 0,
    blockers,
    warnings,
  };
};

/**
 * Strict Multi-Date Validation for Duplication across Future Dates
 * 
 * Enforces:
 * 1. Strict 3-month (90 days) max range limit
 * 2. Teacher clashes across all target dates
 * 3. Room clashes across all target dates
 * 4. Weekly quota exceedances across affected target weeks
 */
export const validateScheduleDuplication = ({
  classId,
  sourceDate,
  targetStartDate,
  targetEndDate,
  copyMode = "full", // 'full' (exact) or 'structure'
  selectedDays = [1, 2, 3, 4, 5, 6],
  timeTables = [],
  classSubjectQuotas = {},
  teacherQuotas = {},
  classes = [],
  teachers = [],
  subjects = [],
}) => {
  const blockers = [];
  const warnings = [];
  const targetDates = [];

  // Check 1: Mandatory fields
  if (!classId || !sourceDate || !targetStartDate || !targetEndDate) {
    return {
      isValid: false,
      blockers: [{ code: "MISSING_FIELDS", message: "Please fill in all date fields and class." }],
      warnings: [],
      targetDates: [],
    };
  }

  // Check 2: Date chronology
  if (targetStartDate > targetEndDate) {
    return {
      isValid: false,
      blockers: [{ code: "INVALID_DATE_RANGE", message: "Target start date must be before or equal to target end date." }],
      warnings: [],
      targetDates: [],
    };
  }

  // Check 3: Strict 3-Month Limit (90 days from sourceDate)
  const maxAllowedDate = getMaxDuplicationDate(sourceDate);
  if (targetEndDate > maxAllowedDate) {
    return {
      isValid: false,
      blockers: [
        {
          code: "EXCEEDS_3_MONTHS",
          message: `Strict Policy: Schedule duplication cannot extend beyond 3 months (90 days). Maximum allowed end date is ${maxAllowedDate}.`,
        },
      ],
      warnings: [],
      targetDates: [],
      maxAllowedDate,
    };
  }

  // Normalize selectedDays (can be strings like "monday" or numbers 0..6)
  const normalizedDayIndices = selectedDays.map((d) => {
    if (typeof d === "number") return d;
    const lower = String(d).toLowerCase().trim();
    const map = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    return map[lower] !== undefined ? map[lower] : null;
  }).filter((d) => d !== null);

  // Compute all target dates
  const startObj = new Date(targetStartDate + "T00:00:00Z");
  const endObj = new Date(targetEndDate + "T00:00:00Z");
  let curr = new Date(startObj);

  while (curr <= endObj) {
    const dayIndex = curr.getUTCDay();
    if (normalizedDayIndices.includes(dayIndex)) {
      const y = curr.getUTCFullYear();
      const m = String(curr.getUTCMonth() + 1).padStart(2, "0");
      const d = String(curr.getUTCDate()).padStart(2, "0");
      targetDates.push(`${y}-${m}-${d}`);
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  if (targetDates.length === 0) {
    return {
      isValid: false,
      blockers: [{ code: "NO_MATCHING_DAYS", message: "No dates match your selected weekdays within the chosen range." }],
      warnings: [],
      targetDates: [],
      maxAllowedDate,
    };
  }

  // Retrieve source periods
  const sourceClassTT = timeTables.find((tt) => String(tt.classId) === String(classId));
  const sourcePeriods = sourceClassTT?.dates?.[sourceDate] || [];

  if (sourcePeriods.length === 0) {
    return {
      isValid: false,
      blockers: [{ code: "NO_SOURCE_PERIODS", message: `No periods found on source date (${sourceDate}) to duplicate.` }],
      warnings: [],
      targetDates,
      maxAllowedDate,
    };
  }

  // If copyMode is 'structure', teachers and subjects are stripped, so no teacher/room clashes can occur.
  if (copyMode === "structure") {
    return {
      isValid: true,
      blockers: [],
      warnings: [
        {
          code: "STRUCTURE_ONLY_NOTICE",
          message: "Structure-only mode: Time slots will be copied, but teacher and subject assignments will remain unassigned.",
        },
      ],
      targetDates,
      maxAllowedDate,
      conflictSummary: {
        teacherClashes: [],
        roomClashes: [],
        quotaViolations: [],
      },
    };
  }

  // Exact / Full duplication mode: Run strict validation across all target dates
  const teacherClashes = [];
  const roomClashes = [];
  const quotaViolations = [];
  const teacherQuotaViolations = [];

  // 1. Simulate Teacher and Room Clashes on every target date
  targetDates.forEach((tDate) => {
    sourcePeriods.forEach((sp) => {
      if (sp.isBreak) return;
      const spTime = (sp.time || "").trim().toLowerCase();
      const spTeacher = sp.teacher;
      const spRoom = (sp.roomNumber || "").trim().toLowerCase();

      // Check against all other classes on tDate
      timeTables.forEach((otherTT) => {
        // Exclude current class since existing periods on target dates will be replaced
        if (String(otherTT.classId) === String(classId)) return;

        const otherPeriods = otherTT.dates?.[tDate];
        if (!Array.isArray(otherPeriods)) return;

        otherPeriods.forEach((op) => {
          if (op.isBreak) return;
          const opTime = (op.time || "").trim().toLowerCase();
          if (opTime !== spTime) return;

          // Teacher clash
          if (spTeacher && String(op.teacher) === String(spTeacher)) {
            const tObj = teachers.find((t) => String(t.id) === String(spTeacher));
            const tName = tObj ? tObj.name : "Teacher";
            const conflictingClass = `${otherTT.className || "Class"} ${otherTT.section || ""}`.trim();

            teacherClashes.push({
              date: tDate,
              time: sp.time,
              teacherId: spTeacher,
              teacherName: tName,
              conflictingClass,
              subject: sp.subject,
              message: `Teacher ${tName} clashes with ${conflictingClass} at ${sp.time} on ${tDate}.`,
            });
          }

          // Room clash
          if (spRoom && (op.roomNumber || "").trim().toLowerCase() === spRoom) {
            const conflictingClass = `${otherTT.className || "Class"} ${otherTT.section || ""}`.trim();
            roomClashes.push({
              date: tDate,
              time: sp.time,
              roomNumber: sp.roomNumber,
              conflictingClass,
              subject: sp.subject,
              message: `Room ${sp.roomNumber} clashes with ${conflictingClass} at ${sp.time} on ${tDate}.`,
            });
          }
        });
      });
    });
  });

  // 2. Simulate Weekly Subject Quotas across affected weeks
  // Group targetDates by week bounds
  const weeksMap = {};
  targetDates.forEach((tDate) => {
    const { start: wStart, end: wEnd } = getWeekBounds(tDate);
    const key = `${wStart}_${wEnd}`;
    if (!weeksMap[key]) {
      weeksMap[key] = { start: wStart, end: wEnd, datesInWeek: [] };
    }
    weeksMap[key].datesInWeek.push(tDate);
  });

  // For each affected week, calculate post-duplication count for each subject in this class
  Object.values(weeksMap).forEach(({ start: wStart, end: wEnd, datesInWeek }) => {
    // Subject occurrences contributed per duplicated day
    const subjectsInSource = {};
    sourcePeriods.forEach((sp) => {
      if (sp.isBreak || !sp.subject) return;
      const normSub = normalizeSubjectKey(sp.subject);
      subjectsInSource[normSub] = (subjectsInSource[normSub] || 0) + 1;
    });

    Object.keys(subjectsInSource).forEach((normSub) => {
      const quota = getSubjectQuotaForClass(classId, normSub, classSubjectQuotas, subjects);
      const originalSub = sourcePeriods.find((sp) => normalizeSubjectKey(sp.subject) === normSub)?.subject || normSub;

      if (quota === null || quota === undefined || Number(quota) <= 0) {
        quotaViolations.push({
          weekStart: wStart,
          weekEnd: wEnd,
          subject: originalSub,
          quota: 0,
          projectedCount: 1,
          message: `Strict Policy Block: Subject "${originalSub}" has no weekly quota defined for this class. Please define a quota in Quota settings before duplicating.`,
        });
      } else {
        const quotaNum = Number(quota);
        // Count existing periods in this week on days that are NOT being overwritten
        let existingUnoverwritten = 0;
        if (sourceClassTT?.dates) {
          Object.entries(sourceClassTT.dates).forEach(([dStr, dPeriods]) => {
            if (dStr >= wStart && dStr <= wEnd && !datesInWeek.includes(dStr)) {
              if (Array.isArray(dPeriods)) {
                dPeriods.forEach((p) => {
                  if (!p.isBreak && normalizeSubjectKey(p.subject) === normSub) {
                    existingUnoverwritten++;
                  }
                });
              }
            }
          });
        }

        const addedFromDuplication = subjectsInSource[normSub] * datesInWeek.length;
        const totalProjected = existingUnoverwritten + addedFromDuplication;

        if (totalProjected > quotaNum) {
          quotaViolations.push({
            weekStart: wStart,
            weekEnd: wEnd,
            subject: originalSub,
            quota: quotaNum,
            projectedCount: totalProjected,
            message: `Subject "${originalSub}" will exceed its weekly quota of ${quotaNum} periods (projected: ${totalProjected}) in week of ${wStart} to ${wEnd}.`,
          });
        }
      }
    });

    // 3. Simulate Weekly Teacher Quotas across affected weeks
    const teachersInSource = {};
    sourcePeriods.forEach((sp) => {
      if (sp.isBreak || !sp.teacher) return;
      const tid = String(sp.teacher);
      teachersInSource[tid] = (teachersInSource[tid] || 0) + 1;
    });

    Object.entries(teachersInSource).forEach(([tid, perDayCount]) => {
      const tQuota = getTeacherQuota(tid, teacherQuotas, teachers);
      const tObj = teachers.find((t) => String(t.id) === tid);
      const tName = tObj ? tObj.name : "Teacher";

      if (tQuota === null || tQuota === undefined || Number(tQuota) <= 0) {
        teacherQuotaViolations.push({
          weekStart: wStart,
          weekEnd: wEnd,
          teacherId: tid,
          teacherName: tName,
          quota: 0,
          projectedCount: 1,
          message: `Strict Policy Block: Teacher "${tName}" has no weekly quota defined. Please define a quota in Teacher Quota settings before duplicating.`,
        });
      } else {
        const quotaNum = Number(tQuota);
        // Count existing periods for this teacher across all classes in this week,
        // excluding periods of current class on days that are being overwritten
        let existingTeacherPeriods = 0;
        (timeTables || []).forEach((otherTT) => {
          if (!otherTT.dates) return;
          Object.entries(otherTT.dates).forEach(([dStr, dPeriods]) => {
            if (dStr >= wStart && dStr <= wEnd) {
              if (String(otherTT.classId) === String(classId) && datesInWeek.includes(dStr)) {
                return; // Will be replaced by duplicated schedule
              }
              if (Array.isArray(dPeriods)) {
                dPeriods.forEach((p) => {
                  if (!p.isBreak && String(p.teacher) === tid) {
                    existingTeacherPeriods++;
                  }
                });
              }
            }
          });
        });

        const addedFromDuplication = perDayCount * datesInWeek.length;
        const totalProjected = existingTeacherPeriods + addedFromDuplication;

        if (totalProjected > quotaNum) {
          teacherQuotaViolations.push({
            weekStart: wStart,
            weekEnd: wEnd,
            teacherId: tid,
            teacherName: tName,
            quota: quotaNum,
            projectedCount: totalProjected,
            message: `Teacher "${tName}" will exceed weekly quota of ${quotaNum} periods (projected: ${totalProjected}) in week of ${wStart} to ${wEnd}.`,
          });
        }
      }
    });
  });

  // Assemble blockers
  if (teacherClashes.length > 0) {
    blockers.push({
      code: "TEACHER_CLASHES_FOUND",
      message: `${teacherClashes.length} teacher clash(es) detected across future target dates.`,
      items: teacherClashes,
    });
  }

  if (roomClashes.length > 0) {
    blockers.push({
      code: "ROOM_CLASHES_FOUND",
      message: `${roomClashes.length} room clash(es) detected across future target dates.`,
      items: roomClashes,
    });
  }

  if (quotaViolations.length > 0) {
    blockers.push({
      code: "QUOTA_VIOLATIONS_FOUND",
      message: `${quotaViolations.length} weekly subject quota violation(s) would occur across future weeks.`,
      items: quotaViolations,
    });
  }

  if (teacherQuotaViolations.length > 0) {
    blockers.push({
      code: "TEACHER_QUOTA_VIOLATIONS_FOUND",
      message: `${teacherQuotaViolations.length} weekly teacher quota violation(s) would occur across future weeks.`,
      items: teacherQuotaViolations,
    });
  }

  return {
    isValid: blockers.length === 0,
    blockers,
    warnings,
    targetDates,
    maxAllowedDate,
    conflictSummary: {
      teacherClashes,
      roomClashes,
      quotaViolations,
      teacherQuotaViolations,
    },
  };
};
