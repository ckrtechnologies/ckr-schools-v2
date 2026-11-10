import * as repo from './repository.js';
import * as timetableRepo from '../timetable/repository.js';
import * as examsRepo from '../exams/repository.js';

const FALLBACK_QUOTES = [
  { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" }
];

export async function getDashboard(tenantId, studentId) {
  // 1. Student Details
  const student = await repo.getStudentProfile(tenantId, studentId);
  const classData = await repo.getStudentClass(tenantId, studentId);

  // 2. Today's schedule
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  let todaySchedule = [];
  if (classData?.class_id) {
    todaySchedule = await repo.getTodaySchedule(tenantId, classData.class_id, todayName);
  }

  // 3. Grades & Avg
  const grades = await repo.getStudentGrades(tenantId, studentId);
  let latestGrade = null;
  let avgGradePercentage = 0;
  if (grades && grades.length > 0) {
    const latest = grades[0];
    latestGrade = {
      examName: latest.exam_name,
      obtained: latest.marks,
      total: latest.total_marks,
      percentage: latest.total_marks > 0 ? (latest.marks / latest.total_marks) * 100 : 0
    };
    const total = grades.reduce((sum, g) => sum + (g.total_marks > 0 ? (g.marks / g.total_marks) * 100 : 0), 0);
    avgGradePercentage = Math.round((total / grades.length) * 10) / 10;
  }

  // 4. Attendance
  const att = await repo.getAttendanceStats(tenantId, studentId);
  const attendanceStats = {
    present: att.present,
    total: att.total,
    percentage: att.total > 0 ? Math.round((att.present / att.total) * 100) : 0
  };

  // 5. Events & Courses
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = await repo.getUpcomingEvents(tenantId, todayStr);
  const pendingCount = await repo.getPendingCourseCount(tenantId);

  return {
    profile: student,
    classInfo: classData ? {
      id: classData.class_id,
      name: classData.name,
      section: classData.section,
      roll_number: classData.roll_number
    } : null,
    todaySchedule,
    latestGrade,
    avgGradePercentage,
    attendance: attendanceStats,
    upcomingEvents,
    pendingCount
  };
}

export async function getQuote(tenantId) {
  const thought = await repo.getThoughtOfTheDay(tenantId);
  if (thought) {
    return {
      text: thought.thought,
      author: thought.author,
      date: thought.date
    };
  }
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % FALLBACK_QUOTES.length;
  return FALLBACK_QUOTES[index];
}

export async function getRewards(tenantId, studentId) {
  const att = await repo.getAttendanceStats(tenantId, studentId);
  const grades = await repo.getStudentGrades(tenantId, studentId);
  
  const points = (att.present * 10) + (grades.length * 25);
  const badges = [];
  if (att.present >= 20) badges.push('Consistent Attendance');
  if (grades.some(g => g.total_marks > 0 && (g.marks / g.total_marks) >= 0.8)) badges.push('Academic Excellence');
  if (badges.length === 0) badges.push('New Achiever');

  return {
    points,
    badges,
    rank: 1
  };
}

export async function getTimetable(tenantId, studentId, classId) {
  let resolvedClassId = classId;
  if (!resolvedClassId && studentId) {
    resolvedClassId = await timetableRepo.getStudentClassId(tenantId, studentId);
  }
  if (!resolvedClassId) {
    return [];
  }
  const rows = await repo.getStudentTimetableRows(tenantId, resolvedClassId);

  const groupedData = {};
  rows.forEach(row => {
    const cId = row.class_id;
    if (!groupedData[cId]) {
      groupedData[cId] = {
        id: row.id,
        classId: cId,
        className: row.class_name || 'Class',
        section: row.section || '',
        dates: {}
      };
    }

    const dateStr = row.date;
    if (dateStr) {
      if (!groupedData[cId].dates[dateStr]) groupedData[cId].dates[dateStr] = [];
      groupedData[cId].dates[dateStr].push({
        id: row.id,
        teacher: row.teacher_id,
        teacherName: row.teacher_name || null,
        time: row.time_slot,
        timeSlot: row.time_slot,
        subject: row.subject,
        isBreak: row.is_break,
        roomNumber: row.room_number,
      });
    }
  });

  return Object.values(groupedData);
}

export async function getStudentAcademics(tenantId, studentId, academicYear = null) {
  const [gradesData, gradingScalesData, classData] = await Promise.all([
    repo.getStudentGradesWithDetails(tenantId, studentId),
    examsRepo.getGradingScales(tenantId).catch(() => []),
    repo.getStudentClass(tenantId, studentId)
  ]);

  const gradingScales = gradingScalesData?.length > 0 ? gradingScalesData : [
    { grade: 'A+', min_percentage: 90, max_percentage: 100, color_hex: '#16a34a' },
    { grade: 'A', min_percentage: 80, max_percentage: 89.99, color_hex: '#16a34a' },
    { grade: 'B', min_percentage: 70, max_percentage: 79.99, color_hex: '#3b82f6' },
    { grade: 'C', min_percentage: 60, max_percentage: 69.99, color_hex: '#eab308' },
    { grade: 'D', min_percentage: 50, max_percentage: 59.99, color_hex: '#f97316' },
    { grade: 'F', min_percentage: 0, max_percentage: 49.99, color_hex: '#ef4444' },
  ];

  const formattedGrades = (gradesData || []).map(g => {
    let percentage = 0;
    let grade = 'N/A';
    let gradeColor = '#ef4444';

    const maxMarks = Number(g.max_marks) || 100;
    const obtained = Number(g.marks);

    if (maxMarks > 0 && g.marks !== null) {
      percentage = Math.round((obtained / maxMarks) * 100);
      const matched = gradingScales.find(
        s => percentage >= Number(s.min_percentage) && percentage <= Number(s.max_percentage)
      ) || gradingScales[gradingScales.length - 1];

      grade = matched?.grade || 'A';
      gradeColor = matched?.color_hex || '#16a34a';
    }

    return {
      id: g.id,
      marks: obtained,
      maxMarks,
      percentage,
      subject: g.subject || 'Subject',
      title: g.title || 'Exam',
      date: g.date || null,
      grade,
      gradeColor,
      component_scores: g.component_scores || null
    };
  });

  let dateSheets = [];
  if (classData?.class_id) {
    let startDate = null;
    let endDate = null;
    if (academicYear && academicYear.includes('-')) {
      const [startYr, endYr] = academicYear.split('-');
      const fullEndYr = endYr.length === 2 ? `20${endYr}` : endYr;
      startDate = `${startYr}-04-01`;
      endDate = `${fullEndYr}-03-31`;
    }
    dateSheets = await repo.getClassDateSheets(tenantId, classData.class_id, startDate, endDate);
  }

  return {
    grades: formattedGrades,
    upcomingExams: dateSheets
  };
}

export async function getSiblings(tenantId, userId) {
  return await repo.getLinkedSiblings(tenantId, userId);
}


