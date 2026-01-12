import React, { useState, useEffect, useRef } from 'react';
import { channelsAPI, messagesAPI } from '../api';

function MessageArea({ channelId, dmUserId, socket, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [channelInfo, setChannelInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages and channel info when channel changes
  useEffect(() => {
    if (channelId) {
      setLoading(true);
      Promise.all([
        channelsAPI.getMessages(channelId),
        channelsAPI.getById(channelId)
      ])
        .then(([messagesRes, channelRes]) => {
          setMessages(messagesRes.data);
          setChannelInfo(channelRes.data);
          
          // Join channel room in socket
          if (socket) {
            socket.emit('join_channel', channelId);
          }
        })
        .catch((error) => {
          console.error('Error fetching messages:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setMessages([]);
      setChannelInfo(null);
    }
  }, [channelId, socket]);

  // Fetch DM messages when DM user changes
  useEffect(() => {
    if (dmUserId) {
      setLoading(true);
      messagesAPI.getDirectMessages(dmUserId)
        .then((response) => {
          setMessages(response.data);
        })
        .catch((error) => {
          console.error('Error fetching DM messages:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setMessages([]);
    }
  }, [dmUserId]);

  // Listen for new messages via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleChannelMessage = (message) => {
      if (message.channelId === channelId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleDirectMessage = (message) => {
      if (
        (channelId === null && dmUserId !== null) &&
        ((message.sender_id === dmUserId && message.receiver_id === currentUser.id) ||
         (message.receiver_id === dmUserId && message.sender_id === currentUser.id))
      ) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('new_channel_message', handleChannelMessage);
    socket.on('new_direct_message', handleDirectMessage);

    return () => {
      socket.off('new_channel_message', handleChannelMessage);
      socket.off('new_direct_message', handleDirectMessage);
    };
  }, [socket, channelId, dmUserId, currentUser.id]);

  // Handle message send
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const content = inputValue.trim();
    setInputValue('');

    try {
      if (channelId) {
        // Send channel message
        const response = await messagesAPI.sendChannelMessage(channelId, content);
        
        // Emit socket event for real-time update
        if (socket) {
          socket.emit('channel_message', {
            channelId,
            message: response.data
          });
        }
      } else if (dmUserId) {
        // Send direct message
        const response = await messagesAPI.sendDirectMessage(dmUserId, content);
        
        // Emit socket event for real-time update
        if (socket) {
          socket.emit('direct_message', {
            receiverId: dmUserId,
            message: response.data
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.error || 'Failed to send message');
      setInputValue(content); // Restore input on error
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!channelId && !dmUserId) {
    return (
      <div className="chat-main">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: '#72767d'
        }}>
          Select a channel or direct message to start chatting
        </div>
      </div>
    );
  }

  return (
    <div className="chat-main">
      <div className="chat-header">
        {channelId && channelInfo && (
          <>
            <span className="hash">#</span>
            <h2>{channelInfo.name}</h2>
            {channelInfo.description && (
              <span style={{ color: '#72767d', fontSize: '14px', marginLeft: '8px' }}>
                {channelInfo.description}
              </span>
            )}
          </>
        )}
        {dmUserId && (
          <h2>Direct Message</h2>
        )}
      </div>
      <div className="messages-container" ref={messagesContainerRef}>
        {loading && messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#72767d', padding: '20px' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#72767d', padding: '20px' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            // Handle both channel messages and DM messages
            const username = message.username || message.sender_username;
            const profilePicture = message.profile_picture || message.sender_picture;
            const isCurrentUser = (message.user_id || message.sender_id) === currentUser.id;

            return (
              <div key={message.id} className="message">
                <img
                  src={profilePicture || 'https://via.placeholder.com/40'}
                  alt={username}
                  className="message-avatar"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/40';
                  }}
                />
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-username">{username}</span>
                    <span className="message-timestamp">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div className="message-text">{message.content}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="message-input-container">
        <form className="message-input-form" onSubmit={handleSend}>
          <textarea
            className="message-input"
            placeholder={channelId ? `Message #${channelInfo?.name || ''}` : 'Type a message...'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            rows={1}
          />
          <button type="submit" className="send-button" disabled={!inputValue.trim() || loading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default MessageArea;
