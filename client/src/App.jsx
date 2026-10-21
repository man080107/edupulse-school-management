import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import TeachersPage from './pages/TeachersPage';
import ClassesPage from './pages/ClassesPage';
import SubjectsPage from './pages/SubjectsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AttendancePage from './pages/AttendancePage';
import ExamsPage from './pages/ExamsPage';
import FeesPage from './pages/FeesPage';
import ReportsPage from './pages/ReportsPage';

export default function App() {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner text="Initializing EduPulse System..." size={36} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage setCurrentTab={setCurrentTab} />;
      case 'students':
        return <StudentsPage />;
      case 'teachers':
        return <TeachersPage />;
      case 'classes':
        return <ClassesPage />;
      case 'subjects':
        return <SubjectsPage />;
      case 'assignments':
        return isAdmin ? <AssignmentsPage /> : <DashboardPage setCurrentTab={setCurrentTab} />;
      case 'attendance':
        return <AttendancePage />;
      case 'exams':
        return <ExamsPage />;
      case 'fees':
        return isAdmin ? <FeesPage /> : <DashboardPage setCurrentTab={setCurrentTab} />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <DashboardPage setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
      />
      <div className="main-wrapper">
        <Navbar
          currentTab={currentTab}
          toggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <main>{renderActivePage()}</main>
      </div>
    </div>
  );
}
