import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Connection configuration
// Defaults to standard local PostgreSQL connection without Docker
const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || '5432'}/${process.env.PGDATABASE || 'smashzone'}`;

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 3000,
});

export let isPostgresConnected = false;

/**
 * Automatically initializes PostgreSQL tables and seeds initial branches/courts
 * Reads /schema.sql and executes it on first launch.
 */
export async function initPostgres(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT current_database(), current_user;');
      isPostgresConnected = true;
      console.log(`✅ [PostgreSQL] Connected successfully to database: "${res.rows[0].current_database}" as user: "${res.rows[0].current_user}"`);

      // Check if tables exist
      const tableCheck = await client.query(
        "SELECT to_regclass('public.bookings') as has_bookings;"
      );

      if (!tableCheck.rows[0].has_bookings) {
        console.log('🔄 [PostgreSQL] Initializing tables and seeding initial records from schema.sql...');
        const schemaPath = path.resolve(import.meta.dirname || '.', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf-8');
          await client.query(sql);
          console.log('✨ [PostgreSQL] Tables, constraints, and seed data created successfully!');
        }
      } else {
        console.log('⚡ [PostgreSQL] Database tables verified and ready.');
      }

      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    isPostgresConnected = false;
    console.warn(`⚠️ [PostgreSQL] Could not connect to PostgreSQL (${err.message}).`);
    console.warn(`👉 To use local PostgreSQL without Docker:`);
    console.warn(`   1. Install PostgreSQL from https://www.postgresql.org/download/`);
    console.warn(`   2. Create a database: CREATE DATABASE smashzone;`);
    console.warn(`   3. Put your credentials in .env (DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/smashzone)`);
    console.warn(`   (The server will continue running using the active in-memory relational store)`);
    return false;
  }
}

/**
 * Execute SQL query with parameter binding
 */
export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}
