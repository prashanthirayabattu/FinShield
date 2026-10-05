import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../app';
import { prisma, checkDatabaseConnection } from '../db/prisma';
import { signAuthToken, AUTH_COOKIE_NAME } from '../auth/jwt';
import { userService } from '../services/userService';
import { hashPassword } from '../auth/password';

describe('FinShield Milestone 5 — Real Neon PostgreSQL Transaction CRUD & IDOR/BOLA Defense Suite', () => {
  let isPostgresConnected = false;

  // Test User A details
  const userAEmail = `idor_user_a_${Date.now()}@finshield.test`;
  let userAId: string = '';
  let userACookie: string = '';

  // Test User B details
  const userBEmail = `idor_user_b_${Date.now()}@finshield.test`;
  let userBId: string = '';
  let userBCookie: string = '';

  // Transaction IDs
  let transactionAId: string = '';
  let transactionBId: string = '';

  before(async () => {
    isPostgresConnected = await checkDatabaseConnection();
    assert.strictEqual(
      isPostgresConnected,
      true,
      'Neon PostgreSQL must be live and connected'
    );

    // Create User A in Neon PostgreSQL
    const passHashA = await hashPassword('UserAPassword123!');
    const userA = await prisma.user.create({
      data: {
        name: 'User A (Tenant Alpha)',
        email: userAEmail,
        passwordHash: passHashA,
        role: 'USER',
      },
    });
    userAId = userA.id;
    const tokenA = signAuthToken({ id: userA.id, email: userA.email, role: userA.role });
    userACookie = `${AUTH_COOKIE_NAME}=${tokenA}`;

    // Create User B in Neon PostgreSQL
    const passHashB = await hashPassword('UserBPassword123!');
    const userB = await prisma.user.create({
      data: {
        name: 'User B (Tenant Beta)',
        email: userBEmail,
        passwordHash: passHashB,
        role: 'USER',
      },
    });
    userBId = userB.id;
    const tokenB = signAuthToken({ id: userB.id, email: userB.email, role: userB.role });
    userBCookie = `${AUTH_COOKIE_NAME}=${tokenB}`;
  });

  after(async () => {
    // Teardown: Clean up test transactions and users from Neon PostgreSQL
    try {
      if (userAId || userBId) {
        await prisma.transaction.deleteMany({
          where: { userId: { in: [userAId, userBId] } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: [userAId, userBId] } },
        });
      }
    } catch {
      // Safe cleanup
    }
    await prisma.$disconnect();
  });

  // 1. Transaction Creation & Database Ownership Verification
  it('User A creates Transaction A and User B creates Transaction B in Neon PostgreSQL', async () => {
    // User A creates Transaction A
    const resA = await request(app)
      .post('/api/transactions')
      .set('Cookie', userACookie)
      .send({
        type: 'INCOME',
        amount: 5000.0,
        category: 'Salary',
        description: 'Tech Consulting Salary',
        payee: 'Acme Corp',
        transactionDate: '2026-10-05T10:00:00.000Z',
      });

    assert.strictEqual(resA.status, 201);
    assert.strictEqual(resA.body.transaction.userId, userAId);
    assert.strictEqual(resA.body.transaction.amount, 5000);
    transactionAId = resA.body.transaction.id;
    assert.ok(transactionAId);

    // User B creates Transaction B
    const resB = await request(app)
      .post('/api/transactions')
      .set('Cookie', userBCookie)
      .send({
        type: 'EXPENSE',
        amount: 1200.5,
        category: 'Food',
        description: 'Team Dinner',
        payee: 'Bistro Cafe',
        transactionDate: '2026-10-05T12:00:00.000Z',
      });

    assert.strictEqual(resB.status, 201);
    assert.strictEqual(resB.body.transaction.userId, userBId);
    assert.strictEqual(resB.body.transaction.amount, 1200.5);
    transactionBId = resB.body.transaction.id;
    assert.ok(transactionBId);

    // Direct Neon PostgreSQL Verification
    const dbTxA = await prisma.transaction.findUnique({ where: { id: transactionAId } });
    const dbTxB = await prisma.transaction.findUnique({ where: { id: transactionBId } });

    assert.ok(dbTxA);
    assert.strictEqual(dbTxA.userId, userAId);
    assert.ok(dbTxB);
    assert.strictEqual(dbTxB.userId, userBId);
  });

  // 2. IDOR / BOLA Read Protection
  it('CRITICAL IDOR: User A CANNOT read User B transaction, and User B CANNOT read User A transaction', async () => {
    // 2a. User A attempts to read User B's transaction
    const crossReadA = await request(app)
      .get(`/api/transactions/${transactionBId}`)
      .set('Cookie', userACookie);

    // Must return generic 404 to avoid leaking existence
    assert.strictEqual(crossReadA.status, 404);
    assert.strictEqual(crossReadA.body.error, 'Transaction not found');

    // 2b. User B attempts to read User A's transaction
    const crossReadB = await request(app)
      .get(`/api/transactions/${transactionAId}`)
      .set('Cookie', userBCookie);

    assert.strictEqual(crossReadB.status, 404);
    assert.strictEqual(crossReadB.body.error, 'Transaction not found');

    // 2c. Legitimate reads succeed
    const legitReadA = await request(app)
      .get(`/api/transactions/${transactionAId}`)
      .set('Cookie', userACookie);
    assert.strictEqual(legitReadA.status, 200);
    assert.strictEqual(legitReadA.body.transaction.id, transactionAId);

    const legitReadB = await request(app)
      .get(`/api/transactions/${transactionBId}`)
      .set('Cookie', userBCookie);
    assert.strictEqual(legitReadB.status, 200);
    assert.strictEqual(legitReadB.body.transaction.id, transactionBId);
  });

  // 3. IDOR / BOLA Update Protection
  it('CRITICAL IDOR: User A CANNOT update User B transaction, and User B CANNOT update User A transaction', async () => {
    // 3a. User A attempts to modify User B's transaction
    const crossUpdateA = await request(app)
      .patch(`/api/transactions/${transactionBId}`)
      .set('Cookie', userACookie)
      .send({
        amount: 99999.99,
        description: 'Hacked by User A',
      });

    assert.strictEqual(crossUpdateA.status, 404);
    assert.strictEqual(crossUpdateA.body.error, 'Transaction not found');

    // Verify in Neon PostgreSQL: Transaction B was NOT modified
    const dbTxB = await prisma.transaction.findUnique({ where: { id: transactionBId } });
    assert.strictEqual(dbTxB?.amount.toNumber(), 1200.5);
    assert.strictEqual(dbTxB?.description, 'Team Dinner');

    // 3b. User B attempts to modify User A's transaction
    const crossUpdateB = await request(app)
      .patch(`/api/transactions/${transactionAId}`)
      .set('Cookie', userBCookie)
      .send({
        amount: 0.01,
        description: 'Hacked by User B',
      });

    assert.strictEqual(crossUpdateB.status, 404);
    assert.strictEqual(crossUpdateB.body.error, 'Transaction not found');

    // Verify in Neon PostgreSQL: Transaction A was NOT modified
    const dbTxA = await prisma.transaction.findUnique({ where: { id: transactionAId } });
    assert.strictEqual(dbTxA?.amount.toNumber(), 5000);
    assert.strictEqual(dbTxA?.description, 'Tech Consulting Salary');
  });

  // 4. IDOR / BOLA Delete Protection
  it('CRITICAL IDOR: User A CANNOT delete User B transaction, and User B CANNOT delete User A transaction', async () => {
    // 4a. User A attempts to delete User B's transaction
    const crossDeleteA = await request(app)
      .delete(`/api/transactions/${transactionBId}`)
      .set('Cookie', userACookie);

    assert.strictEqual(crossDeleteA.status, 404);
    assert.strictEqual(crossDeleteA.body.error, 'Transaction not found');

    // Verify in Neon PostgreSQL: Transaction B still exists!
    const dbTxB = await prisma.transaction.findUnique({ where: { id: transactionBId } });
    assert.ok(dbTxB, 'Transaction B must remain intact in Neon PostgreSQL');

    // 4b. User B attempts to delete User A's transaction
    const crossDeleteB = await request(app)
      .delete(`/api/transactions/${transactionAId}`)
      .set('Cookie', userBCookie);

    assert.strictEqual(crossDeleteB.status, 404);
    assert.strictEqual(crossDeleteB.body.error, 'Transaction not found');

    // Verify in Neon PostgreSQL: Transaction A still exists!
    const dbTxA = await prisma.transaction.findUnique({ where: { id: transactionAId } });
    assert.ok(dbTxA, 'Transaction A must remain intact in Neon PostgreSQL');
  });

  // 5. Tenant List Isolation
  it('Tenant Isolation: List queries strictly isolate user records without cross-tenant leakage', async () => {
    // User A lists transactions
    const listA = await request(app)
      .get('/api/transactions')
      .set('Cookie', userACookie);

    assert.strictEqual(listA.status, 200);
    assert.strictEqual(listA.body.transactions.length, 1);
    assert.strictEqual(listA.body.transactions[0].id, transactionAId);
    assert.strictEqual(listA.body.transactions[0].userId, userAId);

    // User B lists transactions
    const listB = await request(app)
      .get('/api/transactions')
      .set('Cookie', userBCookie);

    assert.strictEqual(listB.status, 200);
    assert.strictEqual(listB.body.transactions.length, 1);
    assert.strictEqual(listB.body.transactions[0].id, transactionBId);
    assert.strictEqual(listB.body.transactions[0].userId, userBId);
  });

  // 6. Mass Assignment Protection
  it('MASS ASSIGNMENT: Strict Zod validation rejects unexpected or privilege-escalating fields', async () => {
    // 6a. Attempt to inject userId and ownerId on create
    const massAssignCreate = await request(app)
      .post('/api/transactions')
      .set('Cookie', userACookie)
      .send({
        userId: userBId, // Malicious override attempt
        ownerId: userBId,
        role: 'ADMIN',
        isAdmin: true,
        type: 'INCOME',
        amount: 100,
        category: 'Freelance',
        description: 'Injection Attempt',
        payee: 'Victim Corp',
        transactionDate: '2026-10-05T14:00:00.000Z',
      });

    assert.strictEqual(massAssignCreate.status, 400);
    assert.strictEqual(massAssignCreate.body.error, 'Validation failed');

    // 6b. Attempt to inject userId on update
    const massAssignUpdate = await request(app)
      .patch(`/api/transactions/${transactionAId}`)
      .set('Cookie', userACookie)
      .send({
        userId: userBId,
        createdAt: '2020-01-01T00:00:00.000Z',
      });

    assert.strictEqual(massAssignUpdate.status, 400);
    assert.strictEqual(massAssignUpdate.body.error, 'Validation failed');
  });

  // 7. Input Validation Edge Cases
  it('VALIDATION: Rejects invalid amounts, zero amounts, invalid types, categories, and malformed dates', async () => {
    // 7a. Negative amount
    const negAmount = await request(app)
      .post('/api/transactions')
      .set('Cookie', userACookie)
      .send({
        type: 'EXPENSE',
        amount: -500,
        category: 'Food',
        description: 'Negative',
        payee: 'Store',
        transactionDate: '2026-10-05T12:00:00.000Z',
      });
    assert.strictEqual(negAmount.status, 400);

    // 7b. Zero amount
    const zeroAmount = await request(app)
      .post('/api/transactions')
      .set('Cookie', userACookie)
      .send({
        type: 'EXPENSE',
        amount: 0,
        category: 'Food',
        description: 'Zero',
        payee: 'Store',
        transactionDate: '2026-10-05T12:00:00.000Z',
      });
    assert.strictEqual(zeroAmount.status, 400);

    // 7c. Invalid type
    const badType = await request(app)
      .post('/api/transactions')
      .set('Cookie', userACookie)
      .send({
        type: 'TRANSFER', // Illegal
        amount: 100,
        category: 'Food',
        description: 'Bad Type',
        payee: 'Store',
        transactionDate: '2026-10-05T12:00:00.000Z',
      });
    assert.strictEqual(badType.status, 400);

    // 7d. Unsupported category
    const badCat = await request(app)
      .post('/api/transactions')
      .set('Cookie', userACookie)
      .send({
        type: 'EXPENSE',
        amount: 100,
        category: 'CryptocurrencySpeculation', // Illegal
        description: 'Bad Cat',
        payee: 'Store',
        transactionDate: '2026-10-05T12:00:00.000Z',
      });
    assert.strictEqual(badCat.status, 400);

    // 7e. Malformed date
    const badDate = await request(app)
      .post('/api/transactions')
      .set('Cookie', userACookie)
      .send({
        type: 'EXPENSE',
        amount: 100,
        category: 'Food',
        description: 'Bad Date',
        payee: 'Store',
        transactionDate: 'invalid-not-a-date',
      });
    assert.strictEqual(badDate.status, 400);
  });

  // 8. Search & Filtering Verification
  it('SEARCH & FILTER: Validates server-side filtering by type, category, date, and text search', async () => {
    // Add additional transaction for User A to test multiple filter branches
    const secondTx = await request(app)
      .post('/api/transactions')
      .set('Cookie', userACookie)
      .send({
        type: 'EXPENSE',
        amount: 350.0,
        category: 'Transport',
        description: 'Metro Monthly Card',
        payee: 'Metro Rail Corp',
        transactionDate: '2026-10-04T08:00:00.000Z',
      });
    assert.strictEqual(secondTx.status, 201);

    // 8a. Filter by type=INCOME
    const incomeOnly = await request(app)
      .get('/api/transactions?type=INCOME')
      .set('Cookie', userACookie);
    assert.strictEqual(incomeOnly.status, 200);
    assert.ok(incomeOnly.body.transactions.every((t: { type: string }) => t.type === 'INCOME'));

    // 8b. Filter by type=EXPENSE
    const expenseOnly = await request(app)
      .get('/api/transactions?type=EXPENSE')
      .set('Cookie', userACookie);
    assert.strictEqual(expenseOnly.status, 200);
    assert.ok(expenseOnly.body.transactions.every((t: { type: string }) => t.type === 'EXPENSE'));

    // 8c. Filter by category=Transport
    const transportOnly = await request(app)
      .get('/api/transactions?category=Transport')
      .set('Cookie', userACookie);
    assert.strictEqual(transportOnly.status, 200);
    assert.strictEqual(transportOnly.body.transactions.length, 1);
    assert.strictEqual(transportOnly.body.transactions[0].category, 'Transport');

    // 8d. Text search in description/payee
    const searchRes = await request(app)
      .get('/api/transactions?search=Metro')
      .set('Cookie', userACookie);
    assert.strictEqual(searchRes.status, 200);
    assert.strictEqual(searchRes.body.transactions.length, 1);
    assert.strictEqual(searchRes.body.transactions[0].payee, 'Metro Rail Corp');
  });

  // 9. Legitimate Update, Delete & Database Cleanup
  it('LIFECYCLE: User A successfully updates and deletes own transaction with direct DB verification', async () => {
    // 9a. Update own transaction
    const updateRes = await request(app)
      .patch(`/api/transactions/${transactionAId}`)
      .set('Cookie', userACookie)
      .send({
        amount: 5500.0,
        description: 'Tech Consulting Salary (Bonus Added)',
      });

    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.transaction.amount, 5500);

    // Verify in Neon PostgreSQL
    const dbUpdated = await prisma.transaction.findUnique({ where: { id: transactionAId } });
    assert.strictEqual(dbUpdated?.amount.toNumber(), 5500);

    // 9b. Delete own transaction
    const deleteRes = await request(app)
      .delete(`/api/transactions/${transactionAId}`)
      .set('Cookie', userACookie);

    assert.strictEqual(deleteRes.status, 200);

    // Direct DB check: row is removed from Neon PostgreSQL
    const dbDeleted = await prisma.transaction.findUnique({ where: { id: transactionAId } });
    assert.strictEqual(dbDeleted, null);
  });
});
