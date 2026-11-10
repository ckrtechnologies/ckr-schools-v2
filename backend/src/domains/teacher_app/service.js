import * as repo from './repository.js';

export async function getTeacherProfile(tenantId, teacherId) {
  const teacherUser = await repo.getTeacherUser(tenantId, teacherId);
  const teacherClasses = await repo.getTeacherClasses(tenantId, teacherId);
  const teacherSubjects = await repo.getTeacherSubjects(tenantId, teacherId);

  const combinedClassesMap = new Map();

  const classTeacherOf = teacherClasses.map(c => {
    combinedClassesMap.set(c.class_id, {
      classId: c.class_id,
      className: c.class_name,
      section: c.section,
      isClassTeacher: true
    });
    return {
      classId: c.class_id,
      className: c.class_name,
      section: c.section
    };
  });

  teacherSubjects.forEach(st => {
    if (!combinedClassesMap.has(st.class_id)) {
      combinedClassesMap.set(st.class_id, {
        classId: st.class_id,
        className: st.class_name,
        section: st.section,
        isClassTeacher: false
      });
    }
  });

  const assignedClasses = Array.from(combinedClassesMap.values());

  const subjects = teacherSubjects.map(st => ({
    id: st.id,
    subjectId: st.subject_id,
    subjectName: st.subject_name,
    classId: st.class_id,
    className: st.class_name,
    section: st.section
  }));

  return {
    teacher: teacherUser,
    avatar_url: teacherUser?.avatar_url || null,
    assignedClasses,
    classTeacherOf,
    subjects
  };
}

export async function getTeacherClasses(tenantId, teacherId) {
  const profile = await getTeacherProfile(tenantId, teacherId);
  return profile.assignedClasses;
}

export async function getClassStudents(tenantId, classId) {
  const students = await repo.getClassStudents(tenantId, classId);
  return students.map(u => ({
    ...u,
    avatar_url: u.avatar_url && u.avatar_url.startsWith('http://') && !u.avatar_url.includes('localhost')
      ? u.avatar_url.replace(/^http:\/\//i, 'https://')
      : u.avatar_url
  }));
}

export async function getClassPerformance(tenantId, classId) {
  return await repo.getClassPerformance(tenantId, classId);
}

export async function getTeacherTimetable(tenantId, teacherId, classId = null) {
  const rows = await repo.getTeacherTimetable(tenantId, teacherId, classId);

  const groupedData = {};
  rows.forEach(row => {
    const cId = row.class_id;
    if (!groupedData[cId]) {
      groupedData[cId] = {
        id: row.id,
        classId: cId,
        className: row.class_name || 'Unknown Class',
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
        subject: row.subject,
        isBreak: row.is_break,
        roomNumber: row.room_number
      });
    }
  });

  return Object.values(groupedData);
}

