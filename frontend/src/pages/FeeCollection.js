import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function FeeCollection() {
  const [fees, setFees] = useState([]);
  const [patients, setPatients] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    patient_id: '', registration_id: '', amount: '',
    payment_method: 'cash', transaction_id: '',
    cheque_number: '', bank_name: '', notes: ''
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [feesRes, patientsRes] = await Promise.all([
        axios.get('/api/fees'),
        axios.get('/api/patients')
      ]);
      setFees(feesRes.data);
      setPatients(patientsRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadRegistrations = async (patientId) => {
    try {
      const res = await axios.get(`/api/patients/${patientId}/history`);
      setRegistrations(res.data.filter(r => r.id));
    } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/fees', form);
      setMsg('Fee collected successfully!');
      setShowModal(false);
      setForm({ patient_id: '', registration_id: '', amount: '', payment_method: 'cash', transaction_id: '', cheque_number: '', bank_name: '', notes: '' });
      fetchData();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error collecting fee');
    }
  };

  const methodBadge = (m) => {
    const map = { cash: ['💵', 'badge-success'], upi: ['📱', 'badge-info'], neft_rtgs: ['🏦', 'badge-warning'], cheque: ['📝', 'badge-muted'] };
    const [icon, cls] = map[m] || ['?', 'badge-muted'];
    return <span className={`badge ${cls}`}>{icon} {m?.toUpperCase().replace('_', '/')}</span>;
  };

  return (
    <div>
      <div className="flex-between mb-16">
        <h2 style={{ color: 'var(--primary)' }}>💳 Fee Collection</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Collect Fee</button>
      </div>

      {msg && <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      <div className="card">
        <div className="card-header">
          <h3>Fee Records</h3>
          <span className="badge badge-info">{fees.length} records</span>
        </div>
        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Transaction / Cheque</th>
                  <th>Collected By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {fees.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted">No fee records</td></tr>
                ) : fees.map(f => (
                  <tr key={f.id}>
                    <td>{new Date(f.payment_date).toLocaleDateString('en-IN')}</td>
                    <td><strong>{f.patient_name}</strong></td>
                    <td><strong style={{ color: 'var(--success)' }}>₹{Number(f.amount).toLocaleString('en-IN')}</strong></td>
                    <td>{methodBadge(f.payment_method)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {f.transaction_id || f.cheque_number || (f.bank_name ? `Bank: ${f.bank_name}` : '—')}
                    </td>
                    <td>{f.receptionist_name}</td>
                    <td><span className={`badge ${f.payment_status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{f.payment_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Collect Fee</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select className="form-control" value={form.patient_id} required
                  onChange={e => { setForm({ ...form, patient_id: e.target.value, registration_id: '' }); loadRegistrations(e.target.value); }}>
                  <option value="">Select patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} — {p.phone}</option>)}
                </select>
              </div>
              {registrations.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Visit (optional)</label>
                  <select className="form-control" value={form.registration_id}
                    onChange={e => setForm({ ...form, registration_id: e.target.value })}>
                    <option value="">Select visit</option>
                    {registrations.map(r => (
                      <option key={r.id} value={r.id}>
                        {new Date(r.registration_date).toLocaleDateString('en-IN')} — {r.visit_type} — {r.status}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input className="form-control" type="number" min="1" step="0.01" placeholder="0.00"
                    value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method *</label>
                  <select className="form-control" value={form.payment_method}
                    onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                    <option value="cash">💵 Cash</option>
                    <option value="upi">📱 UPI</option>
                    <option value="neft_rtgs">🏦 NEFT / RTGS</option>
                    <option value="cheque">📝 Cheque</option>
                  </select>
                </div>
              </div>

              {form.payment_method === 'upi' && (
                <div className="form-group">
                  <label className="form-label">UPI Transaction ID</label>
                  <input className="form-control" placeholder="e.g. 408123456789" value={form.transaction_id}
                    onChange={e => setForm({ ...form, transaction_id: e.target.value })} />
                </div>
              )}

              {form.payment_method === 'neft_rtgs' && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Transaction / UTR Number</label>
                    <input className="form-control" value={form.transaction_id}
                      onChange={e => setForm({ ...form, transaction_id: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input className="form-control" placeholder="e.g. SBI, HDFC" value={form.bank_name}
                      onChange={e => setForm({ ...form, bank_name: e.target.value })} />
                  </div>
                </div>
              )}

              {form.payment_method === 'cheque' && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cheque Number</label>
                    <input className="form-control" value={form.cheque_number}
                      onChange={e => setForm({ ...form, cheque_number: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input className="form-control" placeholder="e.g. ICICI Bank" value={form.bank_name}
                      onChange={e => setForm({ ...form, bank_name: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={2} placeholder="Optional notes..."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-accent">✓ Collect Fee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
