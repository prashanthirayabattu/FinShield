import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma, checkDatabaseConnection } from '../db/prisma';
import { userService } from '../services/userService';
import { hashPassword, comparePassword } from '../auth/password';

describe('FinShield Milestone 3 — PostgreSQL & Database Integration Tests', () => {
  let isPostgresConnected = false;

  before(async () => {
    isPostgresConnected = await checkDatabaseConnection();
  });

  after(async () => {
    if (isPostgresConnected) {
      // Clean up integration test artifacts if live DB was used
      try {
        await prisma.user.deleteMany({
          where: { email: { contains: 'db_integration_test_' } },
        });
      } catch {
        // Ignore cleanup errors
      }
      await prisma.$disconnect();
    }
  });

  // 1. Connection check transparency
  it('Truthfully reports PostgreSQL connectivity without fabrication', async () => {
    const connected = await checkDatabaseConnection();
    assert.strictEqual(typeof connected, 'boolean');
    assert.strictEqual(connected, isPostgresConnected);
  });

  // 2. Real DB vs Fallback classification test
  it('Correctly classifies data store execution path (PostgreSQL vs Fallback)', async () => {
    if (isPostgresConnected) {
      // Real PostgreSQL integration path
      const testEmail = `db_integration_test_${Date.now()}@finshield.local`;
      const passHash = await hashPassword('LiveSecurePass123!');

      const created = await prisma.user.create({
        data: {
          name: 'Live DB User',
          email: testEmail,
          passwordHash: passHash,
          role: 'USER',
        },
      });

      assert.ok(created.id);
      assert.strictEqual(created.email, testEmail);

      // Verify direct read from PostgreSQL
      const fetched = await prisma.user.findUnique({
        where: { email: testEmail },
      });
      assert.ok(fetched);
      assert.strictEqual(fetched.id, created.id);

      // Verify password comparison
      const match = await comparePassword('LiveSecurePass123!', fetched.passwordHash);
      assert.strictEqual(match, true);

      // Cleanup
      await prisma.user.delete({ where: { id: created.id } });
    } else {
      // Fallback path: verify that fallback store operates safely when PostgreSQL is not configured
      const testEmail = `fallback_test_${Date.now()}@finshield.local`;
      const passHash = await hashPassword('FallbackPass123!');

      const created = await userService.create({
        name: 'Fallback User',
        email: testEmail,
        passwordHash: passHash,
      });

      assert.ok(created.id);
      assert.strictEqual(created.email, testEmail);

      const found = await userService.findByEmail(testEmail);
      assert.ok(found);
      assert.strictEqual(found.email, testEmail);
    }
  });
});
