import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../app';
import { prisma, checkDatabaseConnection } from '../db/prisma';
import { userService } from '../services/userService';
import { comparePassword } from '../auth/password';
import { AUTH_COOKIE_NAME } from '../auth/jwt';

describe('FinShield Milestone 4 — Real Neon PostgreSQL Authentication Verification Suite', () => {
  let isPostgresConnected = false;
  const testEmail = `db_verified_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@finshield.test`;
  const testPassword = 'NeonDbSecurePassword2026!';
  const testName = 'Neon Verified User';
  let registeredUserId: string = '';
  let authCookieHeader: string = '';

  before(async () => {
    isPostgresConnected = await checkDatabaseConnection();
    assert.strictEqual(
      isPostgresConnected,
      true,
      'PostgreSQL must be connected for live authentication verification'
    );
  });

  after(async () => {
    if (isPostgresConnected && testEmail) {
      try {
        await prisma.user.deleteMany({
          where: { email: testEmail },
        });
      } catch {
        // Cleanup safety
      }
      await prisma.$disconnect();
    }
  });

  // 1. Data Store Classification
  it('Phase 4: Confirms active data-store path is REAL_POSTGRESQL', async () => {
    const activeStore = await userService.getActiveStore();
    assert.strictEqual(
      activeStore,
      'REAL_POSTGRESQL',
      'Data store path must be REAL_POSTGRESQL, not IN_MEMORY_FALLBACK'
    );
  });

  // 2. Schema Structure Verification
  it('Phase 3: Verifies Neon PostgreSQL schema, tables, enum, and indexes exist', async () => {
    // 2a. Table check in public schema
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users';
    `;
    assert.strictEqual(tables.length, 1, 'Table "users" must exist in Neon PostgreSQL public schema');

    // 2b. Enum check
    const enums = await prisma.$queryRaw<Array<{ typname: string }>>`
      SELECT typname 
      FROM pg_type 
      WHERE typname = 'Role';
    `;
    assert.strictEqual(enums.length, 1, 'Enum "Role" must exist in pg_type');

    // 2c. Index check
    const indexes = await prisma.$queryRaw<Array<{ indexname: string; indexdef: string }>>`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'users';
    `;
    const hasUniqueEmail = indexes.some(
      (idx) => idx.indexname === 'users_email_key' || idx.indexdef.includes('UNIQUE')
    );
    const hasEmailIdx = indexes.some((idx) => idx.indexname === 'users_email_idx');

    assert.strictEqual(hasUniqueEmail, true, 'Unique constraint "users_email_key" must be verified');
    assert.strictEqual(hasEmailIdx, true, 'Secondary index "users_email_idx" must be verified');
  });

  // 3. TEST A — Registration & Real Database Persistence
  it('TEST A: Registers user via API and verifies physical persistence in Neon PostgreSQL', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: testName,
      email: testEmail,
      password: testPassword,
    });

    assert.strictEqual(res.status, 201, 'Registration API must return HTTP 201');
    assert.ok(res.body.user, 'API response must return safe user profile');
    assert.strictEqual(res.body.user.name, testName);
    assert.strictEqual(res.body.user.email, testEmail);
    assert.strictEqual(res.body.user.role, 'USER');
    assert.strictEqual(res.body.user.passwordHash, undefined, 'passwordHash must NEVER leak to client');

    registeredUserId = res.body.user.id;
    assert.ok(registeredUserId, 'User ID must be generated');

    // DIRECT DATABASE VERIFICATION: Query Neon PostgreSQL directly using Prisma
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    assert.ok(dbUser, 'DIRECT DB CHECK: User row must exist in Neon PostgreSQL users table');
    assert.strictEqual(dbUser.id, registeredUserId, 'PostgreSQL user ID must match API user ID');
    assert.strictEqual(dbUser.email, testEmail);
    assert.strictEqual(dbUser.role, 'USER');
    assert.ok(dbUser.passwordHash, 'PostgreSQL must store passwordHash');
    assert.ok(
      dbUser.passwordHash.startsWith('$2a$') || dbUser.passwordHash.startsWith('$2b$'),
      'Stored password must be a valid bcrypt hash'
    );
    assert.ok(dbUser.createdAt instanceof Date, 'PostgreSQL createdAt timestamp must be populated');
    assert.ok(dbUser.updatedAt instanceof Date, 'PostgreSQL updatedAt timestamp must be populated');

    // Verify hash matches plaintext password
    const passwordMatches = await comparePassword(testPassword, dbUser.passwordHash);
    assert.strictEqual(passwordMatches, true, 'Stored bcrypt hash must verify against plaintext password');
  });

  // 4. TEST B — Duplicate Registration & PostgreSQL Unique Constraint
  it('TEST B: Exercises PostgreSQL unique constraint (users_email_key) on duplicate registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Duplicate Attempt',
      email: testEmail,
      password: 'AnotherPassword123!',
    });

    assert.strictEqual(res.status, 409, 'Duplicate registration must return HTTP 409 Conflict');
    assert.strictEqual(res.body.error, 'An account with this email address already exists');

    // Direct DB check: confirm no duplicate row was created in Neon PostgreSQL
    const matchingUsers = await prisma.user.findMany({
      where: { email: testEmail },
    });
    assert.strictEqual(
      matchingUsers.length,
      1,
      'Neon PostgreSQL must contain exactly 1 row for the test email'
    );
  });

  // 5. TEST C — Login Against Neon PostgreSQL
  it('TEST C: Authenticates credentials read from Neon PostgreSQL and sets HttpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    assert.strictEqual(res.status, 200, 'Login must return HTTP 200');
    assert.ok(res.body.user);
    assert.strictEqual(res.body.user.email, testEmail);
    assert.strictEqual(res.body.user.passwordHash, undefined);

    // Extract HttpOnly session cookie
    const cookies = res.headers['set-cookie'];
    assert.ok(Array.isArray(cookies), 'Login response must set cookies');
    const authCookie = cookies.find((c: string) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    assert.ok(authCookie, 'finshield_session cookie must be set');
    assert.ok(authCookie.includes('HttpOnly'), 'Cookie must have HttpOnly flag');

    authCookieHeader = authCookie.split(';')[0];
  });

  // 6. TEST D — /me Profile from Authenticated PostgreSQL User
  it('TEST D: GET /api/auth/me returns identity derived from Neon PostgreSQL record', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookieHeader);

    assert.strictEqual(res.status, 200, '/me must return HTTP 200');
    assert.ok(res.body.user);
    assert.strictEqual(res.body.user.id, registeredUserId);
    assert.strictEqual(res.body.user.email, testEmail);
    assert.strictEqual(res.body.user.role, 'USER');
    assert.strictEqual(res.body.user.passwordHash, undefined, 'passwordHash must never be returned');
  });

  // 7. TEST E — Logout Clears Authentication Cookie
  it('TEST E: POST /api/auth/logout clears auth cookie and invalidates session access', async () => {
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookieHeader);

    assert.strictEqual(logoutRes.status, 200, 'Logout must return HTTP 200');

    const cookies = logoutRes.headers['set-cookie'];
    assert.ok(Array.isArray(cookies));
    const clearedCookie = cookies.find((c: string) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    assert.ok(clearedCookie, 'Logout must issue clear-cookie header');
    assert.ok(
      clearedCookie.includes('Expires=') || clearedCookie.includes('Max-Age=0'),
      'Cleared cookie must expire immediately'
    );

    // Subsequent access without cookie is rejected
    const unauthRes = await request(app).get('/api/auth/me');
    assert.strictEqual(unauthRes.status, 401, 'Access after logout must return 401 Unauthorized');
  });

  // 8. TEST F — RBAC Role Enforcement
  it('TEST F: Standard USER account is strictly blocked from ADMIN routes with 403 Forbidden', async () => {
    // Re-authenticate test user to get active session
    const loginRes = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });
    const cookies = loginRes.headers['set-cookie'];
    const cookieList = Array.isArray(cookies) ? cookies : typeof cookies === 'string' ? [cookies] : [];
    const activeCookie = cookieList.find((c: string) => c.startsWith(`${AUTH_COOKIE_NAME}=`))?.split(';')[0];

    // Attempt access to admin endpoint
    const rbacRes = await request(app)
      .get('/api/auth/admin-only')
      .set('Cookie', activeCookie || '');

    assert.strictEqual(rbacRes.status, 403, 'USER account must receive 403 on admin-only route');
    assert.strictEqual(rbacRes.body.error, 'Forbidden: insufficient role privileges');
  });

  // 9. TEST G — Direct Database Persistence & Cleanup Verification
  it('TEST G: Direct Prisma queries verify presence before cleanup and absence after cleanup', async () => {
    // Confirm presence before cleanup
    const beforeCleanup = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    assert.ok(beforeCleanup, 'User must exist in Neon PostgreSQL before cleanup');

    // Execute deletion
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    // Confirm absence after cleanup
    const afterCleanup = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    assert.strictEqual(afterCleanup, null, 'User must be completely removed from Neon PostgreSQL after cleanup');
  });
});
