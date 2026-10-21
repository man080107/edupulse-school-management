import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  UserCheck,
  Mail,
  Phone,
  BookOpen,
  Briefcase,
  Calendar,
  X,
} from 'lucide-react';
import { teacherService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

export default function TeachersPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTeacherDetail, setSelectedTeacherDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialForm = {
    full_name: '',
    email: '',
    phone: '',
    password: '',
    employee_id: '',
    qualification: '',
    specialization: '',
    hire_date: new Date().toISOString().slice(0, 10),
    status: 'active',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await teacherService.getAll({
        search,
        status: statusFilter,
      });
      setTeachers(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load teachers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTeachers();
  };

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData(initialForm);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTeacher(t);
    setFormData({
      full_name: t.full_name,
      email: t.email,
      phone: t.phone || '',
      password: '',
      employee_id: t.employee_id,
      qualification: t.qualification,
      specialization: t.specialization || '',
      hire_date: t.hire_date,
      status: t.status,
    });
    setShowAddEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingTeacher) {
        await teacherService.update(editingTeacher.id, formData);
        toast.success('Teacher profile updated successfully.');
      } else {
        await teacherService.create(formData);
        toast.success('Faculty member registered successfully.');
      }
      setShowAddEditModal(false);
      fetchTeachers();
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewTeacher = async (id) => {
    setShowViewModal(true);
    setLoadingDetail(true);
    try {
      const res = await teacherService.getById(id);
      setSelectedTeacherDetail(res);
    } catch (err) {
      toast.error(err.message || 'Failed to load teacher details.');
      setShowViewModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await teacherService.delete(deleteId);
      toast.success('Teacher record and account deleted.');
      setDeleteId(null);
      fetchTeachers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete teacher.');
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
            placeholder="Search teacher by name, ID, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="filter-group">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {isAdmin && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Register Faculty Member
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <LoadingSpinner text="Retrieving faculty records..." />
        ) : teachers.length === 0 ? (
          <EmptyState
            title="No faculty members found"
            description="Add teachers to build your school academic faculty."
            actionButton={
              isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
                  Add First Teacher
                </button>
              )
            }
          />
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Faculty Name</th>
                  <th>Email & Contact</th>
                  <th>Qualification</th>
                  <th>Assigned Classes</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 700, color: 'var(--blue-600)' }}>
                      {t.employee_id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{t.full_name}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{t.email}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                          {t.phone || 'No phone'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>{t.qualification}</div>
                      {t.specialization && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {t.specialization}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {t.assigned_class_count} Class(es) / {t.assigned_subject_count} Subject(s)
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="icon-btn"
                          title="View Faculty Assignments"
                          onClick={() => handleViewTeacher(t.id)}
                        >
                          <Eye size={15} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              className="icon-btn"
                              title="Edit Profile"
                              onClick={() => handleOpenEdit(t)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="icon-btn"
                              style={{ color: 'var(--danger-main)' }}
                              title="Delete Teacher"
                              onClick={() => setDeleteId(t.id)}
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
        )}
      </div>

      {showAddEditModal && (
        <div className="modal-backdrop" onClick={() => setShowAddEditModal(false)}>
          <div className="modal-container large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTeacher ? `Edit Faculty: ${editingTeacher.full_name}` : 'Register Faculty Teacher'}
              </h3>
              <button className="icon-btn" onClick={() => setShowAddEditModal(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Employee ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. TCH-1004"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dr. Catherine Brooks"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Email Address (Login Username)</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. catherine.brooks@school.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. +1-555-0150"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                {!editingTeacher && (
                  <div className="form-group">
                    <label className="form-label">Initial Password (Default: teacher123)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Leave blank for 'teacher123'"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Academic Qualification</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. M.Sc. Biology, B.Ed"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Specialization</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Genetics & Cell Biology"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Date of Joining</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Account Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
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
                  {isSubmitting ? 'Saving...' : editingTeacher ? 'Save Changes' : 'Register Faculty'}
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
              <h3 className="modal-title">Faculty Portfolio & Teaching Assignments</h3>
              <button className="icon-btn" onClick={() => setShowViewModal(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {loadingDetail || !selectedTeacherDetail ? (
                <LoadingSpinner text="Retrieving portfolio..." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        fontWeight: 700,
                      }}
                    >
                      {selectedTeacherDetail.teacher.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                        {selectedTeacherDetail.teacher.full_name}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <span className="badge badge-info">{selectedTeacherDetail.teacher.employee_id}</span>
                        <span className="badge badge-neutral">{selectedTeacherDetail.teacher.qualification}</span>
                        <span className="badge badge-success">Joined: {selectedTeacherDetail.teacher.hire_date}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>
                      Assigned Classes & Subjects ({selectedTeacherDetail.assignments.length})
                    </h4>
                    {selectedTeacherDetail.assignments.length === 0 ? (
                      <EmptyState
                        title="No classes assigned"
                        description="This teacher currently has no assigned classes or subjects. Assign them in the Faculty Assignments module."
                      />
                    ) : (
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Class Section</th>
                              <th>Room</th>
                              <th>Subject Code</th>
                              <th>Subject Name</th>
                              <th>Academic Term</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedTeacherDetail.assignments.map((a) => (
                              <tr key={a.assignment_id}>
                                <td style={{ fontWeight: 600 }}>{a.class_name}</td>
                                <td>{a.room_number || 'N/A'}</td>
                                <td>
                                  <span className="badge badge-info">{a.subject_code}</span>
                                </td>
                                <td style={{ fontWeight: 600 }}>{a.subject_name}</td>
                                <td>{a.academic_year}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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
        title="Delete Teacher Record"
        message="Are you sure you want to delete this teacher? Their user account and active class assignments will be permanently removed."
        confirmText="Yes, Delete Teacher"
        isLoading={isDeleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
