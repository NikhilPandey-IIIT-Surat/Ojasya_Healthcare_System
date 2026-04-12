import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const ROLES = [
  { key: 'patient', label: 'Patient' },
  { key: 'doctor', label: 'Doctor' },
  { key: 'receptionist', label: 'Receptionist' },
  { key: 'pharmacist', label: 'Pharmacist' },
  { key: 'admin', label: 'Admin' },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { ...form, role });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>🫀 Ojasya</h1>
          <p>Healthcare Management System</p>
        </div>

        <div className="role-grid">
          {ROLES.map(r => (
            <button key={r.key} className={`role-btn ${role === r.key ? 'active' : ''}`} onClick={() => setRole(r.key)}>
              {r.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" type="email" placeholder="your@email.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : `Sign in as ${ROLES.find(r => r.key === role)?.label}`}
          </button>
        </form>

        {role !== 'admin' && role !== 'doctor' && role !== 'receptionist' && role !== 'pharmacist' && (
          <p className="text-center mt-16 text-muted">
            New patient? <Link to="/signup" style={{ color: 'var(--primary)' }}>Create account</Link>
          </p>
        )}

        <p className="text-center mt-16" style={{ fontSize: '12px', color: '#aaa' }}>
          Demo admin: admin@ojasya.com / Admin@123
        </p>
      </div>
    </div>
  );
}

export function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '',
    dob: '', gender: '', address: '', blood_group: '',
    doctor_type: 'junior_resident', specialization: '', qualification: '',
    license_number: '', employee_id: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const SIGNUP_ROLES = ['patient', 'doctor', 'receptionist', 'pharmacist'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', { ...form, role });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <h1>🫀 Ojasya</h1>
          <p>Create your account</p>
        </div>

        <div className="role-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {SIGNUP_ROLES.map(r => (
            <button key={r} className={`role-btn ${role === r ? 'active' : ''}`} onClick={() => setRole(r)}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" placeholder="Dr. / Mr. / Ms." value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" placeholder="+91 XXXXXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-control" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>

          {role === 'patient' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-control" type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-control" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-control" value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })}>
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-control" placeholder="City, State" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
            </>
          )}

          {role === 'doctor' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Doctor Type</label>
                  <select className="form-control" value={form.doctor_type} onChange={e => setForm({ ...form, doctor_type: e.target.value })}>
                    <option value="junior_resident">Junior Resident</option>
                    <option value="senior_resident">Senior Resident</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <input className="form-control" placeholder="e.g. General Medicine" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Qualification</label>
                  <input className="form-control" placeholder="e.g. MBBS, MD" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input className="form-control" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} />
                </div>
              </div>
            </>
          )}

          {role === 'receptionist' && (
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input className="form-control" placeholder="OJH-REC-001" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} />
            </div>
          )}

          {role === 'pharmacist' && (
            <div className="form-group">
              <label className="form-label">Pharmacy License Number</label>
              <input className="form-control" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} />
            </div>
          )}

          <button className="btn btn-accent" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-16 text-muted">
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
