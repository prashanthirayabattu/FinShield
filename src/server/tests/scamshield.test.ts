import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../app';
import { prisma, checkDatabaseConnection } from '../db/prisma';

describe('FinShield Milestone 7 — Real Neon PostgreSQL ScamShield Fraud Analysis Test Suite', () => {
  const timestamp = Date.now();
  const userAEmail = `test_scam_userA_${timestamp}@finshield.local`;
  const userBEmail = `test_scam_userB_${timestamp}@finshield.local`;
  const testPassword = 'StrongPassword123!';

  let userAId: string;
  let userBId: string;
  let userACookie: string;
  let userBCookie: string;

  before(async () => {
    const isConnected = await checkDatabaseConnection();
    assert.equal(isConnected, true, 'Neon PostgreSQL must be reachable and verified');

    // Clean up any stale test users
    await prisma.scamAnalysis.deleteMany({
      where: { user: { email: { contains: 'test_scam_' } } },
    });
    await prisma.transaction.deleteMany({
      where: { user: { email: { contains: 'test_scam_' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test_scam_' } },
    });

    // 1. Register User A
    const resRegA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'ScamShield Test User A',
        email: userAEmail,
        password: testPassword,
      });
    assert.equal(resRegA.status, 201);
    userAId = resRegA.body.user.id;

    // Login User A
    const resLoginA = await request(app)
      .post('/api/auth/login')
      .send({ email: userAEmail, password: testPassword });
    assert.equal(resLoginA.status, 200);
    userACookie = resLoginA.headers['set-cookie'][0];

    // 2. Register User B
    const resRegB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'ScamShield Test User B',
        email: userBEmail,
        password: testPassword,
      });
    assert.equal(resRegB.status, 201);
    userBId = resRegB.body.user.id;

    // Login User B
    const resLoginB = await request(app)
      .post('/api/auth/login')
      .send({ email: userBEmail, password: testPassword });
    assert.equal(resLoginB.status, 200);
    userBCookie = resLoginB.headers['set-cookie'][0];

    // Seed transaction for User A: Paid ₹4,500 to fraudster UPI
    await prisma.transaction.create({
      data: {
        userId: userAId,
        type: 'EXPENSE',
        amount: 4500.0,
        category: 'Shopping',
        payee: 'refund.support@oksbi',
        description: 'Payment made for online order support',
        transactionDate: new Date('2026-10-01'),
      },
    });
  });

  after(async () => {
    // Teardown: clean up test data and verify counts return to 0
    if (userAId || userBId) {
      await prisma.scamAnalysis.deleteMany({
        where: { userId: { in: [userAId, userBId] } },
      });
      await prisma.transaction.deleteMany({
        where: { userId: { in: [userAId, userBId] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [userAId, userBId] } },
      });
    }

    const remainingScamAnalyses = await prisma.scamAnalysis.count({
      where: { userId: { in: [userAId, userBId] } },
    });
    const remainingTransactions = await prisma.transaction.count({
      where: { userId: { in: [userAId, userBId] } },
    });
    const remainingUsers = await prisma.user.count({
      where: { id: { in: [userAId, userBId] } },
    });

    assert.equal(
      remainingScamAnalyses,
      0,
      'Database scam_analyses count must return to 0 after test cleanup'
    );
    assert.equal(
      remainingTransactions,
      0,
      'Database transactions count must return to 0 after test cleanup'
    );
    assert.equal(
      remainingUsers,
      0,
      'Database users count must return to 0 after test cleanup'
    );
  });

  it('Test A: KYC urgency and account suspension scam yields HIGH risk and KYC_FRAUD category', async () => {
    const payload = {
      text: 'Dear customer, your SBI bank account and KYC will be blocked within 24 hours immediately. Update PAN card now at http://sbi-kyc-verify-portal.xyz',
    };

    const res = await request(app)
      .post('/api/scamshield/analyze')
      .set('Cookie', [userACookie])
      .send(payload);

    assert.equal(res.status, 200);
    assert.equal(res.body.riskLevel, 'HIGH');
    assert.ok(res.body.riskScore >= 60, 'Risk score must be >= 60 for high risk');
    assert.equal(res.body.category, 'KYC_FRAUD');
    assert.ok(res.body.reasons.length > 0, 'Must provide explainable reasons');
    assert.ok(res.body.recommendations.length > 0, 'Must provide safety recommendations');
    assert.ok(res.body.extractedUrls.length > 0, 'Must extract URL');
  });

  it('Test B: Sensitive credential harvesting (OTP / UPI PIN) yields HIGH risk and CREDENTIAL_THEFT category', async () => {
    const payload = {
      text: 'Please share your 6-digit OTP and UPI PIN immediately to verify your transaction refund.',
    };

    const res = await request(app)
      .post('/api/scamshield/analyze')
      .set('Cookie', [userACookie])
      .send(payload);

    assert.equal(res.status, 200);
    assert.equal(res.body.riskLevel, 'HIGH');
    assert.ok(res.body.riskScore >= 60);
    assert.equal(res.body.category, 'CREDENTIAL_THEFT');
  });

  it('Test C: Utility bill disconnection intimidation yields HIGH risk', async () => {
    const payload = {
      text: 'Dear consumer, your electricity power bill was unpaid. Power will be disconnected tonight at 9:30 PM. Call power officer immediately.',
    };

    const res = await request(app)
      .post('/api/scamshield/analyze')
      .set('Cookie', [userACookie])
      .send(payload);

    assert.equal(res.status, 200);
    assert.equal(res.body.riskLevel, 'HIGH');
    assert.ok(res.body.riskScore >= 50);
    assert.equal(res.body.category, 'UTILITY_EXTORTION');
  });

  it('Test D: Part-time job / Telegram task yields MEDIUM risk', async () => {
    const payload = {
      text: 'Earn ₹2000 daily part time work from home by liking youtube videos. Join our Telegram channel now.',
    };

    const res = await request(app)
      .post('/api/scamshield/analyze')
      .set('Cookie', [userACookie])
      .send(payload);

    assert.equal(res.status, 200);
    assert.equal(res.body.riskLevel, 'MEDIUM');
    assert.ok(res.body.riskScore >= 30 && res.body.riskScore < 60);
    assert.equal(res.body.category, 'TASK_JOB_FRAUD');
  });

  it('Test E: Benign routine financial message yields LOW risk', async () => {
    const payload = {
      text: 'Hey Rohit, please send the restaurant dinner bill split when you get home.',
    };

    const res = await request(app)
      .post('/api/scamshield/analyze')
      .set('Cookie', [userACookie])
      .send(payload);

    assert.equal(res.status, 200);
    assert.equal(res.body.riskLevel, 'LOW');
    assert.ok(res.body.riskScore < 30);
    assert.equal(res.body.category, 'SAFE_OR_BENIGN');
  });

  it('Test F: SSRF-safe URL lexical inspection detects insecure protocol, high-risk TLD, and brand spoofing', async () => {
    const payload = {
      url: 'http://sbi-kyc-verify-portal.xyz/login',
    };

    const res = await request(app)
      .post('/api/scamshield/analyze')
      .set('Cookie', [userACookie])
      .send(payload);

    assert.equal(res.status, 200);
    assert.equal(res.body.riskLevel, 'HIGH');
    assert.equal(res.body.category, 'PHISHING_URL');
    const reasonsJoined = res.body.reasons.join(' ');
    assert.ok(
      reasonsJoined.includes('Insecure unencrypted HTTP protocol'),
      'Must identify HTTP protocol risk'
    );
    assert.ok(
      reasonsJoined.includes('high-risk top-level domain'),
      'Must identify high-risk .xyz TLD'
    );
    assert.ok(
      reasonsJoined.includes('Suspicious brand imitation'),
      'Must identify brand keyword spoofing'
    );
  });

  it('Test G: UPI handle extraction and fraud keyword identification', async () => {
    const payload = {
      text: 'Pay urgently to refund.support@oksbi to process your pending claim',
    };

    const res = await request(app)
      .post('/api/scamshield/analyze')
      .set('Cookie', [userACookie])
      .send(payload);

    assert.equal(res.status, 200);
    assert.equal(res.body.extractedUpiId, 'refund.support@oksbi');
    assert.ok(
      res.body.reasons.some((r: string) => r.includes('impersonation keywords')),
      'Must detect fraud keywords in UPI username'
    );
  });

  it('Test H: Amount extraction correctly parses currency amounts', async () => {
    const payload = {
      text: 'Urgent: transfer ₹4,500 immediately to complete registration',
    };

    const res = await request(app)
      .post('/api/scamshield/analyze')
      .set('Cookie', [userACookie])
      .send(payload);

    assert.equal(res.status, 200);
    assert.equal(res.body.extractedAmount, 4500);
  });

  it('Test I: Validation rejects empty payload with 400', async () => {
    const res = await request(app)
      .post('/api/scamshield/analyze')
      .set('Cookie', [userACookie])
      .send({});

    assert.equal(res.status, 400);
  });

  it('Test J: Validation rejects oversized text payload with 400', async () => {
    const res = await request(app)
      .post('/api/scamshield/analyze')
      .set('Cookie', [userACookie])
      .send({ text: 'A'.repeat(5001) });

    assert.equal(res.status, 400);
  });

  it('Test K: Mass assignment rejection: unknown fields rejected with 400', async () => {
    const res = await request(app)
      .post('/api/scamshield/analyze')
      .set('Cookie', [userACookie])
      .send({
        text: 'Checking suspicious activity',
        userId: userBId,
        isAdmin: true,
        riskScore: 0,
      });

    assert.equal(res.status, 400);
  });

  it('Test L: Unauthenticated request returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/scamshield/analyze')
      .send({ text: 'Suspicious text without auth token' });

    assert.equal(res.status, 401);
  });

  it('Test M: Scoped transaction linking connects suspicious entity to User A ledger', async () => {
    // User A analyzes message containing the payee and amount from their seed transaction
    const payload = {
      text: 'Send confirmation to refund.support@oksbi for ₹4,500 order verification',
    };

    const res = await request(app)
      .post('/api/scamshield/analyze')
      .set('Cookie', [userACookie])
      .send(payload);

    assert.equal(res.status, 200);
    assert.ok(res.body.matchedTransactions.length >= 1, 'Must link User A transaction');
    assert.equal(res.body.matchedTransactions[0].payee, 'refund.support@oksbi');
    assert.equal(res.body.matchedTransactions[0].amount, 4500);
  });

  it('Test N: Cross-user isolation: User B analyzing identical message receives 0 linked transactions', async () => {
    // User B runs the EXACT same analysis with refund.support@oksbi and ₹4,500
    const payload = {
      text: 'Send confirmation to refund.support@oksbi for ₹4,500 order verification',
    };

    const res = await request(app)
      .post('/api/scamshield/analyze')
      .set('Cookie', [userBCookie])
      .send(payload);

    assert.equal(res.status, 200);
    // User B MUST NOT see User A's transaction!
    assert.equal(
      res.body.matchedTransactions.length,
      0,
      'User B must have 0 matched transactions (zero cross-user data leakage)'
    );
  });
});
