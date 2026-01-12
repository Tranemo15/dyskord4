import React from 'react';

function ChannelList({ channels, selectedChannel, onChannelSelect, onCreateChannel }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
        <h4>Channels</h4>
        <button
          onClick={onCreateChannel}
          style={{
            background: 'none',
            border: 'none',
            color: '#b9bbbe',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '0 4px'
          }}
          title="Create Channel"
        >
          +
        </button>
      </div>
      <ul className="sidebar-list">
        {channels.map((channel) => (
          <li
            key={channel.id}
            className={`sidebar-item ${selectedChannel === channel.id ? 'active' : ''}`}
            onClick={() => onChannelSelect(channel.id)}
          >
            <span className="channel-icon">#</span>
            <span>{channel.name}</span>
          </li>
        ))}
        {channels.length === 0 && (
          <li style={{ padding: '8px 12px', color: '#72767d', fontSize: '14px' }}>
            No channels yet. Create one!
          </li>
        )}
      </ul>
    </>
  );
}

export default ChannelList;
