import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export function ConsultationsPage() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [diseases, setDiseases] = useState([]);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchConsultations();
    axios.get('/api/diseases').then(r => setDiseases(r.data)).catch(() => {});
  }, []);

  const fetchConsultations = async () => {
    try {
      const res = await axios.get('/api/consultations');
      setConsultations(res.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const selectConsult = (c) => {
    setSelected(c);
    setEditForm({
      diagnosis: c.diagnosis || '',
      diagnosis_disease_id: c.diagnosis_disease_id || '',
      notes: c.notes || '',
      follow_up_date: c.follow_up_date ? c.follow_up_date.slice(0, 10) : '',
      status: c.status
    });
  };

  const saveConsult = async () => {
    try {
      await axios.put(`/api/consultations/${selected.id}`, editForm);
      setMsg('Consultation updated successfully!');
      fetchConsultations();
      setSelected(null);
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  const statusBadge = (s) => {
    const map = { scheduled: 'badge-warning', in_progress: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' };
    return <span className={`badge ${map[s] || 'badge-muted'}`}>{s?.replace('_', ' ')}</span>;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20 }}>
      <div>
        <h2 style={{ color: 'var(--primary)', marginBottom: 16 }}>🩺 Consultations</h2>
        {msg && <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}
        <div className="card">
          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    {user?.role !== 'doctor' && <th>Doctor</th>}
                    <th>Type</th>
                    <th>Diagnosis</th>
                    <th>Status</th>
                    {user?.role === 'doctor' && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {consultations.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted">No consultations</td></tr>
                  ) : consultations.map(c => (
                    <tr key={c.id} onClick={() => selectConsult(c)} style={{ cursor: 'pointer' }}>
                      <td>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                      <td><strong>{c.patient_name}</strong></td>
                      {user?.role !== 'doctor' && (
                        <td>
                          <div>Dr. {c.doctor_name}</div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.doctor_type === 'senior_resident' ? 'Senior Resident' : 'Junior Resident'}</span>
                        </td>
                      )}
                      <td><span className={`badge badge-${c.medication_type}`}>{c.medication_type}</span></td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.diagnosis || c.disease_name || '—'}
                      </td>
                      <td>{statusBadge(c.status)}</td>
                      {user?.role === 'doctor' && (
                        <td><button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); selectConsult(c); }}>Update</button></td>
                      )}
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
            <h3>Consultation #{selected.id}</h3>
            <button className="btn btn-sm btn-outline" onClick={() => setSelected(null)}>✕</button>
          </div>

          <div style={{ marginBottom: 16, padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
            <strong>{selected.patient_name}</strong>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{selected.chief_complaint}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <span className={`badge badge-${selected.medication_type}`}>{selected.medication_type}</span>
              {statusBadge(selected.status)}
            </div>
          </div>

          {selected.symptoms && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>SYMPTOMS</p>
              <p style={{ fontSize: 14 }}>{selected.symptoms}</p>
            </div>
          )}

          {user?.role === 'doctor' && selected.status !== 'completed' ? (
            <div>
              <div className="form-group">
                <label className="form-label">Diagnosis</label>
                <input className="form-control" value={editForm.diagnosis}
                  onChange={e => setEditForm({ ...editForm, diagnosis: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Disease (ICD)</label>
                <select className="form-control" value={editForm.diagnosis_disease_id}
                  onChange={e => setEditForm({ ...editForm, diagnosis_disease_id: e.target.value })}>
                  <option value="">Select disease</option>
                  {diseases.map(d => <option key={d.id} value={d.id}>{d.name} ({d.icd_code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Clinical Notes</label>
                <textarea className="form-control" rows={3} value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Follow-up Date</label>
                  <input className="form-control" type="date" value={editForm.follow_up_date}
                    onChange={e => setEditForm({ ...editForm, follow_up_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-accent" onClick={saveConsult}>Save</button>
                <a href="/prescriptions" className="btn btn-primary">+ Add Prescription</a>
              </div>
            </div>
          ) : (
            <div>
              {selected.diagnosis && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>DIAGNOSIS</p>
                  <p style={{ fontSize: 14 }}>{selected.diagnosis}</p>
                </div>
              )}
              {selected.notes && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>NOTES</p>
                  <p style={{ fontSize: 14 }}>{selected.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ consultation_id: '', patient_id: '', notes: '', items: [] });
  const [newItem, setNewItem] = useState({ medicine_id: '', dosage: '', frequency: '', duration: '', quantity: 1, instructions: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchPrescriptions();
    if (user?.role === 'doctor') {
      axios.get('/api/medicines').then(r => setMedicines(r.data));
      axios.get('/api/consultations').then(r => setConsultations(r.data.filter(c => c.status !== 'cancelled')));
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get('/api/prescriptions');
      setPrescriptions(res.data);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const viewPrescription = async (p) => {
    try {
      const res = await axios.get(`/api/prescriptions/${p.id}`);
      setSelected(res.data);
    } catch (e) {}
  };

  const addItem = () => {
    if (!newItem.medicine_id) return;
    setForm({ ...form, items: [...form.items, { ...newItem }] });
    setNewItem({ medicine_id: '', dosage: '', frequency: '', duration: '', quantity: 1, instructions: '' });
  };

  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) { setMsg('Add at least one medicine'); return; }
    try {
      await axios.post('/api/prescriptions', { ...form, patient_id: consultations.find(c => c.id == form.consultation_id)?.patient_id });
      setMsg('Prescription created!');
      setShowModal(false);
      setForm({ consultation_id: '', patient_id: '', notes: '', items: [] });
      fetchPrescriptions();
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  const typeColors = { ayurveda: 'ayurveda', allopathy: 'allopathy', homeopathy: 'homeopathy' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
      <div>
        <div className="flex-between mb-16">
          <h2 style={{ color: 'var(--primary)' }}>📄 Prescriptions</h2>
          {user?.role === 'doctor' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Prescription</button>
          )}
        </div>

        {msg && <div className={`alert ${msg.includes('created') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

        <div className="card">
          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    {user?.role !== 'patient' && <th>Patient</th>}
                    <th>Doctor</th>
                    <th>Type</th>
                    <th>Diagnosis</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 32 }}>
                      {user?.role === 'patient' ? 'No prescriptions issued to you yet.' : 'No prescriptions found.'}
                    </td></tr>
                  ) : prescriptions.map(p => (
                    <tr key={p.id}>
                      <td>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                      {user?.role !== 'patient' && <td><strong>{p.patient_name}</strong></td>}
                      <td>Dr. {p.doctor_name}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {p.doctor_type === 'senior_resident' ? 'Senior Resident' : 'Junior Resident'}
                        </div>
                      </td>
                      <td>
                        {p.medication_type
                          ? <span className={`badge badge-${p.medication_type}`}>{p.medication_type}</span>
                          : <span className="badge badge-muted">—</span>
                        }
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.diagnosis || '—'}
                      </td>
                      <td><span className={`badge ${p.status === 'dispensed' ? 'badge-success' : p.status === 'completed' ? 'badge-info' : 'badge-warning'}`}>{p.status}</span></td>
                      <td><button className="btn btn-sm btn-outline" onClick={() => viewPrescription(p)}>View</button></td>
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
            <h3>Prescription #{selected.id}</h3>
            <button className="btn btn-sm btn-outline" onClick={() => setSelected(null)}>✕</button>
          </div>

          <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
            <strong>{selected.patient_name}</strong>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Dr. {selected.doctor_name} · {selected.doctor_type === 'senior_resident' ? 'Senior Resident' : 'Junior Resident'}
            </p>
            {selected.medication_type && <span className={`badge badge-${typeColors[selected.medication_type]}`}>{selected.medication_type}</span>}
            {selected.diagnosis && <p style={{ fontSize: 13, marginTop: 6 }}><strong>Dx:</strong> {selected.diagnosis}</p>}
          </div>

          <h4 style={{ marginBottom: 10, fontSize: 14 }}>💊 Medicines</h4>
          {(selected.items || []).map((item, i) => (
            <div key={i} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 14 }}>{item.medicine_name}</strong>
                <span className={`badge badge-${typeColors[item.medicine_type]}`}>{item.medicine_type}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {item.dosage} · {item.frequency} · {item.duration} · Qty: {item.quantity}
              </p>
              {item.instructions && <p style={{ fontSize: 12, color: 'var(--accent-dark)', marginTop: 2 }}>📝 {item.instructions}</p>}
              {item.precautions && (
                <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 2 }}>⚠️ {item.precautions}</p>
              )}
            </div>
          ))}

          {selected.notes && (
            <div style={{ marginTop: 12, padding: '10px', background: '#fef9e7', borderRadius: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ayurveda)', marginBottom: 4 }}>DOCTOR'S NOTES</p>
              <p style={{ fontSize: 13 }}>{selected.notes}</p>
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>🖨️ Print</button>
          </div>
        </div>
      )}

      {showModal && user?.role === 'doctor' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>New Prescription</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Consultation *</label>
                <select className="form-control" required value={form.consultation_id}
                  onChange={e => setForm({ ...form, consultation_id: e.target.value })}>
                  <option value="">Select consultation</option>
                  {consultations.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.patient_name} — {new Date(c.created_at).toLocaleDateString('en-IN')} — {c.medication_type}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
                <h4 style={{ marginBottom: 12, fontSize: 14 }}>Add Medicine</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Medicine</label>
                    <select className="form-control" value={newItem.medicine_id}
                      onChange={e => setNewItem({ ...newItem, medicine_id: e.target.value })}>
                      <option value="">Select medicine</option>
                      {medicines.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.medicine_type}) — {m.strength}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dosage</label>
                    <input className="form-control" placeholder="e.g. 1 tablet" value={newItem.dosage}
                      onChange={e => setNewItem({ ...newItem, dosage: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Frequency</label>
                    <select className="form-control" value={newItem.frequency}
                      onChange={e => setNewItem({ ...newItem, frequency: e.target.value })}>
                      <option value="">Select</option>
                      <option>Once daily</option>
                      <option>Twice daily</option>
                      <option>Three times daily</option>
                      <option>Four times daily</option>
                      <option>At bedtime</option>
                      <option>Before meals</option>
                      <option>After meals</option>
                      <option>As needed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input className="form-control" placeholder="e.g. 7 days" value={newItem.duration}
                      onChange={e => setNewItem({ ...newItem, duration: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Qty</label>
                    <input className="form-control" type="number" min="1" value={newItem.quantity}
                      onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Special Instructions</label>
                  <input className="form-control" placeholder="e.g. Take with milk" value={newItem.instructions}
                    onChange={e => setNewItem({ ...newItem, instructions: e.target.value })} />
                </div>
                <button type="button" className="btn btn-accent btn-sm" onClick={addItem}>+ Add Medicine</button>
              </div>

              {form.items.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ marginBottom: 8, fontSize: 14 }}>Added Medicines ({form.items.length})</h4>
                  {form.items.map((item, i) => {
                    const med = medicines.find(m => m.id == item.medicine_id);
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f0f4f8', borderRadius: 8, marginBottom: 6 }}>
                        <div>
                          <strong style={{ fontSize: 13 }}>{med?.name}</strong>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{item.dosage} · {item.frequency} · {item.duration}</span>
                        </div>
                        <button type="button" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} onClick={() => removeItem(i)}>✕</button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <textarea className="form-control" rows={2} value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Prescription</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
