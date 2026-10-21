import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Operation',
  message = 'Are you sure you want to proceed with this action? This operation cannot be undone.',
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = true,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: isDangerous ? 'var(--danger-bg)' : 'var(--blue-50)',
              color: isDangerous ? 'var(--danger-main)' : 'var(--blue-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={18} />
            </div>
            <h3 className="modal-title">{title}</h3>
          </div>
          <button className="icon-btn" onClick={onCancel} style={{ border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {message}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </button>
          <button
            className={`btn ${isDangerous ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
