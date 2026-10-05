import { prisma, checkDatabaseConnection } from '../db/prisma';
import { env } from '../config/env';

async function main() {
  console.log('--- FinShield PostgreSQL & Prisma Verification ---');
  console.log(`Configured DATABASE_URL target: ${env.DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);
  console.log(`IS_REAL_DATABASE_CONFIGURED: ${env.IS_REAL_DATABASE_CONFIGURED}`);

  const isConnected = await checkDatabaseConnection();

  if (isConnected) {
    console.log('✅ Connection to PostgreSQL: SUCCESS');

    try {
      // 1. Check tables
      const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN ('users', 'transactions', 'budgets');
      `;

      const hasUsersTable = tables.some((t) => t.table_name === 'users');
      const hasTransactionsTable = tables.some((t) => t.table_name === 'transactions');
      const hasBudgetsTable = tables.some((t) => t.table_name === 'budgets');

      if (hasUsersTable) {
        console.log('✅ Table "users": FOUND in public schema');
      } else {
        console.log('⚠️  Table "users": NOT FOUND');
      }

      if (hasTransactionsTable) {
        console.log('✅ Table "transactions": FOUND in public schema');
      } else {
        console.log('⚠️  Table "transactions": NOT FOUND');
      }

      if (hasBudgetsTable) {
        console.log('✅ Table "budgets": FOUND in public schema');
      } else {
        console.log('⚠️  Table "budgets": NOT FOUND');
      }

      // 2. Check Enums
      const enums = await prisma.$queryRaw<Array<{ typname: string }>>`
        SELECT typname 
        FROM pg_type 
        WHERE typname IN ('Role', 'TransactionType');
      `;

      const hasRoleEnum = enums.some((e) => e.typname === 'Role');
      const hasTypeEnum = enums.some((e) => e.typname === 'TransactionType');

      if (hasRoleEnum) {
        console.log('✅ Enum "Role": FOUND in pg_type (USER, ADMIN)');
      }
      if (hasTypeEnum) {
        console.log('✅ Enum "TransactionType": FOUND in pg_type (INCOME, EXPENSE)');
      }

      // 3. Check Foreign Keys
      const foreignKeys = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
          AND table_name IN ('transactions', 'budgets') 
          AND constraint_type = 'FOREIGN KEY';
      `;
      const hasTxUserFkey = foreignKeys.some((fk) => fk.constraint_name === 'transactions_userId_fkey');
      const hasBudgetFkey = foreignKeys.some((fk) => fk.constraint_name === 'budgets_userId_fkey');
      if (hasTxUserFkey) {
        console.log('✅ Foreign Key "transactions_userId_fkey": VERIFIED');
      }
      if (hasBudgetFkey) {
        console.log('✅ Foreign Key "budgets_userId_fkey": VERIFIED');
      }

      // 4. Check Indexes and Unique Constraints
      const indexes = await prisma.$queryRaw<Array<{ tablename: string; indexname: string }>>`
        SELECT tablename, indexname 
        FROM pg_indexes 
        WHERE tablename IN ('users', 'transactions', 'budgets');
      `;

      const hasUniqueEmail = indexes.some((idx) => idx.indexname === 'users_email_key');
      const hasUniqueBudget = indexes.some((idx) => idx.indexname === 'budgets_userId_category_month_key');
      const hasTxUserIdx = indexes.some((idx) => idx.indexname === 'transactions_userId_idx');
      const hasTxUserDateIdx = indexes.some((idx) => idx.indexname === 'transactions_userId_transactionDate_idx');
      const hasTxUserTypeIdx = indexes.some((idx) => idx.indexname === 'transactions_userId_type_idx');
      const hasTxUserCategoryIdx = indexes.some((idx) => idx.indexname === 'transactions_userId_category_idx');
      const hasBudgetUserIdx = indexes.some((idx) => idx.indexname === 'budgets_userId_idx');
      const hasBudgetUserCategoryIdx = indexes.some((idx) => idx.indexname === 'budgets_userId_category_idx');
      const hasBudgetUserMonthIdx = indexes.some((idx) => idx.indexname === 'budgets_userId_month_idx');

      if (hasUniqueEmail) {
        console.log('✅ Unique constraint "users_email_key": VERIFIED');
      }
      if (hasUniqueBudget) {
        console.log('✅ Unique constraint "budgets_userId_category_month_key": VERIFIED');
      }
      if (hasTxUserIdx) {
        console.log('✅ Index "transactions_userId_idx": VERIFIED');
      }
      if (hasTxUserDateIdx) {
        console.log('✅ Index "transactions_userId_transactionDate_idx": VERIFIED');
      }
      if (hasTxUserTypeIdx) {
        console.log('✅ Index "transactions_userId_type_idx": VERIFIED');
      }
      if (hasTxUserCategoryIdx) {
        console.log('✅ Index "transactions_userId_category_idx": VERIFIED');
      }
      if (hasBudgetUserIdx) {
        console.log('✅ Index "budgets_userId_idx": VERIFIED');
      }
      if (hasBudgetUserCategoryIdx) {
        console.log('✅ Index "budgets_userId_category_idx": VERIFIED');
      }
      if (hasBudgetUserMonthIdx) {
        console.log('✅ Index "budgets_userId_month_idx": VERIFIED');
      }

      const userCount = await prisma.user.count();
      const txCount = await prisma.transaction.count();
      const budgetCount = await prisma.budget.count();
      console.log(`📊 Current registered user count: ${userCount}`);
      console.log(`📊 Current transaction count: ${txCount}`);
      console.log(`📊 Current budget count: ${budgetCount}`);
    } catch (err: unknown) {
      console.error('Error querying schema details:', err);
    }
  } else {
    console.log('❌ Connection to PostgreSQL: FAILED / NOT REACHABLE');
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal check error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
