import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Eye, EyeOff, X, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import './ChangePasswordModal.css';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setLoading(true);

    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      setSuccess('Your password has been changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error('[ChangePasswordModal] Error:', err);
      setError(err.message || 'Failed to update password. Please verify current password.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="cp-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cp-modal-dialog">
        <div className="cp-modal-header">
          <div className="cp-modal-header-title">
            <div className="cp-modal-icon-badge">
              <Shield size={20} />
            </div>
            <div>
              <h3>Change Account Password</h3>
              <p>Update your portal access credentials securely.</p>
            </div>
          </div>
          <button type="button" className="cp-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cp-modal-body">
          {error && (
            <div className="cp-modal-alert cp-modal-alert--error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="cp-modal-alert cp-modal-alert--success">
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          <div className="cp-form-group">
            <label>Current Password</label>
            <div className="cp-input-wrap">
              <Lock className="cp-input-icon" size={16} />
              <input
                type={showCurrent ? 'text' : 'password'}
                placeholder="Enter current password..."
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="cp-input"
              />
              <button
                type="button"
                className="cp-toggle-eye"
                onClick={() => setShowCurrent(v => !v)}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="cp-form-group">
            <label>New Password *</label>
            <div className="cp-input-wrap">
              <Lock className="cp-input-icon" size={16} />
              <input
                type={showNew ? 'text' : 'password'}
                required
                placeholder="Enter new password (min. 6 chars)..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="cp-input"
              />
              <button
                type="button"
                className="cp-toggle-eye"
                onClick={() => setShowNew(v => !v)}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="cp-form-group">
            <label>Confirm New Password *</label>
            <div className="cp-input-wrap">
              <Lock className="cp-input-icon" size={16} />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                placeholder="Confirm new password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="cp-input"
              />
              <button
                type="button"
                className="cp-toggle-eye"
                onClick={() => setShowConfirm(v => !v)}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="cp-modal-footer">
            <button type="button" className="cp-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cp-btn-submit" disabled={loading}>
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
