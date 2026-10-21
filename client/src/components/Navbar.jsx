import React, { useState } from 'react';
import { Menu, LogOut, KeyRound, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';

export default function Navbar({ currentTab, toggleSidebar, isSidebarCollapsed }) {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'dashboard': return 'Administrative Overview';
      case 'students': return 'Student Directory & Admissions';
      case 'teachers': return 'Faculty & Teacher Management';
      case 'classes': return 'Classes & Sections Management';
      case 'subjects': return 'Academic Curriculum & Subjects';
      case 'assignments': return 'Faculty Class-Subject Assignments';
      case 'attendance': return 'Daily Attendance Registry';
      case 'exams': return 'Examinations & Student Performance';
      case 'fees': return 'Tuition & Academic Fee Tracking';
      case 'reports': return 'Institutional Analytics & Reports';
      default: return 'School Management System';
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    setIsChanging(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully.');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="icon-btn"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            <Menu size={19} />
          </button>
          <h1 className="page-title">{getTabTitle(currentTab)}</h1>
        </div>

        <div className="topbar-right">
          <div className="term-pill">
            <span className="term-dot"></span>
            Academic Year 2025-2026 (Term 1)
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              backgroundColor: '#f1f5f9',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-light)',
            }}
          >
            {user?.role === 'admin' ? (
              <ShieldCheck size={16} color="var(--blue-600)" />
            ) : (
              <UserCheck size={16} color="var(--success-main)" />
            )}
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-900)' }}>
              {user?.fullName}
            </span>
            <span
              className={`badge ${user?.role === 'admin' ? 'badge-info' : 'badge-success'}`}
              style={{ fontSize: '0.68rem', padding: '2px 8px' }}
            >
              {user?.role === 'admin' ? 'Admin' : 'Teacher'}
            </span>
          </div>

          <button
            className="icon-btn"
            onClick={() => setShowPasswordModal(true)}
            title="Change Account Password"
          >
            <KeyRound size={17} />
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Sign out of system"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {showPasswordModal && (
        <div className="modal-backdrop" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Change Account Password</h3>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">New Password (Min 6 characters)</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isChanging}>
                  {isChanging ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
