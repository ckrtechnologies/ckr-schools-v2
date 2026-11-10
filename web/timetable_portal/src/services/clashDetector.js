/**
 * Detect teacher or room scheduling conflicts across classes
 * @param {Array} timeTables - All timetable objects grouped by class
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Array} - List of conflicts: { type: 'teacher' | 'room', name, time, classes: [] }
 */
export const detectClashes = (timeTables = [], date) => {
  if (!date || !Array.isArray(timeTables)) return [];

  const teacherSlots = {};
  const roomSlots = {};
  const conflicts = [];

  timeTables.forEach((classTT) => {
    const periods = classTT.dates?.[date] || [];
    periods.forEach((p) => {
      if (p.isBreak) return;

      const timeKey = (p.time || "").trim().toLowerCase();
      if (!timeKey) return;

      // 1. Check Teacher conflict
      if (p.teacher) {
        const key = `${p.teacher}__${timeKey}`;
        if (!teacherSlots[key]) {
          teacherSlots[key] = [];
        }
        teacherSlots[key].push({
          classId: classTT.classId,
          className: `${classTT.className} - ${classTT.section}`,
          period: p,
        });
      }

      // 2. Check Room conflict
      if (p.roomNumber) {
        const key = `${p.roomNumber}__${timeKey}`;
        if (!roomSlots[key]) {
          roomSlots[key] = [];
        }
        roomSlots[key].push({
          classId: classTT.classId,
          className: `${classTT.className} - ${classTT.section}`,
          period: p,
        });
      }
    });
  });

  // Collect teacher conflicts
  Object.entries(teacherSlots).forEach(([key, entries]) => {
    if (entries.length > 1) {
      const [teacherId, time] = key.split("__");
      conflicts.push({
        type: "teacher",
        id: teacherId,
        time,
        classes: entries.map((e) => e.className),
        periodIds: entries.map((e) => e.period.id),
      });
    }
  });

  // Collect room conflicts
  Object.entries(roomSlots).forEach(([key, entries]) => {
    if (entries.length > 1) {
      const [roomNumber, time] = key.split("__");
      conflicts.push({
        type: "room",
        id: roomNumber,
        time,
        classes: entries.map((e) => e.className),
        periodIds: entries.map((e) => e.period.id),
      });
    }
  });

  return conflicts;
};
