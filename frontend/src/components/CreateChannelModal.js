import React, { useState } from 'react';

function CreateChannelModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Channel name is required');
      return;
    }

    setLoading(true);
    try {
      await onCreate(name.trim(), description.trim() || null);
      onClose();
    } catch (error) {
      console.error('Error creating channel:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Create Channel</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Channel Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              background: '#40444b',
              border: '1px solid #202225',
              borderRadius: '4px',
              color: '#dcddde',
              fontSize: '16px'
            }}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '16px',
              background: '#40444b',
              border: '1px solid #202225',
              borderRadius: '4px',
              color: '#dcddde',
              fontSize: '16px',
              minHeight: '80px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <div className="modal-buttons">
            <button type="button" className="modal-button secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-button primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateChannelModal;
