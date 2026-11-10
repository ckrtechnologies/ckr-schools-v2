/**
 * CKR Schools v2 - Automated Verification for Marketplace & Super Admin Leads API
 */

import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import { pgPool } from '../src/config/db.js';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5006';

async function runVerification() {
  console.log('\n===============================================================');
  console.log('🧪 VERIFYING MARKETPLACE & SUPER ADMIN LEADS API SUITE');
  console.log('===============================================================\n');

  // Super Admin Auth Token
  const superAdminToken = jwt.sign(
    {
      userId: '00000000-0000-0000-0000-000000000000',
      id: '00000000-0000-0000-0000-000000000000',
      sub: '00000000-0000-0000-0000-000000000000',
      email: 'superadmin@ckrschools.in',
      role: 'super_admin',
      type: 'super_admin'
    },
    config.jwt.accessSecret,
    { expiresIn: '1h' }
  );

  let passed = 0;
  let failed = 0;

  async function testStep(name, fn) {
    try {
      process.stdout.write(`⏳ ${name}... `);
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err) {
      console.log('❌ FAIL');
      console.error('   Error:', err.message);
      failed++;
    }
  }

  // 1. GET /api/marketplace/schools
  await testStep('GET /api/marketplace/schools returns schools list with badges', async () => {
    const res = await fetch(`${BASE_URL}/api/marketplace/schools`);
    const json = await res.json();
    if (res.status !== 200 || !json.success || !Array.isArray(json.data) || json.data.length < 2) {
      throw new Error(`Invalid response: status=${res.status}, count=${json.data?.length}`);
    }
    const vision = json.data.find(s => s.slug === 'vision');
    if (!vision.admission_status || !vision.student_count_badge) {
      throw new Error('Missing admission_status or student_count_badge');
    }
  });

  // 2. GET /api/marketplace/schools/vision
  await testStep('GET /api/marketplace/schools/vision returns profile and details', async () => {
    const res = await fetch(`${BASE_URL}/api/marketplace/schools/vision`);
    const json = await res.json();
    if (res.status !== 200 || !json.success || json.data.slug !== 'vision') {
      throw new Error(`Failed to fetch Vision school details: status=${res.status}`);
    }
    if (!json.data.facilities || !json.data.gallery_images) {
      throw new Error('Facilities or gallery_images missing');
    }
  });

  // 3. POST /api/marketplace/schools/vision/enquiry (Insert into marketplace_leads)
  let enquiryLeadId = null;
  await testStep('POST /api/marketplace/schools/vision/enquiry creates centralized lead', async () => {
    const payload = {
      name: 'Advik Deshmukh',
      parent_name: 'Mahesh Deshmukh',
      phone: '9822998877',
      email: 'mahesh.deshmukh@gmail.com',
      grade: 'Grade 5',
      academic_year: '2026-2027',
      message: 'Looking for admission in Grade 5 with Shirur bus stop pickup'
    };
    const res = await fetch(`${BASE_URL}/api/marketplace/schools/vision/enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (res.status !== 201 || !json.success || !json.data.id) {
      throw new Error(`Enquiry creation failed: ${JSON.stringify(json)}`);
    }
    enquiryLeadId = json.data.id;
    if (json.data.lead_type !== 'enquiry') {
      throw new Error(`Unexpected lead_type: ${json.data.lead_type}`);
    }
  });

  // 4. POST /api/marketplace/schools/arc/brochure (Brochure download lead)
  await testStep('POST /api/marketplace/schools/arc/brochure creates brochure download lead', async () => {
    const payload = {
      parent_name: 'Shalini Saxena',
      phone: '9811554433',
      email: 'shalini.saxena@gmail.com',
      grade: 'Grade 8'
    };
    const res = await fetch(`${BASE_URL}/api/marketplace/schools/arc/brochure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (res.status !== 201 || !json.success || json.data.lead_type !== 'brochure_download') {
      throw new Error(`Brochure lead failed: ${JSON.stringify(json)}`);
    }
  });

  // 5. POST /api/marketplace/multi-enquiry (Multi-School Joint Enquiry)
  await testStep('POST /api/marketplace/multi-enquiry creates leads across both schools', async () => {
    const payload = {
      school_slugs: ['vision', 'arc'],
      student_name: 'Anvi Aggarwal',
      parent_name: 'Gaurav Aggarwal',
      phone: '9988776655',
      email: 'gaurav.aggarwal@gmail.com',
      grade: 'Grade 2',
      message: 'Comparing Vision and ARC for Grade 2 CBSE admission'
    };
    const res = await fetch(`${BASE_URL}/api/marketplace/multi-enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (res.status !== 201 || !json.success || !Array.isArray(json.data) || json.data.length !== 2) {
      throw new Error(`Multi-enquiry failed: ${JSON.stringify(json)}`);
    }
  });

  // 6. GET /api/marketplace/schools/vision/reviews
  let reviewIdToUpvote = null;
  await testStep('GET /api/marketplace/schools/vision/reviews lists reviews with 5-axis ratings', async () => {
    const res = await fetch(`${BASE_URL}/api/marketplace/schools/vision/reviews`);
    const json = await res.json();
    if (res.status !== 200 || !json.success || json.data.length === 0) {
      throw new Error(`Reviews fetch failed: ${JSON.stringify(json)}`);
    }
    reviewIdToUpvote = json.data[0].id;
    if (json.data[0].overall_rating === undefined || json.data[0].helpful_count === undefined) {
      throw new Error('Missing review ratings or helpful_count');
    }
  });

  // 7. POST /api/marketplace/reviews/:id/helpful (Upvote)
  await testStep('POST /api/marketplace/reviews/:id/helpful increments helpful count', async () => {
    const res = await fetch(`${BASE_URL}/api/marketplace/reviews/${reviewIdToUpvote}/helpful`, {
      method: 'POST'
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success || typeof json.data.helpful_count !== 'number') {
      throw new Error(`Upvote failed: ${JSON.stringify(json)}`);
    }
  });

  // 8. GET /api/marketplace/schools/vision/press-releases
  await testStep('GET /api/marketplace/schools/vision/press-releases lists public circulars/news', async () => {
    const res = await fetch(`${BASE_URL}/api/marketplace/schools/vision/press-releases`);
    const json = await res.json();
    if (res.status !== 200 || !json.success || json.data.length === 0) {
      throw new Error(`Press releases failed: ${JSON.stringify(json)}`);
    }
    if (!json.data[0].content_html || !json.data[0].category) {
      throw new Error('Missing content_html or category in press release');
    }
  });

  // 9. GET /api/superadmin/marketplace/leads (Super Admin Lead Desk)
  await testStep('GET /api/superadmin/marketplace/leads returns leads with pipeline stats', async () => {
    const res = await fetch(`${BASE_URL}/api/superadmin/marketplace/leads`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success || !Array.isArray(json.data) || !json.stats) {
      throw new Error(`Super admin leads failed: ${JSON.stringify(json)}`);
    }
    if (json.stats.total_leads < 8) {
      throw new Error(`Expected at least 8 leads, got ${json.stats.total_leads}`);
    }
  });

  // 10. PATCH /api/superadmin/marketplace/leads/:id (Update lead status and fee)
  await testStep('PATCH /api/superadmin/marketplace/leads/:id updates status and monetization fee', async () => {
    const res = await fetch(`${BASE_URL}/api/superadmin/marketplace/leads/${enquiryLeadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        status: 'qualified',
        monetization_fee_paise: 60000,
        admin_notes: 'Verified phone with parent. Sent notification to school admissions desk.'
      })
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success || json.data.status !== 'qualified') {
      throw new Error(`Lead update failed: ${JSON.stringify(json)}`);
    }
  });

  // 11. GET /api/superadmin/marketplace/leads/export/:tenantId (Generate school lead dossier)
  await testStep('GET /api/superadmin/marketplace/leads/export/:tenantId generates pitch dossier', async () => {
    const visionTenantRes = await pgPool.query("SELECT id FROM public.tenants WHERE slug = 'vision' LIMIT 1;");
    const visionId = visionTenantRes.rows[0].id;

    const res = await fetch(`${BASE_URL}/api/superadmin/marketplace/leads/export/${visionId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success || !json.data.dossier || !json.data.dossier.summary) {
      throw new Error(`Dossier export failed: ${JSON.stringify(json)}`);
    }
  });

  console.log('\n===============================================================');
  console.log(`🏁 TEST COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

