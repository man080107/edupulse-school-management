import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, X, Code } from 'lucide-react';
import { subjectService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

export default function SubjectsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm = {
    subject_code: '',
    subject_name: '',
    description: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await subjectService.getAll();
      setSubjects(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData(initialForm);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSubject(s);
    setFormData({
      subject_code: s.subject_code,
      subject_name: s.subject_name,
      description: s.description || '',
    });
    setShowAddEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingSubject) {
        await subjectService.update(editingSubject.id, formData);
        toast.success('Subject updated successfully.');
      } else {
        await subjectService.create(formData);
        toast.success('New subject added to curriculum.');
      }
      setShowAddEditModal(false);
      fetchSubjects();
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await subjectService.delete(deleteId);
      toast.success('Subject removed from curriculum.');
      setDeleteId(null);
      fetchSubjects();
    } catch (err) {
      toast.error(err.message || 'Failed to delete subject.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="filter-bar">
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-900)' }}>
            Curriculum Subjects ({subjects.length})
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Institutional academic subjects, codes, and syllabus definitions.
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add New Subject
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <LoadingSpinner text="Retrieving curriculum subjects..." />
        ) : subjects.length === 0 ? (
          <EmptyState
            title="No subjects registered"
            description="Add academic subjects like Mathematics, Physics, English, etc."
          />
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>Description / Syllabus</th>
                  <th>Assigned Faculty</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="badge badge-info" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {s.subject_code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{s.subject_name}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '380px' }}>
                      {s.description || 'No detailed syllabus description provided.'}
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {s.assigned_teachers} Teacher(s)
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button className="icon-btn" title="Edit Subject" onClick={() => handleOpenEdit(s)}>
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="icon-btn"
                            style={{ color: 'var(--danger-main)' }}
                            title="Delete Subject"
                            onClick={() => setDeleteId(s.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddEditModal && (
        <div className="modal-backdrop" onClick={() => setShowAddEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingSubject ? `Edit Subject: ${editingSubject.subject_name}` : 'Add Subject to Curriculum'}
              </h3>
              <button className="icon-btn" onClick={() => setShowAddEditModal(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Subject Code (Unique)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. MATH-10 or BIO-11"
                    value={formData.subject_code}
                    onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Subject Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Advanced Mathematics"
                    value={formData.subject_name}
                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Syllabus Overview & Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter curriculum overview and course goals..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingSubject ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Subject"
        message="Are you sure you want to remove this subject? Associated assignments and exam markings may be affected."
        confirmText="Delete Subject"
        isLoading={isDeleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
