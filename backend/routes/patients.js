const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/patients - list all (admin, receptionist, doctor, pharmacist)
router.get('/', auth(['admin', 'receptionist', 'doctor', 'pharmacist']), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, dob, gender, blood_group, address, created_at, is_active
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/patients/register-visit — MUST be before /:id to avoid param collision
router.post('/register-visit', auth(['receptionist', 'admin']), async (req, res) => {
  const { patient_id, chief_complaint, visit_type } = req.body;
  if (!patient_id || !chief_complaint) {
    return res.status(400).json({ message: 'patient_id and chief_complaint are required' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO patient_registrations (patient_id, receptionist_id, chief_complaint, visit_type) VALUES (?,?,?,?)`,
      [patient_id, req.user.id, chief_complaint, visit_type || 'opd']
    );
    res.status(201).json({ message: 'Patient visit registered', registration_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/patients/:id — patient can only fetch their own record
router.get('/:id', auth(['admin', 'receptionist', 'doctor', 'pharmacist', 'patient']), async (req, res) => {
  // Patients can only view their own profile
  if (req.user.role === 'patient' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, dob, gender, blood_group, address, created_at FROM users WHERE id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Patient not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/patients/:id — update patient (admin + receptionist)
router.put('/:id', auth(['admin', 'receptionist']), async (req, res) => {
  const { full_name, phone, dob, gender, address, blood_group } = req.body;
  if (!full_name) return res.status(400).json({ message: 'full_name is required' });
  try {
    await db.query(
      `UPDATE users SET full_name=?, phone=?, dob=?, gender=?, address=?, blood_group=? WHERE id=?`,
      [full_name, phone || null, dob || null, gender || null, address || null, blood_group || null, req.params.id]
    );
    res.json({ message: 'Patient updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/patients/:id/history — patient can only see their own history
router.get('/:id/history', auth(['admin', 'receptionist', 'doctor', 'pharmacist', 'patient']), async (req, res) => {
  if (req.user.role === 'patient' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const [rows] = await db.query(`
      SELECT pr.*, r.full_name AS receptionist_name,
        c.id AS consultation_id, c.medication_type, c.diagnosis, c.status AS consult_status,
        d.full_name AS doctor_name, d.specialization
      FROM patient_registrations pr
      LEFT JOIN receptionists r ON pr.receptionist_id = r.id
      LEFT JOIN consultations c ON c.registration_id = pr.id
      LEFT JOIN doctors d ON c.doctor_id = d.id
      WHERE pr.patient_id = ?
      ORDER BY pr.registration_date DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
