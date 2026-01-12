import React, { useState } from 'react';
import UserProfile from './UserProfile';
import ChannelList from './ChannelList';
import FriendsList from './FriendsList';
import CreateChannelModal from './CreateChannelModal';

function Sidebar({
  channels,
  friends,
  allUsers,
  selectedChannel,
  selectedDM,
  onChannelSelect,
  onDMSelect,
  onChannelCreate,
  onLogout,
  user,
  onUserUpdate
}) {
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Dyskord</h3>
        <UserProfile user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} />
      </div>
      <div className="sidebar-section">
        <ChannelList
          channels={channels}
          selectedChannel={selectedChannel}
          onChannelSelect={onChannelSelect}
          onCreateChannel={() => setShowCreateChannel(true)}
        />
        <FriendsList
          friends={friends}
          allUsers={allUsers}
          selectedDM={selectedDM}
          onDMSelect={onDMSelect}
        />
      </div>
      {showCreateChannel && (
        <CreateChannelModal
          onClose={() => setShowCreateChannel(false)}
          onCreate={onChannelCreate}
        />
      )}
    </div>
  );
}

export default Sidebar;
