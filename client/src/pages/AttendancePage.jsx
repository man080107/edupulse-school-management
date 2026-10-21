import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Users,
  Search,
  CheckCheck,
  BarChart2,
  Calendar,
} from 'lucide-react';
import { attendanceService, classService, assignmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function AttendancePage() {
  const { user, isTeacher } = useAuth();
  const toast = useToast();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  // Attendance Records state
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isAlreadyRecorded, setIsAlreadyRecorded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tabs: 'take' or 'daily-summary'
  const [activeTab, setActiveTab] = useState('take');
  const [dailySummaries, setDailySummaries] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Load authorized classes for user
  useEffect(() => {
    async function loadAuthorizedClasses() {
      try {
        if (isTeacher) {
          const res = await assignmentService.getMyClasses();
          const list = res.data || [];
          setClasses(list);
          if (list.length > 0) setSelectedClassId(list[0].id);
        } else {
          const res = await classService.getAll();
          const list = res.data || [];
          setClasses(list);
          if (list.length > 0) setSelectedClassId(list[0].id);
        }
      } catch (err) {
        toast.error('Failed to load classes.');
      }
    }
    loadAuthorizedClasses();
  }, [isTeacher]);

  // Fetch Attendance Sheet
  const fetchAttendanceSheet = async () => {
    if (!selectedClassId || !selectedDate) return;
    setLoading(true);
    try {
      const res = await attendanceService.getSheet({
        classId: selectedClassId,
        date: selectedDate,
      });
      setRecords(res.records || []);
      setSummary(res.summary || null);
      setIsAlreadyRecorded(res.isAlreadyRecorded || false);
    } catch (err) {
      toast.error(err.message || 'Failed to load attendance sheet.');
      setRecords([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'take') {
      fetchAttendanceSheet();
    } else if (activeTab === 'daily-summary') {
      fetchDailySummary();
    }
  }, [selectedClassId, selectedDate, activeTab]);

  // Fetch Daily Summary across all classes
  const fetchDailySummary = async () => {
    setLoadingDaily(true);
    try {
      const res = await attendanceService.getDailySummary({ date: selectedDate });
      setDailySummaries(res.summaries || []);
    } catch (err) {
      toast.error('Failed to load daily summaries.');
    } finally {
      setLoadingDaily(false);
    }
  };

  // Change individual student status
  const handleStatusChange = (studentId, status) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );
  };

  // Change individual student remarks
  const handleRemarksChange = (studentId, remarks) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, remarks } : r))
    );
  };

  // Helper: Mark All Present
  const handleMarkAllPresent = () => {
    setRecords((prev) => prev.map((r) => ({ ...r, status: 'Present' })));
    toast.info('Marked all students as Present.');
  };

  // Helper: Mark All Absent
  const handleMarkAllAbsent = () => {
    setRecords((prev) => prev.map((r) => ({ ...r, status: 'Absent' })));
    toast.info('Marked all students as Absent.');
  };

  // Save Attendance to MySQL
  const handleSaveAttendance = async () => {
    if (records.length === 0) return;
    setSaving(true);
    try {
      await attendanceService.save({
        classId: selectedClassId,
        date: selectedDate,
        records: records.map((r) => ({
          student_id: r.student_id,
          status: r.status,
          remarks: r.remarks,
        })),
      });
      toast.success('Attendance recorded and saved successfully!');
      fetchAttendanceSheet();
    } catch (err) {
      toast.error(err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Compute live local summary counts
  const livePresent = records.filter((r) => r.status === 'Present').length;
  const liveLate = records.filter((r) => r.status === 'Late').length;
  const liveAbsent = records.filter((r) => r.status === 'Absent').length;
  const livePct = records.length > 0 ? Math.round(((livePresent + liveLate) / records.length) * 100) : 0;

  return (
    <div className="page-content">
      {/* Tab Switcher & Date Selector */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'take' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('take')}
          >
            <CalendarCheck size={16} /> Mark / Edit Attendance
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'daily-summary' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('daily-summary')}
          >
            <BarChart2 size={16} /> School Daily Overview
          </button>
        </div>

        <div className="filter-group">
          {activeTab === 'take' && (
            <select
              className="form-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={{ width: 'auto', fontWeight: 600 }}
            >
              {classes.length === 0 && <option value="">No authorized classes</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name} - {c.section}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            className="form-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: 'auto' }}
          />
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'take' ? (
        <>
          {/* Quick Metrics Bar for this Class */}
          {records.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
              }}
            >
              <div className="stat-card" style={{ padding: '14px', '--stat-color': 'var(--blue-600)', '--stat-bg': 'var(--blue-50)' }}>
                <div className="stat-info">
                  <span className="stat-label">Total Enrolled</span>
                  <span className="stat-value" style={{ fontSize: '1.4rem' }}>{records.length}</span>
                  <span className="stat-subtext">Students in Section</span>
                </div>
              </div>
              <div className="stat-card" style={{ padding: '14px', '--stat-color': 'var(--success-main)', '--stat-bg': 'var(--success-bg)' }}>
                <div className="stat-info">
                  <span className="stat-label">Present</span>
                  <span className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--success-text)' }}>{livePresent}</span>
                  <span className="stat-subtext">In Classroom</span>
                </div>
              </div>
              <div className="stat-card" style={{ padding: '14px', '--stat-color': 'var(--warning-main)', '--stat-bg': 'var(--warning-bg)' }}>
                <div className="stat-info">
                  <span className="stat-label">Late Arrivals</span>
                  <span className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--warning-text)' }}>{liveLate}</span>
                  <span className="stat-subtext">Tardy arrivals</span>
                </div>
              </div>
              <div className="stat-card" style={{ padding: '14px', '--stat-color': 'var(--danger-main)', '--stat-bg': 'var(--danger-bg)' }}>
                <div className="stat-info">
                  <span className="stat-label">Absent</span>
                  <span className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--danger-text)' }}>{liveAbsent}</span>
                  <span className="stat-subtext">Not in Attendance</span>
                </div>
              </div>
              <div className="stat-card" style={{ padding: '14px', '--stat-color': '#06b6d4', '--stat-bg': '#ecfeff' }}>
                <div className="stat-info">
                  <span className="stat-label">Attendance Rate</span>
                  <span className="stat-value" style={{ fontSize: '1.4rem' }}>{livePct}%</span>
                  <span className="stat-subtext">Present + Late</span>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Action Controls Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: '#ffffff',
              padding: '14px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                Quick Helpers:
              </span>
              <button className="btn btn-secondary btn-sm" onClick={handleMarkAllPresent}>
                <CheckCheck size={14} color="var(--success-main)" /> Mark All Present
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleMarkAllAbsent}>
                <XCircle size={14} color="var(--danger-main)" /> Mark All Absent
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isAlreadyRecorded && (
                <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
                  ✓ Previously Saved for this Date
                </span>
              )}
              <button
                className="btn btn-primary"
                onClick={handleSaveAttendance}
                disabled={saving || records.length === 0}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Attendance to MySQL'}
              </button>
            </div>
          </div>

          {/* Student Roster Attendance Sheet Table */}
          <div className="card" style={{ padding: 0 }}>
            {loading ? (
              <LoadingSpinner text="Loading class roster..." />
            ) : records.length === 0 ? (
              <EmptyState
                title="No students found in class"
                description={
                  isTeacher
                    ? "You have no students enrolled in your assigned class, or you are not assigned to this class."
                    : "No active students are currently enrolled in this class section."
                }
              />
            ) : (
              <div className="table-container" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Admission No</th>
                      <th>Student Name</th>
                      <th>Gender</th>
                      <th style={{ width: '320px' }}>Attendance Status</th>
                      <th>Remarks / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, idx) => (
                      <tr key={r.student_id}>
                        <td style={{ color: 'var(--text-light)', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: 'var(--blue-600)' }}>{r.admission_no}</td>
                        <td style={{ fontWeight: 700 }}>{r.full_name}</td>
                        <td>{r.gender}</td>
                        <td>
                          {/* Segmented Radio Buttons for Present / Late / Absent */}
                          <div
                            style={{
                              display: 'inline-flex',
                              backgroundColor: '#f1f5f9',
                              padding: '3px',
                              borderRadius: 'var(--radius-md)',
                              gap: '4px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r.student_id, 'Present')}
                              style={{
                                padding: '5px 12px',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 150ms ease',
                                backgroundColor: r.status === 'Present' ? 'var(--success-main)' : 'transparent',
                                color: r.status === 'Present' ? '#ffffff' : 'var(--text-secondary)',
                                boxShadow: r.status === 'Present' ? '0 2px 6px rgba(16, 185, 129, 0.3)' : 'none',
                              }}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r.student_id, 'Late')}
                              style={{
                                padding: '5px 12px',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 150ms ease',
                                backgroundColor: r.status === 'Late' ? 'var(--warning-main)' : 'transparent',
                                color: r.status === 'Late' ? '#ffffff' : 'var(--text-secondary)',
                                boxShadow: r.status === 'Late' ? '0 2px 6px rgba(245, 158, 11, 0.3)' : 'none',
                              }}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(r.student_id, 'Absent')}
                              style={{
                                padding: '5px 12px',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 150ms ease',
                                backgroundColor: r.status === 'Absent' ? 'var(--danger-main)' : 'transparent',
                                color: r.status === 'Absent' ? '#ffffff' : 'var(--text-secondary)',
                                boxShadow: r.status === 'Absent' ? '0 2px 6px rgba(239, 68, 68, 0.3)' : 'none',
                              }}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                            placeholder="Optional reason..."
                            value={r.remarks || ''}
                            onChange={(e) => handleRemarksChange(r.student_id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Daily Summary across School Overview */
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
            <h3 className="card-title">School-wide Daily Attendance Breakdown</h3>
            <p className="card-subtitle">Summary for date: {selectedDate}</p>
          </div>
          {loadingDaily ? (
            <LoadingSpinner text="Computing school attendance stats..." />
          ) : dailySummaries.length === 0 ? (
            <EmptyState title="No classes found" description="Classes will appear here once configured." />
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Class Section</th>
                    <th>Enrolled Students</th>
                    <th>Recorded Count</th>
                    <th>Present</th>
                    <th>Late</th>
                    <th>Absent</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySummaries.map((s) => (
                    <tr key={s.class_id}>
                      <td style={{ fontWeight: 700 }}>{s.class_name}</td>
                      <td>{s.total_enrolled}</td>
                      <td>{s.recorded_count}</td>
                      <td style={{ color: 'var(--success-main)', fontWeight: 600 }}>{s.present_count || 0}</td>
                      <td style={{ color: 'var(--warning-main)', fontWeight: 600 }}>{s.late_count || 0}</td>
                      <td style={{ color: 'var(--danger-main)', fontWeight: 600 }}>{s.absent_count || 0}</td>
                      <td>
                        <span
                          className={`badge ${
                            s.attendance_rate >= 85
                              ? 'badge-success'
                              : s.attendance_rate >= 60
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {s.attendance_rate ? `${s.attendance_rate}%` : 'Not Marked'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
