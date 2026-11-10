/**
 * Provisions a School SPOC account (public-domain / marketplace portal).
 *
 * Run by hand, one account per school:
 *   node scripts/create_spoc_user.js <tenant-slug> <email> <password> "<Full Name>"
 *
 * Re-running with the same email updates the password and re-activates the account.
 */

import bcrypt from 'bcryptjs';
import { pgPool } from '../src/config/db.js';

async function main() {
  const [slug, email, password, name] = process.argv.slice(2);

  if (!slug || !email || !password) {
    console.error('Usage: node scripts/create_spoc_user.js <tenant-slug> <email> <password> "<Full Name>"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const tenantRes = await pgPool.query(
    'SELECT id, name FROM public.tenants WHERE LOWER(slug) = LOWER($1) LIMIT 1;',
    [slug]
  );
  const tenant = tenantRes.rows[0];
  if (!tenant) {
    console.error(`No tenant found for slug "${slug}".`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const displayName = name || 'School SPOC';

  const existing = await pgPool.query(
    'SELECT id FROM public."user" WHERE tenant_id = $1 AND LOWER(email) = LOWER($2) LIMIT 1;',
    [tenant.id, email]
  );

  if (existing.rows[0]) {
    await pgPool.query(
      `UPDATE public."user"
          SET password_hash = $3, type = 'spoc', status = 'active',
              name = COALESCE(NULLIF($4, ''), name), updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2;`,
      [existing.rows[0].id, tenant.id, passwordHash, displayName]
    );
    console.log(`Updated SPOC account ${email} for ${tenant.name}.`);
  } else {
    await pgPool.query(
      `INSERT INTO public."user" (tenant_id, name, email, password_hash, type, status)
       VALUES ($1, $2, $3, $4, 'spoc', 'active');`,
      [tenant.id, displayName, email, passwordHash]
    );
    console.log(`Created SPOC account ${email} for ${tenant.name}.`);
  }

  await pgPool.end();
}

main().catch(async (error) => {
  console.error('Failed to provision SPOC account:', error.message);
  await pgPool.end().catch(() => {});
  process.exit(1);
});
