import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ── MEDICINES MANAGEMENT ──────────────────────────────────────────────

export function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', generic_name: '', medicine_type: 'allopathy', dosage_form: '',
    strength: '', manufacturer: '', price: '', stock_quantity: '',
    description: '', precautions: '', side_effects: '', is_active: 1
  });
  const [msg, setMsg] = useState('');
  const [loadErr, setLoadErr] = useState('');

  useEffect(() => { fetchMedicines(); }, []);

  const fetchMedicines = async () => {
    try {
      const res = await axios.get('/api/medicines');
      setMedicines(res.data);
      setLoadErr('');
    } catch (err) {
      setLoadErr(err.response?.data?.message || 'Failed to load medicines');
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', generic_name: '', medicine_type: 'allopathy', dosage_form: '', strength: '', manufacturer: '', price: '', stock_quantity: '', description: '', precautions: '', side_effects: '', is_active: 1 });
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({ ...m });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`/api/medicines/${editing.id}`, form);
        setMsg('Medicine updated!');
      } else {
        await axios.post('/api/medicines', form);
        setMsg('Medicine added!');
      }
      setShowModal(false);
      fetchMedicines();
    } catch (err) { setMsg(err.response?.data?.message || 'Error'); }
  };

  const filtered = medicines.filter(m => {
    const matchText = m.name.toLowerCase().includes(filter.toLowerCase()) || (m.generic_name || '').toLowerCase().includes(filter.toLowerCase());
    const matchType = !typeFilter || m.medicine_type === typeFilter;
    return matchText && matchType;
  });

  return (
    <div>
      <div className="flex-between mb-16">
        <h2 style={{ color: 'var(--primary)' }}>💊 Medicines</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Medicine</button>
      </div>

      {msg && <div className={`alert ${msg.includes('!') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}
      {loadErr && <div className="alert alert-error">{loadErr}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <span>🔍</span>
          <input placeholder="Search medicines..." value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 160 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="ayurveda">🌿 Ayurveda</option>
          <option value="allopathy">💊 Allopathy</option>
          <option value="homeopathy">🔬 Homeopathy</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Type</th><th>Form</th><th>Strength</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.name}</strong>
                    {m.generic_name && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.generic_name}</div>}
                  </td>
                  <td><span className={`badge badge-${m.medicine_type}`}>{m.medicine_type}</span></td>
                  <td>{m.dosage_form || '—'}</td>
                  <td>{m.strength || '—'}</td>
                  <td>₹{m.price || '—'}</td>
                  <td>
                    <span style={{ color: m.stock_quantity < 10 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                      {m.stock_quantity}
                    </span>
                  </td>
                  <td><span className={`badge ${m.is_active ? 'badge-success' : 'badge-danger'}`}>{m.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td><button className="btn btn-sm btn-outline" onClick={() => openEdit(m)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>{editing ? 'Edit Medicine' : 'Add Medicine'}</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Medicine Name *</label>
                  <input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Generic Name</label>
                  <input className="form-control" value={form.generic_name} onChange={e => setForm({ ...form, generic_name: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select className="form-control" value={form.medicine_type} onChange={e => setForm({ ...form, medicine_type: e.target.value })}>
                    <option value="ayurveda">🌿 Ayurveda</option>
                    <option value="allopathy">💊 Allopathy</option>
                    <option value="homeopathy">🔬 Homeopathy</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Dosage Form</label>
                  <select className="form-control" value={form.dosage_form} onChange={e => setForm({ ...form, dosage_form: e.target.value })}>
                    <option value="">Select</option>
                    <option>Tablet</option><option>Capsule</option><option>Syrup</option>
                    <option>Powder</option><option>Drops</option><option>Globules</option>
                    <option>Injection</option><option>Ointment</option><option>Cream</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Strength</label>
                  <input className="form-control" placeholder="e.g. 500mg" value={form.strength} onChange={e => setForm({ ...form, strength: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Manufacturer</label>
                  <input className="form-control" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input className="form-control" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Qty</label>
                  <input className="form-control" type="number" min="0" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Precautions</label>
                <textarea className="form-control" rows={2} value={form.precautions} onChange={e => setForm({ ...form, precautions: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Side Effects</label>
                <textarea className="form-control" rows={2} value={form.side_effects} onChange={e => setForm({ ...form, side_effects: e.target.value })} />
              </div>
              {editing && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.is_active} onChange={e => setForm({ ...form, is_active: parseInt(e.target.value) })}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Medicine'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DISEASES MANAGEMENT ───────────────────────────────────────────────

export function DiseasesPage() {
  const [diseases, setDiseases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', icd_code: '', description: '', category: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { axios.get('/api/diseases').then(r => setDiseases(r.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/diseases', form);
      setMsg('Disease added!');
      setShowModal(false);
      setForm({ name: '', icd_code: '', description: '', category: '' });
      const res = await axios.get('/api/diseases');
      setDiseases(res.data);
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <div className="flex-between mb-16">
        <h2 style={{ color: 'var(--primary)' }}>🦠 Diseases / ICD Codes</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Disease</button>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Disease Name</th><th>ICD Code</th><th>Category</th><th>Description</th></tr></thead>
            <tbody>
              {diseases.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td><code style={{ background: '#f0f4f8', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{d.icd_code || '—'}</code></td>
                  <td><span className="badge badge-info">{d.category || '—'}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Add Disease</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Disease Name *</label>
                  <input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">ICD Code</label>
                  <input className="form-control" placeholder="e.g. E11" value={form.icd_code} onChange={e => setForm({ ...form, icd_code: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input className="form-control" placeholder="e.g. Endocrine" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Disease</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DOCTORS PAGE ──────────────────────────────────────────────────────

export function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', specialization: '', doctor_type: 'junior_resident', qualification: '', license_number: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { axios.get('/api/doctors').then(r => setDoctors(r.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/staff', { ...form, role: 'doctor' });
      setMsg('Doctor added!');
      setShowModal(false);
      axios.get('/api/doctors').then(r => setDoctors(r.data));
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  const toggleActive = async (d) => {
    try {
      await axios.put('/api/admin/toggle-active', { role: 'doctor', id: d.id, is_active: !d.is_active });
      axios.get('/api/doctors').then(r => setDoctors(r.data));
    } catch (e) {}
  };

  return (
    <div>
      <div className="flex-between mb-16">
        <h2 style={{ color: 'var(--primary)' }}>👨‍⚕️ Doctors</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Doctor</button>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>Specialization</th><th>License</th><th>Leave</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {doctors.map(d => (
                <tr key={d.id}>
                  <td><strong>Dr. {d.full_name}</strong><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.qualification}</div></td>
                  <td>
                    <span className={`badge ${d.doctor_type === 'senior_resident' ? 'badge-info' : 'badge-muted'}`}>
                      {d.doctor_type === 'senior_resident' ? 'Senior Resident' : 'Junior Resident'}
                    </span>
                  </td>
                  <td>{d.specialization || '—'}</td>
                  <td style={{ fontSize: 12 }}>{d.license_number || '—'}</td>
                  <td>{d.is_on_leave ? <span className="badge badge-warning">On Leave</span> : <span className="badge badge-success">Available</span>}</td>
                  <td><span className={`badge ${d.is_active ? 'badge-success' : 'badge-danger'}`}>{d.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => toggleActive(d)}>
                      {d.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Add Doctor</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Full Name *</label><input className="form-control" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Password *</label><input className="form-control" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Doctor Type</label>
                  <select className="form-control" value={form.doctor_type} onChange={e => setForm({ ...form, doctor_type: e.target.value })}>
                    <option value="junior_resident">Junior Resident</option>
                    <option value="senior_resident">Senior Resident</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Specialization</label><input className="form-control" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Qualification</label><input className="form-control" placeholder="MBBS, MD" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">License No.</label><input className="form-control" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STAFF MANAGEMENT (Admin) ──────────────────────────────────────────

export function StaffPage() {
  const [tab, setTab] = useState('receptionist');
  const [receptionists, setReceptionists] = useState([]);
  const [pharmacists, setPharmacists] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', employee_id: '', license_number: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get('/api/staff').then(r => {
      setReceptionists(r.data.filter(s => s.role === 'receptionist'));
      setPharmacists(r.data.filter(s => s.role === 'pharmacist'));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/staff', { ...form, role: tab });
      setMsg(`${tab} added!`);
      setShowModal(false);
      const res = await axios.get('/api/staff');
      setReceptionists(res.data.filter(s => s.role === 'receptionist'));
      setPharmacists(res.data.filter(s => s.role === 'pharmacist'));
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  const staff = tab === 'receptionist' ? receptionists : pharmacists;

  return (
    <div>
      <div className="flex-between mb-16">
        <h2 style={{ color: 'var(--primary)' }}>👩‍💼 Staff Management</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Staff</button>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="tabs">
        <button className={`tab ${tab === 'receptionist' ? 'active' : ''}`} onClick={() => setTab('receptionist')}>Receptionists ({receptionists.length})</button>
        <button className={`tab ${tab === 'pharmacist' ? 'active' : ''}`} onClick={() => setTab('pharmacist')}>Pharmacists ({pharmacists.length})</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>{tab === 'receptionist' ? 'Employee ID' : 'License No.'}</th><th>Status</th></tr></thead>
            <tbody>
              {staff.length === 0 ? <tr><td colSpan={5} className="text-center text-muted">No {tab}s found</td></tr>
                : staff.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.full_name}</strong></td>
                    <td>{s.email || '—'}</td>
                    <td>{s.phone || '—'}</td>
                    <td style={{ fontSize: 12 }}>{s.employee_id || s.license_number || '—'}</td>
                    <td><span className="badge badge-success">Active</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Add {tab.charAt(0).toUpperCase() + tab.slice(1)}</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Full Name *</label><input className="form-control" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Password *</label><input className="form-control" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
              </div>
              {tab === 'receptionist' && (
                <div className="form-group"><label className="form-label">Employee ID</label><input className="form-control" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} /></div>
              )}
              {tab === 'pharmacist' && (
                <div className="form-group"><label className="form-label">Pharmacy License No.</label><input className="form-control" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} /></div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add {tab}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
