import React, { useState } from 'react';

function ProfilePictureModal({ user, onClose, onUpdate, onLogout }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (GIF, JPG, PNG)');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpdate(selectedFile);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Profile Settings</h3>
        <div style={{ marginBottom: '16px' }}>
          <img
            src={preview || user.profile_picture || 'https://via.placeholder.com/100'}
            alt={user.username}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block',
              margin: '0 auto 16px',
              border: '2px solid #7289da'
            }}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/100';
            }}
          />
          <input
            type="file"
            accept="image/gif,image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
          />
          <p style={{ fontSize: '12px', color: '#72767d', marginTop: '8px' }}>
            Supported formats: GIF, JPG, PNG, WEBP (max 5MB)
          </p>
        </div>
        <div style={{ marginBottom: '16px', padding: '12px', background: '#2f3136', borderRadius: '4px' }}>
          <p style={{ fontSize: '14px', color: '#b9bbbe', marginBottom: '4px' }}>Username: {user.username}</p>
          <p style={{ fontSize: '14px', color: '#b9bbbe' }}>Email: {user.email}</p>
        </div>
        <div className="modal-buttons">
          <button className="modal-button secondary" onClick={onClose}>
            Cancel
          </button>
          {selectedFile && (
            <button className="modal-button primary" onClick={handleUpload}>
              Upload
            </button>
          )}
          <button
            className="modal-button secondary"
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                onLogout();
              }
            }}
            style={{ marginLeft: '8px', background: '#f04747' }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePictureModal;
