import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  School,
  BookOpen,
  UserCheck,
  CalendarCheck,
  Award,
  CreditCard,
  BarChart3,
  Shield,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentTab, setCurrentTab, isCollapsed }) {
  const { user, isAdmin, isTeacher } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher'] },
    { id: 'students', label: 'Students', icon: GraduationCap, roles: ['admin', 'teacher'] },
    { id: 'teachers', label: 'Teachers', icon: Users, roles: ['admin', 'teacher'] },
    { id: 'classes', label: 'Classes & Sections', icon: School, roles: ['admin', 'teacher'] },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, roles: ['admin', 'teacher'] },
    { id: 'assignments', label: 'Faculty Assignments', icon: UserCheck, roles: ['admin'] },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'teacher'] },
    { id: 'exams', label: 'Examinations & Marks', icon: Award, roles: ['admin', 'teacher'] },
    { id: 'fees', label: 'Fee Management', icon: CreditCard, roles: ['admin'] },
    { id: 'reports', label: 'Reports & Exports', icon: BarChart3, roles: ['admin', 'teacher'] },
  ];

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">E</div>
        {!isCollapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-title">EduPulse</span>
            <span className="sidebar-subtitle">School Management</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {!isCollapsed && <div className="nav-section-title">Navigation Menu</div>}
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="nav-item-icon" />
              {!isCollapsed && <span>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-snippet">
          <div className="user-avatar">
            {user?.role === 'admin' ? <Shield size={18} /> : <User size={18} />}
          </div>
          {!isCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {user?.fullName || 'User'}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: user?.role === 'admin' ? '#93c5fd' : '#86efac',
                  fontWeight: 600,
                }}
              >
                {user?.role === 'admin' ? 'Administrator' : 'Faculty Teacher'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
