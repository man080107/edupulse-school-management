import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  School,
  CalendarCheck,
  CreditCard,
  TrendingUp,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { dashboardService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function DashboardPage({ setCurrentTab }) {
  const { user, isTeacher } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await dashboardService.getStats();
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Computing school metrics and live stats..." />;
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Could not load dashboard statistics"
        description={error || 'An error occurred while fetching live metrics.'}
      />
    );
  }

  const { stats, classDistribution, attendanceTrend, recentAdmissions, recentActivities, teacherAssignedClasses } = data;

  return (
    <div className="page-content">
      {isTeacher && teacherAssignedClasses && teacherAssignedClasses.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: '#ffffff',
            padding: '22px 26px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sparkles size={18} color="#60a5fa" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Welcome back, {user?.fullName}!
              </h2>
            </div>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
              You are assigned to teach {teacherAssignedClasses.length} class section(s).
              Quickly mark attendance or enter marks below.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setCurrentTab('attendance')}
            >
              <CalendarCheck size={16} /> Mark Today's Attendance
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentTab('exams')}
            >
              <BookOpen size={16} /> Enter Exam Marks
            </button>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          subtext="Active enrollment"
          icon={GraduationCap}
          color="var(--blue-600)"
          bgColor="var(--blue-50)"
        />
        <StatCard
          label="Faculty Teachers"
          value={stats.totalTeachers}
          subtext="Appointed faculty"
          icon={Users}
          color="#10b981"
          bgColor="#ecfdf5"
        />
        <StatCard
          label="Active Classes"
          value={stats.totalClasses}
          subtext="Grade sections"
          icon={School}
          color="#8b5cf6"
          bgColor="#f5f3ff"
        />
        <StatCard
          label="Today's Attendance"
          value={`${stats.todayAttendancePercent}%`}
          subtext={`${stats.todayAttendanceSummary?.present || 0} present today`}
          icon={TrendingUp}
          color="#06b6d4"
          bgColor="#ecfeff"
        />
        {user?.role === 'admin' && (
          <StatCard
            label="Pending Fees"
            value={`$${stats.pendingFeeAmount.toLocaleString()}`}
            subtext={`$${stats.totalFeesCollected.toLocaleString()} collected`}
            icon={CreditCard}
            color="#f59e0b"
            bgColor="#fffbeb"
          />
        )}
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Daily Attendance Trend (%)</h3>
              <p className="card-subtitle">Recent active recorded dates across school</p>
            </div>
          </div>
          {attendanceTrend && attendanceTrend.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="record_date" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="attendance_rate"
                    name="Attendance Rate"
                    stroke="var(--blue-600)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'var(--blue-600)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No Attendance Recorded Yet"
              description="Mark attendance in the attendance module to generate visual trend charts."
            />
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Enrolled Students by Class</h3>
              <p className="card-subtitle">Active distribution per section</p>
            </div>
          </div>
          {classDistribution && classDistribution.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="class_label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="student_count"
                    name="Students"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No classes configured" description="Add classes and sections to view distribution." />
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Student Admissions</h3>
              <p className="card-subtitle">Latest enrolled students</p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentTab('students')}
            >
              View All
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentAdmissions && recentAdmissions.length > 0 ? (
                  recentAdmissions.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: 'var(--blue-600)' }}>{s.admission_no}</td>
                      <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                      <td>
                        <span className="badge badge-info">{s.class_name}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {s.admission_date}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>
                      No recent student admissions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">System Activity Log</h3>
              <p className="card-subtitle">Real-time operational audit trail</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--blue-50)',
                      color: 'var(--blue-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                        {act.action.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                        {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {act.details}
                    </p>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      By {act.user_name} ({act.user_role || 'system'})
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No activities yet" description="System actions will appear here." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
