import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const icons = {
  dashboard: '🏠', patients: '👥', register: '📋', fees: '💳',
  consultations: '🩺', prescriptions: '📄', medicines: '💊',
  pharmacy: '🏪', messages: '✉️', nutrition: '🥗', bills: '🧾',
  doctors: '👨‍⚕️', staff: '👩‍💼', diseases: '🦠', admin: '⚙️',
  leave: '🏖️', reports: '📊', profile: '👤', logout: '🚪'
};

const navConfig = {
  admin: [
    { section: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', path: '/dashboard' }] },
    { section: 'Management', items: [
      { key: 'patients', label: 'Patients', path: '/patients' },
      { key: 'doctors', label: 'Doctors', path: '/doctors' },
      { key: 'staff', label: 'Staff Management', path: '/staff' },
      { key: 'medicines', label: 'Medicines', path: '/medicines' },
      { key: 'diseases', label: 'Diseases', path: '/diseases' },
    ]},
    { section: 'Operations', items: [
      { key: 'consultations', label: 'Consultations', path: '/consultations' },
      { key: 'bills', label: 'Bills', path: '/bills' },
      { key: 'fees', label: 'Fee Records', path: '/fees' },
      { key: 'messages', label: 'Messages', path: '/messages', badge: true },
      { key: 'nutrition', label: 'Nutrition Check', path: '/nutrition' },
    ]},
  ],
  receptionist: [
    { section: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', path: '/dashboard' }] },
    { section: 'Patient Care', items: [
      { key: 'patients', label: 'Patients', path: '/patients' },
      { key: 'register', label: 'Register Visit', path: '/register-visit' },
      { key: 'fees', label: 'Fee Collection', path: '/fees' },
      { key: 'consultations', label: 'Consultations', path: '/consultations' },
      { key: 'bills', label: 'Generate Bills', path: '/bills' },
    ]},
    { section: 'Other', items: [
      { key: 'messages', label: 'Messages', path: '/messages', badge: true },
      { key: 'nutrition', label: 'Nutrition Check', path: '/nutrition' },
    ]},
  ],
  doctor: [
    { section: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', path: '/dashboard' }] },
    { section: 'Clinical', items: [
      { key: 'consultations', label: 'My Consultations', path: '/consultations' },
      { key: 'prescriptions', label: 'Prescriptions', path: '/prescriptions' },
      { key: 'patients', label: 'Patients', path: '/patients' },
      { key: 'medicines', label: 'Medicines', path: '/medicines' },
    ]},
    { section: 'Other', items: [
      { key: 'leave', label: 'Manage Leave', path: '/leave' },
      { key: 'messages', label: 'Messages', path: '/messages', badge: true },
      { key: 'nutrition', label: 'Nutrition Check', path: '/nutrition' },
    ]},
  ],
  pharmacist: [
    { section: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', path: '/dashboard' }] },
    { section: 'Pharmacy', items: [
      { key: 'prescriptions', label: 'Prescriptions', path: '/prescriptions' },
      { key: 'pharmacy', label: 'Dispense', path: '/dispense' },
      { key: 'medicines', label: 'Medicines', path: '/medicines' },
    ]},
    { section: 'Other', items: [
      { key: 'messages', label: 'Messages', path: '/messages', badge: true },
      { key: 'nutrition', label: 'Nutrition Check', path: '/nutrition' },
    ]},
  ],
  patient: [
    { section: 'My Health', items: [
      { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
      { key: 'consultations', label: 'My Consultations', path: '/consultations' },
      { key: 'prescriptions', label: 'My Prescriptions', path: '/prescriptions' },
      { key: 'bills', label: 'My Bills', path: '/bills' },
    ]},
    { section: 'Tools', items: [
      { key: 'nutrition', label: 'Nutrition Check', path: '/nutrition' },
    ]},
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread messages every 30 seconds for staff roles
  useEffect(() => {
    const canReceiveMessages = ['doctor', 'receptionist', 'pharmacist', 'admin'].includes(user?.role);
    if (!canReceiveMessages) return;

    const fetchUnread = () => {
      axios.get('/api/messages').then(r => {
        const count = r.data.filter(
          m => m.receiver_type === user.role && m.receiver_id === user.id && !m.is_read
        ).length;
        setUnreadCount(count);
      }).catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Clear badge when on messages page
  useEffect(() => {
    if (location.pathname === '/messages') setUnreadCount(0);
  }, [location.pathname]);

  const config = navConfig[user?.role] || [];
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const roleLabel = user?.role === 'doctor'
    ? (user?.doctor_type === 'senior_resident' ? 'Senior Resident' : 'Junior Resident')
    : user?.role?.replace(/_/g, ' ') || '';

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h2>🫀 Ojasya</h2>
        <span>Healthcare System</span>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
            {user?.full_name}
          </p>
          <span style={{ textTransform: 'capitalize' }}>{roleLabel}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {config.map(section => (
          <div key={section.section}>
            <div className="nav-section">{section.section}</div>
            {section.items.map(item => (
              <button
                key={item.key}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span style={{ fontSize: 16 }}>{icons[item.key]}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {item.badge && unreadCount > 0 && (
                  <span style={{
                    background: '#e74c3c', color: 'white',
                    borderRadius: 10, padding: '1px 6px',
                    fontSize: 10, fontWeight: 700, minWidth: 18,
                    textAlign: 'center', flexShrink: 0
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={logout} style={{ color: '#e74c3c', width: '100%' }}>
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
        <div style={{
          marginTop: 12,
          padding: '10px 12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.35)',
          lineHeight: 1.6
        }}>
          <div style={{ marginBottom: 2 }}>Designed &amp; Developed with ❤️ by</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
  <a 
    href="https://www.linkedin.com/in/nityam-dave-095201312/" 
    target="_blank" 
    rel="noopener noreferrer"
    style={{ color: 'inherit', textDecoration: 'none' }}
  >
    Nityam Dave
  </a>
</div>

<div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
  <a 
    href="https://www.linkedin.com/in/nikhil-pandey-19b917324/" 
    target="_blank" 
    rel="noopener noreferrer"
    style={{ color: 'inherit', textDecoration: 'none' }}
  >
    Nikhil Pandey
  </a>
</div>

          <div style={{ marginBottom: 2 }}>© 2026 Ojasya Healthcare. <br />All rights reserved.</div>
        </div>
        
      </div>
    </div>
  );
}