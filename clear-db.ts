import { pool } from './server/db';
import dotenv from 'dotenv';

dotenv.config();

async function clearDatabase() {
  console.log('🗑️  Clearing database completely...');

  try {
    // Get all table names
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%' 
      AND tablename NOT LIKE 'information_schema%'
    `);
    
    const tables = tablesResult.rows;
    console.log(`📋 Found ${tables.length} tables to drop:`);
    tables.forEach((table: any) => console.log(`  - ${table.tablename}`));
    
    // Drop all tables
    for (const table of tables) {
      console.log(`🗑️  Dropping table: ${table.tablename}`);
      await pool.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
    }
    
    console.log('✅ Database completely cleared!');
    console.log('📋 All tables dropped successfully');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the function
clearDatabase()
  .then(() => {
    console.log('🎉 Database clear operation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database clear operation failed:', error);
    process.exit(1);
  }); 