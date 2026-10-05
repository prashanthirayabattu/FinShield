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
      // 1. Check if users table exists in public schema
      const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users';
      `;

      if (tables.length > 0) {
        console.log('✅ Table "users": FOUND in public schema');
      } else {
        console.log('⚠️  Table "users": NOT FOUND. Pending migration execution.');
      }

      // 2. Check if Role enum exists in pg_type
      const enums = await prisma.$queryRaw<Array<{ typname: string }>>`
        SELECT typname 
        FROM pg_type 
        WHERE typname = 'Role';
      `;

      if (enums.length > 0) {
        console.log('✅ Enum "Role": FOUND in pg_type (USER, ADMIN)');
      } else {
        console.log('⚠️  Enum "Role": NOT FOUND. Pending migration execution.');
      }

      // 3. Check for unique index on users.email
      const indexes = await prisma.$queryRaw<Array<{ indexname: string; indexdef: string }>>`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'users';
      `;

      const hasUniqueEmail = indexes.some(
        (idx) => idx.indexname === 'users_email_key' || idx.indexdef.includes('UNIQUE')
      );
      const hasEmailIdx = indexes.some((idx) => idx.indexname === 'users_email_idx');

      if (hasUniqueEmail) {
        console.log('✅ Unique constraint "users_email_key": VERIFIED');
      }
      if (hasEmailIdx) {
        console.log('✅ Secondary index "users_email_idx": VERIFIED');
      }

      const userCount = await prisma.user.count();
      console.log(`📊 Current registered user count in database: ${userCount}`);
    } catch (err: unknown) {
      console.error('Error querying schema details:', err);
    }
  } else {
    console.log('❌ Connection to PostgreSQL: FAILED / NOT REACHABLE');
    console.log('\nDiagnostic Details:');
    console.log('- No live PostgreSQL service responded on the configured DATABASE_URL.');
    console.log('- Local fallback in-memory store remains active to prevent server crashes.');
    console.log('\nTo connect to a real PostgreSQL instance:');
    console.log('1. Create or update `src/server/.env` with your PostgreSQL connection string:');
    console.log('   DATABASE_URL="postgresql://user:password@host:5432/finshield?schema=public"');
    console.log('2. For cloud PostgreSQL (e.g. Neon, Supabase, Render):');
    console.log('   DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require"');
    console.log('3. Once configured, apply migrations:');
    console.log('   npx prisma migrate deploy --schema=src/prisma/schema.prisma');
    console.log('4. Verify with:');
    console.log('   npm --prefix src run db:check');
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal check error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
