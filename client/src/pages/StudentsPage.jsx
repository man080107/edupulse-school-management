import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
} from 'lucide-react';
import { studentService, classService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

export default function StudentsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const initialFormState = {
    admission_no: '',
    full_name: '',
    date_of_birth: '',
    gender: 'Male',
    class_id: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    address: '',
    admission_date: new Date().toISOString().slice(0, 10),
    status: 'active',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch classes for dropdowns
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

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await studentService.getAll({
        page,
        limit: 10,
        search,
        classId: classFilter,
        status: statusFilter,
      });
      setStudents(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      toast.error(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, classFilter, statusFilter]);

  // Handle Search submit or enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      ...initialFormState,
      class_id: classes[0]?.id || '',
    });
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      admission_no: student.admission_no,
      full_name: student.full_name,
      date_of_birth: student.date_of_birth,
      gender: student.gender,
      class_id: student.class_id,
      guardian_name: student.guardian_name,
      guardian_phone: student.guardian_phone,
      guardian_email: student.guardian_email || '',
      address: student.address,
      admission_date: student.admission_date,
      status: student.status,
    });
    setShowAddEditModal(true);
  };

  // Save Student (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingStudent) {
        await studentService.update(editingStudent.id, formData);
        toast.success('Student details updated successfully.');
      } else {
        await studentService.create(formData);
        toast.success('New student admitted successfully.');
      }
      setShowAddEditModal(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to save student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Student Details
  const handleViewStudent = async (studentId) => {
    setShowViewModal(true);
    setLoadingDetail(true);
    try {
      const res = await studentService.getById(studentId);
      setSelectedStudentDetail(res);
    } catch (err) {
      toast.error(err.message || 'Failed to load student profile.');
      setShowViewModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Delete Student
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await studentService.delete(deleteId);
      toast.success('Student record removed.');
      setDeleteId(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to delete student.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <Search size={16} className="search-box-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, admission no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="filter-group">
          <select
            className="form-select"
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
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
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: 'auto' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
          </select>

          {isAdmin && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Admit New Student
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <LoadingSpinner text="Retrieving student database records..." />
        ) : students.length === 0 ? (
          <EmptyState
            title="No students found"
            description="Try modifying search keywords or filter criteria."
            actionButton={
              isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
                  Admit First Student
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Gender</th>
                    <th>Guardian</th>
                    <th>Contact Phone</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 700, color: 'var(--blue-600)' }}>
                        {student.admission_no}
                      </td>
                      <td style={{ fontWeight: 600 }}>{student.full_name}</td>
                      <td>
                        <span className="badge badge-info">{student.class_name}</span>
                      </td>
                      <td>{student.gender}</td>
                      <td>{student.guardian_name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{student.guardian_phone}</td>
                      <td>
                        <span
                          className={`badge ${
                            student.status === 'active'
                              ? 'badge-success'
                              : student.status === 'inactive'
                              ? 'badge-danger'
                              : 'badge-neutral'
                          }`}
                        >
                          {student.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="icon-btn"
                            title="View Student Profile"
                            onClick={() => handleViewStudent(student.id)}
                          >
                            <Eye size={15} />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                className="icon-btn"
                                title="Edit Student Record"
                                onClick={() => handleOpenEdit(student)}
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                className="icon-btn"
                                style={{ color: 'var(--danger-main)' }}
                                title="Delete Student"
                                onClick={() => setDeleteId(student.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total students)
              </div>
              <div className="pagination-controls">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showAddEditModal && (
        <div className="modal-backdrop" onClick={() => setShowAddEditModal(false)}>
          <div className="modal-container large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingStudent ? `Edit Student: ${editingStudent.full_name}` : 'New Student Admission'}
              </h3>
              <button className="icon-btn" onClick={() => setShowAddEditModal(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitForm}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Admission Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. ADM-2025-050"
                      value={formData.admission_no}
                      onChange={(e) => setFormData({ ...formData, admission_no: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Student Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Alexander Vance"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Class & Section</label>
                    <select
                      className="form-select"
                      value={formData.class_id}
                      onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.class_name} - {c.section} (Room {c.room_number || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Gender</label>
                    <select
                      className="form-select"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Guardian Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. David Vance"
                      value={formData.guardian_name}
                      onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Guardian Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. +1-555-0199"
                      value={formData.guardian_phone}
                      onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Guardian Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. david.vance@example.com"
                      value={formData.guardian_email}
                      onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Residential Address</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter complete address..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Admission Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.admission_date}
                      onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Enrollment Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="graduated">Graduated</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingStudent ? 'Update Student Record' : 'Complete Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && (
        <div className="modal-backdrop" onClick={() => setShowViewModal(false)}>
          <div className="modal-container large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Student Profile Dossier</h3>
              <button className="icon-btn" onClick={() => setShowViewModal(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {loadingDetail || !selectedStudentDetail ? (
                <LoadingSpinner text="Loading student dossier..." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--blue-600)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                      }}
                    >
                      {selectedStudentDetail.student.full_name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                        {selectedStudentDetail.student.full_name}
                      </h2>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span className="badge badge-info">
                          Admission: {selectedStudentDetail.student.admission_no}
                        </span>
                        <span className="badge badge-neutral">
                          Class: {selectedStudentDetail.student.class_name}
                        </span>
                        <span className="badge badge-success">
                          Status: {selectedStudentDetail.student.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div className="stat-card" style={{ padding: '14px', '--stat-color': 'var(--blue-600)', '--stat-bg': 'var(--blue-50)' }}>
                      <div className="stat-info">
                        <span className="stat-label">Attendance Rate</span>
                        <span className="stat-value" style={{ fontSize: '1.4rem' }}>
                          {selectedStudentDetail.attendanceSummary?.attendanceRate || 0}%
                        </span>
                        <span className="stat-subtext">
                          {selectedStudentDetail.attendanceSummary?.presentDays || 0} / {selectedStudentDetail.attendanceSummary?.totalDays || 0} days present
                        </span>
                      </div>
                    </div>

                    <div className="stat-card" style={{ padding: '14px', '--stat-color': '#10b981', '--stat-bg': '#ecfdf5' }}>
                      <div className="stat-info">
                        <span className="stat-label">Total Fee Paid</span>
                        <span className="stat-value" style={{ fontSize: '1.4rem' }}>
                          ${selectedStudentDetail.feeSummary?.totalPaid || 0}
                        </span>
                        <span className="stat-subtext">
                          Total Obligation: ${selectedStudentDetail.feeSummary?.totalFees || 0}
                        </span>
                      </div>
                    </div>

                    <div className="stat-card" style={{ padding: '14px', '--stat-color': '#f59e0b', '--stat-bg': '#fffbeb' }}>
                      <div className="stat-info">
                        <span className="stat-label">Outstanding Balance</span>
                        <span className="stat-value" style={{ fontSize: '1.4rem' }}>
                          ${selectedStudentDetail.feeSummary?.balance || 0}
                        </span>
                        <span className="stat-subtext">Pending payment</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--navy-900)' }}>
                        Personal Details
                      </h4>
                      <p style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                        <strong>Date of Birth:</strong> {selectedStudentDetail.student.date_of_birth}
                      </p>
                      <p style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                        <strong>Gender:</strong> {selectedStudentDetail.student.gender}
                      </p>
                      <p style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                        <strong>Admission Date:</strong> {selectedStudentDetail.student.admission_date}
                      </p>
                      <p style={{ fontSize: '0.85rem' }}>
                        <strong>Address:</strong> {selectedStudentDetail.student.address}
                      </p>
                    </div>

                    <div style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--navy-900)' }}>
                        Guardian Details
                      </h4>
                      <p style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                        <strong>Guardian Name:</strong> {selectedStudentDetail.student.guardian_name}
                      </p>
                      <p style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                        <strong>Phone Number:</strong> {selectedStudentDetail.student.guardian_phone}
                      </p>
                      <p style={{ fontSize: '0.85rem' }}>
                        <strong>Email:</strong> {selectedStudentDetail.student.guardian_email || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Student Record"
        message="Are you sure you want to permanently delete this student? All associated attendance, marks, and fee tracking records will also be removed."
        confirmText="Yes, Permanently Delete"
        isLoading={isDeleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
