/**
 * One-off cleanup: removes seeded/demo marketplace content for the existing
 * school tenants and leaves only real, school-entered data.
 *
 * Run manually: node scripts/cleanup_marketplace_demo_content.js
 */

import { pgPool } from '../src/config/db.js';

// Leads created by the old demo seeder. Real leads captured through the portal are kept.
const SEEDED_LEADS = [
  ['Suresh Kulkarni', '9822334455'],
  ['Pravin Shinde', '9766554433'],
  ['Karan Malhotra', '9811223344'],
  ['Meenakshi Gupta', '9911887766'],
  ['Santosh Gaikwad', '9823998811'],
  ['Nitin Verma', '9810112233']
];

async function cleanup() {
  console.log('\n===============================================================');
  console.log('🧹 CLEANING SEEDED MARKETPLACE CONTENT');
  console.log('===============================================================\n');

  const tenantRes = await pgPool.query(`
    SELECT DISTINCT tenant_id FROM public.marketplace_school_profiles;
  `);
  const tenantIds = tenantRes.rows.map(r => r.tenant_id);

  if (tenantIds.length === 0) {
    console.log('No marketplace profiles found. Nothing to clean.');
    process.exit(0);
  }

  const before = await pgPool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM public.marketplace_reviews WHERE tenant_id = ANY($1::uuid[])) AS reviews,
      (SELECT COUNT(*)::int FROM public.marketplace_press_releases WHERE tenant_id = ANY($1::uuid[]) AND source_circular_id IS NULL) AS seeded_press,
      (SELECT COUNT(*)::int FROM public.marketplace_leads WHERE tenant_id = ANY($1::uuid[])) AS leads;
  `, [tenantIds]);
  console.log('Before:', before.rows[0]);

  await pgPool.query(`
    UPDATE public.marketplace_school_profiles
    SET tagline = NULL,
        about = NULL,
        established_year = NULL,
        min_fee = NULL,
        max_fee = NULL,
        fee_period = NULL,
        grades_offered = NULL,
        facilities = '[]'::jsonb,
        gallery_images = '[]'::jsonb,
        brochure_url = NULL,
        is_featured = FALSE,
        is_verified = FALSE,
        avg_rating = 0,
        review_count = 0,
        admission_status = NULL,
        hero_image_url = NULL,
        student_count_badge = NULL,
        teacher_count_badge = NULL,
        student_teacher_ratio = NULL,
        updated_at = NOW()
    WHERE tenant_id = ANY($1::uuid[]);
  `, [tenantIds]);

  await pgPool.query(
    `DELETE FROM public.marketplace_reviews WHERE tenant_id = ANY($1::uuid[]);`,
    [tenantIds]
  );

  await pgPool.query(
    `DELETE FROM public.marketplace_press_releases
     WHERE tenant_id = ANY($1::uuid[]) AND source_circular_id IS NULL;`,
    [tenantIds]
  );

  for (const [parentName, phone] of SEEDED_LEADS) {
    await pgPool.query(
      `DELETE FROM public.marketplace_leads
       WHERE parent_name = $1 AND REGEXP_REPLACE(COALESCE(phone, ''), '\\D', '', 'g') = $2;`,
      [parentName, phone]
    );
  }

  const after = await pgPool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM public.marketplace_reviews WHERE tenant_id = ANY($1::uuid[])) AS reviews,
      (SELECT COUNT(*)::int FROM public.marketplace_press_releases WHERE tenant_id = ANY($1::uuid[])) AS press,
      (SELECT COUNT(*)::int FROM public.marketplace_leads WHERE tenant_id = ANY($1::uuid[])) AS leads,
      (SELECT COUNT(*)::int FROM public.marketplace_school_profiles WHERE tenant_id = ANY($1::uuid[]) AND (hero_image_url IS NOT NULL OR gallery_images <> '[]'::jsonb)) AS profiles_with_media,
      (SELECT COUNT(*)::int FROM public.marketplace_school_profiles WHERE tenant_id = ANY($1::uuid[]) AND (tagline IS NOT NULL OR about IS NOT NULL OR admission_status IS NOT NULL)) AS profiles_with_demo_copy;
  `, [tenantIds]);
  console.log('After:', after.rows[0]);

  const leftovers = await pgPool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM public.marketplace_school_profiles
        WHERE tenant_id = ANY($1::uuid[])
          AND (hero_image_url ILIKE '%unsplash%'
            OR gallery_images::text ILIKE '%unsplash%'
            OR brochure_url ILIKE '%vis-shirur%'
            OR brochure_url ILIKE '%arcschool%')) AS demo_urls,
      (SELECT COUNT(*)::int FROM public.marketplace_reviews
        WHERE tenant_id = ANY($1::uuid[])
          AND (reviewer_email ILIKE '%techcorp%' OR reviewer_email ILIKE '%noida.org'
            OR reviewer_email ILIKE '%consultant.in' OR reviewer_email ILIKE '%outlook.com'
            OR reviewer_email ILIKE '%yahoo.com' OR reviewer_email ILIKE '%gmail.com')) AS demo_reviews;
  `, [tenantIds]);
  console.log('Leftover demo fingerprints:', leftovers.rows[0]);

  if (after.rows[0].reviews !== 0 || leftovers.rows[0].demo_urls !== 0) {
    throw new Error('Cleanup verification failed — demo content still present.');
  }

  console.log('\n✅ Marketplace demo content removed. Real tenant data preserved.');
  process.exit(0);
}

cleanup().catch(err => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
