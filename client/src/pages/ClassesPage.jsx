import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, School, X, DoorOpen } from 'lucide-react';
import { classService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

export default function ClassesPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClassStudents, setSelectedClassStudents] = useState([]);
  const [selectedClassName, setSelectedClassName] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm = {
    class_name: '',
    section: '',
    room_number: '',
    capacity: 40,
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await classService.getAll();
      setClasses(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData(initialForm);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingClass(c);
    setFormData({
      class_name: c.class_name,
      section: c.section,
      room_number: c.room_number || '',
      capacity: c.capacity,
    });
    setShowAddEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingClass) {
        await classService.update(editingClass.id, formData);
        toast.success('Class details updated.');
      } else {
        await classService.create(formData);
        toast.success('New class section created.');
      }
      setShowAddEditModal(false);
      fetchClasses();
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewStudents = async (c) => {
    setSelectedClassName(`${c.class_name} - ${c.section}`);
    setShowStudentsModal(true);
    setLoadingStudents(true);
    try {
      const res = await classService.getClassStudents(c.id);
      setSelectedClassStudents(res.data || []);
    } catch (err) {
      toast.error('Failed to load class students.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await classService.delete(deleteId);
      toast.success('Class removed.');
      setDeleteId(null);
      fetchClasses();
    } catch (err) {
      toast.error(err.message || 'Cannot delete class.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-content">
      {/* Header bar */}
      <div className="filter-bar">
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-900)' }}>
            Academic Classes & Sections ({classes.length})
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Manage school grades, classrooms, and seating capacities.
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Create Class Section
          </button>
        )}
      </div>

      {/* Grid of Class Cards */}
      {loading ? (
        <LoadingSpinner text="Retrieving class schedules..." />
      ) : classes.length === 0 ? (
        <EmptyState
          title="No classes configured"
          description="Create your first class to enroll students and assign faculty."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {classes.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                      {c.class_name} - {c.section}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      <DoorOpen size={15} />
                      <span>{c.room_number ? `Room: ${c.room_number}` : 'No room assigned'}</span>
                    </div>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                    Sec {c.section}
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div style={{ margin: '14px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Enrolled: {c.enrolled_students} / {c.capacity}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {Math.round((c.enrolled_students / c.capacity) * 100)}% filled
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, (c.enrolled_students / c.capacity) * 100)}%`,
                        height: '100%',
                        backgroundColor: c.enrolled_students >= c.capacity ? 'var(--danger-main)' : 'var(--blue-600)',
                        borderRadius: '4px',
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '14px',
                  marginTop: '10px',
                }}
              >
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleViewStudents(c)}
                  style={{ gap: '6px' }}
                >
                  <Users size={14} /> View Students ({c.enrolled_students})
                </button>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="icon-btn" title="Edit Class" onClick={() => handleOpenEdit(c)}>
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="icon-btn"
                      style={{ color: 'var(--danger-main)' }}
                      title="Delete Class"
                      onClick={() => setDeleteId(c.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Class Modal */}
      {showAddEditModal && (
        <div className="modal-backdrop" onClick={() => setShowAddEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingClass ? `Edit Class: ${editingClass.class_name}` : 'Create Class Section'}
              </h3>
              <button className="icon-btn" onClick={() => setShowAddEditModal(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Class / Grade Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Grade 10 or Class 9"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Section Identifier</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. A, B, or C"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Assigned Room Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Room 204"
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Seating Capacity</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      max="100"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 40 })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingClass ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrolled Students Modal */}
      {showStudentsModal && (
        <div className="modal-backdrop" onClick={() => setShowStudentsModal(false)}>
          <div className="modal-container large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Enrolled Students: {selectedClassName}</h3>
              <button className="icon-btn" onClick={() => setShowStudentsModal(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {loadingStudents ? (
                <LoadingSpinner text="Fetching class roster..." />
              ) : selectedClassStudents.length === 0 ? (
                <EmptyState
                  title="No enrolled students"
                  description="No active students are currently enrolled in this class."
                />
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Admission No</th>
                        <th>Student Name</th>
                        <th>Gender</th>
                        <th>Guardian</th>
                        <th>Guardian Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClassStudents.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600, color: 'var(--blue-600)' }}>{s.admission_no}</td>
                          <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                          <td>{s.gender}</td>
                          <td>{s.guardian_name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{s.guardian_phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowStudentsModal(false)}>
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Class Section"
        message="Are you sure you want to delete this class? Note that classes with enrolled students cannot be deleted until students are transferred."
        confirmText="Confirm Delete"
        isLoading={isDeleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
