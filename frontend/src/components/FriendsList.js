import React, { useState } from 'react';
import { usersAPI } from '../api';

function FriendsList({ friends, allUsers, selectedDM, onDMSelect }) {
  const [showAllUsers, setShowAllUsers] = useState(false);

  const handleFriendRequest = async (userId) => {
    try {
      await usersAPI.sendFriendRequest(userId);
      alert('Friend request sent!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send friend request');
    }
  };

  // Get users who are not friends
  const nonFriends = allUsers.filter(
    (user) => !friends.some((friend) => friend.id === user.id)
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
        <h4>Direct Messages</h4>
        <button
          onClick={() => setShowAllUsers(!showAllUsers)}
          style={{
            background: 'none',
            border: 'none',
            color: '#b9bbbe',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '0 4px'
          }}
          title={showAllUsers ? 'Hide Users' : 'Show All Users'}
        >
          {showAllUsers ? '−' : '+'}
        </button>
      </div>
      <ul className="sidebar-list">
        {friends.map((friend) => (
          <li
            key={friend.id}
            className={`sidebar-item ${selectedDM === friend.id ? 'active' : ''}`}
            onClick={() => onDMSelect(friend.id)}
          >
            <img
              src={friend.profile_picture || 'https://via.placeholder.com/20'}
              alt={friend.username}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/20';
              }}
            />
            <span>{friend.username}</span>
          </li>
        ))}
        {showAllUsers && (
          <>
            {nonFriends.map((user) => (
              <li
                key={user.id}
                className="sidebar-item"
                style={{ opacity: 0.7 }}
              >
                <img
                  src={user.profile_picture || 'https://via.placeholder.com/20'}
                  alt={user.username}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/20';
                  }}
                />
                <span style={{ flex: 1 }}>{user.username}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFriendRequest(user.id);
                  }}
                  style={{
                    background: '#7289da',
                    border: 'none',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Add
                </button>
              </li>
            ))}
          </>
        )}
        {friends.length === 0 && !showAllUsers && (
          <li style={{ padding: '8px 12px', color: '#72767d', fontSize: '14px' }}>
            No friends yet. Add some!
          </li>
        )}
      </ul>
    </>
  );
}

export default FriendsList;
