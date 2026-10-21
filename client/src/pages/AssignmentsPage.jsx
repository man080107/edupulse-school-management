import React, { useState, useEffect } from 'react';
import { Plus, Trash2, UserCheck, School, BookOpen, X, AlertCircle } from 'lucide-react';
import { assignmentService, teacherService, classService, subjectService } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

export default function AssignmentsPage() {
  const toast = useToast();

  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [teacherFilter, setTeacherFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Add Assignment Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    teacher_id: '',
    class_id: '',
    subject_id: '',
    academic_year: '2025-2026',
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [assRes, tRes, cRes, sRes] = await Promise.all([
        assignmentService.getAll({ teacherId: teacherFilter, classId: classFilter }),
        teacherService.getAll({ status: 'active' }),
        classService.getAll(),
        subjectService.getAll(),
      ]);
      setAssignments(assRes.data || []);
      setTeachers(tRes.data || []);
      setClasses(cRes.data || []);
      setSubjects(sRes.data || []);
    } catch (err) {
      toast.error('Failed to load assignment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [teacherFilter, classFilter]);

  const handleOpenAdd = () => {
    setFormData({
      teacher_id: teachers[0]?.id || '',
      class_id: classes[0]?.id || '',
      subject_id: subjects[0]?.id || '',
      academic_year: '2025-2026',
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await assignmentService.create(formData);
      toast.success('Teacher assigned successfully.');
      setShowAddModal(false);
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Failed to create assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await assignmentService.delete(deleteId);
      toast.success('Assignment unassigned.');
      setDeleteId(null);
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Failed to remove assignment.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="filter-bar">
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-900)' }}>
            Faculty Class-Subject Assignments ({assignments.length})
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Relational junction assigning teachers to specific grade sections and subjects.
          </p>
        </div>

        <div className="filter-group">
          <select
            className="form-select"
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name} ({t.employee_id})
              </option>
            ))}
          </select>

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

          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Assign Teacher to Class
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <LoadingSpinner text="Retrieving faculty assignments..." />
        ) : assignments.length === 0 ? (
          <EmptyState
            title="No assignments found"
            description="Assign teachers to classes and subjects to enable attendance marking and exam grading."
            actionButton={
              <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
                Create First Assignment
              </button>
            }
          />
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Faculty Teacher</th>
                  <th>Employee ID</th>
                  <th>Class & Section</th>
                  <th>Assigned Subject</th>
                  <th>Academic Term</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                      {a.teacher_name}
                    </td>
                    <td>
                      <span className="badge badge-neutral">{a.employee_id}</span>
                    </td>
                    <td>
                      <span className="badge badge-info">{a.class_name}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.subject_name}</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                        {a.subject_code}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.academic_year}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="icon-btn"
                        style={{ color: 'var(--danger-main)' }}
                        title="Remove Assignment"
                        onClick={() => setDeleteId(a.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Teacher to Class & Subject</h3>
              <button className="icon-btn" onClick={() => setShowAddModal(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Select Teacher</label>
                  <select
                    className="form-select"
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    required
                  >
                    <option value="">Choose Faculty Member</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.employee_id}) - {t.qualification}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">Target Class & Section</label>
                  <select
                    className="form-select"
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    required
                  >
                    <option value="">Choose Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.class_name} - {c.section} (Room {c.room_number || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">Subject to Teach</label>
                  <select
                    className="form-select"
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    required
                  >
                    <option value="">Choose Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subject_name} ({s.subject_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">Academic Year</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Unassign Faculty"
        message="Are you sure you want to remove this teacher's assignment? They will no longer have permission to take attendance or grade exams for this class section."
        confirmText="Remove Assignment"
        isLoading={isDeleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
