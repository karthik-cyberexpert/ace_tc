const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.VITE_BACKEND_PORT || 5014;

const shortCodes = require('./shortCodes.json');

const generateAuthCode = (s, certType = 'TC') => {
  const prefix = certType === 'CC' ? 'CC' : '';
  const courseCode = (s.course || '').replace(/\./g, '').toUpperCase();
  const yearCode = (s.batchStart || '').toString().slice(-2);
  const mappingKey = `${s.course} ${s.branch}`;
  const branchShort = shortCodes[mappingKey] || shortCodes[s.branch] || (s.branch || 'XX').substring(0, 3).toUpperCase();
  const regSuffix = (s.registerNo || '').toString().slice(-3);
  return `${prefix}${courseCode}${yearCode}${branchShort}${regSuffix}`;
};

// Login Endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length > 0) {
      const user = rows[0];
      res.json({ success: true, id: user.id, role: user.role, name: user.name, onboarding: user.onboarding });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Users Endpoints
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, username, onboarding FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, role } = req.body;
  let { username } = req.body;
  if (!username || username.trim() === '') {
    username = (name || '').toLowerCase().replace(/\s+/g, '.') + '.' + Date.now().toString().slice(-4);
  }
  const defaultPassword = 'password123';
  try {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, role, password, username, onboarding) VALUES (?, ?, ?, ?, ?, TRUE)',
      [name, email, role, defaultPassword, username]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role, username } = req.body;
  try {
    await pool.query(
      'UPDATE users SET name=?, email=?, role=?, username=? WHERE id=?',
      [name, email, role, username, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users/:id/reset', async (req, res) => {
  const { id } = req.params;
  const defaultPassword = 'password123';
  try {
    await pool.query(
      'UPDATE users SET password=?, onboarding=FALSE WHERE id=?',
      [defaultPassword, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users/:id/onboard', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  try {
    await pool.query(
      'UPDATE users SET password=?, onboarding=FALSE WHERE id=?',
      [password, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Students Endpoints
app.get('/api/students', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  const s = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO students (registerNo, admissionNo, umisNo, name, fatherName, nationality, religion, caste, dob, dateOfAdmission, course, branch, mediumOfInstruction, batchStart, batchEnd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [s.registerNo, s.admissionNo, s.umisNo, s.name, s.fatherName, s.nationality, s.religion, s.caste, s.dob, s.dateOfAdmission, s.course, s.branch, s.mediumOfInstruction, s.batchStart, s.batchEnd]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const s = req.body;
  try {
    await pool.query(
      'UPDATE students SET registerNo=?, admissionNo=?, umisNo=?, name=?, fatherName=?, nationality=?, religion=?, caste=?, dob=?, dateOfAdmission=?, course=?, branch=?, mediumOfInstruction=?, batchStart=?, batchEnd=? WHERE id=?',
      [s.registerNo, s.admissionNo, s.umisNo, s.name, s.fatherName, s.nationality, s.religion, s.caste, s.dob, s.dateOfAdmission, s.course, s.branch, s.mediumOfInstruction, s.batchStart, s.batchEnd, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM students WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/students/bulk', async (req, res) => {
  const students = req.body;
  if (!Array.isArray(students)) return res.status(400).json({ success: false, message: 'Expected an array of students' });
  
  try {
    const values = students.map(s => [
      s.registerNo, s.admissionNo || '', s.umisNo || '', s.name, s.fatherName || '', 
      s.nationality || 'Indian', s.religion || '', s.caste || '', s.dob || '', s.dateOfAdmission || '', 
      s.course, s.branch, s.mediumOfInstruction || 'English', s.batchStart, s.batchEnd
    ]);
    
    await pool.query(
      'INSERT INTO students (registerNo, admissionNo, umisNo, name, fatherName, nationality, religion, caste, dob, dateOfAdmission, course, branch, mediumOfInstruction, batchStart, batchEnd) VALUES ?',
      [values]
    );
    res.json({ success: true, count: students.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Certificates Endpoints
app.get('/api/certificates', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, s.name as studentName, s.registerNo, s.course, s.branch, s.batchStart, s.batchEnd, s.admissionNo, s.umisNo, s.fatherName, s.nationality, s.religion, s.caste, s.dob, s.dateOfAdmission, s.mediumOfInstruction 
      FROM certificates c 
      JOIN students s ON c.student_id = s.id 
      ORDER BY c.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/certificates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT c.*, s.name as studentName, s.registerNo, 
             COALESCE(c.override_course, s.course) as course, 
             COALESCE(c.override_branch, s.branch) as branch, 
             COALESCE(c.override_batchStart, s.batchStart) as batchStart, 
             COALESCE(c.override_batchEnd, s.batchEnd) as batchEnd, 
             COALESCE(c.override_admissionNo, s.admissionNo) as admissionNo, 
             s.umisNo, s.fatherName, s.nationality, s.religion, s.caste, s.dob, s.dateOfAdmission, s.mediumOfInstruction 
      FROM certificates c 
      JOIN students s ON s.id = c.student_id 
      WHERE c.id = ?`, [id]);
    if (rows.length > 0) res.json(rows[0]);
    else res.status(404).json({ success: false, message: 'Certificate not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/certificates', async (req, res) => {
  const c = req.body;
  try {
    const [students] = await pool.query('SELECT course, branch, batchStart, registerNo FROM students WHERE id = ?', [c.student_id]);
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found' });
    
    const authCodeDetails = {
      course: c.override_course || students[0].course,
      branch: c.override_branch || students[0].branch,
      batchStart: c.override_batchStart || students[0].batchStart,
      registerNo: students[0].registerNo
    };
    const auth_code = generateAuthCode(authCodeDetails, c.cert_type || 'TC');
    
    const [result] = await pool.query(
      'INSERT INTO certificates (student_id, cert_type, issue_date, auth_code, status, tcPromotion, tcCompleted, tcFeesPaid, tcLeftDate, tcApplyDate, tcConduct, tcScholarship, tcScholarshipScheme, ccResultMonthYear, ccConduct, override_course, override_branch, override_admissionNo, override_batchStart, override_batchEnd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [c.student_id, c.cert_type || 'TC', c.issue_date, auth_code, c.status || 'AWAITING AUTH', c.tcPromotion, c.tcCompleted, c.tcFeesPaid, c.tcLeftDate, c.tcApplyDate, c.tcConduct, c.tcScholarship, c.tcScholarshipScheme, c.ccResultMonthYear, c.ccConduct, c.override_course || null, c.override_branch || null, c.override_admissionNo || null, c.override_batchStart || null, c.override_batchEnd || null]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/certificates/bulk', async (req, res) => {
  const certs = req.body;
  if (!Array.isArray(certs)) return res.status(400).json({ success: false, message: 'Expected an array' });

  try {
    // Get all student IDs to fetch their details
    const studentIds = certs.map(c => c.student_id);
    const [studentInfo] = await pool.query('SELECT id, course, branch, batchStart, registerNo FROM students WHERE id IN (?)', [studentIds]);
    const studentMap = studentInfo.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});

    const values = certs.map(c => {
      const s = studentMap[c.student_id];
      const authCodeDetails = s ? {
        course: c.override_course || s.course,
        branch: c.override_branch || s.branch,
        batchStart: c.override_batchStart || s.batchStart,
        registerNo: s.registerNo
      } : null;
      const auth_code = authCodeDetails ? generateAuthCode(authCodeDetails, c.cert_type || 'TC') : `${c.cert_type || 'TC'}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      return [
        c.student_id, c.cert_type || 'TC', c.issue_date, auth_code, c.status || 'AWAITING AUTH',
        c.tcPromotion, c.tcCompleted, c.tcFeesPaid, c.tcLeftDate, c.tcApplyDate,
        c.tcConduct, c.tcScholarship, c.tcScholarshipScheme || '', c.ccResultMonthYear || null, c.ccConduct || null,
        c.override_course || null, c.override_branch || null, c.override_admissionNo || null, c.override_batchStart || null, c.override_batchEnd || null
      ];
    });

    await pool.query(
      'INSERT INTO certificates (student_id, cert_type, issue_date, auth_code, status, tcPromotion, tcCompleted, tcFeesPaid, tcLeftDate, tcApplyDate, tcConduct, tcScholarship, tcScholarshipScheme, ccResultMonthYear, ccConduct, override_course, override_branch, override_admissionNo, override_batchStart, override_batchEnd) VALUES ?',
      [values]
    );
    res.json({ success: true, count: certs.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/certificates/:id/authorize', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE certificates SET status = "ISSUED" WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/certificates/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE certificates SET status = "REJECTED" WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (Exposed to network)`);
});
