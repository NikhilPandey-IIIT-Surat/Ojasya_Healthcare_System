import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/patients');
      setPatients(res.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const selectPatient = async (p) => {
    setSelected(p);
    setEditForm(p);
    setEditMode(false);
    try {
      const res = await axios.get(`/api/patients/${p.id}/history`);
      setHistory(res.data);
    } catch (e) {}
  };

  const saveEdit = async () => {
    try {
      await axios.put(`/api/patients/${selected.id}`, editForm);
      setMsg('Patient updated!');
      setEditMode(false);
      fetchPatients();
      setSelected({ ...selected, ...editForm });
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
      <div>
        <div className="flex-between mb-16">
          <h2 style={{ color: 'var(--primary)' }}>👥 Patients</h2>
          <div className="search-bar" style={{ width: 280 }}>
            <span>🔍</span>
            <input placeholder="Search by name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {msg && <div className={`alert ${msg.includes('updated') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

        <div className="card">
          {loading ? <div className="loading">Loading patients...</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>Blood Group</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted">No patients found</td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => selectPatient(p)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>
                            {p.full_name.charAt(0)}
                          </div>
                          <div>
                            <strong>{p.full_name}</strong>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{p.phone || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{p.gender || '—'}</td>
                      <td><span className="badge badge-info">{p.blood_group || '—'}</span></td>
                      <td>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                      <td><span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td><button className="btn btn-sm btn-outline">View →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="modal-header">
              <h3>{selected.full_name}</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setSelected(null)}>✕</button>
            </div>

            {!editMode ? (
              <div>
                {[
                  ['Email', selected.email],
                  ['Phone', selected.phone || '—'],
                  ['DOB', selected.dob ? new Date(selected.dob).toLocaleDateString('en-IN') : '—'],
                  ['Gender', selected.gender || '—'],
                  ['Blood Group', selected.blood_group || '—'],
                  ['Address', selected.address || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ width: 100, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{k}</span>
                    <span style={{ fontSize: 14 }}>{v}</span>
                  </div>
                ))}
                {(user?.role === 'admin' || user?.role === 'receptionist') && (
                  <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => setEditMode(true)}>✏️ Edit Details</button>
                )}
              </div>
            ) : (
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-control" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-control" value={editForm.gender || ''} onChange={e => setEditForm({ ...editForm, gender: e.target.value })}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select className="form-control" value={editForm.blood_group || ''} onChange={e => setEditForm({ ...editForm, blood_group: e.target.value })}>
                      <option value="">Select</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-control" rows={2} value={editForm.address || ''} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-accent btn-sm" onClick={saveEdit}>Save</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header"><h3>Visit History</h3></div>
            {history.length === 0 ? (
              <p className="text-muted text-center">No visits recorded</p>
            ) : history.map(h => (
              <div key={h.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13 }}>{new Date(h.registration_date).toLocaleDateString('en-IN')}</strong>
                  <span className={`badge ${h.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{h.status}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.visit_type} — {h.chief_complaint || 'General visit'}</p>
                {h.doctor_name && <p style={{ fontSize: 12, color: 'var(--primary)' }}>Dr. {h.doctor_name}</p>}
                {h.medication_type && (
                  <span className={`badge badge-${h.medication_type}`} style={{ marginTop: 4, fontSize: 11 }}>{h.medication_type}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RegisterVisitPage() {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    patient_id: '', chief_complaint: '', visit_type: 'opd',
    doctor_id: '', medication_type: 'allopathy', symptoms: ''
  });
  const [registrationId, setRegistrationId] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/patients').then(r => setPatients(r.data));
    axios.get('/api/doctors').then(r => setDoctors(r.data.filter(d => !d.is_on_leave)));
  }, []);

  const handleRegister = async () => {
    if (!form.patient_id || !form.chief_complaint) {
      setMsg('Please fill required fields'); return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/patients/register-visit', {
        patient_id: form.patient_id,
        chief_complaint: form.chief_complaint,
        visit_type: form.visit_type
      });
      setRegistrationId(res.data.registration_id);
      setStep(2);
      setMsg('');
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const handleAssignDoctor = async () => {
    if (!form.doctor_id || !form.medication_type) { setMsg('Select doctor and medication type'); return; }
    setLoading(true);
    try {
      await axios.post('/api/consultations', {
        registration_id: registrationId,
        patient_id: form.patient_id,
        doctor_id: form.doctor_id,
        medication_type: form.medication_type,
        chief_complaint: form.chief_complaint,
        symptoms: form.symptoms
      });
      setStep(3);
      setMsg('');
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: 24 }}>📋 Register Patient Visit</h2>

      {/* Steps */}
      <div style={{ display: 'flex', marginBottom: 28 }}>
        {['Patient Info', 'Assign Doctor', 'Complete'].map((label, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--primary)' : 'var(--border)',
                color: step >= i + 1 ? 'white' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 12, marginTop: 6, color: step === i + 1 ? 'var(--primary)' : 'var(--text-muted)' }}>{label}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? 'var(--success)' : 'var(--border)', marginBottom: 20 }} />}
          </div>
        ))}
      </div>

      {msg && <div className="alert alert-error" style={{ marginBottom: 16 }}>{msg}</div>}

      {step === 1 && (
        <div className="card">
          <div className="card-header"><h3>Patient Information</h3></div>
          <div className="form-group">
            <label className="form-label">Select Patient *</label>
            <select className="form-control" value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
              <option value="">-- Choose patient --</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} — {p.phone || p.email}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Visit Type</label>
              <select className="form-control" value={form.visit_type} onChange={e => setForm({ ...form, visit_type: e.target.value })}>
                <option value="opd">OPD</option>
                <option value="emergency">Emergency</option>
                <option value="follow_up">Follow-up</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Chief Complaint *</label>
            <textarea className="form-control" rows={3} placeholder="Main reason for visit..."
              value={form.chief_complaint} onChange={e => setForm({ ...form, chief_complaint: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={handleRegister} disabled={loading}>
            {loading ? 'Registering...' : 'Register Visit →'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <div className="card-header"><h3>Assign Doctor</h3></div>
          <div className="form-group">
            <label className="form-label">Medication Type *</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['ayurveda', 'allopathy', 'homeopathy'].map(t => (
                <button key={t} onClick={() => setForm({ ...form, medication_type: t })}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 8, cursor: 'pointer',
                    border: `2px solid ${form.medication_type === t ? 'var(--primary)' : 'var(--border)'}`,
                    background: form.medication_type === t ? '#eaf2fb' : 'white',
                    color: form.medication_type === t ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: form.medication_type === t ? 600 : 400,
                    textTransform: 'capitalize', fontSize: 14
                  }}>
                  {t === 'ayurveda' ? '🌿' : t === 'allopathy' ? '💊' : '🔬'} {t}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Select Doctor *</label>
            <select className="form-control" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })}>
              <option value="">-- Choose available doctor --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  Dr. {d.full_name} — {d.doctor_type === 'senior_resident' ? 'SR' : 'JR'} — {d.specialization || 'General'}
                </option>
              ))}
            </select>
            {doctors.length === 0 && <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>No doctors available (all on leave)</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Symptoms</label>
            <textarea className="form-control" rows={3} placeholder="Detailed symptoms..."
              value={form.symptoms} onChange={e => setForm({ ...form, symptoms: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-accent" onClick={handleAssignDoctor} disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Doctor →'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h3 style={{ color: 'var(--success)', marginBottom: 8 }}>Registration Complete!</h3>
          <p className="text-muted">Patient has been registered and doctor assigned.</p>
          <p style={{ fontSize: 13, marginTop: 8, color: 'var(--text-muted)' }}>Registration ID: #{registrationId}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
            <button className="btn btn-primary" onClick={() => { setStep(1); setForm({ patient_id: '', chief_complaint: '', visit_type: 'opd', doctor_id: '', medication_type: 'allopathy', symptoms: '' }); setRegistrationId(null); }}>
              Register Another
            </button>
            <a href="/fees" className="btn btn-accent">Collect Fee →</a>
          </div>
        </div>
      )}
    </div>
  );
}
