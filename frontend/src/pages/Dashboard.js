import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentRx, setRecentRx] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      axios.get('/api/admin/stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
    } else if (user?.role === 'patient') {
      axios.get('/api/prescriptions').then(r => setRecentRx(r.data.slice(0, 3))).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const go = (path) => navigate(path);

  const getRoleDescription = () => ({
    admin: 'Full system access — manage all records, staff, and operations.',
    doctor: 'View consultations, issue prescriptions, manage leave.',
    receptionist: 'Register patients, collect fees, assign doctors, generate bills.',
    pharmacist: 'Dispense medicines, provide dosage guidance and precautions.',
    patient: 'View your prescriptions, bills, and nutrition guidance.',
  }[user?.role] || '');

  return (
    <div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: 22, color: 'var(--primary)', marginBottom: 4 }}>
              Good day, {user?.full_name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-muted">{getRoleDescription()}</p>
          </div>
        </div>
      </div>

      {user?.role === 'admin' && !loading && stats && (
        <>
          <div className="stat-grid">
            {[
              { label: 'Total Patients', value: stats.patients, color: '#2e86c1' },
              { label: 'Active Doctors', value: stats.doctors, color: '#1abc9c' },
              { label: 'Receptionists', value: stats.receptionists, color: '#8e44ad' },
              { label: 'Pharmacists', value: stats.pharmacists, color: '#e67e22' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ borderLeftColor: s.color }}>
                <h4>{s.label}</h4>
                <div className="stat-value">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="stat-grid">
            {[
              { label: "Today's Registrations", value: stats.today_registrations, sub: 'Patient visits today', color: '#27ae60' },
              { label: "Today's Revenue", value: `₹${Number(stats.today_revenue).toLocaleString('en-IN')}`, sub: 'Fee collections', color: '#f39c12' },
              { label: "Today's Consultations", value: stats.consultations, sub: '', color: '#e74c3c' },
              { label: 'Active Medicines', value: stats.medicines, sub: '', color: '#3498db' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ borderLeftColor: s.color }}>
                <h4>{s.label}</h4>
                <div className="stat-value">{s.value}</div>
                {s.sub && <div className="stat-sub">{s.sub}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {user?.role === 'doctor' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3>Quick Actions</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => go('/consultations')}>📋 View My Consultations</button>
              <button className="btn btn-outline" onClick={() => go('/prescriptions')}>📄 Manage Prescriptions</button>
              <button className="btn btn-outline" onClick={() => go('/leave')}>🏖️ Manage Leave</button>
              <button className="btn btn-outline" onClick={() => go('/messages')}>✉️ Messages</button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Medication Types</h3></div>
            {[
              { type: 'Ayurveda', icon: '🌿', color: 'var(--ayurveda)', bg: '#fef9e7', desc: 'Traditional Indian medicine — herbs, minerals, lifestyle' },
              { type: 'Allopathy', icon: '💊', color: 'var(--allopathy)', bg: '#d6eaf8', desc: 'Conventional Western medicine — pharmaceuticals' },
              { type: 'Homeopathy', icon: '🔬', color: 'var(--homeopathy)', bg: '#f4ecf7', desc: 'Diluted substances to stimulate natural healing' },
            ].map(m => (
              <div key={m.type} style={{ padding: '12px', borderRadius: 8, background: m.bg, borderLeft: `4px solid ${m.color}`, marginBottom: 8 }}>
                <strong style={{ color: m.color }}>{m.icon} {m.type}</strong>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {user?.role === 'receptionist' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3>Quick Actions</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => go('/register-visit')}>📋 Register Patient Visit</button>
              <button className="btn btn-accent" onClick={() => go('/fees')}>💳 Collect Fee</button>
              <button className="btn btn-outline" onClick={() => go('/bills')}>🧾 Generate Bill</button>
              <button className="btn btn-outline" onClick={() => go('/patients')}>👥 View Patients</button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Payment Methods Accepted</h3></div>
            {[
              { icon: '💵', label: 'Cash', desc: 'Direct cash payment at reception' },
              { icon: '📱', label: 'UPI', desc: 'GPay, PhonePe, Paytm, etc.' },
              { icon: '🏦', label: 'NEFT / RTGS', desc: 'Bank transfer with UTR number' },
              { icon: '📝', label: 'Cheque', desc: 'Account payee cheque — bank & number required' },
            ].map(pm => (
              <div key={pm.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 20 }}>{pm.icon}</span>
                <div>
                  <strong style={{ fontSize: 14 }}>{pm.label}</strong>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pm.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {user?.role === 'patient' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3>My Account</h3></div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
              Welcome to Ojasya Healthcare. View your prescriptions, bills, and check nutrition guidance below.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => go('/prescriptions')}>📄 View My Prescriptions</button>
              <button className="btn btn-outline" onClick={() => go('/bills')}>🧾 View My Bills</button>
              <button className="btn btn-accent" onClick={() => go('/nutrition')}>🥗 Check Nutrition</button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Recent Prescriptions</h3></div>
            {recentRx.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 14 }}>No prescriptions yet. Visit a doctor to get started.</p>
            ) : recentRx.map(p => (
              <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: 14 }}>Dr. {p.doctor_name}</strong>
                  <span className={`badge ${p.status === 'dispensed' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(p.created_at).toLocaleDateString('en-IN')}
                  {p.medication_type && <span className={`badge badge-${p.medication_type}`} style={{ marginLeft: 6, fontSize: 11 }}>{p.medication_type}</span>}
                </p>
              </div>
            ))}
            {recentRx.length > 0 && (
              <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => go('/prescriptions')}>
                View all prescriptions →
              </button>
            )}
          </div>
        </div>
      )}

      {user?.role === 'pharmacist' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3>Quick Actions</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => go('/prescriptions')}>📋 View Prescriptions</button>
              <button className="btn btn-accent" onClick={() => go('/dispense')}>💊 Dispense Medicines</button>
              <button className="btn btn-outline" onClick={() => go('/medicines')}>🗃️ Medicine Stock</button>
              <button className="btn btn-outline" onClick={() => go('/messages')}>✉️ Messages</button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Dispensing Tips</h3></div>
            <ul style={{ fontSize: 14, color: 'var(--text-muted)', paddingLeft: 18, lineHeight: 2.2 }}>
              <li>Always verify patient identity before dispensing</li>
              <li>Explain dosage schedule clearly</li>
              <li>Mention food-drug interactions</li>
              <li>Note special precautions for Ayurveda medicines</li>
              <li>Check for allergies listed in prescription</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
