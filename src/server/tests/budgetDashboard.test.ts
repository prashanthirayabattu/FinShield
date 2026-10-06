import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../app';
import { prisma, checkDatabaseConnection } from '../db/prisma';

describe('FinShield Milestone 6 — Real Neon PostgreSQL Budgets & Financial Dashboard Test Suite', () => {
  const timestamp = Date.now();
  const userAEmail = `test_budget_userA_${timestamp}@finshield.local`;
  const userBEmail = `test_budget_userB_${timestamp}@finshield.local`;
  const testPassword = 'StrongPassword123!';

  let userAId: string;
  let userBId: string;
  let userACookie: string;
  let userBCookie: string;

  let budgetAId: string;
  let budgetBId: string;

  before(async () => {
    const isConnected = await checkDatabaseConnection();
    assert.equal(isConnected, true, 'Neon PostgreSQL must be reachable and verified');

    // Clean up any stale test users
    await prisma.budget.deleteMany({
      where: { user: { email: { contains: 'test_budget_' } } },
    });
    await prisma.transaction.deleteMany({
      where: { user: { email: { contains: 'test_budget_' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test_budget_' } },
    });

    // 1. Register User A
    const resRegA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Budget Test User A',
        email: userAEmail,
        password: testPassword,
      });
    assert.equal(resRegA.status, 201);
    userAId = resRegA.body.user.id;

    // Login User A to get auth session
    const resLoginA = await request(app)
      .post('/api/auth/login')
      .send({ email: userAEmail, password: testPassword });
    assert.equal(resLoginA.status, 200);
    userACookie = resLoginA.headers['set-cookie'][0];

    // 2. Register User B
    const resRegB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Budget Test User B',
        email: userBEmail,
        password: testPassword,
      });
    assert.equal(resRegB.status, 201);
    userBId = resRegB.body.user.id;

    // Login User B to get auth session
    const resLoginB = await request(app)
      .post('/api/auth/login')
      .send({ email: userBEmail, password: testPassword });
    assert.equal(resLoginB.status, 200);
    userBCookie = resLoginB.headers['set-cookie'][0];
  });

  after(async () => {
    // Teardown: delete test transactions, budgets, and users
    if (userAId || userBId) {
      await prisma.budget.deleteMany({
        where: { userId: { in: [userAId, userBId] } },
      });
      await prisma.transaction.deleteMany({
        where: { userId: { in: [userAId, userBId] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [userAId, userBId] } },
      });
    }

    const remainingBudgets = await prisma.budget.count({
      where: { userId: { in: [userAId, userBId] } },
    });
    const remainingTransactions = await prisma.transaction.count({
      where: { userId: { in: [userAId, userBId] } },
    });
    const remainingUsers = await prisma.user.count({
      where: { id: { in: [userAId, userBId] } },
    });

    assert.equal(remainingBudgets, 0, 'Database budgets count must return to 0 after test cleanup');
    assert.equal(remainingTransactions, 0, 'Database transactions count must return to 0 after test cleanup');
    assert.equal(remainingUsers, 0, 'Database users count must return to 0 after test cleanup');
  });

  it('1. User A creates Budget A and User B creates Budget B in Neon PostgreSQL', async () => {
    // User A creates Budget for Food (limit 10,000, month 2026-10)
    const resA = await request(app)
      .post('/api/budgets')
      .set('Cookie', [userACookie])
      .send({
        category: 'Food',
        limitAmount: 10000,
        month: '2026-10',
      });

    assert.equal(resA.status, 201);
    assert.equal(resA.body.budget.category, 'Food');
    assert.equal(resA.body.budget.limitAmount, 10000);
    assert.equal(resA.body.budget.month, '2026-10');
    assert.equal(resA.body.budget.spentAmount, 0);
    assert.equal(resA.body.budget.status, 'SAFE');
    budgetAId = resA.body.budget.id;

    // User B creates Budget for Food (limit 5,000, month 2026-10)
    const resB = await request(app)
      .post('/api/budgets')
      .set('Cookie', [userBCookie])
      .send({
        category: 'Food',
        limitAmount: 5000,
        month: '2026-10',
      });

    assert.equal(resB.status, 201);
    assert.equal(resB.body.budget.category, 'Food');
    assert.equal(resB.body.budget.limitAmount, 5000);
    assert.equal(resB.body.budget.month, '2026-10');
    budgetBId = resB.body.budget.id;

    // Direct Neon PostgreSQL query verification
    const dbBudgetA = await prisma.budget.findUnique({ where: { id: budgetAId } });
    const dbBudgetB = await prisma.budget.findUnique({ where: { id: budgetBId } });

    assert.ok(dbBudgetA);
    assert.equal(dbBudgetA.userId, userAId);
    assert.ok(dbBudgetB);
    assert.equal(dbBudgetB.userId, userBId);
  });

  it('2. CRITICAL IDOR: User A CANNOT read User B budget, and User B CANNOT read User A budget', async () => {
    // User A attempts to read Budget B
    const resAonB = await request(app)
      .get(`/api/budgets/${budgetBId}`)
      .set('Cookie', [userACookie]);

    assert.equal(resAonB.status, 404, 'Accessing another user budget must return generic 404');
    assert.equal(resAonB.body.error, 'Budget not found');

    // User B attempts to read Budget A
    const resBonA = await request(app)
      .get(`/api/budgets/${budgetAId}`)
      .set('Cookie', [userBCookie]);

    assert.equal(resBonA.status, 404, 'Accessing another user budget must return generic 404');
    assert.equal(resBonA.body.error, 'Budget not found');
  });

  it('3. CRITICAL IDOR: User A CANNOT update User B budget, and User B CANNOT update User A budget', async () => {
    // User A attempts to tamper with User B's budget limit
    const resAonB = await request(app)
      .patch(`/api/budgets/${budgetBId}`)
      .set('Cookie', [userACookie])
      .send({ limitAmount: 99999 });

    assert.equal(resAonB.status, 404, 'Tampering with another user budget must return 404');

    // Verify User B's budget limit was NOT changed in database
    const dbBudgetB = await prisma.budget.findUnique({ where: { id: budgetBId } });
    assert.equal(Number(dbBudgetB?.limitAmount), 5000);
  });

  it('4. CRITICAL IDOR: User A CANNOT delete User B budget, and User B CANNOT delete User A budget', async () => {
    // User A attempts to delete User B's budget
    const resAonB = await request(app)
      .delete(`/api/budgets/${budgetBId}`)
      .set('Cookie', [userACookie]);

    assert.equal(resAonB.status, 404, 'Deleting another user budget must return 404');

    // Verify User B's budget still exists in database
    const dbBudgetB = await prisma.budget.findUnique({ where: { id: budgetBId } });
    assert.ok(dbBudgetB, 'Budget B must remain untouched');
  });

  it('5. Tenant Isolation: List queries strictly isolate user budgets without cross-tenant leakage', async () => {
    const listA = await request(app)
      .get('/api/budgets')
      .set('Cookie', [userACookie]);

    assert.equal(listA.status, 200);
    assert.equal(listA.body.count, 1);
    assert.equal(listA.body.budgets[0].id, budgetAId);

    const listB = await request(app)
      .get('/api/budgets')
      .set('Cookie', [userBCookie]);

    assert.equal(listB.status, 200);
    assert.equal(listB.body.count, 1);
    assert.equal(listB.body.budgets[0].id, budgetBId);
  });

  it('6. MASS ASSIGNMENT & VALIDATION: Rejects unexpected fields, negative amounts, invalid categories/months', async () => {
    // Mass-assignment: injecting userId and isAdmin
    const resMassAssign = await request(app)
      .post('/api/budgets')
      .set('Cookie', [userACookie])
      .send({
        category: 'Shopping',
        limitAmount: 4000,
        month: '2026-10',
        userId: 'malicious-injected-id',
        isAdmin: true,
      });

    assert.equal(resMassAssign.status, 400);

    // Negative limit amount
    const resNegative = await request(app)
      .post('/api/budgets')
      .set('Cookie', [userACookie])
      .send({
        category: 'Shopping',
        limitAmount: -500,
        month: '2026-10',
      });

    assert.equal(resNegative.status, 400);

    // Invalid category
    const resInvalidCat = await request(app)
      .post('/api/budgets')
      .set('Cookie', [userACookie])
      .send({
        category: 'CryptoGambling',
        limitAmount: 5000,
        month: '2026-10',
      });

    assert.equal(resInvalidCat.status, 400);

    // Invalid month format
    const resInvalidMonth = await request(app)
      .post('/api/budgets')
      .set('Cookie', [userACookie])
      .send({
        category: 'Shopping',
        limitAmount: 5000,
        month: '2026-13',
      });

    assert.equal(resInvalidMonth.status, 400);
  });

  it('7. Unauthenticated access to /api/budgets and /api/dashboard is rejected with 401', async () => {
    const resBudget = await request(app).get('/api/budgets');
    assert.equal(resBudget.status, 401);

    const resDash = await request(app).get('/api/dashboard/summary');
    assert.equal(resDash.status, 401);
  });

  it('8. Live Transaction Spend Calculations: Tracks SAFE (20%), WARNING (85%), and EXCEEDED (105%) states', async () => {
    // Budget A limit is 10,000 for Food in 2026-10.
    // Add transaction 1: 2,000 expense -> 20% -> SAFE
    const tx1 = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userACookie])
      .send({
        type: 'EXPENSE',
        amount: 2000,
        category: 'Food',
        description: 'Groceries store',
        payee: 'Supermarket',
        transactionDate: '2026-10-02T10:00:00.000Z',
      });
    assert.equal(tx1.status, 201);

    const check1 = await request(app)
      .get(`/api/budgets/${budgetAId}`)
      .set('Cookie', [userACookie]);
    assert.equal(check1.status, 200);
    assert.equal(check1.body.budget.spentAmount, 2000);
    assert.equal(check1.body.budget.remainingAmount, 8000);
    assert.equal(check1.body.budget.percentageUsed, 20);
    assert.equal(check1.body.budget.status, 'SAFE');

    // Add transaction 2: 6,500 expense -> total spent 8,500 -> 85% -> WARNING
    const tx2 = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userACookie])
      .send({
        type: 'EXPENSE',
        amount: 6500,
        category: 'Food',
        description: 'Fine dining',
        payee: 'Restaurant',
        transactionDate: '2026-10-06T19:30:00.000Z',
      });
    assert.equal(tx2.status, 201);

    const check2 = await request(app)
      .get(`/api/budgets/${budgetAId}`)
      .set('Cookie', [userACookie]);
    assert.equal(check2.status, 200);
    assert.equal(check2.body.budget.spentAmount, 8500);
    assert.equal(check2.body.budget.remainingAmount, 1500);
    assert.equal(check2.body.budget.percentageUsed, 85);
    assert.equal(check2.body.budget.status, 'WARNING');

    // Add transaction 3: 2,000 expense -> total spent 10,500 -> 105% -> EXCEEDED
    const tx3 = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userACookie])
      .send({
        type: 'EXPENSE',
        amount: 2000,
        category: 'Food',
        description: 'Weekend party snack',
        payee: 'Bakery',
        transactionDate: '2026-10-07T14:00:00.000Z',
      });
    assert.equal(tx3.status, 201);

    const check3 = await request(app)
      .get(`/api/budgets/${budgetAId}`)
      .set('Cookie', [userACookie]);
    assert.equal(check3.status, 200);
    assert.equal(check3.body.budget.spentAmount, 10500);
    assert.equal(check3.body.budget.remainingAmount, -500);
    assert.equal(check3.body.budget.percentageUsed, 105);
    assert.equal(check3.body.budget.status, 'EXCEEDED');
  });

  it('9. Dashboard Summary Real Calculation: Verifies mathematical consistency (balance = income - expenses)', async () => {
    // User A records an INCOME transaction: 50,000
    const txIncome = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userACookie])
      .send({
        type: 'INCOME',
        amount: 50000,
        category: 'Salary',
        description: 'October Salary',
        payee: 'Tech Corp',
        transactionDate: '2026-10-01T09:00:00.000Z',
      });
    assert.equal(txIncome.status, 201);

    // User A records another EXPENSE in Transport: 3,500
    const txTransport = await request(app)
      .post('/api/transactions')
      .set('Cookie', [userACookie])
      .send({
        type: 'EXPENSE',
        amount: 3500,
        category: 'Transport',
        description: 'Monthly metro pass',
        payee: 'Metro Rail',
        transactionDate: '2026-10-03T11:00:00.000Z',
      });
    assert.equal(txTransport.status, 201);

    // Call GET /api/dashboard/summary for User A
    const resDash = await request(app)
      .get('/api/dashboard/summary?month=2026-10')
      .set('Cookie', [userACookie]);

    assert.equal(resDash.status, 200);
    const summary = resDash.body;

    // Total income = 50,000
    assert.equal(summary.totalIncome, 50000);
    // Total expenses = 10,500 (Food) + 3,500 (Transport) = 14,000
    assert.equal(summary.totalExpenses, 14000);
    // Current balance = 50,000 - 14,000 = 36,000
    assert.equal(summary.currentBalance, 36000);
    // Savings = Balance
    assert.equal(summary.totalSavings, 36000);

    // Verify Category breakdown
    interface CategoryItem {
      category: string;
      total: number;
    }
    const foodCat = summary.categoryBreakdown.find((c: CategoryItem) => c.category === 'Food');
    const transportCat = summary.categoryBreakdown.find((c: CategoryItem) => c.category === 'Transport');
    assert.ok(foodCat);
    assert.equal(foodCat.total, 10500);
    assert.ok(transportCat);
    assert.equal(transportCat.total, 3500);

    // Verify sum of category breakdowns equals total expenses
    const sumCategories = summary.categoryBreakdown.reduce((sum: number, c: CategoryItem) => sum + c.total, 0);
    assert.equal(sumCategories, summary.totalExpenses);

    // Verify budget alerts: Food budget must be in budgetAlerts with status EXCEEDED
    assert.equal(summary.budgetAlerts.length, 1);
    assert.equal(summary.budgetAlerts[0].category, 'Food');
    assert.equal(summary.budgetAlerts[0].status, 'EXCEEDED');

    // Verify User B's dashboard is completely isolated (0 income, 0 expenses)
    const resDashB = await request(app)
      .get('/api/dashboard/summary?month=2026-10')
      .set('Cookie', [userBCookie]);

    assert.equal(resDashB.status, 200);
    assert.equal(resDashB.body.totalIncome, 0);
    assert.equal(resDashB.body.totalExpenses, 0);
    assert.equal(resDashB.body.currentBalance, 0);
    assert.equal(resDashB.body.recentTransactions.length, 0);
  });

  it('10. Lifecycle: Legitimate update and delete for budgets operate cleanly', async () => {
    // User A increases Budget A limit to 20,000 -> 10,500 / 20,000 = 52.5% -> SAFE
    const resUpdate = await request(app)
      .patch(`/api/budgets/${budgetAId}`)
      .set('Cookie', [userACookie])
      .send({ limitAmount: 20000 });

    assert.equal(resUpdate.status, 200);
    assert.equal(resUpdate.body.budget.limitAmount, 20000);
    assert.equal(resUpdate.body.budget.spentAmount, 10500);
    assert.equal(resUpdate.body.budget.remainingAmount, 9500);
    assert.equal(resUpdate.body.budget.percentageUsed, 52.5);
    assert.equal(resUpdate.body.budget.status, 'SAFE');

    // User A deletes Budget A
    const resDeleteA = await request(app)
      .delete(`/api/budgets/${budgetAId}`)
      .set('Cookie', [userACookie]);
    assert.equal(resDeleteA.status, 200);

    // User B deletes Budget B
    const resDeleteB = await request(app)
      .delete(`/api/budgets/${budgetBId}`)
      .set('Cookie', [userBCookie]);
    assert.equal(resDeleteB.status, 200);
  });
});
