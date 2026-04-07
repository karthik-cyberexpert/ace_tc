const mysql = require('mysql2/promise');
const shortCodes = require('./shortCodes.json');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ace_tc',
});

const generateAuthCode = (s) => {
  const courseCode = (s.course || '').replace(/\./g, '').toUpperCase();
  const yearCode = (s.batchStart || '').toString().slice(-2);
  const mappingKey = `${s.course} ${s.branch}`;
  const branchShort = shortCodes[mappingKey] || shortCodes[s.branch] || (s.branch || 'XX').substring(0, 3).toUpperCase();
  const regSuffix = (s.registerNo || '').toString().slice(-3);
  return `${courseCode}${yearCode}${branchShort}${regSuffix}`;
};

async function migrate() {
  try {
    console.log('Starting S.No Migration...');
    const [certs] = await pool.query(`
      SELECT c.id, s.course, s.branch, s.batchStart, s.registerNo 
      FROM certificates c 
      JOIN students s ON c.student_id = s.id
    `);

    for (const cert of certs) {
      const newCode = generateAuthCode(cert);
      console.log(`Updating Cert ID ${cert.id}: ${newCode}`);
      await pool.query('UPDATE certificates SET auth_code = ? WHERE id = ?', [newCode, cert.id]);
    }

    console.log('Migration Complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration Failed:', err);
    process.exit(1);
  }
}

migrate();
