import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Printer,
  X,
  Save,
  CheckCircle,
  FileText,
  Search,
} from 'lucide-react';
import { examService, classService, subjectService, studentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

export default function ExamsPage() {
  const { isAdmin, isTeacher } = useAuth();
  const toast = useToast();

  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examMarksList, setExamMarksList] = useState([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  // Report Card State
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [reportCardData, setReportCardData] = useState(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState('');

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  // New Exam Form
  const [examForm, setExamForm] = useState({
    exam_name: '',
    class_id: '',
    subject_id: '',
    exam_date: new Date().toISOString().slice(0, 10),
    max_marks: 100,
    pass_marks: 40,
    academic_term: 'Term 1',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [eRes, cRes, sRes] = await Promise.all([
        examService.getAll({ classId: classFilter, subjectId: subjectFilter }),
        classService.getAll(),
        subjectService.getAll(),
      ]);
      setExams(eRes.data || []);
      setClasses(cRes.data || []);
      setSubjects(sRes.data || []);
    } catch (err) {
      toast.error('Failed to load exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classFilter, subjectFilter]);

  // Load students for report card generator selector
  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await studentService.getAll({ limit: 100 });
        setAllStudents(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadStudents();
  }, []);

  const handleOpenCreate = () => {
    setExamForm({
      exam_name: '',
      class_id: classes[0]?.id || '',
      subject_id: subjects[0]?.id || '',
      exam_date: new Date().toISOString().slice(0, 10),
      max_marks: 100,
      pass_marks: 40,
      academic_term: 'Term 1',
    });
    setShowCreateModal(true);
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setIsSubmittingExam(true);
    try {
      await examService.create(examForm);
      toast.success('Examination scheduled successfully.');
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule exam.');
    } finally {
      setIsSubmittingExam(false);
    }
  };

  // Open Marks Entry Modal
  const handleOpenMarks = async (exam) => {
    setSelectedExam(exam);
    setShowMarksModal(true);
    setLoadingMarks(true);
    try {
      const res = await examService.getMarks(exam.id);
      setExamMarksList(res.marks || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load marks roster.');
      setShowMarksModal(false);
    } finally {
      setLoadingMarks(false);
    }
  };

  // Update Mark input
  const handleMarkChange = (studentId, value) => {
    setExamMarksList((prev) =>
      prev.map((m) => (m.student_id === studentId ? { ...m, marks_obtained: value } : m))
    );
  };

  // Update Remark input
  const handleRemarkChange = (studentId, value) => {
    setExamMarksList((prev) =>
      prev.map((m) => (m.student_id === studentId ? { ...m, remarks: value } : m))
    );
  };

  // Save Marks to MySQL
  const handleSaveMarks = async () => {
    if (!selectedExam) return;
    setSavingMarks(true);
    try {
      await examService.saveMarks(selectedExam.id, {
        marks: examMarksList.map((m) => ({
          student_id: m.student_id,
          marks_obtained: m.marks_obtained,
          remarks: m.remarks,
        })),
      });
      toast.success('Examination marks evaluated and saved!');
      setShowMarksModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save marks.');
    } finally {
      setSavingMarks(false);
    }
  };

  // Generate & Print Student Report Card
  const handleGenerateReportCard = async (studentId) => {
    if (!studentId) return;
    setLoadingReportCard(true);
    setShowReportCardModal(true);
    try {
      const res = await examService.getStudentReportCard(studentId);
      setReportCardData(res);
    } catch (err) {
      toast.error(err.message || 'Failed to generate report card.');
      setShowReportCardModal(false);
    } finally {
      setLoadingReportCard(false);
    }
  };

  // Delete Exam
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await examService.delete(deleteId);
      toast.success('Examination removed.');
      setDeleteId(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete exam.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="filter-bar">
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-900)' }}>
            Examinations & Academic Grading
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Schedule exams, record marks, and generate official student report cards.
          </p>
        </div>

        <div className="filter-group">
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

          <select
            className="form-select"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subject_name}
              </option>
            ))}
          </select>

          {isAdmin && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={16} /> Schedule Examination
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={20} color="var(--blue-600)" />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)' }}>
              Individual Student Report Card Generator
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Select any student to compile their full academic performance dossier
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            className="form-select"
            value={selectedStudentForReport}
            onChange={(e) => setSelectedStudentForReport(e.target.value)}
            style={{ minWidth: '240px' }}
          >
            <option value="">Select Student...</option>
            {allStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} ({s.admission_no}) - {s.class_name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-outline-primary btn-sm"
            disabled={!selectedStudentForReport}
            onClick={() => handleGenerateReportCard(selectedStudentForReport)}
          >
            <Printer size={15} /> Generate Dossier
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <LoadingSpinner text="Retrieving examinations..." />
        ) : exams.length === 0 ? (
          <EmptyState
            title="No examinations scheduled"
            description="Schedule an exam to enter marks and calculate grades."
            actionButton={
              isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
                  Schedule First Exam
                </button>
              )
            }
          />
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Max / Pass Marks</th>
                  <th>Evaluation Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{e.exam_name}</div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {e.academic_term}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info">{e.class_name}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{e.subject_name}</div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                        {e.subject_code}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.exam_date}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{e.max_marks}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> (Pass: {e.pass_marks})</span>
                    </td>
                    <td>
                      <span className={`badge ${e.graded_students_count > 0 ? 'badge-success' : 'badge-neutral'}`}>
                        {e.graded_students_count > 0
                          ? `Graded (${e.graded_students_count} students, avg: ${e.average_score})`
                          : 'Pending Entry'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleOpenMarks(e)}
                        >
                          <Edit2 size={13} /> Enter Marks
                        </button>
                        {isAdmin && (
                          <button
                            className="icon-btn"
                            style={{ color: 'var(--danger-main)' }}
                            title="Delete Exam"
                            onClick={() => setDeleteId(e.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Schedule New Examination</h3>
              <button className="icon-btn" onClick={() => setShowCreateModal(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateExam}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Examination Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mid-Term Examination 2026"
                    value={examForm.exam_name}
                    onChange={(e) => setExamForm({ ...examForm, exam_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Class & Section</label>
                    <select
                      className="form-select"
                      value={examForm.class_id}
                      onChange={(e) => setExamForm({ ...examForm, class_id: e.target.value })}
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.class_name} - {c.section}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Subject</label>
                    <select
                      className="form-select"
                      value={examForm.subject_id}
                      onChange={(e) => setExamForm({ ...examForm, subject_id: e.target.value })}
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.subject_name} ({s.subject_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Examination Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={examForm.exam_date}
                      onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Academic Term</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Term 1"
                      value={examForm.academic_term}
                      onChange={(e) => setExamForm({ ...examForm, academic_term: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Maximum Marks</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={examForm.max_marks}
                      onChange={(e) => setExamForm({ ...examForm, max_marks: parseFloat(e.target.value) || 100 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Passing Marks</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={examForm.pass_marks}
                      onChange={(e) => setExamForm({ ...examForm, pass_marks: parseFloat(e.target.value) || 40 })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingExam}>
                  {isSubmittingExam ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMarksModal && selectedExam && (
        <div className="modal-backdrop" onClick={() => setShowMarksModal(false)}>
          <div className="modal-container large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selectedExam.exam_name} - Marks Evaluation</h3>
                <p className="card-subtitle">
                  Class: {selectedExam.class_name} | Subject: {selectedExam.subject_name} | Max Marks: {selectedExam.max_marks}
                </p>
              </div>
              <button className="icon-btn" onClick={() => setShowMarksModal(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {loadingMarks ? (
                <LoadingSpinner text="Loading enrolled student marks sheet..." />
              ) : examMarksList.length === 0 ? (
                <EmptyState title="No students enrolled" description="Enroll students in this class to grade exams." />
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Admission No</th>
                        <th>Student Name</th>
                        <th style={{ width: '140px' }}>Marks Obtained</th>
                        <th>Grade</th>
                        <th>Status</th>
                        <th>Teacher Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examMarksList.map((m) => {
                        const num = parseFloat(m.marks_obtained);
                        const isEntered = !isNaN(num);
                        const isPass = isEntered && num >= selectedExam.pass_marks;
                        return (
                          <tr key={m.student_id}>
                            <td style={{ fontWeight: 600, color: 'var(--blue-600)' }}>{m.admission_no}</td>
                            <td style={{ fontWeight: 600 }}>{m.full_name}</td>
                            <td>
                              <input
                                type="number"
                                className="form-input"
                                min="0"
                                max={selectedExam.max_marks}
                                step="0.5"
                                style={{ padding: '6px 10px', fontWeight: 700 }}
                                placeholder="0"
                                value={m.marks_obtained ?? ''}
                                onChange={(e) => handleMarkChange(m.student_id, e.target.value)}
                              />
                            </td>
                            <td>
                              {isEntered ? (
                                <span className="badge badge-info" style={{ fontWeight: 800 }}>
                                  {num >= 90 ? 'A+' : num >= 80 ? 'A' : num >= 70 ? 'B' : num >= 60 ? 'C' : num >= 40 ? 'D' : 'F'}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-light)' }}>-</span>
                              )}
                            </td>
                            <td>
                              {isEntered ? (
                                <span className={`badge ${isPass ? 'badge-success' : 'badge-danger'}`}>
                                  {isPass ? 'Pass' : 'Fail'}
                                </span>
                              ) : (
                                <span className="badge badge-neutral">Pending</span>
                              )}
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-input"
                                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                                placeholder="Remark..."
                                value={m.remarks || ''}
                                onChange={(e) => handleRemarkChange(m.student_id, e.target.value)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowMarksModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveMarks} disabled={savingMarks}>
                <Save size={16} /> {savingMarks ? 'Saving...' : 'Save Evaluated Marks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportCardModal && (
        <div className="modal-backdrop" onClick={() => setShowReportCardModal(false)}>
          <div className="modal-container large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header no-print">
              <h3 className="modal-title">Official Student Academic Performance Dossier</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => window.print()}
                >
                  <Printer size={15} /> Print Report Card
                </button>
                <button className="icon-btn" onClick={() => setShowReportCardModal(false)} style={{ border: 'none' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              {loadingReportCard || !reportCardData ? (
                <LoadingSpinner text="Compiling academic transcript..." />
              ) : (
                <div className="printable-document" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  <div
                    style={{
                      borderBottom: '2px solid var(--navy-900)',
                      paddingBottom: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                        EDUPULSE ACADEMY OF EXCELLENCE
                      </h1>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Institutional Academic Evaluation & Report Dossier | 2025-2026
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>
                        OFFICIAL TRANSCRIPT
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      padding: '14px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                    }}
                  >
                    <div><strong>Student Full Name:</strong> {reportCardData.student.full_name}</div>
                    <div><strong>Admission Number:</strong> {reportCardData.student.admission_no}</div>
                    <div><strong>Grade & Section:</strong> {reportCardData.student.class_name}</div>
                    <div><strong>Attendance Rate:</strong> {reportCardData.summary.attendancePercentage}% Recorded</div>
                    <div><strong>Guardian Name:</strong> {reportCardData.student.guardian_name}</div>
                    <div><strong>Date of Birth:</strong> {reportCardData.student.date_of_birth}</div>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Subject Code</th>
                          <th>Subject Name</th>
                          <th>Examination</th>
                          <th>Max Marks</th>
                          <th>Passing</th>
                          <th>Score</th>
                          <th>Grade</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportCardData.marks.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                              No examination marks recorded for this student yet.
                            </td>
                          </tr>
                        ) : (
                          reportCardData.marks.map((m, idx) => (
                            <tr key={idx}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{m.subject_code}</td>
                              <td style={{ fontWeight: 600 }}>{m.subject_name}</td>
                              <td>{m.exam_name}</td>
                              <td>{m.max_marks}</td>
                              <td>{m.pass_marks}</td>
                              <td style={{ fontWeight: 700 }}>{m.marks_obtained}</td>
                              <td>
                                <span className="badge badge-info" style={{ fontWeight: 800 }}>
                                  {m.grade}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${m.status === 'Pass' ? 'badge-success' : 'badge-danger'}`}>
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Cumulative Academic Result
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                        Overall Grade: {reportCardData.summary.overallGrade} ({reportCardData.summary.overallPercentage}%)
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${reportCardData.summary.overallStatus === 'Passed' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                        {reportCardData.summary.overallStatus}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-light)', paddingTop: '10px' }}>
                    <strong>Grading Policy Scale:</strong> A+ (90%-100%), A (80%-89%), B (70%-79%), C (60%-69%), D (40%-59%), F (&lt;40% Fail).
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '36px',
                      paddingTop: '20px',
                      borderTop: '1px solid #cbd5e1',
                    }}
                  >
                    <div style={{ textAlign: 'center', width: '200px' }}>
                      <div style={{ height: '36px' }}></div>
                      <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                        Class Teacher Signature
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', width: '200px' }}>
                      <div style={{ height: '36px' }}></div>
                      <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                        Principal / Head of School
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setShowReportCardModal(false)}>
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Examination"
        message="Are you sure you want to cancel and delete this examination? All entered student marks will be erased."
        confirmText="Confirm Delete"
        isLoading={isDeleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
