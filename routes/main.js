const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// ── MEDICINES ────────────────────────────────────────────────

router.get('/medicines', auth(['doctor', 'pharmacist', 'admin', 'receptionist']), async (req, res) => {
  try {
    const type = req.query.type;
    let sql = `SELECT * FROM medicines WHERE is_active = 1`;
    const params = [];
    if (type) { sql += ` AND medicine_type = ?`; params.push(type); }
    sql += ' ORDER BY name';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/medicines', auth(['admin']), async (req, res) => {
  const { name, generic_name, medicine_type, dosage_form, strength, manufacturer, price, stock_quantity, description, precautions, side_effects } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO medicines (name, generic_name, medicine_type, dosage_form, strength, manufacturer, price, stock_quantity, description, precautions, side_effects) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [name, generic_name, medicine_type, dosage_form, strength, manufacturer, price, stock_quantity, description, precautions, side_effects]
    );
    res.status(201).json({ message: 'Medicine added', id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/medicines/:id', auth(['admin']), async (req, res) => {
  const { name, generic_name, medicine_type, dosage_form, strength, manufacturer, price, stock_quantity, description, precautions, side_effects, is_active } = req.body;
  try {
    await db.query(
      `UPDATE medicines SET name=?, generic_name=?, medicine_type=?, dosage_form=?, strength=?, manufacturer=?, price=?, stock_quantity=?, description=?, precautions=?, side_effects=?, is_active=? WHERE id=?`,
      [name, generic_name, medicine_type, dosage_form, strength, manufacturer, price, stock_quantity, description, precautions, side_effects, is_active, req.params.id]
    );
    res.json({ message: 'Medicine updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DISEASES ─────────────────────────────────────────────────

router.get('/diseases', auth(['doctor', 'admin', 'receptionist']), async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM diseases ORDER BY name`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/diseases', auth(['admin']), async (req, res) => {
  const { name, icd_code, description, category } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO diseases (name, icd_code, description, category) VALUES (?,?,?,?)`,
      [name, icd_code, description, category]
    );
    res.status(201).json({ message: 'Disease added', id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DOCTORS ──────────────────────────────────────────────────

router.get('/doctors', auth(['admin', 'receptionist', 'doctor', 'pharmacist']), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, specialization, doctor_type, qualification, license_number, is_on_leave, leave_from, leave_to, is_active FROM doctors WHERE is_active=1 ORDER BY full_name`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Doctor leave management
router.put('/doctors/:id/leave', auth(['doctor', 'admin']), async (req, res) => {
  const { is_on_leave, leave_reason, leave_from, leave_to } = req.body;
  // Doctor can only update own leave
  if (req.user.role === 'doctor' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ message: 'Cannot update another doctor leave' });
  }
  try {
    await db.query(
      `UPDATE doctors SET is_on_leave=?, leave_reason=?, leave_from=?, leave_to=? WHERE id=?`,
      [is_on_leave, leave_reason||null, leave_from||null, leave_to||null, req.params.id]
    );
    res.json({ message: 'Leave status updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── MESSAGES ─────────────────────────────────────────────────

router.post('/messages', auth(['doctor', 'receptionist', 'pharmacist', 'admin']), async (req, res) => {
  const { receiver_type, receiver_id, subject, message } = req.body;
  if (!receiver_type || !receiver_id || !message) {
    return res.status(400).json({ message: 'receiver_type, receiver_id and message are required' });
  }
  try {
    await db.query(
      `INSERT INTO messages (sender_type, sender_id, receiver_type, receiver_id, subject, message) VALUES (?,?,?,?,?,?)`,
      [req.user.role, req.user.id, receiver_type, receiver_id, subject || '', message]
    );
    res.status(201).json({ message: 'Message sent' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Helper: resolve a name for a role+id pair
async function resolveStaffName(db, type, id) {
  const tableMap = { doctor: 'doctors', receptionist: 'receptionists', pharmacist: 'pharmacists', admin: 'admins' };
  const table = tableMap[type];
  if (!table) return `${type} #${id}`;
  const [[row]] = await db.query(`SELECT full_name FROM ${table} WHERE id=?`, [id]);
  return row?.full_name || `${type} #${id}`;
}

router.get('/messages', auth(['doctor', 'receptionist', 'pharmacist', 'admin']), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM messages
       WHERE (receiver_type=? AND receiver_id=?) OR (sender_type=? AND sender_id=?)
       ORDER BY created_at DESC LIMIT 100`,
      [req.user.role, req.user.id, req.user.role, req.user.id]
    );
    // Resolve names for each unique sender/receiver combo
    const nameCache = {};
    const getKey = (type, id) => `${type}:${id}`;
    const resolveName = async (type, id) => {
      const key = getKey(type, id);
      if (!nameCache[key]) nameCache[key] = await resolveStaffName(db, type, id);
      return nameCache[key];
    };
    const enriched = await Promise.all(rows.map(async m => ({
      ...m,
      sender_name: await resolveName(m.sender_type, m.sender_id),
      receiver_name: await resolveName(m.receiver_type, m.receiver_id),
    })));
    res.json(enriched);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/messages/:id/read', auth(['doctor', 'receptionist', 'pharmacist', 'admin']), async (req, res) => {
  try {
    await db.query(`UPDATE messages SET is_read=1 WHERE id=? AND receiver_type=? AND receiver_id=?`,
      [req.params.id, req.user.role, req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get staff list for messaging
router.get('/staff', auth(['doctor', 'receptionist', 'pharmacist', 'admin']), async (req, res) => {
  try {
    const [doctors] = await db.query(`SELECT id, full_name, 'doctor' AS role FROM doctors WHERE is_active=1`);
    const [receptionists] = await db.query(`SELECT id, full_name, 'receptionist' AS role FROM receptionists WHERE is_active=1`);
    const [pharmacists] = await db.query(`SELECT id, full_name, 'pharmacist' AS role FROM pharmacists WHERE is_active=1`);
    res.json([...doctors, ...receptionists, ...pharmacists]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── NUTRITIONAL DEFICIENCY ───────────────────────────────────

// Public - no auth required (patients and guests can use this)
router.get('/nutrition', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM nutritional_conditions ORDER BY condition_name`);
    // Normalize symptoms: MySQL JSON column returns already-parsed arrays
    const normalized = rows.map(r => ({
      ...r,
      symptoms: Array.isArray(r.symptoms) ? r.symptoms :
        (typeof r.symptoms === 'string' ? JSON.parse(r.symptoms || '[]') : [])
    }));
    res.json(normalized);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/nutrition/check', async (req, res) => {
  const { symptoms } = req.body;
  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return res.status(400).json({ message: 'Please provide at least one symptom' });
  }
  try {
    const [conditions] = await db.query(`SELECT * FROM nutritional_conditions`);
    const scored = conditions.map(c => {
      // MySQL JSON column returns already-parsed value (array), not a string.
      // Handle both: already an array OR a JSON string (from older drivers).
      let condSymptoms = [];
      if (Array.isArray(c.symptoms)) {
        condSymptoms = c.symptoms;
      } else if (typeof c.symptoms === 'string') {
        try { condSymptoms = JSON.parse(c.symptoms); } catch { condSymptoms = []; }
      }

      const userSymptoms = symptoms.map(s => s.toLowerCase().trim());
      const matches = userSymptoms.filter(us =>
        condSymptoms.some(cs => {
          const csl = cs.toLowerCase().trim();
          return csl.includes(us) || us.includes(csl);
        })
      );

      return {
        ...c,
        symptoms: condSymptoms,   // return array, not raw JSON
        match_count: matches.length,
        match_symptoms: matches
      };
    })
    .filter(c => c.match_count > 0)
    .sort((a, b) => b.match_count - a.match_count);

    res.json(scored.slice(0, 5));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── BILLS ────────────────────────────────────────────────────

// POST /api/bills — generate bill; if payment_method included → paid immediately
router.post('/bills', auth(['receptionist', 'admin']), async (req, res) => {
  const {
    patient_id, registration_id, consultation_id, prescription_id,
    consultation_fee, medicine_cost, other_charges, discount, tax,
    payment_method, transaction_id, cheque_number, bank_name, payment_note
  } = req.body;

  if (!patient_id) return res.status(400).json({ message: 'Patient is required' });

  try {
    const billNumber = 'OJH-' + Date.now();
    const total = (
      parseFloat(consultation_fee||0) +
      parseFloat(medicine_cost||0) +
      parseFloat(other_charges||0) +
      parseFloat(tax||0)
    ) - parseFloat(discount||0);

    // If payment method given → collect now → paid; else → unpaid (pay later)
    const paymentStatus = payment_method ? 'paid' : 'unpaid';

    const [result] = await db.query(
      `INSERT INTO bills
        (patient_id, registration_id, consultation_id, prescription_id,
         bill_number, consultation_fee, medicine_cost, other_charges, discount, tax,
         total_amount, payment_status, generated_by_type, generated_by_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [patient_id, registration_id||null, consultation_id||null, prescription_id||null,
       billNumber, consultation_fee||0, medicine_cost||0, other_charges||0, discount||0, tax||0,
       total, paymentStatus, req.user.role, req.user.id]
    );

    const billId = result.insertId;

    // Create fee_collection record when payment is collected at bill time
    if (payment_method && total > 0) {
      await db.query(
        `INSERT INTO fee_collections
          (registration_id, patient_id, receptionist_id, amount, payment_method,
           payment_status, transaction_id, cheque_number, bank_name, notes)
         VALUES (?,?,?,?,?,'completed',?,?,?,?)`,
        [registration_id||null, patient_id, req.user.id, total, payment_method,
         transaction_id||null, cheque_number||null, bank_name||null,
         payment_note||`Bill ${billNumber}`]
      );
    }

    // Mark registration complete
    if (registration_id) {
      await db.query(
        `UPDATE patient_registrations SET status='completed' WHERE id=?`,
        [registration_id]
      );
    }

    res.status(201).json({
      message: 'Bill generated',
      bill_id: billId,
      bill_number: billNumber,
      total,
      payment_status: paymentStatus
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/bills/:id/payment — mark unpaid bill as paid (collect payment later)
router.patch('/bills/:id/payment', auth(['receptionist', 'admin']), async (req, res) => {
  const { payment_method, transaction_id, cheque_number, bank_name, notes } = req.body;
  if (!payment_method) return res.status(400).json({ message: 'payment_method is required' });
  try {
    const [[bill]] = await db.query(`SELECT * FROM bills WHERE id=?`, [req.params.id]);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.payment_status === 'paid') return res.status(400).json({ message: 'Bill already paid' });

    await db.query(`UPDATE bills SET payment_status='paid' WHERE id=?`, [req.params.id]);

    await db.query(
      `INSERT INTO fee_collections
        (registration_id, patient_id, receptionist_id, amount, payment_method,
         payment_status, transaction_id, cheque_number, bank_name, notes)
       VALUES (?,?,?,?,?,'completed',?,?,?,?)`,
      [bill.registration_id||null, bill.patient_id, req.user.id, bill.total_amount,
       payment_method, transaction_id||null, cheque_number||null, bank_name||null,
       notes||`Payment for ${bill.bill_number}`]
    );

    res.json({ message: 'Bill marked as paid' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/bills/:id', auth(['admin', 'receptionist', 'patient', 'doctor']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*,
        u.full_name AS patient_name, u.phone AS patient_phone, u.address AS patient_address,
        d.full_name AS doctor_name
      FROM bills b
      JOIN users u ON b.patient_id = u.id
      LEFT JOIN consultations c ON b.consultation_id = c.id
      LEFT JOIN doctors d ON c.doctor_id = d.id
      WHERE b.id = ?
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Bill not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/bills', auth(['admin', 'receptionist', 'patient']), async (req, res) => {
  try {
    let sql = `SELECT b.*, u.full_name AS patient_name FROM bills b JOIN users u ON b.patient_id = u.id`;
    const params = [];
    if (req.user.role === 'patient') { sql += ' WHERE b.patient_id=?'; params.push(req.user.id); }
    sql += ' ORDER BY b.generated_at DESC LIMIT 100';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── ADMIN MANAGEMENT ─────────────────────────────────────────

// Admin: manage staff
router.post('/admin/staff', auth(['admin']), async (req, res) => {
  const { role, full_name, email, phone, password, ...extra } = req.body;
  const tables = { doctor: 'doctors', receptionist: 'receptionists', pharmacist: 'pharmacists' };
  if (!tables[role]) return res.status(400).json({ message: 'Invalid role' });

  try {
    const hash = await bcrypt.hash(password, 10);
    let sql, params;

    if (role === 'doctor') {
      sql = `INSERT INTO doctors (full_name, email, phone, password_hash, specialization, doctor_type, qualification, license_number) VALUES (?,?,?,?,?,?,?,?)`;
      params = [full_name, email, phone, hash, extra.specialization, extra.doctor_type || 'junior_resident', extra.qualification, extra.license_number];
    } else if (role === 'receptionist') {
      sql = `INSERT INTO receptionists (full_name, email, phone, password_hash, employee_id) VALUES (?,?,?,?,?)`;
      params = [full_name, email, phone, hash, extra.employee_id];
    } else {
      sql = `INSERT INTO pharmacists (full_name, email, phone, password_hash, license_number) VALUES (?,?,?,?,?)`;
      params = [full_name, email, phone, hash, extra.license_number];
    }

    const [result] = await db.query(sql, params);
    res.status(201).json({ message: `${role} added`, id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: toggle user/staff active
router.put('/admin/toggle-active', auth(['admin']), async (req, res) => {
  const { role, id, is_active } = req.body;
  const tables = { patient: 'users', doctor: 'doctors', receptionist: 'receptionists', pharmacist: 'pharmacists' };
  if (!tables[role]) return res.status(400).json({ message: 'Invalid role' });
  try {
    await db.query(`UPDATE ${tables[role]} SET is_active=? WHERE id=?`, [is_active, id]);
    res.json({ message: 'Status updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin dashboard stats
router.get('/admin/stats', auth(['admin']), async (req, res) => {
  try {
    const [[{ patients }]] = await db.query(`SELECT COUNT(*) as patients FROM users`);
    const [[{ doctors }]] = await db.query(`SELECT COUNT(*) as doctors FROM doctors WHERE is_active=1`);
    const [[{ receptionists }]] = await db.query(`SELECT COUNT(*) as receptionists FROM receptionists WHERE is_active=1`);
    const [[{ pharmacists }]] = await db.query(`SELECT COUNT(*) as pharmacists FROM pharmacists WHERE is_active=1`);
    const [[{ today_registrations }]] = await db.query(`SELECT COUNT(*) as today_registrations FROM patient_registrations WHERE DATE(registration_date)=CURDATE()`);
    const [[{ today_revenue }]] = await db.query(`SELECT COALESCE(SUM(amount),0) as today_revenue FROM fee_collections WHERE DATE(payment_date)=CURDATE() AND payment_status='completed'`);
    const [[{ consultations }]] = await db.query(`SELECT COUNT(*) as consultations FROM consultations WHERE DATE(created_at)=CURDATE()`);
    const [[{ medicines }]] = await db.query(`SELECT COUNT(*) as medicines FROM medicines WHERE is_active=1`);

    res.json({ patients, doctors, receptionists, pharmacists, today_registrations, today_revenue, consultations, medicines });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;