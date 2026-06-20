const pool = require('./db');

async function migrate() {
  try {
    console.log('Starting Course Completion Schema Migration...');
    
    // Check if columns already exist
    const [columns] = await pool.query('SHOW COLUMNS FROM certificates');
    const columnNames = columns.map(c => c.Field);
    
    if (!columnNames.includes('cert_type')) {
      console.log('Adding cert_type column...');
      await pool.query("ALTER TABLE certificates ADD COLUMN cert_type ENUM('TC', 'CC') NOT NULL DEFAULT 'TC' AFTER student_id");
    }
    
    if (!columnNames.includes('ccResultMonthYear')) {
      console.log('Adding ccResultMonthYear column...');
      await pool.query("ALTER TABLE certificates ADD COLUMN ccResultMonthYear VARCHAR(255) DEFAULT NULL AFTER tcScholarshipScheme");
    }
    
    if (!columnNames.includes('ccConduct')) {
      console.log('Adding ccConduct column...');
      await pool.query("ALTER TABLE certificates ADD COLUMN ccConduct VARCHAR(255) DEFAULT NULL AFTER ccResultMonthYear");
    }
    
    console.log('Database Migration Complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
