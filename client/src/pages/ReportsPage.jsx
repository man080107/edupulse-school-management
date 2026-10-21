import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Users,
  Award,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { reportService, classService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [classes, setClasses] = useState([]);
  const [reportType, setReportType] = useState('enrollment'); // 'enrollment', 'attendance', 'exams', 'fees'
  const [classFilter, setClassFilter] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await classService.getAll();
        setClasses(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadClasses();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'enrollment') {
        const res = await reportService.getEnrollment();
        setReportData(res.data || []);
      } else if (reportType === 'attendance') {
        const res = await reportService.getAttendance({
          classId: classFilter,
          startDate,
          endDate,
        });
        setReportData(res.data || []);
      } else if (reportType === 'exams') {
        const res = await reportService.getExams({ classId: classFilter });
        setReportData(res.data || []);
      } else if (reportType === 'fees') {
        const res = await reportService.getFees({ classId: classFilter });
        setReportData(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch report.');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, classFilter, startDate, endDate]);

  const handleExportCSV = () => {
    let typeParam = 'students';
    if (reportType === 'attendance') typeParam = 'attendance';
    if (reportType === 'fees') typeParam = 'fees';

    const url = reportService.exportCsvUrl(typeParam, classFilter);
    window.open(url, '_blank');
    toast.success('Downloading database CSV export...');
  };

  return (
    <div className="page-content">
      <div className="filter-bar no-print">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${reportType === 'enrollment' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setReportType('enrollment')}
          >
            <Users size={15} /> Enrollment by Class
          </button>
          <button
            className={`btn btn-sm ${reportType === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setReportType('attendance')}
          >
            <Calendar size={15} /> Attendance Percentages
          </button>
          <button
            className={`btn btn-sm ${reportType === 'exams' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setReportType('exams')}
          >
            <Award size={15} /> Exam Performance
          </button>
          {isAdmin && (
            <button
              className={`btn btn-sm ${reportType === 'fees' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportType('fees')}
            >
              <CreditCard size={15} /> Outstanding Fees
            </button>
          )}
        </div>

        <div className="filter-group">
          {reportType !== 'enrollment' && (
            <select
              className="form-select"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name} - {c.section}
                </option>
              ))}
            </select>
          )}

          {reportType === 'attendance' && (
            <>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: 'auto' }}
              />
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: 'auto' }}
              />
            </>
          )}

          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <FileSpreadsheet size={15} /> Export CSV
          </button>

          <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      <div className="card printable-document" style={{ padding: 0 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                {reportType === 'enrollment' && 'Student Enrollment & Capacity Report'}
                {reportType === 'attendance' && 'Student Attendance Frequency & Percentage Report'}
                {reportType === 'exams' && 'Institutional Examination & Pass Percentage Report'}
                {reportType === 'fees' && 'Outstanding Academic Fees & Defaulters Ledger'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                EduPulse School Administration System | Generated on {new Date().toLocaleDateString()}
              </p>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
              OFFICIAL REPORT
            </span>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Compiling analytical report from MySQL records..." />
        ) : reportData.length === 0 ? (
          <EmptyState title="No records found" description="No data matched the selected filter range." />
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            {reportType === 'enrollment' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Class Section</th>
                    <th>Room</th>
                    <th>Total Enrolled</th>
                    <th>Male Students</th>
                    <th>Female Students</th>
                    <th>Capacity</th>
                    <th>Occupancy Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r) => (
                    <tr key={r.class_id}>
                      <td style={{ fontWeight: 700 }}>{r.class_name}</td>
                      <td>{r.room_number || 'N/A'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--blue-600)' }}>{r.total_enrolled}</td>
                      <td>{r.male_count}</td>
                      <td>{r.female_count}</td>
                      <td>{r.capacity}</td>
                      <td>
                        <span className="badge badge-info">{r.occupancy_rate}% Filled</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'attendance' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Total Recorded Days</th>
                    <th>Present Days</th>
                    <th>Late Days</th>
                    <th>Absent Days</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r) => (
                    <tr key={r.student_id}>
                      <td style={{ fontWeight: 600, color: 'var(--blue-600)' }}>{r.admission_no}</td>
                      <td style={{ fontWeight: 700 }}>{r.full_name}</td>
                      <td>{r.class_name}</td>
                      <td>{r.total_recorded_days}</td>
                      <td style={{ color: 'var(--success-main)', fontWeight: 600 }}>{r.present_days}</td>
                      <td style={{ color: 'var(--warning-main)', fontWeight: 600 }}>{r.late_days}</td>
                      <td style={{ color: 'var(--danger-main)', fontWeight: 600 }}>{r.absent_days}</td>
                      <td>
                        <span
                          className={`badge ${
                            r.attendance_percentage >= 85
                              ? 'badge-success'
                              : r.attendance_percentage >= 70
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {r.attendance_percentage != null ? `${r.attendance_percentage}%` : '0%'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'exams' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Exam Name</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Appeared</th>
                    <th>Passed</th>
                    <th>Failed</th>
                    <th>Pass Rate (%)</th>
                    <th>Avg Score</th>
                    <th>Highest Score</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r) => (
                    <tr key={r.exam_id}>
                      <td style={{ fontWeight: 700 }}>{r.exam_name}</td>
                      <td>{r.class_name}</td>
                      <td>{r.subject_name}</td>
                      <td>{r.exam_date}</td>
                      <td>{r.total_appeared}</td>
                      <td style={{ color: 'var(--success-main)', fontWeight: 600 }}>{r.passed_count}</td>
                      <td style={{ color: 'var(--danger-main)', fontWeight: 600 }}>{r.failed_count}</td>
                      <td>
                        <span className="badge badge-info">{r.pass_percentage || 0}%</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.average_score || 'N/A'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success-main)' }}>{r.highest_score || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'fees' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Fee Title</th>
                    <th>Invoice Amount</th>
                    <th>Amount Paid</th>
                    <th>Outstanding Balance</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: 'var(--blue-600)' }}>{r.admission_no}</td>
                      <td style={{ fontWeight: 700 }}>{r.student_name}</td>
                      <td>{r.class_name}</td>
                      <td>{r.fee_title}</td>
                      <td>${Number(r.fee_amount).toFixed(2)}</td>
                      <td style={{ color: 'var(--success-main)', fontWeight: 600 }}>
                        ${Number(r.paid_amount).toFixed(2)}
                      </td>
                      <td style={{ color: 'var(--danger-main)', fontWeight: 700 }}>
                        ${Number(r.outstanding_balance).toFixed(2)}
                      </td>
                      <td>{r.due_date}</td>
                      <td>
                        <span
                          className={`badge ${
                            r.status === 'paid'
                              ? 'badge-success'
                              : r.status === 'partial'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
