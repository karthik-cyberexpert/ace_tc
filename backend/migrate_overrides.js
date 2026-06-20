const pool = require('./db');

async function migrate() {
  try {
    console.log('Starting Overrides Schema Migration...');
    const [columns] = await pool.query('SHOW COLUMNS FROM certificates');
    const columnNames = columns.map(c => c.Field);
    
    if (!columnNames.includes('override_course')) {
      console.log('Adding override_course column...');
      await pool.query("ALTER TABLE certificates ADD COLUMN override_course VARCHAR(100) DEFAULT NULL");
    }
    if (!columnNames.includes('override_branch')) {
      console.log('Adding override_branch column...');
      await pool.query("ALTER TABLE certificates ADD COLUMN override_branch VARCHAR(100) DEFAULT NULL");
    }
    if (!columnNames.includes('override_admissionNo')) {
      console.log('Adding override_admissionNo column...');
      await pool.query("ALTER TABLE certificates ADD COLUMN override_admissionNo VARCHAR(50) DEFAULT NULL");
    }
    if (!columnNames.includes('override_batchStart')) {
      console.log('Adding override_batchStart column...');
      await pool.query("ALTER TABLE certificates ADD COLUMN override_batchStart VARCHAR(10) DEFAULT NULL");
    }
    if (!columnNames.includes('override_batchEnd')) {
      console.log('Adding override_batchEnd column...');
      await pool.query("ALTER TABLE certificates ADD COLUMN override_batchEnd VARCHAR(10) DEFAULT NULL");
    }
    
    console.log('Database Migration Complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
