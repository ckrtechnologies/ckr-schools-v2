/**
 * CKR Schools v2 - End-to-End Automated Verification for Timetable Portal
 * Tests all Timetable, Teacher Schedule, Quotas & Allotment APIs with multi-tenant isolation.
 */

import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import { pgPool } from '../src/config/db.js';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5006';

async function runTests() {
  console.log('\n===============================================================');
  console.log('🚀 CKR SCHOOLS V2 - E2E COMPREHENSIVE TEST SUITE: TIMETABLE PORTAL');
  console.log('===============================================================\n');

  // 1. Resolve Tenants
  const arcTenantRes = await pgPool.query("SELECT id, slug, name FROM public.tenants WHERE slug = 'arc' LIMIT 1;");
  const arcTenant = arcTenantRes.rows[0];

  const visionTenantRes = await pgPool.query("SELECT id, slug, name FROM public.tenants WHERE slug = 'vision' LIMIT 1;");
  const visionTenant = visionTenantRes.rows[0];

  if (!arcTenant || !visionTenant) {
    throw new Error('Could not find ARC or Vision tenant in database');
  }

  const arcToken = jwt.sign(
    {
      userId: '00000000-0000-0000-0000-000000000001',
      id: '00000000-0000-0000-0000-000000000001',
      sub: '00000000-0000-0000-0000-000000000001',
      email: 'admin@arcschool.in',
      role: 'admin',
      type: 'admin',
      schoolId: arcTenant.id,
      tenantId: arcTenant.id,
      schoolSlug: 'arc'
    },
    config.jwt.accessSecret,
    { expiresIn: '2h' }
  );

  async function request(endpoint, options = {}, token = arcToken, tenantSlug = 'arc') {
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant-slug': tenantSlug,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const contentType = res.headers.get('content-type') || '';
    let body = null;
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    return { status: res.status, body, ok: res.ok };
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Test 1: GET /api/subjects
  console.log('1. Testing GET /api/subjects (Class subjects & assignments)');
  const resSubjects = await request('/api/subjects');
  assert(resSubjects.status === 200, `Status is 200 (got ${resSubjects.status})`);
  assert(resSubjects.body?.success === true, 'Response indicates success: true');
  assert(Array.isArray(resSubjects.body?.data), 'Data is an array of subjects');
  console.log(`   Found ${resSubjects.body?.data?.length || 0} subjects`);

  // Test 2: GET /api/rooms
  console.log('\n2. Testing GET /api/rooms (Campus rooms)');
  const resRooms = await request('/api/rooms');
  assert(resRooms.status === 200, `Status is 200 (got ${resRooms.status})`);
  assert(Array.isArray(resRooms.body?.data || resRooms.body?.rooms), 'Rooms list is returned');

  // Test 3: GET /api/teacher_schedule/teachers
  console.log('\n3. Testing GET /api/teacher_schedule/teachers (Workload stats)');
  const resTeachers = await request('/api/teacher_schedule/teachers');
  assert(resTeachers.status === 200, `Status is 200 (got ${resTeachers.status})`);
  assert(resTeachers.body?.success === true, 'Response success is true');
  assert(Array.isArray(resTeachers.body?.data), 'Teachers data is an array');
  const teachers = resTeachers.body?.data || [];
  console.log(`   Found ${teachers.length} teachers with schedule metrics`);
  let sampleTeacherId = teachers[0]?.id;

  // Test 4: GET /api/teacher_schedule/workload-matrix
  console.log('\n4. Testing GET /api/teacher_schedule/workload-matrix (Full faculty grid)');
  const resWorkload = await request('/api/teacher_schedule/workload-matrix');
  assert(resWorkload.status === 200, `Status is 200 (got ${resWorkload.status})`);
  assert(Array.isArray(resWorkload.body?.data?.matrix), 'Matrix is an array');
  assert(Array.isArray(resWorkload.body?.data?.timeSlots), 'timeSlots array returned');
  assert(Array.isArray(resWorkload.body?.data?.days), 'days array returned');

  // Test 5: GET /api/teacher_schedule/allotment-matrix
  console.log('\n5. Testing GET /api/teacher_schedule/allotment-matrix (Master Class x Subject matrix)');
  const resAllotment = await request('/api/teacher_schedule/allotment-matrix');
  assert(resAllotment.status === 200, `Status is 200 (got ${resAllotment.status})`);
  assert(Array.isArray(resAllotment.body?.data?.classes), 'classes array returned');
  assert(Array.isArray(resAllotment.body?.data?.subjects), 'subjects array returned');
  assert(typeof resAllotment.body?.data?.matrix === 'object', 'matrix mapping returned');

  // Test 6: GET & POST /api/teacher_schedule/subject-quotas
  console.log('\n6. Testing Subject Quotas (GET & POST)');
  const resGetSubQuotas = await request('/api/teacher_schedule/subject-quotas');
  assert(resGetSubQuotas.status === 200, `GET /subject-quotas status is 200 (got ${resGetSubQuotas.status})`);
  assert(resGetSubQuotas.body?.success === true, 'GET /subject-quotas returns success: true');

  const resSaveSubQuotas = await request('/api/teacher_schedule/subject-quotas', {
    method: 'POST',
    body: JSON.stringify({
      classSubjectQuotas: {
        'Mathematics': 6,
        'Science': 5,
        'English': 5
      }
    })
  });
  assert(resSaveSubQuotas.status === 200, `POST /subject-quotas status is 200 (got ${resSaveSubQuotas.status})`);
  assert(resSaveSubQuotas.body?.success === true, 'POST /subject-quotas returns success: true');

  // Test 7: GET & POST /api/teacher_schedule/teacher-quotas
  console.log('\n7. Testing Teacher Quotas (GET & POST)');
  const resGetTeachQuotas = await request('/api/teacher_schedule/teacher-quotas');
  assert(resGetTeachQuotas.status === 200, `GET /teacher-quotas status is 200 (got ${resGetTeachQuotas.status})`);
  assert(resGetTeachQuotas.body?.success === true, 'GET /teacher-quotas returns success: true');

  if (sampleTeacherId) {
    const resSaveTeachQuotas = await request('/api/teacher_schedule/teacher-quotas', {
      method: 'POST',
      body: JSON.stringify({
        teacherId: sampleTeacherId,
        weeklyQuota: 24
      })
    });
    assert(resSaveTeachQuotas.status === 200, `POST /teacher-quotas status is 200 (got ${resSaveTeachQuotas.status})`);
    assert(resSaveTeachQuotas.body?.success === true, 'POST /teacher-quotas returns success: true');
  }

  // Test 8: GET /api/teacher_schedule/:teacherId/routine
  if (sampleTeacherId) {
    console.log(`\n8. Testing GET /api/teacher_schedule/${sampleTeacherId}/routine`);
    const resRoutine = await request(`/api/teacher_schedule/${sampleTeacherId}/routine`);
    assert(resRoutine.status === 200, `Routine status is 200 (got ${resRoutine.status})`);
    assert(resRoutine.body?.success === true, 'Routine returns success: true');
    assert(typeof resRoutine.body?.data?.routine === 'object', 'routine object returned');
    assert(typeof resRoutine.body?.data?.summary === 'object', 'summary object returned');

    // Test 9: GET /api/teacher_schedule/:teacherId/yearly
    console.log(`\n9. Testing GET /api/teacher_schedule/${sampleTeacherId}/yearly`);
    const resYearly = await request(`/api/teacher_schedule/${sampleTeacherId}/yearly`);
    assert(resYearly.status === 200, `Yearly schedule status is 200 (got ${resYearly.status})`);
    assert(resYearly.body?.success === true, 'Yearly schedule returns success: true');
    assert(Array.isArray(resYearly.body?.data?.sessions), 'sessions array returned');
  }

  // Test 10: Timetable Settings (Bell Timings)
  console.log('\n10. Testing Timetable Settings (Bell Timings)');
  const resGetSettings = await request('/api/teacher_schedule/timetable-settings');
  assert(resGetSettings.status === 200, `GET settings status is 200 (got ${resGetSettings.status})`);
  assert(resGetSettings.body?.success === true, 'GET settings success is true');

  const resSaveSettings = await request('/api/teacher_schedule/timetable-settings', {
    method: 'POST',
    body: JSON.stringify({
      academic_year: '2026-2027',
      school_start_time: '08:00 AM',
      period_duration_minutes: 40,
      assembly_duration_minutes: 0,
      recess_after_period: 4,
      recess_duration_minutes: 0,
      lunch_after_period: 6,
      lunch_duration_minutes: 0,
      periods_per_day: 5,
      saturday_periods: 5,
      max_daily_subject_periods: 1
    })
  });
  assert(resSaveSettings.status === 200, `POST settings status is 200 (got ${resSaveSettings.status})`);
  assert(resSaveSettings.body?.success === true, 'POST settings success is true');
  assert(resSaveSettings.body?.data?.assembly_duration_minutes === 0, 'assembly_duration_minutes correctly saved as 0');
  assert(resSaveSettings.body?.data?.recess_duration_minutes === 0, 'recess_duration_minutes correctly saved as 0');
  assert(resSaveSettings.body?.data?.lunch_duration_minutes === 0, 'lunch_duration_minutes correctly saved as 0');

  // Test 11: Free vs Engaged Teachers Roster
  console.log('\n11. Testing Free vs Engaged Teachers Roster');
  const resFree = await request('/api/teacher_schedule/free-teachers?date=2026-11-09');
  assert(resFree.status === 200, `GET free-teachers status is 200 (got ${resFree.status})`);
  assert(resFree.body?.success === true, 'GET free-teachers success is true');
  assert(Array.isArray(resFree.body?.data?.freeTeachers), 'freeTeachers is an array');
  assert(Array.isArray(resFree.body?.data?.engagedTeachers), 'engagedTeachers is an array');
  assert(resFree.body?.data?.summary !== undefined, 'summary object returned');

  // Test 12: Assign Faculty & Quota Allotment
  console.log('\n12. Testing Faculty & Quota Allotment');
  const classesRes = await pgPool.query("SELECT id FROM class WHERE tenant_id = $1 LIMIT 1;", [arcTenant.id]);
  const subjectsResDb = await pgPool.query("SELECT id, name FROM subject WHERE tenant_id = $1 LIMIT 1;", [arcTenant.id]);
  const testClassId = classesRes.rows[0]?.id;
  const testSubjectId = subjectsResDb.rows[0]?.id;
  const testSubjectName = subjectsResDb.rows[0]?.name;

  if (testClassId && testSubjectId && sampleTeacherId) {
    const resAssignAllotment = await request('/api/teacher_schedule/assign-allotment', {
      method: 'POST',
      body: JSON.stringify({
        classId: testClassId,
        subjectId: testSubjectId,
        teacherId: sampleTeacherId,
        quota: 5,
        subjectName: testSubjectName
      })
    });
    assert(resAssignAllotment.status === 200, `POST assign-allotment status is 200 (got ${resAssignAllotment.status})`);
    assert(resAssignAllotment.body?.success === true, 'assign-allotment success is true');
  }

  // Test 13: Daily Proxy Substitution Lifecycle
  console.log('\n13. Testing Daily Proxy Lifecycle');
  let proxyId = null;
  if (testClassId && sampleTeacherId) {
    const resAssignProxy = await request('/api/teacher_schedule/assign-proxy', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-11-09',
        period_index: 2,
        time_slot: '08:50 AM - 09:40 AM',
        class_id: testClassId,
        substitute_teacher_id: sampleTeacherId,
        subject: 'General Science',
        room_number: '102',
        reason: 'Staff leave'
      })
    });
    if (resAssignProxy.status !== 201) {
      console.log('   [DEBUG assign-proxy error]:', resAssignProxy.body);
    }
    assert(resAssignProxy.status === 201, `POST assign-proxy status is 201 (got ${resAssignProxy.status})`);
    assert(resAssignProxy.body?.success === true, 'assign-proxy success is true');
    proxyId = resAssignProxy.body?.data?.id;

    const resListProxies = await request('/api/teacher_schedule/daily-proxies?date=2026-11-09');
    assert(resListProxies.status === 200, `GET daily-proxies status is 200 (got ${resListProxies.status})`);
    assert(resListProxies.body?.success === true, 'GET daily-proxies success is true');
    assert(Array.isArray(resListProxies.body?.data), 'daily-proxies data is an array');

    if (proxyId) {
      const resCancelProxy = await request(`/api/teacher_schedule/cancel-proxy/${proxyId}`, {
        method: 'DELETE'
      });
      assert(resCancelProxy.status === 200, `DELETE cancel-proxy status is 200 (got ${resCancelProxy.status})`);
      assert(resCancelProxy.body?.success === true, 'cancel-proxy success is true');
    }
  }

  // Test 14: Timetable Listing & Class Schedule
  console.log('\n14. Testing Timetable Listing & Filtering');
  const resGetTimetable = await request(`/api/timeTable/getTimeTable${testClassId ? `?classId=${testClassId}` : ''}`);
  assert(resGetTimetable.status === 200, `GET /getTimeTable status is 200 (got ${resGetTimetable.status})`);
  assert(resGetTimetable.body?.success === true, 'GET /getTimeTable returns success: true');
  assert(Array.isArray(resGetTimetable.body?.timeTables || resGetTimetable.body?.data), 'timeTables is an array');

  // Test 15: Period Lifecycle (Add, Update, Delete)
  console.log('\n15. Testing Period CRUD Lifecycle');
  let createdPeriodId = null;
  if (testClassId) {
    const resAddPeriod = await request('/api/timeTable/addPeriod', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          class_id: testClassId,
          date: '2026-11-25',
          day_of_week: 'Wednesday',
          time_slot: '09:00 AM - 09:40 AM',
          subject: 'Computer Science',
          teacher_id: sampleTeacherId || null,
          teacher_name: 'arct1',
          room_number: 'Lab 1',
          is_break: false
        }
      })
    });
    assert(resAddPeriod.status === 201, `POST /addPeriod status is 201 (got ${resAddPeriod.status})`);
    assert(resAddPeriod.body?.success === true, 'POST /addPeriod returns success: true');
    createdPeriodId = resAddPeriod.body?.data?.id;

    if (createdPeriodId) {
      const resUpdatePeriod = await request(`/api/timeTable/updatePeriod/${createdPeriodId}`, {
        method: 'PUT',
        body: JSON.stringify({
          subject: 'Advanced Computer Science',
          room_number: 'Lab 2'
        })
      });
      assert(resUpdatePeriod.status === 200, `PUT /updatePeriod status is 200 (got ${resUpdatePeriod.status})`);
      assert(resUpdatePeriod.body?.success === true, 'PUT /updatePeriod returns success: true');

      const resDeletePeriod = await request(`/api/timeTable/deletePeriod/${createdPeriodId}`, {
        method: 'DELETE'
      });
      assert(resDeletePeriod.status === 200, `DELETE /deletePeriod status is 200 (got ${resDeletePeriod.status})`);
      assert(resDeletePeriod.body?.success === true, 'DELETE /deletePeriod returns success: true');
    }
  }

  // Test 16: Multi-tenant Isolation Test
  console.log('\n16. Testing Multi-tenant Isolation (Vision vs ARC)');
  const visionToken = jwt.sign(
    {
      userId: '00000000-0000-0000-0000-000000000002',
      id: '00000000-0000-0000-0000-000000000002',
      sub: '00000000-0000-0000-0000-000000000002',
      email: 'admin@vision.edu',
      role: 'admin',
      type: 'admin',
      schoolId: visionTenant.id,
      tenantId: visionTenant.id,
      schoolSlug: 'vision'
    },
    config.jwt.accessSecret,
    { expiresIn: '2h' }
  );

  const resVisionTeachers = await request('/api/teacher_schedule/teachers', {}, visionToken, 'vision');
  assert(resVisionTeachers.status === 200, 'Vision tenant request succeeds');
  const visionTeachers = resVisionTeachers.body?.data || [];
  const arcTeacherIds = new Set(teachers.map(t => t.id));
  const hasLeak = visionTeachers.some(vt => arcTeacherIds.has(vt.id));
  assert(!hasLeak, 'Zero cross-tenant leakage between ARC and Vision');

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  await pgPool.end();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

