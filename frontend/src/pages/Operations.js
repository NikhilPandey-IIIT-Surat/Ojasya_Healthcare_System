import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// ── MESSAGES ─────────────────────────────────────────────────────────

export function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ receiver_type: '', receiver_id: '', subject: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [sendMsg, setSendMsg] = useState('');
  const [tab, setTab] = useState('inbox');

  useEffect(() => {
    fetchMessages();
    axios.get('/api/staff').then(r => setStaff(r.data.filter(s => !(s.role === user?.role && s.id === user?.id))));
  }, [user]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get('/api/messages');
      setMessages(res.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try { await axios.put(`/api/messages/${id}/read`); fetchMessages(); } catch (e) {}
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    setSendMsg('');
    try {
      await axios.post('/api/messages', form);
      setSendMsg('✅ Message sent!');
      setTimeout(() => { setShowCompose(false); setSendMsg(''); }, 1200);
      setForm({ receiver_type: '', receiver_id: '', subject: '', message: '' });
      fetchMessages();
    } catch (e) { setSendMsg('❌ ' + (e.response?.data?.message || 'Failed to send')); }
  };

  const inbox = messages.filter(m => m.receiver_type === user?.role && m.receiver_id === user?.id);
  const sent = messages.filter(m => m.sender_type === user?.role && m.sender_id === user?.id);
  const unreadCount = inbox.filter(m => !m.is_read).length;
  const displayed = tab === 'inbox' ? inbox : sent;

  const formatSender = (m) => {
    if (tab === 'inbox') return m.sender_name || `${m.sender_type} #${m.sender_id}`;
    return m.receiver_name || `${m.receiver_type} #${m.receiver_id}`;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap: 20 }}>
      <div>
        <div className="flex-between mb-16">
          <h2 style={{ color: 'var(--primary)' }}>✉️ Messages</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCompose(true)}>+ Compose</button>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'inbox' ? 'active' : ''}`} onClick={() => setTab('inbox')}>
            Inbox
            {unreadCount > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--danger)', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                {unreadCount}
              </span>
            )}
          </button>
          <button className={`tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>
            Sent ({sent.length})
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? <div className="loading">Loading...</div> : displayed.length === 0 ? (
            <div className="empty-state"><p>No messages in {tab}</p></div>
          ) : displayed.map(m => (
            <div key={m.id}
              onClick={() => { setSelected(m); if (tab === 'inbox' && !m.is_read) markRead(m.id); }}
              style={{
                padding: '14px 18px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
                background: selected?.id === m.id ? '#f0f4f8' : (!m.is_read && tab === 'inbox' ? '#f8fbff' : 'white')
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong style={{ fontSize: 13, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {!m.is_read && tab === 'inbox' && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }} />
                  )}
                  {tab === 'inbox' ? `From: ${formatSender(m)}` : `To: ${formatSender(m)}`}
                </strong>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(m.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              <p style={{ fontSize: 13, fontWeight: !m.is_read && tab === 'inbox' ? 600 : 400 }}>
                {m.subject || '(no subject)'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {m.message}
              </p>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="card">
          <div className="modal-header">
            <h3>{selected.subject || '(no subject)'}</h3>
            <button className="btn btn-sm btn-outline" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
            <p><strong>From:</strong> {selected.sender_name || `${selected.sender_type} #${selected.sender_id}`}</p>
            <p><strong>To:</strong> {selected.receiver_name || `${selected.receiver_type} #${selected.receiver_id}`}</p>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{new Date(selected.created_at).toLocaleString('en-IN')}</p>
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
            {selected.message}
          </div>
          <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }}
            onClick={() => {
              const s = staff.find(x => x.role === selected.sender_type && x.id === selected.sender_id);
              if (s) setForm({ receiver_type: s.role, receiver_id: s.id, subject: `Re: ${selected.subject || ''}`, message: '' });
              setShowCompose(true);
            }}>
            ↩ Reply
          </button>
        </div>
      )}

      {showCompose && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCompose(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Compose Message</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowCompose(false)}>✕</button>
            </div>
            {sendMsg && <div className={`alert ${sendMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{sendMsg}</div>}
            <form onSubmit={sendMessage}>
              <div className="form-group">
                <label className="form-label">To *</label>
                <select className="form-control" required
                  value={form.receiver_id ? `${form.receiver_type}|${form.receiver_id}` : ''}
                  onChange={e => {
                    const [type, id] = e.target.value.split('|');
                    setForm({ ...form, receiver_type: type, receiver_id: parseInt(id) });
                  }}>
                  <option value="">Select recipient</option>
                  {staff.map(s => (
                    <option key={`${s.role}|${s.id}`} value={`${s.role}|${s.id}`}>
                      {s.full_name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-control" placeholder="Message subject..." value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea className="form-control" rows={5} required value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCompose(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DISPENSE (Pharmacist) ─────────────────────────────────────────────

export function DispensePage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ dosage_instructions: '', precautions_given: '', notes: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    try {
      const res = await axios.get('/api/prescriptions');
      setPrescriptions(res.data.filter(p => p.status !== 'dispensed' && p.status !== 'completed'));
    } catch (e) {} finally { setLoading(false); }
  };

  const viewRx = async (p) => {
    try {
      const res = await axios.get(`/api/prescriptions/${p.id}`);
      setSelected(res.data);
      setForm({ dosage_instructions: '', precautions_given: '', notes: '' });
      setMsg('');
    } catch (e) {}
  };

  const dispense = async () => {
    if (!form.dosage_instructions.trim()) { setMsg('❌ Please enter dosage instructions for the patient'); return; }
    setSubmitting(true);
    try {
      await axios.post('/api/dispensing', {
        prescription_id: selected.id,
        patient_id: selected.patient_id,
        ...form
      });
      setMsg('✅ Medicines dispensed successfully! Patient has been counselled.');
      setSelected(null);
      fetchPending();
    } catch (e) { setMsg('❌ ' + (e.response?.data?.message || 'Error dispensing')); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20 }}>
      <div>
        <h2 style={{ color: 'var(--primary)', marginBottom: 16 }}>💊 Dispense Medicines</h2>
        {msg && (
          <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
            {msg}
          </div>
        )}
        <div className="card">
          <div className="card-header">
            <h3>Pending Prescriptions</h3>
            <span className="badge badge-warning">{prescriptions.length} pending</span>
          </div>
          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Date</th><th>Patient</th><th>Doctor</th><th>Type</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {prescriptions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 32 }}>
                      ✅ No pending prescriptions
                    </td></tr>
                  ) : prescriptions.map(p => (
                    <tr key={p.id}>
                      <td>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                      <td><strong>{p.patient_name}</strong></td>
                      <td>Dr. {p.doctor_name}</td>
                      <td>{p.medication_type && <span className={`badge badge-${p.medication_type}`}>{p.medication_type}</span>}</td>
                      <td><span className="badge badge-warning">{p.status}</span></td>
                      <td><button className="btn btn-sm btn-primary" onClick={() => viewRx(p)}>Dispense</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="card">
          <div className="modal-header">
            <h3>Dispense Rx #{selected.id}</h3>
            <button className="btn btn-sm btn-outline" onClick={() => setSelected(null)}>✕</button>
          </div>

          <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
            <strong>{selected.patient_name}</strong>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Dr. {selected.doctor_name} · {selected.doctor_type === 'senior_resident' ? 'Senior Resident' : 'Junior Resident'}
            </p>
            {selected.diagnosis && <p style={{ fontSize: 13, marginTop: 4 }}><strong>Dx:</strong> {selected.diagnosis}</p>}
          </div>

          <h4 style={{ marginBottom: 10, fontSize: 14 }}>Medicines to Dispense</h4>
          {(selected.items || []).length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13 }}>No medicines in this prescription.</p>
          ) : (selected.items || []).map((item, i) => (
            <div key={i} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8, background: '#f8fff8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 14 }}>{item.medicine_name}</strong>
                <span className={`badge badge-${item.medicine_type}`}>{item.medicine_type}</span>
              </div>
              <p style={{ fontSize: 12, marginTop: 2, color: 'var(--text-muted)' }}>
                {[item.dosage, item.frequency, item.duration, `Qty: ${item.quantity}`].filter(Boolean).join(' · ')}
              </p>
              {item.instructions && <p style={{ fontSize: 12, color: 'var(--accent-dark)', marginTop: 3 }}>📝 {item.instructions}</p>}
              {item.precautions && <p style={{ fontSize: 12, color: '#e67e22', marginTop: 3 }}>⚠️ {item.precautions}</p>}
              {item.side_effects && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 3 }}>❗ {item.side_effects}</p>}
            </div>
          ))}

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Dosage Instructions Given to Patient *</label>
            <textarea className="form-control" rows={3}
              placeholder="e.g. Take 1 tablet after breakfast, 1 after dinner with warm water..."
              value={form.dosage_instructions}
              onChange={e => setForm({ ...form, dosage_instructions: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Precautions Communicated</label>
            <textarea className="form-control" rows={2}
              placeholder="Food interactions, timing, storage, things to avoid..."
              value={form.precautions_given}
              onChange={e => setForm({ ...form, precautions_given: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Internal Notes</label>
            <input className="form-control" placeholder="Optional notes..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button className="btn btn-accent" onClick={dispense} disabled={submitting}>
            {submitting ? '⏳ Dispensing...' : '✓ Confirm Dispense & Counsel Patient'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── LEAVE MANAGEMENT (Doctor) ─────────────────────────────────────────

export function LeavePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ is_on_leave: false, leave_reason: '', leave_from: '', leave_to: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/doctors').then(r => {
      const me = r.data.find(d => d.id === user?.id);
      if (me) {
        setForm({
          is_on_leave: !!me.is_on_leave,
          leave_reason: me.leave_reason || '',
          // Safe slice — handle null, undefined, and ISO timestamps
          leave_from: me.leave_from ? String(me.leave_from).slice(0, 10) : '',
          leave_to: me.leave_to ? String(me.leave_to).slice(0, 10) : ''
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const save = async () => {
    setMsg('');
    try {
      await axios.put(`/api/doctors/${user?.id}/leave`, form);
      setMsg(form.is_on_leave
        ? '✅ Leave applied. Receptionist will see you as unavailable.'
        : '✅ You are now marked as available for consultations.'
      );
    } catch (e) { setMsg('❌ ' + (e.response?.data?.message || 'Error saving')); }
  };

  if (loading) return <div className="loading">Loading leave status...</div>;

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: 24 }}>🏖️ Leave Management</h2>

      {msg && (
        <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
          {msg}
        </div>
      )}

      <div className="card">
        <div className="card-header"><h3>My Leave Status</h3></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: form.is_on_leave ? '#fadbd8' : '#d5f5e3',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
          }}>
            {form.is_on_leave ? '🏖️' : '👨‍⚕️'}
          </div>
          <div>
            <strong style={{ fontSize: 15 }}>{form.is_on_leave ? 'Currently on Leave' : 'Currently Available'}</strong>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {form.is_on_leave
                ? 'You will not be assigned to new patient consultations'
                : 'Receptionist can assign you to patients'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            className={`btn ${!form.is_on_leave ? 'btn-accent' : 'btn-outline'}`}
            onClick={() => setForm({ ...form, is_on_leave: false })}>
            ✅ Mark Available
          </button>
          <button
            className={`btn ${form.is_on_leave ? 'btn-danger' : 'btn-outline'}`}
            onClick={() => setForm({ ...form, is_on_leave: true })}>
            🏖️ Apply Leave
          </button>
        </div>

        {form.is_on_leave && (
          <>
            <div className="form-group">
              <label className="form-label">Leave Reason</label>
              <textarea className="form-control" rows={3} placeholder="Reason for leave (optional)..."
                value={form.leave_reason} onChange={e => setForm({ ...form, leave_reason: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">From Date</label>
                <input className="form-control" type="date" value={form.leave_from}
                  onChange={e => setForm({ ...form, leave_from: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">To Date</label>
                <input className="form-control" type="date" value={form.leave_to}
                  min={form.leave_from || undefined}
                  onChange={e => setForm({ ...form, leave_to: e.target.value })} />
              </div>
            </div>
          </>
        )}

        <button className="btn btn-primary" onClick={save}>Save Leave Status</button>
      </div>
    </div>
  );
}

// ── BILLS PAGE ────────────────────────────────────────────────────────

export function BillsPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payBill, setPayBill] = useState(null);
  const [payForm, setPayForm] = useState({ payment_method: 'cash', transaction_id: '', cheque_number: '', bank_name: '' });
  const [form, setForm] = useState({
    patient_id: '', registration_id: '', consultation_id: '',
    consultation_fee: '', medicine_cost: '', other_charges: '',
    discount: '', tax: '',
    payment_method: 'cash', transaction_id: '', cheque_number: '', bank_name: '',
    collect_now: true
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
    if (user?.role !== 'patient') {
      axios.get('/api/patients').then(r => setPatients(r.data));
    }
  }, [user]);

  const fetchBills = async () => {
    try { const r = await axios.get('/api/bills'); setBills(r.data); }
    catch(e) {} finally { setLoading(false); }
  };

  // When patient changes → load their registrations and consultations
  const onPatientChange = async (pid) => {
    setForm(f => ({ ...f, patient_id: pid, registration_id: '', consultation_id: '' }));
    setRegistrations([]); setConsultations([]);
    if (!pid) return;
    try {
      const [histRes, consultRes] = await Promise.all([
        axios.get(`/api/patients/${pid}/history`),
        axios.get('/api/consultations')
      ]);
      setRegistrations(histRes.data.filter(r => r.id));
      setConsultations(consultRes.data.filter(c => c.patient_id == pid));
    } catch(e) {}
  };

  // Auto-fill consultation fee based on doctor type when consultation selected
  const onConsultationChange = (cid) => {
    const c = consultations.find(x => x.id == cid);
    const fee = c?.doctor_type === 'senior_resident' ? '500' : '300';
    setForm(f => ({ ...f, consultation_id: cid, consultation_fee: f.consultation_fee || fee }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.patient_id) { setMsg('Please select a patient'); return; }
    try {
      const payload = {
        patient_id: form.patient_id,
        registration_id: form.registration_id || null,
        consultation_id: form.consultation_id || null,
        consultation_fee: form.consultation_fee,
        medicine_cost: form.medicine_cost,
        other_charges: form.other_charges,
        discount: form.discount,
        tax: form.tax,
      };
      // Only include payment info if collecting now
      if (form.collect_now) {
        payload.payment_method = form.payment_method;
        payload.transaction_id = form.transaction_id;
        payload.cheque_number = form.cheque_number;
        payload.bank_name = form.bank_name;
      }
      const res = await axios.post('/api/bills', payload);
      setMsg(`✅ Bill ${res.data.bill_number} generated! Total: ₹${parseFloat(res.data.total).toFixed(2)} — Status: ${res.data.payment_status}`);
      setShowModal(false);
      setForm({ patient_id: '', registration_id: '', consultation_id: '', consultation_fee: '', medicine_cost: '', other_charges: '', discount: '', tax: '', payment_method: 'cash', transaction_id: '', cheque_number: '', bank_name: '', collect_now: true });
      fetchBills();
    } catch (e) { setMsg('❌ ' + (e.response?.data?.message || 'Error generating bill')); }
  };

  const viewBill = async (b) => {
    try { const res = await axios.get(`/api/bills/${b.id}`); setSelectedBill(res.data); }
    catch(e) {}
  };

  const openPayModal = (b) => {
    setPayBill(b);
    setPayForm({ payment_method: 'cash', transaction_id: '', cheque_number: '', bank_name: '' });
    setShowPayModal(true);
  };

  const markPaid = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/bills/${payBill.id}/payment`, payForm);
      setMsg(`✅ Bill ${payBill.bill_number} marked as paid!`);
      setShowPayModal(false);
      setPayBill(null);
      fetchBills();
      if (selectedBill?.id === payBill.id) {
        const r = await axios.get(`/api/bills/${payBill.id}`);
        setSelectedBill(r.data);
      }
    } catch(e) { setMsg('❌ ' + (e.response?.data?.message || 'Error')); }
  };

  const calcTotal = () => {
    const c = parseFloat(form.consultation_fee || 0);
    const m = parseFloat(form.medicine_cost || 0);
    const o = parseFloat(form.other_charges || 0);
    const d = parseFloat(form.discount || 0);
    const t = parseFloat(form.tax || 0);
    return (c + m + o + t - d).toFixed(2);
  };

  const paymentFields = (f, setF) => (
    <>
      <div className="form-group">
        <label className="form-label">Payment Method</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[['cash','💵 Cash'],['upi','📱 UPI'],['neft_rtgs','🏦 NEFT/RTGS'],['cheque','📝 Cheque']].map(([v,l]) => (
            <button key={v} type="button"
              onClick={() => setF(x => ({ ...x, payment_method: v }))}
              style={{
                padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                border: `2px solid ${f.payment_method===v ? 'var(--primary)' : 'var(--border)'}`,
                background: f.payment_method===v ? '#eaf2fb' : 'white',
                color: f.payment_method===v ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: f.payment_method===v ? 600 : 400
              }}>{l}</button>
          ))}
        </div>
      </div>
      {f.payment_method === 'upi' && (
        <div className="form-group">
          <label className="form-label">UPI Transaction ID</label>
          <input className="form-control" placeholder="e.g. 408123456789" value={f.transaction_id}
            onChange={e => setF(x => ({ ...x, transaction_id: e.target.value }))} />
        </div>
      )}
      {f.payment_method === 'neft_rtgs' && (
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">UTR / Transaction No.</label>
            <input className="form-control" value={f.transaction_id}
              onChange={e => setF(x => ({ ...x, transaction_id: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Bank Name</label>
            <input className="form-control" placeholder="e.g. SBI" value={f.bank_name}
              onChange={e => setF(x => ({ ...x, bank_name: e.target.value }))} />
          </div>
        </div>
      )}
      {f.payment_method === 'cheque' && (
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Cheque Number</label>
            <input className="form-control" value={f.cheque_number}
              onChange={e => setF(x => ({ ...x, cheque_number: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Bank Name</label>
            <input className="form-control" value={f.bank_name}
              onChange={e => setF(x => ({ ...x, bank_name: e.target.value }))} />
          </div>
        </div>
      )}
    </>
  );

  const statusBadge = (s) => {
    const map = { paid: 'badge-success', unpaid: 'badge-danger', partial: 'badge-warning' };
    return <span className={`badge ${map[s] || 'badge-muted'}`}>{s}</span>;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedBill ? '1fr 400px' : '1fr', gap: 20 }}>
      <div>
        <div className="flex-between mb-16">
          <h2 style={{ color: 'var(--primary)' }}>🧾 Bills</h2>
          {(user?.role === 'receptionist' || user?.role === 'admin') && (
            <button className="btn btn-primary" onClick={() => { setShowModal(true); setMsg(''); }}>+ Generate Bill</button>
          )}
        </div>

        {msg && (
          <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
            {msg}
          </div>
        )}

        {/* Flow reminder for receptionists */}
        {user?.role === 'receptionist' && (
          <div style={{ background: '#eaf6ff', border: '1px solid #b3d9f7', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
            <strong style={{ color: 'var(--primary)' }}>📋 Correct Flow:</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
              Register Visit → Assign Doctor → Doctor Consults → Pharmacist Dispenses → <strong>Generate Bill here (collect payment)</strong>
            </span>
          </div>
        )}

        <div className="card">
          {loading ? <div className="loading">Loading bills...</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Bill No.</th><th>Patient</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {bills.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 32 }}>No bills yet</td></tr>
                  ) : bills.map(b => (
                    <tr key={b.id}>
                      <td><code style={{ fontSize: 12, background: '#f0f4f8', padding: '2px 6px', borderRadius: 4 }}>{b.bill_number}</code></td>
                      <td><strong>{b.patient_name}</strong></td>
                      <td><strong style={{ color: 'var(--success)', fontSize: 15 }}>₹{Number(b.total_amount).toLocaleString('en-IN')}</strong></td>
                      <td>{statusBadge(b.payment_status)}</td>
                      <td style={{ fontSize: 13 }}>{new Date(b.generated_at).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-outline" onClick={() => viewBill(b)}>View</button>
                          {b.payment_status === 'unpaid' && (user?.role === 'receptionist' || user?.role === 'admin') && (
                            <button className="btn btn-sm btn-accent" onClick={() => openPayModal(b)}>Collect Payment</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bill detail panel */}
      {selectedBill && (
        <div className="card" id="printable-bill">
          <div className="modal-header">
            <h3 style={{ fontSize: 16 }}>{selectedBill.bill_number}</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm btn-primary" onClick={() => window.print()}>🖨️ Print</button>
              <button className="btn btn-sm btn-outline" onClick={() => setSelectedBill(null)}>✕</button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '2px dashed var(--border)' }}>
            <h2 style={{ color: 'var(--primary)', fontSize: 18 }}>🏥 Ojasya Healthcare</h2>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tax Invoice · {selectedBill.bill_number}</p>
          </div>

          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>BILLED TO</p>
            <p><strong>{selectedBill.patient_name}</strong></p>
            {selectedBill.patient_phone && <p style={{ fontSize: 13 }}>{selectedBill.patient_phone}</p>}
            {selectedBill.patient_address && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedBill.patient_address}</p>}
          </div>

          {selectedBill.doctor_name && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>CONSULTING DOCTOR</p>
              <p style={{ fontSize: 13 }}>Dr. {selectedBill.doctor_name}</p>
            </div>
          )}

          <div style={{ marginBottom: 14, fontSize: 13 }}>
            <p><strong>Date:</strong> {new Date(selectedBill.generated_at).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</p>
          </div>

          <table style={{ width: '100%', marginBottom: 14, fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {selectedBill.consultation_fee > 0 && <tr><td style={{ padding: '7px 8px' }}>Consultation Fee</td><td style={{ padding: '7px 8px', textAlign: 'right' }}>₹{Number(selectedBill.consultation_fee).toLocaleString('en-IN')}</td></tr>}
              {selectedBill.medicine_cost > 0 && <tr><td style={{ padding: '7px 8px' }}>Medicine Cost</td><td style={{ padding: '7px 8px', textAlign: 'right' }}>₹{Number(selectedBill.medicine_cost).toLocaleString('en-IN')}</td></tr>}
              {selectedBill.other_charges > 0 && <tr><td style={{ padding: '7px 8px' }}>Other Charges</td><td style={{ padding: '7px 8px', textAlign: 'right' }}>₹{Number(selectedBill.other_charges).toLocaleString('en-IN')}</td></tr>}
              {selectedBill.tax > 0 && <tr><td style={{ padding: '7px 8px' }}>Tax / GST</td><td style={{ padding: '7px 8px', textAlign: 'right' }}>₹{Number(selectedBill.tax).toLocaleString('en-IN')}</td></tr>}
              {selectedBill.discount > 0 && <tr><td style={{ padding: '7px 8px', color: 'var(--success)' }}>Discount</td><td style={{ padding: '7px 8px', textAlign: 'right', color: 'var(--success)' }}>−₹{Number(selectedBill.discount).toLocaleString('en-IN')}</td></tr>}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)' }}>
                <td style={{ padding: '10px 8px', fontWeight: 700, fontSize: 14 }}>Total</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, fontSize: 17, color: 'var(--primary)' }}>₹{Number(selectedBill.total_amount).toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: selectedBill.payment_status === 'paid' ? '#d5f5e3' : '#fadbd8' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: selectedBill.payment_status === 'paid' ? 'var(--success)' : 'var(--danger)' }}>
              {selectedBill.payment_status === 'paid' ? '✅ PAID' : '❌ UNPAID'}
            </span>
            {selectedBill.payment_status === 'unpaid' && (user?.role === 'receptionist' || user?.role === 'admin') && (
              <button className="btn btn-sm btn-accent" onClick={() => openPayModal(selectedBill)}>Collect Payment</button>
            )}
          </div>

          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 14, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
            Thank you for choosing Ojasya Healthcare System
          </div>
        </div>
      )}

      {/* Generate Bill Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>Generate Bill</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              {/* Step 1: Patient + Visit */}
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '14px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>PATIENT & VISIT</p>
                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select className="form-control" required value={form.patient_id} onChange={e => onPatientChange(e.target.value)}>
                    <option value="">Select patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} — {p.phone || p.email}</option>)}
                  </select>
                </div>
                {registrations.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Visit / Registration</label>
                    <select className="form-control" value={form.registration_id}
                      onChange={e => setForm(f => ({ ...f, registration_id: e.target.value }))}>
                      <option value="">Select visit (optional)</option>
                      {registrations.map(r => (
                        <option key={r.id} value={r.id}>
                          {new Date(r.registration_date).toLocaleDateString('en-IN')} — {r.visit_type} — {r.chief_complaint?.slice(0, 30)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {consultations.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Consultation</label>
                    <select className="form-control" value={form.consultation_id} onChange={e => onConsultationChange(e.target.value)}>
                      <option value="">Select consultation (optional)</option>
                      {consultations.map(c => (
                        <option key={c.id} value={c.id}>
                          {new Date(c.created_at).toLocaleDateString('en-IN')} — {c.medication_type} — Dr. {c.doctor_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Step 2: Charges */}
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '14px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>CHARGES</p>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Consultation Fee (₹)</label>
                    <input className="form-control" type="number" min="0" step="0.01" placeholder="0"
                      value={form.consultation_fee} onChange={e => setForm(f => ({ ...f, consultation_fee: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Medicine Cost (₹)</label>
                    <input className="form-control" type="number" min="0" step="0.01" placeholder="0"
                      value={form.medicine_cost} onChange={e => setForm(f => ({ ...f, medicine_cost: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Other Charges (₹)</label>
                    <input className="form-control" type="number" min="0" step="0.01" placeholder="0"
                      value={form.other_charges} onChange={e => setForm(f => ({ ...f, other_charges: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax / GST (₹)</label>
                    <input className="form-control" type="number" min="0" step="0.01" placeholder="0"
                      value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discount (₹)</label>
                    <input className="form-control" type="number" min="0" step="0.01" placeholder="0"
                      value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
                  </div>
                </div>

                <div style={{ padding: '12px 16px', background: '#e8f5e9', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 15 }}>Total Payable</strong>
                  <strong style={{ fontSize: 18, color: 'var(--success)' }}>₹{calcTotal()}</strong>
                </div>
              </div>

              {/* Step 3: Payment */}
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '14px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>PAYMENT</p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.collect_now}
                      onChange={e => setForm(f => ({ ...f, collect_now: e.target.checked }))} />
                    Collect payment now
                  </label>
                </div>

                {form.collect_now ? (
                  paymentFields(form, setForm)
                ) : (
                  <div style={{ padding: '10px 14px', background: '#fff3e0', borderRadius: 8, fontSize: 13, color: '#e65100' }}>
                    ⏳ Bill will be generated as <strong>UNPAID</strong>. Use "Collect Payment" button later to mark it paid.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {form.collect_now ? '✅ Generate & Collect Payment' : '📄 Generate Bill (Pay Later)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {showPayModal && payBill && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPayModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Collect Payment</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowPayModal(false)}>✕</button>
            </div>

            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
              <p style={{ fontSize: 13 }}><strong>Bill:</strong> {payBill.bill_number}</p>
              <p style={{ fontSize: 13 }}><strong>Patient:</strong> {payBill.patient_name}</p>
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--primary)', marginTop: 6 }}>
                Amount Due: ₹{Number(payBill.total_amount).toLocaleString('en-IN')}
              </p>
            </div>

            <form onSubmit={markPaid}>
              {paymentFields(payForm, setPayForm)}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowPayModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-accent">✅ Confirm Payment Received</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
