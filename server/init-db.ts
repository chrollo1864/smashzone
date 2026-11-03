import { pool, initPostgres } from './pg.ts';

async function run() {
  console.log('🚀 Connecting to PostgreSQL and initializing SmashZone schema...');
  const success = await initPostgres();
  if (success) {
    console.log('✅ PostgreSQL setup completed successfully!');
  } else {
    console.error('❌ Failed to connect to PostgreSQL. Check your credentials in .env');
  }
  await pool.end();
}

run();
