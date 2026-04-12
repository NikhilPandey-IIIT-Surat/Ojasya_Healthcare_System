const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const signToken = (id, role, name, email) =>
  jwt.sign({ id, role, name, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });

// TABLE MAP
const roleMap = {
  patient: 'users',
  doctor: 'doctors',
  receptionist: 'receptionists',
  pharmacist: 'pharmacists',
  admin: 'admins'
};

// POST /api/auth/register  (patient / doctor / receptionist / pharmacist)
router.post('/register', async (req, res) => {
  const { role, email, password, full_name, phone, ...extra } = req.body;

  if (!roleMap[role] || role === 'admin') {
    return res.status(400).json({ message: 'Invalid role for registration' });
  }

  try {
    const table = roleMap[role];
    const [existing] = await db.query(`SELECT id FROM ${table} WHERE email = ?`, [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    let sql, params;

    if (role === 'patient') {
      sql = `INSERT INTO users (full_name, email, phone, password_hash, dob, gender, address, blood_group) VALUES (?,?,?,?,?,?,?,?)`;
      params = [full_name, email, phone, hash, extra.dob||null, extra.gender||null, extra.address||null, extra.blood_group||null];
    } else if (role === 'doctor') {
      sql = `INSERT INTO doctors (full_name, email, phone, password_hash, specialization, doctor_type, qualification, license_number) VALUES (?,?,?,?,?,?,?,?)`;
      params = [full_name, email, phone, hash, extra.specialization||null, extra.doctor_type||'junior_resident', extra.qualification||null, extra.license_number||null];
    } else if (role === 'receptionist') {
      sql = `INSERT INTO receptionists (full_name, email, phone, password_hash, employee_id) VALUES (?,?,?,?,?)`;
      params = [full_name, email, phone, hash, extra.employee_id||null];
    } else if (role === 'pharmacist') {
      sql = `INSERT INTO pharmacists (full_name, email, phone, password_hash, license_number) VALUES (?,?,?,?,?)`;
      params = [full_name, email, phone, hash, extra.license_number||null];
    }

    const [result] = await db.query(sql, params);
    const token = signToken(result.insertId, role, full_name, email);

    // Return same shape as login — use full_name consistently
    res.status(201).json({
      message: 'Registered successfully',
      token,
      user: { id: result.insertId, role, full_name, email, phone: phone || null }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { role, email, password } = req.body;

  if (!roleMap[role]) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const table = roleMap[role];
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE email = ?`, [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (role !== 'admin' && user.is_active === 0) {
      return res.status(403).json({ message: 'Account deactivated. Contact admin.' });
    }

    const token = signToken(user.id, role, user.full_name, user.email);
    const { password_hash, ...userData } = user;

    res.json({ message: 'Login successful', token, user: { ...userData, role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
