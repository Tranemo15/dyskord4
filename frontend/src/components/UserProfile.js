import React, { useState } from 'react';
import ProfilePictureModal from './ProfilePictureModal';
import { uploadAPI } from '../api';

function UserProfile({ user, onLogout, onUserUpdate }) {
  const [showModal, setShowModal] = useState(false);

  const handlePictureUpdate = async (file) => {
    try {
      await uploadAPI.uploadProfilePicture(file);
      onUserUpdate();
      setShowModal(false);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert(error.response?.data?.error || 'Failed to upload profile picture');
    }
  };

  return (
    <>
      <div className="user-profile" onClick={() => setShowModal(true)}>
        <img
          src={user.profile_picture || 'https://via.placeholder.com/32'}
          alt={user.username}
          className="profile-picture-small"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/32';
          }}
        />
        <span style={{ fontSize: '14px', color: '#dcddde' }}>{user.username}</span>
      </div>
      {showModal && (
        <ProfilePictureModal
          user={user}
          onClose={() => setShowModal(false)}
          onUpdate={handlePictureUpdate}
          onLogout={onLogout}
        />
      )}
    </>
  );
}

export default UserProfile;
