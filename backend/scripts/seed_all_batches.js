import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pgPool } from '../src/config/db.js';

async function seedAll() {
  const dir = path.resolve('seed_school-json');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f.includes('-schools-batch-')).sort();
  console.log(`\n==========================================================`);
  console.log(`🚀 Starting Full Migration for ${files.length} JSON Batch Files`);
  console.log(`==========================================================\n`);

  const defaultPassword = 'School@123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  let successCount = 0;
  let errorCount = 0;

  for (const f of files) {
    const fullPath = path.join(dir, f);
    const schools = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    console.log(`\n📦 Batch: ${f} (${schools.length} schools)`);

    for (const [index, s] of schools.entries()) {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');

        // 1. Upsert public.tenants
        const tenantQuery = `
          INSERT INTO public.tenants (
            slug, name, affiliation_board, board_affiliation_number, school_code,
            official_email, official_phone, website, address, city, state, pincode,
            logo_url, theme_color, accent_color, motto, plan_tier, is_active, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10, $11, $12,
            $13, $14, $15, $16, 'GROWTH_CAMPUS', TRUE, NOW()
          )
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            affiliation_board = EXCLUDED.affiliation_board,
            official_email = COALESCE(EXCLUDED.official_email, tenants.official_email),
            official_phone = COALESCE(EXCLUDED.official_phone, tenants.official_phone),
            website = COALESCE(EXCLUDED.website, tenants.website),
            address = EXCLUDED.address,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            pincode = EXCLUDED.pincode,
            logo_url = COALESCE(EXCLUDED.logo_url, tenants.logo_url),
            theme_color = COALESCE(EXCLUDED.theme_color, tenants.theme_color),
            accent_color = COALESCE(EXCLUDED.accent_color, tenants.accent_color),
            motto = COALESCE(EXCLUDED.motto, tenants.motto),
            updated_at = NOW()
          RETURNING id, slug, name;
        `;

        const tenantRes = await client.query(tenantQuery, [
          s.slug.toLowerCase().trim(),
          s.name.trim(),
          s.affiliation_board || 'CBSE',
          s.board_affiliation_number || null,
          s.school_code || null,
          s.official_email || `info@${s.slug}.schoolkarma.com`,
          s.official_phone || '9876543210',
          s.website || null,
          s.address || s.city,
          s.city || 'Delhi',
          s.state || 'Delhi',
          s.pincode || '110001',
          s.logo_url || null,
          s.theme_color || '#064e3b',
          s.accent_color || '#059669',
          s.motto || 'Excellence in Education'
        ]);

        const tenant = tenantRes.rows[0];
        const tenantId = tenant.id;

        // 2. Upsert public.marketplace_school_profiles
        // IMPORTANT: Honest reviews only! avg_rating is null or derived from real reviews
        const profileQuery = `
          INSERT INTO public.marketplace_school_profiles (
            tenant_id, tagline, about, established_year, min_fee, max_fee, fee_period,
            grades_offered, facilities, gallery_images, hero_image_url,
            student_count_badge, teacher_count_badge, student_teacher_ratio,
            is_featured, is_verified, is_published, avg_rating, review_count, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9::jsonb, $10::jsonb, $11,
            $12, $13, $14,
            $15, TRUE, TRUE, $16, $17, NOW()
          )
          ON CONFLICT (tenant_id) DO UPDATE SET
            tagline = EXCLUDED.tagline,
            about = EXCLUDED.about,
            established_year = EXCLUDED.established_year,
            min_fee = EXCLUDED.min_fee,
            max_fee = EXCLUDED.max_fee,
            fee_period = EXCLUDED.fee_period,
            grades_offered = EXCLUDED.grades_offered,
            facilities = EXCLUDED.facilities,
            gallery_images = EXCLUDED.gallery_images,
            hero_image_url = COALESCE(EXCLUDED.hero_image_url, marketplace_school_profiles.hero_image_url),
            student_count_badge = EXCLUDED.student_count_badge,
            teacher_count_badge = EXCLUDED.teacher_count_badge,
            student_teacher_ratio = EXCLUDED.student_teacher_ratio,
            is_verified = TRUE,
            is_published = TRUE,
            updated_at = NOW();
        `;

        await client.query(profileQuery, [
          tenantId,
          s.tagline || `${s.name} - Premier Learning Campus`,
          s.about || `${s.name} provides comprehensive education with modern infrastructure.`,
          s.established_year || 2000,
          null, // Sensitive info: min_fee null until SPOC approves disclosure
          null, // Sensitive info: max_fee null until SPOC approves disclosure
          s.fee_period || 'ANNUAL',
          s.grades_offered || 'Nursery to XII',
          JSON.stringify(s.facilities || ['Smart Classrooms', 'Science Labs', 'Library', 'Sports']),
          JSON.stringify(s.gallery_images || []),
          s.hero_image_url || null,
          s.student_count_badge || '1,500+ Students',
          s.teacher_count_badge || '90+ Faculty',
          s.student_teacher_ratio || '18:1',
          false,
          null, // avg_rating (honest: 0 or null until real parents review)
          0     // review_count (honest)
        ]);

        // 3. Upsert gallery images into public.school_gallery
        if (Array.isArray(s.gallery_images) && s.gallery_images.length > 0) {
          for (const [gIdx, g] of s.gallery_images.entries()) {
            await client.query(`
              INSERT INTO public.school_gallery (
                tenant_id, image_url, title, description, media_type, created_at
              ) VALUES ($1, $2, $3, $4, 'image', NOW())
              ON CONFLICT DO NOTHING;
            `, [
              tenantId,
              g.url,
              g.title || `Campus View ${gIdx + 1}`,
              g.category || 'Campus'
            ]);
          }
        }

        // 4. SPOC User
        const spocEmail = `spoc@${s.slug}.schoolkarma.com`;
        await client.query(`
          INSERT INTO public."user" (
            tenant_id, name, email, phone, password_hash, type, status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, 'spoc', 'active', NOW(), NOW()
          )
          ON CONFLICT DO NOTHING;
        `, [
          tenantId,
          `${s.name} SPOC`,
          spocEmail,
          s.official_phone || '9876543210',
          passwordHash
        ]);

        // 5. Admin User
        const adminEmail = `admin@${s.slug}.schoolkarma.com`;
        await client.query(`
          INSERT INTO public."user" (
            tenant_id, name, email, phone, password_hash, type, status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, 'admin', 'active', NOW(), NOW()
          )
          ON CONFLICT DO NOTHING;
        `, [
          tenantId,
          `${s.name} Principal`,
          adminEmail,
          s.official_phone || '9876543210',
          passwordHash
        ]);

        await client.query('COMMIT');
        successCount++;
        process.stdout.write(`   ✓ [${index + 1}/${schools.length}] ${s.name}\n`);
      } catch (err) {
        await client.query('ROLLBACK');
        errorCount++;
        console.error(`   ✗ [${index + 1}/${schools.length}] ${s.name}: ${err.message}`);
      } finally {
        client.release();
      }
    }
  }

  // 6. Recalculate true honest ratings for all profiles based on real approved reviews
  console.log('\nRecalculating verified user reviews...');
  await pgPool.query(`
    UPDATE public.marketplace_school_profiles p
    SET 
      avg_rating = COALESCE(
        (SELECT ROUND(AVG(overall_rating), 2) FROM public.marketplace_reviews r WHERE r.tenant_id = p.tenant_id AND r.is_approved = TRUE),
        0.00
      ),
      review_count = COALESCE(
        (SELECT COUNT(*)::int FROM public.marketplace_reviews r WHERE r.tenant_id = p.tenant_id AND r.is_approved = TRUE),
        0
      );
  `);

  console.log(`\n==========================================================`);
  console.log(`🎉 MIGRATION FINISHED!`);
  console.log(`   Successful: ${successCount} campuses`);
  console.log(`   Errors:     ${errorCount}`);
  console.log(`==========================================================\n`);

  process.exit(0);
}

seedAll();
