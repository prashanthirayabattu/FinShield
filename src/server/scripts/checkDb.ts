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
        WHERE table_schema = 'public' AND table_name IN ('users', 'transactions');
      `;

      const hasUsersTable = tables.some((t) => t.table_name === 'users');
      const hasTransactionsTable = tables.some((t) => t.table_name === 'transactions');

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

      // 3. Check Foreign Keys on transactions table
      const foreignKeys = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
          AND table_name = 'transactions' 
          AND constraint_type = 'FOREIGN KEY';
      `;
      const hasUserFkey = foreignKeys.some((fk) => fk.constraint_name === 'transactions_userId_fkey');
      if (hasUserFkey) {
        console.log('✅ Foreign Key "transactions_userId_fkey": VERIFIED');
      }

      // 4. Check Indexes
      const indexes = await prisma.$queryRaw<Array<{ tablename: string; indexname: string }>>`
        SELECT tablename, indexname 
        FROM pg_indexes 
        WHERE tablename IN ('users', 'transactions');
      `;

      const hasUniqueEmail = indexes.some((idx) => idx.indexname === 'users_email_key');
      const hasUserIdx = indexes.some((idx) => idx.indexname === 'transactions_userId_idx');
      const hasUserDateIdx = indexes.some((idx) => idx.indexname === 'transactions_userId_transactionDate_idx');
      const hasUserTypeIdx = indexes.some((idx) => idx.indexname === 'transactions_userId_type_idx');
      const hasUserCategoryIdx = indexes.some((idx) => idx.indexname === 'transactions_userId_category_idx');

      if (hasUniqueEmail) {
        console.log('✅ Unique constraint "users_email_key": VERIFIED');
      }
      if (hasUserIdx) {
        console.log('✅ Index "transactions_userId_idx": VERIFIED');
      }
      if (hasUserDateIdx) {
        console.log('✅ Index "transactions_userId_transactionDate_idx": VERIFIED');
      }
      if (hasUserTypeIdx) {
        console.log('✅ Index "transactions_userId_type_idx": VERIFIED');
      }
      if (hasUserCategoryIdx) {
        console.log('✅ Index "transactions_userId_category_idx": VERIFIED');
      }

      const userCount = await prisma.user.count();
      const txCount = await prisma.transaction.count();
      console.log(`📊 Current registered user count: ${userCount}`);
      console.log(`📊 Current transaction count: ${txCount}`);
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
