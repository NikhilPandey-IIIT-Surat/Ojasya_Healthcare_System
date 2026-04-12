const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// ── FEE COLLECTION ──────────────────────────────────────────

// POST /api/fees - collect fee
router.post('/fees', auth(['receptionist', 'admin']), async (req, res) => {
  const { registration_id, patient_id, amount, payment_method, transaction_id, cheque_number, bank_name, notes } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO fee_collections (registration_id, patient_id, receptionist_id, amount, payment_method, payment_status, transaction_id, cheque_number, bank_name, notes)
       VALUES (?,?,?,?,?,'completed',?,?,?,?)`,
      [registration_id, patient_id, req.user.id, amount, payment_method, transaction_id||null, cheque_number||null, bank_name||null, notes||null]
    );
    res.status(201).json({ message: 'Fee collected', fee_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/fees - list fees
router.get('/fees', auth(['admin', 'receptionist']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT fc.*, u.full_name AS patient_name, r.full_name AS receptionist_name
      FROM fee_collections fc
      JOIN users u ON fc.patient_id = u.id
      JOIN receptionists r ON fc.receptionist_id = r.id
      ORDER BY fc.payment_date DESC LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── CONSULTATIONS ────────────────────────────────────────────

// GET /api/consultations - doctor sees own; admin/receptionist sees all; patient sees own
router.get('/consultations', auth(['doctor', 'admin', 'receptionist', 'patient']), async (req, res) => {
  try {
    let sql = `
      SELECT c.*, u.full_name AS patient_name, d.full_name AS doctor_name, d.doctor_type,
        pr.visit_type, di.name AS disease_name
      FROM consultations c
      JOIN users u ON c.patient_id = u.id
      JOIN doctors d ON c.doctor_id = d.id
      LEFT JOIN patient_registrations pr ON c.registration_id = pr.id
      LEFT JOIN diseases di ON c.diagnosis_disease_id = di.id
    `;
    const params = [];
    if (req.user.role === 'doctor') {
      sql += ' WHERE c.doctor_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'patient') {
      sql += ' WHERE c.patient_id = ?';
      params.push(req.user.id);
    }
    sql += ' ORDER BY c.created_at DESC LIMIT 100';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/consultations - create consultation (assign doctor)
router.post('/consultations', auth(['receptionist', 'admin']), async (req, res) => {
  const { registration_id, patient_id, doctor_id, medication_type, chief_complaint, symptoms } = req.body;
  try {
    const [docRows] = await db.query(`SELECT is_on_leave FROM doctors WHERE id = ?`, [doctor_id]);
    if (!docRows.length) return res.status(404).json({ message: 'Doctor not found' });
    if (docRows[0].is_on_leave) return res.status(400).json({ message: 'Doctor is currently on leave' });

    const [result] = await db.query(
      `INSERT INTO consultations (registration_id, patient_id, doctor_id, medication_type, chief_complaint, symptoms, status)
       VALUES (?,?,?,?,?,?,'scheduled')`,
      [registration_id, patient_id, doctor_id, medication_type, chief_complaint, symptoms]
    );

    // Update registration status
    await db.query(`UPDATE patient_registrations SET status='in_consultation' WHERE id=?`, [registration_id]);

    res.status(201).json({ message: 'Consultation created', consultation_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/consultations/:id - doctor updates consultation
router.put('/consultations/:id', auth(['doctor', 'admin']), async (req, res) => {
  const { diagnosis, diagnosis_disease_id, notes, follow_up_date, status } = req.body;
  try {
    const completedAt = status === 'completed' ? new Date() : null;
    await db.query(
      `UPDATE consultations SET diagnosis=?, diagnosis_disease_id=?, notes=?, follow_up_date=?, status=?, completed_at=? WHERE id=?`,
      [diagnosis, diagnosis_disease_id||null, notes, follow_up_date||null, status, completedAt, req.params.id]
    );
    res.json({ message: 'Consultation updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PRESCRIPTIONS ────────────────────────────────────────────

// POST /api/prescriptions - doctor creates prescription
router.post('/prescriptions', auth(['doctor']), async (req, res) => {
  const { consultation_id, patient_id, notes, items } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO prescriptions (consultation_id, patient_id, doctor_id, notes) VALUES (?,?,?,?)`,
      [consultation_id, patient_id, req.user.id, notes]
    );
    const prescriptionId = result.insertId;

    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          `INSERT INTO prescription_items (prescription_id, medicine_id, dosage, frequency, duration, quantity, instructions) VALUES (?,?,?,?,?,?,?)`,
          [prescriptionId, item.medicine_id, item.dosage, item.frequency, item.duration, item.quantity, item.instructions||null]
        );
      }
    }

    res.status(201).json({ message: 'Prescription created', prescription_id: prescriptionId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/prescriptions/:id - get prescription with items
router.get('/prescriptions/:id', auth(['doctor', 'pharmacist', 'admin', 'patient', 'receptionist']), async (req, res) => {
  try {
    const [pRows] = await db.query(`
      SELECT p.*, u.full_name AS patient_name, d.full_name AS doctor_name, d.doctor_type,
        c.medication_type, c.diagnosis
      FROM prescriptions p
      JOIN users u ON p.patient_id = u.id
      JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN consultations c ON p.consultation_id = c.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!pRows.length) return res.status(404).json({ message: 'Prescription not found' });

    const [items] = await db.query(`
      SELECT pi.*, m.name AS medicine_name, m.medicine_type, m.dosage_form, m.strength,
        m.precautions, m.side_effects
      FROM prescription_items pi
      JOIN medicines m ON pi.medicine_id = m.id
      WHERE pi.prescription_id = ?
    `, [req.params.id]);

    res.json({ ...pRows[0], items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/prescriptions - list (doctor/pharmacist/admin/patient)
router.get('/prescriptions', auth(['doctor', 'pharmacist', 'admin', 'patient']), async (req, res) => {
  try {
    let sql = `
      SELECT p.*, u.full_name AS patient_name, d.full_name AS doctor_name, d.doctor_type,
        c.medication_type, c.diagnosis
      FROM prescriptions p
      JOIN users u ON p.patient_id = u.id
      JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN consultations c ON p.consultation_id = c.id
    `;
    const params = [];
    if (req.user.role === 'doctor') {
      sql += ' WHERE p.doctor_id = ?'; params.push(req.user.id);
    } else if (req.user.role === 'patient') {
      sql += ' WHERE p.patient_id = ?'; params.push(req.user.id);
    }
    sql += ' ORDER BY p.created_at DESC LIMIT 50';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DISPENSING ───────────────────────────────────────────────

// POST /api/dispensing - pharmacist dispenses
router.post('/dispensing', auth(['pharmacist']), async (req, res) => {
  const { prescription_id, patient_id, dosage_instructions, precautions_given, notes } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO dispensing_records (prescription_id, pharmacist_id, patient_id, dosage_instructions, precautions_given, notes)
       VALUES (?,?,?,?,?,?)`,
      [prescription_id, req.user.id, patient_id, dosage_instructions, precautions_given, notes]
    );
    await db.query(`UPDATE prescriptions SET status='dispensed' WHERE id=?`, [prescription_id]);
    res.status(201).json({ message: 'Medicines dispensed', record_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
