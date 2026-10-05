import { prisma, checkDatabaseConnection } from '../db/prisma';
import { env } from '../config/env';

async function main() {
  console.log('--- FinShield PostgreSQL & Prisma Verification ---');
  console.log(`Configured DATABASE_URL target: ${env.DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);

  const isConnected = await checkDatabaseConnection();

  if (isConnected) {
    console.log('✅ Connection to PostgreSQL: SUCCESS');

    try {
      // Check if users table exists in public schema
      const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users';
      `;

      if (tables.length > 0) {
        console.log('✅ Table "users": FOUND in public schema');

        const userCount = await prisma.user.count();
        console.log(`📊 Current registered user count in database: ${userCount}`);
      } else {
        console.log('⚠️  Table "users": NOT FOUND. Pending migration execution:');
        console.log('   Run: npx prisma migrate deploy --schema=src/prisma/schema.prisma');
      }
    } catch (err: unknown) {
      console.error('Error querying schema:', err);
    }
  } else {
    console.log('❌ Connection to PostgreSQL: FAILED / NOT REACHABLE');
    console.log('\nDiagnostic Details:');
    console.log('- No PostgreSQL service responded on the configured DATABASE_URL.');
    console.log('- Local fallback in-memory store remains active to prevent server crashes.');
    console.log('\nTo connect to a real PostgreSQL instance:');
    console.log('1. For local PostgreSQL service:');
    console.log('   Ensure PostgreSQL service is running and listening on localhost:5432.');
    console.log('2. For Docker:');
    console.log('   docker run -d --name finshield-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=finshield -p 5432:5432 postgres:16-alpine');
    console.log('3. For cloud PostgreSQL (e.g., Neon, Render, Supabase):');
    console.log('   Set DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require" in src/server/.env');
    console.log('4. Once running, apply migrations:');
    console.log('   npx prisma migrate deploy --schema=src/prisma/schema.prisma');
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal check error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
