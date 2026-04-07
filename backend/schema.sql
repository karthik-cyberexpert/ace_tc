CREATE DATABASE IF NOT EXISTS ace_tc;
USE ace_tc;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('Admin', 'Office', 'Principal') NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  onboarding BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registerNo VARCHAR(50) UNIQUE NOT NULL,
  admissionNo VARCHAR(50) NOT NULL,
  umisNo VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  fatherName VARCHAR(255),
  nationality VARCHAR(100),
  religion VARCHAR(100),
  caste VARCHAR(100),
  dob DATE,
  dateOfAdmission DATE,
  course VARCHAR(100),
  branch VARCHAR(100),
  mediumOfInstruction VARCHAR(50),
  batchStart VARCHAR(10),
  batchEnd VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  issue_date DATE NOT NULL,
  auth_code VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  tcPromotion ENUM('yes', 'no') DEFAULT 'yes',
  tcCompleted ENUM('yes', 'no') DEFAULT 'yes',
  tcFeesPaid ENUM('yes', 'no') DEFAULT 'yes',
  tcLeftDate DATE,
  tcApplyDate DATE,
  tcConduct VARCHAR(255),
  tcScholarship ENUM('yes', 'no') DEFAULT 'no',
  tcScholarshipScheme VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Seed default users
INSERT IGNORE INTO users (name, email, role, password, username) VALUES 
('System Admin', 'admin@ace.edu', 'Admin', 'admin123', 'admin'),
('Office Staff', 'office@ace.edu', 'Office', 'office123', 'office'),
('Principal', 'principal@ace.edu', 'Principal', 'principal123', 'principal');
