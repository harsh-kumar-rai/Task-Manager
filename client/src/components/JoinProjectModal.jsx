import { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

export default function JoinProjectModal({ onClose, onSubmit }) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(code.trim());
      toast.success('Project joined');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not join project');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-head">
          <h2>Join project</h2>
          <p>Enter the join code shared by a project member.</p>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Project code</label>
            <input
              className="input join-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. MKTQ1A"
              autoFocus
              required
              maxLength={32}
            />
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !code.trim()}>
            {submitting ? 'Joining...' : 'Join project'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
