import { pgPool } from '../../config/db.js';

/**
 * Coursework & Consents Repository (ADO)
 */

// ============================================================================
// 1. COURSEWORK & HOMEWORK
// ============================================================================

export async function listCoursework(tenantId, classId = null) {
  let query = `
    SELECT 
      c.id, c.title, c.subject, c.class_id, c.chapter, c.duedate,
      c.description, c.file_url, c.type, c.date, c.day, c.topics_taught, c.unit,
      c.lesson_no, c.page_number, c.others, c.homework, c.created_at,
      cls.name as class_name, cls.section as class_section
    FROM course c
    LEFT JOIN class cls ON c.class_id = cls.id AND cls.tenant_id = c.tenant_id
    WHERE c.tenant_id = $1
  `;
  const values = [tenantId];

  if (classId && classId !== 'all') {
    query += ` AND c.class_id = $2`;
    values.push(classId);
  }

  query += ` ORDER BY c.created_at DESC;`;
  const { rows } = await pgPool.query(query, values);

  return rows.map(r => ({
    ...r,
    class: r.class_name,
    section: r.class_section,
    points: r.others,
    solution: []
  }));
}

export async function listStudentCoursework(tenantId, studentId) {
  // 1. Get student's class_id
  const classRes = await pgPool.query(
    `SELECT class_id FROM class_students WHERE student_id = $1 AND tenant_id = $2 LIMIT 1;`,
    [studentId, tenantId]
  );
  if (!classRes.rows.length) {
    return [];
  }
  const classId = classRes.rows[0].class_id;

  // 2. Fetch all courses for this class
  const coursesRes = await pgPool.query(
    `SELECT 
       c.id, c.title, c.subject, c.class_id, c.chapter, c.duedate,
       c.description, c.file_url, c.type, c.date, c.day, c.topics_taught, c.unit,
       c.lesson_no, c.page_number, c.others, c.homework, c.created_at,
       cls.name as class_name, cls.section as class_section
     FROM course c
     LEFT JOIN class cls ON c.class_id = cls.id AND cls.tenant_id = c.tenant_id
     WHERE c.class_id = $1 AND c.tenant_id = $2
     ORDER BY c.created_at DESC;`,
    [classId, tenantId]
  );
  const courses = coursesRes.rows;
  if (!courses.length) {
    return [];
  }

  // 3. Find submitted course ids for this student
  const courseIds = courses.map(c => c.id);
  const subRes = await pgPool.query(
    `SELECT course_id FROM course_submissions
     WHERE student_id = $1 AND tenant_id = $2 AND course_id = ANY($3::bigint[]);`,
    [studentId, tenantId, courseIds]
  );
  const submittedSet = new Set(subRes.rows.map(r => String(r.course_id)));

  return courses.map(c => ({
    ...c,
    class: c.class_name,
    section: c.class_section,
    points: c.others,
    isSubmitted: submittedSet.has(String(c.id)),
    solution: []
  }));
}

export async function submitCourseAnswer(tenantId, { courseId, studentId, content }) {
  const query = `
    INSERT INTO course_submissions (tenant_id, course_id, student_id, content, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *;
  `;
  try {
    const { rows } = await pgPool.query(query, [tenantId, courseId, studentId, content]);
    return { success: true, submission: rows[0] };
  } catch (err) {
    if (err.code === '23505') {
      return { success: false, alreadySubmitted: true, message: 'You have already submitted.' };
    }
    throw err;
  }
}

export async function findClassIdByNameSection(tenantId, name, section) {
  const query = `
    SELECT id FROM class 
    WHERE tenant_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) AND LOWER(TRIM(section)) = LOWER(TRIM($3))
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId, name, section]);
  return rows[0]?.id || null;
}

export async function createCoursework(tenantId, data) {
  let finalClassId = data.class_id;
  if (!finalClassId && data.class && data.section) {
    finalClassId = await findClassIdByNameSection(tenantId, data.class, data.section);
  }

  const query = `
    INSERT INTO course (
      tenant_id, title, subject, class_id, chapter, duedate,
      description, file_url, type, date, day, topics_taught, unit,
      lesson_no, page_number, others, homework
    ) VALUES (
      $1, $2, $3, $4, $5, $6::date,
      $7, $8, $9, $10::date, $11, $12, $13,
      $14, $15, $16, $17
    )
    RETURNING *;
  `;
  const values = [
    tenantId,
    data.title,
    data.subject,
    finalClassId || null,
    data.chapter || null,
    data.duedate || null,
    data.description || null,
    data.file_url || null,
    data.type || 'homework',
    data.date || null,
    data.day || null,
    data.topics_taught || null,
    data.unit || null,
    data.lesson_no || null,
    data.page_number || null,
    data.others || null,
    data.homework || null
  ];

  const { rows } = await pgPool.query(query, values);
  const row = rows[0];

  return {
    ...row,
    class: data.class || null,
    section: data.section || null,
    points: row.others,
    solution: []
  };
}

export async function updateCoursework(tenantId, courseId, data) {
  let finalClassId = data.class_id;
  if (!finalClassId && data.class && data.section) {
    finalClassId = await findClassIdByNameSection(tenantId, data.class, data.section);
  }

  const fields = [];
  const values = [courseId, tenantId];
  let idx = 3;

  const mapping = {
    title: 'title',
    subject: 'subject',
    chapter: 'chapter',
    description: 'description',
    file_url: 'file_url',
    type: 'type',
    day: 'day',
    topics_taught: 'topics_taught',
    unit: 'unit',
    lesson_no: 'lesson_no',
    page_number: 'page_number',
    others: 'others',
    homework: 'homework'
  };

  for (const [key, col] of Object.entries(mapping)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${idx++}`);
      values.push(data[key]);
    }
  }

  if (finalClassId !== undefined) {
    fields.push(`class_id = $${idx++}`);
    values.push(finalClassId);
  }

  if (data.duedate !== undefined) {
    fields.push(`duedate = $${idx++}::date`);
    values.push(data.duedate);
  }

  if (data.date !== undefined) {
    fields.push(`date = $${idx++}::date`);
    values.push(data.date);
  }

  if (fields.length === 0) {
    const { rows } = await pgPool.query(`SELECT * FROM course WHERE id = $1 AND tenant_id = $2`, [courseId, tenantId]);
    return rows[0] || null;
  }

  const query = `
    UPDATE course 
    SET ${fields.join(', ')}
    WHERE id = $1 AND tenant_id = $2
    RETURNING *;
  `;

  const { rows } = await pgPool.query(query, values);
  if (!rows[0]) return null;

  return {
    ...rows[0],
    points: rows[0].others,
    solution: []
  };
}

export async function deleteCoursework(tenantId, courseId) {
  const query = `
    DELETE FROM course
    WHERE id = $1 AND tenant_id = $2
    RETURNING id;
  `;
  const { rows } = await pgPool.query(query, [courseId, tenantId]);
  return rows[0] || null;
}

// ============================================================================
// 2. PARENTAL CONSENTS
// ============================================================================

export async function updateConsent(tenantId, id, data) {
  const fields = [];
  const values = [tenantId, id];
  let idx = 3;

  if (data.title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(data.description);
  }
  if (data.class_id !== undefined) {
    fields.push(`class_id = $${idx++}::uuid`);
    values.push(data.class_id ? data.class_id : null);
  }
  if (data.event_date !== undefined) {
    fields.push(`event_date = $${idx++}::date`);
    values.push(data.event_date ? data.event_date : null);
  }

  if (fields.length === 0) {
    const { rows } = await pgPool.query('SELECT * FROM consents WHERE tenant_id = $1 AND id = $2', [tenantId, id]);
    return rows[0] || null;
  }

  const query = `
    UPDATE consents
    SET ${fields.join(', ')}
    WHERE tenant_id = $1 AND id = $2
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, values);
  return rows[0] || null;
}

export async function deleteConsent(tenantId, id) {
  await pgPool.query('DELETE FROM consent_responses WHERE tenant_id = $1 AND consent_id = $2;', [tenantId, id]);
  const query = `DELETE FROM consents WHERE tenant_id = $1 AND id = $2 RETURNING id;`;
  const { rows } = await pgPool.query(query, [tenantId, id]);
  return rows[0] || null;
}

export async function listConsents(tenantId, classId = null) {
  let query = `
    SELECT 
      cs.id, cs.title, cs.description, cs.class_id, cs.event_date, cs.created_at,
      cls.name as class_name, cls.section as class_section,
      COUNT(DISTINCT csr.id)::int as total_responses,
      COUNT(DISTINCT CASE WHEN csr.status = 'approved' THEN csr.id END)::int as approved_count
    FROM consents cs
    LEFT JOIN class cls ON cs.class_id = cls.id AND cls.tenant_id = cs.tenant_id
    LEFT JOIN consent_responses csr ON cs.id = csr.consent_id AND csr.tenant_id = cs.tenant_id
    WHERE cs.tenant_id = $1
  `;
  const values = [tenantId];

  if (classId) {
    query += ` AND cs.class_id = $2`;
    values.push(classId);
  }

  query += ` GROUP BY cs.id, cs.title, cs.description, cs.class_id, cs.event_date, cs.created_at, cls.name, cls.section ORDER BY cs.created_at DESC;`;
  const { rows } = await pgPool.query(query, values);
  return rows.map(r => ({
    ...r,
    class: r.class_id ? {
      id: r.class_id,
      name: r.class_name,
      section: r.class_section
    } : null
  }));
}

export async function createConsent(tenantId, createdBy, data) {
  const query = `
    INSERT INTO consents (
      tenant_id, title, description, class_id, event_date, created_by
    ) VALUES (
      $1, $2, $3, $4::uuid, $5::date, $6::uuid
    )
    RETURNING *;
  `;
  const values = [
    tenantId,
    data.title,
    data.description,
    data.class_id ? data.class_id : null,
    data.event_date ? data.event_date : null,
    createdBy || null
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function getConsentReport(tenantId, consentId) {
  const consentRes = await pgPool.query(
    `SELECT cs.id, cs.title, cs.description, cs.class_id, cs.event_date, cs.created_at,
            cls.name as class_name, cls.section as class_section
     FROM consents cs
     LEFT JOIN class cls ON cs.class_id = cls.id AND cls.tenant_id = cs.tenant_id
     WHERE cs.id = $1 AND cs.tenant_id = $2;`,
    [consentId, tenantId]
  );
  if (consentRes.rows.length === 0) return null;
  const consentRow = consentRes.rows[0];

  const query = `
    SELECT 
      csr.id, csr.status, csr.responded_at,
      u.id as student_id, u.name as student_name, u.admission_number,
      cls.name as class_name, cls.section as class_section
    FROM consent_responses csr
    INNER JOIN "user" u ON csr.student_id = u.id AND u.tenant_id = csr.tenant_id
    INNER JOIN consents cs ON csr.consent_id = cs.id AND cs.tenant_id = csr.tenant_id
    LEFT JOIN class cls ON cs.class_id = cls.id AND cls.tenant_id = csr.tenant_id
    WHERE csr.consent_id = $1 AND csr.tenant_id = $2
    ORDER BY u.name ASC;
  `;
  const { rows } = await pgPool.query(query, [consentId, tenantId]);

  const responses = rows.map(r => ({
    id: r.id,
    status: r.status,
    responded_at: r.responded_at,
    student: {
      id: r.student_id,
      name: r.student_name,
      admission_number: r.admission_number
    },
    student_name: r.student_name,
    admission_number: r.admission_number,
    class_name: r.class_name,
    class_section: r.class_section
  }));

  return {
    consent: {
      ...consentRow,
      class: consentRow.class_id ? {
        id: consentRow.class_id,
        name: consentRow.class_name,
        section: consentRow.class_section
      } : null
    },
    responses
  };
}

export async function submitConsentResponse(tenantId, studentId, consentId, status) {
  const query = `
    INSERT INTO consent_responses (
      tenant_id, student_id, consent_id, status, responded_at
    ) VALUES (
      $1, $2, $3, $4, NOW()
    )
    ON CONFLICT (tenant_id, consent_id, student_id)
    DO UPDATE SET status = EXCLUDED.status, responded_at = NOW()
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [tenantId, studentId, consentId, status]);
  return rows[0];
}

export async function listStudentConsents(tenantId, studentId) {
  // 1. Get student's class_id
  const classRes = await pgPool.query(
    `SELECT class_id FROM class_students WHERE student_id = $1 AND tenant_id = $2 LIMIT 1;`,
    [studentId, tenantId]
  );
  const classId = classRes.rows[0]?.class_id || null;

  // 2. Fetch consents for this class (or class_id IS NULL) joined with consent_responses
  const query = `
    SELECT 
      c.id as consent_id,
      c.title,
      c.description,
      c.event_date,
      c.created_at,
      cr.id as response_id,
      COALESCE(cr.status, 'pending') as status,
      cr.responded_at
    FROM consents c
    LEFT JOIN consent_responses cr 
      ON c.id = cr.consent_id AND cr.student_id = $1 AND cr.tenant_id = c.tenant_id
    WHERE c.tenant_id = $2
      AND ($3::uuid IS NULL OR c.class_id = $3 OR c.class_id IS NULL)
    ORDER BY c.event_date DESC NULLS LAST, c.created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [studentId, tenantId, classId]);

  return rows.map(r => ({
    id: r.response_id || `temp-${r.consent_id}`,
    response_id: r.response_id,
    consent_id: r.consent_id,
    status: r.status,
    responded_at: r.responded_at,
    consent: {
      id: r.consent_id,
      title: r.title,
      description: r.description,
      event_date: r.event_date,
      created_at: r.created_at,
    }
  }));
}

export async function updateStudentConsentStatus(tenantId, studentId, identifier, status) {
  let consentId = null;

  if (typeof identifier === 'string' && identifier.startsWith('temp-')) {
    consentId = identifier.replace('temp-', '');
  } else {
    // Check if identifier is an existing consent_responses.id
    const respRes = await pgPool.query(
      `SELECT consent_id FROM consent_responses WHERE id = $1 AND tenant_id = $2 LIMIT 1;`,
      [identifier, tenantId]
    );
    if (respRes.rows.length) {
      consentId = respRes.rows[0].consent_id;
    } else {
      // Check if identifier is a consent_id directly
      const cRes = await pgPool.query(
        `SELECT id FROM consents WHERE id = $1 AND tenant_id = $2 LIMIT 1;`,
        [identifier, tenantId]
      );
      if (cRes.rows.length) {
        consentId = cRes.rows[0].id;
      }
    }
  }

  if (!consentId) {
    const error = new Error('Consent not found.');
    error.status = 404;
    error.code = 'CONSENT_NOT_FOUND';
    throw error;
  }

  const upsertQuery = `
    INSERT INTO consent_responses (
      tenant_id, student_id, consent_id, status, responded_at
    ) VALUES (
      $1, $2, $3, $4, NOW()
    )
    ON CONFLICT (tenant_id, consent_id, student_id)
    DO UPDATE SET status = EXCLUDED.status, responded_at = NOW()
    RETURNING *;
  `;
  const { rows } = await pgPool.query(upsertQuery, [tenantId, studentId, consentId, status]);
  return rows[0];
}
