import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Chat from '../components/Chat';
import '../styles/UnifiedUI.css';
import '../styles/EnhancedAnimations.css';

/**
 * Messages Page
 * View and manage conversations with drivers
 */
export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  const conversations = [
    {
      id: 1,
      driver: {
        name: 'Rajesh Kumar',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        id: 'driver1',
        type: 'driver',
      },
      lastMessage: 'See you soon! 👍',
      timestamp: new Date(Date.now() - 2 * 60000),
      unread: 0,
      bookingId: 'BOOK123456',
    },
    {
      id: 2,
      driver: {
        name: 'Amit Verma',
        avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
        id: 'driver2',
        type: 'driver',
      },
      lastMessage: 'Your ride is confirmed for tomorrow 10:00 AM',
      timestamp: new Date(Date.now() - 1 * 3600000),
      unread: 1,
      bookingId: 'BOOK123457',
    },
    {
      id: 3,
      driver: {
        name: 'Suresh Thakur',
        avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
        id: 'driver3',
        type: 'driver',
      },
      lastMessage: 'Thank you for the 5-star rating!',
      timestamp: new Date(Date.now() - 5 * 3600000),
      unread: 0,
      bookingId: 'BOOK123458',
    },
  ];

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (selectedConversation) {
    const user = { id: 'user1', name: 'You', avatar: 'https://randomuser.me/api/portraits/women/47.jpg', type: 'customer' };
    return (
      <Chat
        bookingId={selectedConversation.bookingId}
        currentUser={user}
        otherUser={selectedConversation.driver}
        onClose={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <motion.div
      className="ux-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%', padding: '20px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: '28px' }}
        >
          <h1 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '28px' }}>
            Messages
          </h1>
          <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
            Chat with your drivers
          </p>
        </motion.div>

        {/* Conversations List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {conversations.map((conv, idx) => (
            <motion.button
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + idx * 0.08 }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.2)';
              }}
            >
              {/* Avatar */}
              <motion.img
                src={conv.driver.avatar}
                alt={conv.driver.name}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: '2px solid #22c55e',
                }}
                whileHover={{ scale: 1.08 }}
              />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '15px', fontWeight: 600 }}>
                    {conv.driver.name}
                  </h3>
                  <span style={{ color: '#aaa', fontSize: '12px', flexShrink: 0 }}>
                    {formatTime(conv.timestamp)}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    color: '#aaa',
                    fontSize: '13px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {conv.lastMessage}
                </p>
              </div>

              {/* Unread Badge */}
              {conv.unread > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    color: '#0b0f19',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {conv.unread}
                </motion.div>
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Empty State (if no conversations) */}
        {conversations.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center',
              padding: '60px 20px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h3 style={{ color: '#aaa', fontSize: '16px', margin: '0 0 8px 0' }}>
              No messages yet
            </h3>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Start a conversation with your driver after booking a ride.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
