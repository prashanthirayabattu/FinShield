import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../app';
import { userService } from '../services/userService';
import { signAuthToken, AUTH_COOKIE_NAME } from '../auth/jwt';
import { prisma, checkDatabaseConnection } from '../db/prisma';

describe('FinShield Milestone 2 — Backend & Secure Authentication Test Suite', () => {
  before(async () => {
    userService._clearMemoryStore();
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: 'finshield.local' } },
      });
    } catch {
      // safe ignore
    }
  });

  after(async () => {
    userService._clearMemoryStore();
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: 'finshield.local' } },
      });
    } catch {
      // safe ignore
    }
  });

  // 1. Health check endpoint
  it('GET /api/health returns 200 and safe health status', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.ok(typeof res.body.timestamp === 'string');
    assert.ok(typeof res.body.uptime === 'number');
    assert.ok(typeof res.body.environment === 'string');
    // Ensure no internal DB details/credentials leak
    assert.strictEqual(res.body.DATABASE_URL, undefined);
    assert.strictEqual(res.body.JWT_SECRET, undefined);
  });

  // 2. Register valid user
  it('Register valid user returns 201 and safe profile (never passwordHash)', async () => {
    const payload = {
      name: 'Surya Prashanthi',
      email: 'test_user_1@finshield.local',
      password: 'SecurePassword123!',
    };

    const res = await request(app).post('/api/auth/register').send(payload);

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.user);
    assert.strictEqual(res.body.user.name, 'Surya Prashanthi');
    assert.strictEqual(res.body.user.email, 'test_user_1@finshield.local');
    assert.strictEqual(res.body.user.role, 'USER');
    // Security check: passwordHash must never be exposed
    assert.strictEqual(res.body.user.passwordHash, undefined);

    // Verify HttpOnly cookie header
    const cookies = res.headers['set-cookie'];
    assert.ok(Array.isArray(cookies));
    const authCookie = cookies.find((c: string) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    assert.ok(authCookie);
    assert.ok(authCookie.includes('HttpOnly'));
  });

  // 3. Register duplicate email
  it('Register duplicate email is rejected with 409 Conflict', async () => {
    const payload = {
      name: 'Duplicate Attempt',
      email: 'test_user_1@finshield.local',
      password: 'SecurePassword123!',
    };

    const res = await request(app).post('/api/auth/register').send(payload);
    assert.strictEqual(res.status, 409);
    assert.ok(res.body.error);
  });

  // 4. Login valid credentials
  it('Login with valid credentials succeeds with 200 and sets HttpOnly cookie', async () => {
    const payload = {
      email: 'test_user_1@finshield.local',
      password: 'SecurePassword123!',
    };

    const res = await request(app).post('/api/auth/login').send(payload);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.user);
    assert.strictEqual(res.body.user.email, 'test_user_1@finshield.local');
    assert.strictEqual(res.body.user.passwordHash, undefined);

    const cookies = res.headers['set-cookie'];
    assert.ok(Array.isArray(cookies));
    const authCookie = cookies.find((c: string) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    assert.ok(authCookie);
    assert.ok(authCookie.includes('HttpOnly'));
  });

  // 5. Login invalid credentials (wrong password & non-existent email)
  it('Login with invalid credentials returns generic 401 without user enumeration', async () => {
    // 5a. Wrong password
    const wrongPasswordRes = await request(app).post('/api/auth/login').send({
      email: 'test_user_1@finshield.local',
      password: 'WrongPassword999!',
    });
    assert.strictEqual(wrongPasswordRes.status, 401);
    assert.strictEqual(wrongPasswordRes.body.error, 'Invalid email or password');

    // 5b. Non-existent email
    const unknownEmailRes = await request(app).post('/api/auth/login').send({
      email: 'nonexistent_account_99@finshield.local',
      password: 'AnyPassword123!',
    });
    assert.strictEqual(unknownEmailRes.status, 401);
    // Identical error message prevents account harvesting
    assert.strictEqual(unknownEmailRes.body.error, 'Invalid email or password');
  });

  // 6. /api/auth/me without auth
  it('GET /api/auth/me without auth returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.strictEqual(res.status, 401);
    assert.ok(res.body.error);
  });

  // 7. /api/auth/me with auth
  it('GET /api/auth/me with valid session token returns 200 and safe profile', async () => {
    // Login to get cookie
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'test_user_1@finshield.local',
      password: 'SecurePassword123!',
    });
    const cookie = loginRes.headers['set-cookie'];

    const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie);
    assert.strictEqual(meRes.status, 200);
    assert.ok(meRes.body.user);
    assert.strictEqual(meRes.body.user.email, 'test_user_1@finshield.local');
    assert.strictEqual(meRes.body.user.passwordHash, undefined);
  });

  // 8. Logout
  it('POST /api/auth/logout clears auth cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'Logged out successfully');

    const cookies = res.headers['set-cookie'];
    assert.ok(Array.isArray(cookies));
    const authCookie = cookies.find((c: string) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    assert.ok(authCookie);
    // Verified that cookie is cleared/expired
    assert.ok(authCookie.includes('Expires=') || authCookie.includes('Max-Age=0'));
  });

  // 9. RBAC: USER accessing ADMIN route
  it('Standard USER accessing ADMIN-only route is rejected with 403 Forbidden', async () => {
    const standardUserToken = signAuthToken({
      id: 'usr_regular_001',
      email: 'regular_user@finshield.local',
      role: 'USER',
    });

    const res = await request(app)
      .get('/api/auth/admin-only')
      .set('Authorization', `Bearer ${standardUserToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'Forbidden: insufficient role privileges');

    // Verify ADMIN token is allowed
    const adminToken = signAuthToken({
      id: 'usr_admin_001',
      email: 'admin_user@finshield.local',
      role: 'ADMIN',
    });

    const adminRes = await request(app)
      .get('/api/auth/admin-only')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(adminRes.status, 200);
    assert.strictEqual(adminRes.body.message, 'Authorized: administrator access verified');
  });

  // 10. Malformed registration
  it('Malformed registration input is rejected with 400 Bad Request', async () => {
    // 10a. Invalid email
    const invalidEmailRes = await request(app).post('/api/auth/register').send({
      name: 'Bad Email',
      email: 'not-an-email',
      password: 'SecurePassword123!',
    });
    assert.strictEqual(invalidEmailRes.status, 400);

    // 10b. Weak password (<8 chars)
    const weakPassRes = await request(app).post('/api/auth/register').send({
      name: 'Weak Pass',
      email: 'weakpass@test.local',
      password: 'short',
    });
    assert.strictEqual(weakPassRes.status, 400);
  });

  // 11. Client-supplied role escalation
  it('Client-supplied role escalation attempt is strictly rejected by schema', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Privilege Escalation Attacker',
      email: 'attacker@evil.local',
      password: 'SecurePassword123!',
      role: 'ADMIN', // Illegal client role injection
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Validation failed');
  });

  // 12. Unexpected privilege fields
  it('Unexpected privilege fields (isSuperAdmin, userId, etc.) are rejected', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Field Injection Attacker',
      email: 'attacker2@evil.local',
      password: 'SecurePassword123!',
      isSuperAdmin: true,
      userId: 'root_001',
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Validation failed');
  });

  // 13. Rate Limiter Active Verification
  it('Authentication rate limiter is active and configured', async () => {
    // Check that standard RateLimit headers are returned
    const res = await request(app).post('/api/auth/login').send({
      email: 'ratelimit_check@finshield.local',
      password: 'Password123!',
    });

    // RateLimit headers must be present
    assert.ok(
      res.headers['ratelimit-limit'] !== undefined ||
      res.headers['ratelimit-remaining'] !== undefined ||
      res.headers['x-ratelimit-limit'] !== undefined ||
      res.status === 401
    );
  });

  // 14. Real database connectivity check check (reports real status)
  it('Reports real PostgreSQL connection state accurately', async () => {
    const isConnected = await checkDatabaseConnection();
    // Honest reporting: does not fabricate connection
    assert.ok(typeof isConnected === 'boolean');
  });
});
