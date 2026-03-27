import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/UnifiedUI.css';
import '../styles/EnhancedAnimations.css';

/**
 * Chat Component
 * Real-time messaging between driver and customer
 */
export default function Chat({
  bookingId,
  currentUser = { id: 'user1', name: 'You', avatar: 'https://randomuser.me/api/portraits/women/47.jpg', type: 'customer' },
  otherUser = { id: 'driver1', name: 'Rajesh Kumar', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', type: 'driver' },
  onClose = () => {},
  isWidget = false, // If true, renders as a floating widget instead of full page
}) {
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: otherUser.id,
      senderName: otherUser.name,
      text: 'Hi! I am on my way. ETA 8 minutes.',
      timestamp: new Date(Date.now() - 5 * 60000),
      type: 'text',
    },
    {
      id: '2',
      sender: currentUser.id,
      senderName: currentUser.name,
      text: 'Thanks! I am ready. Please call when you arrive.',
      timestamp: new Date(Date.now() - 3 * 60000),
      type: 'text',
    },
    {
      id: '3',
      sender: otherUser.id,
      senderName: otherUser.name,
      text: 'Sure! I will send you my live location.',
      timestamp: new Date(Date.now() - 1 * 60000),
      type: 'text',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage = {
      id: String(messages.length + 1),
      sender: currentUser.id,
      senderName: currentUser.name,
      text: inputValue,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // Simulate driver response after 2 seconds
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        const responses = [
          'Got it! See you soon! 👍',
          'No problem! I am almost there.',
          'Thanks for the info! Will call you.',
          'Ok, on my way!',
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setMessages((prev) => [
          ...prev,
          {
            id: String(prev.length + 1),
            sender: otherUser.id,
            senderName: otherUser.name,
            text: randomResponse,
            timestamp: new Date(),
            type: 'text',
          },
        ]);
        setIsTyping(false);
      }, 1500);
    }, 2000);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const messageBubbleVariants = {
    initial: { opacity: 0, y: 10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
  };

  if (isWidget) {
    // Floating Widget Version
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '380px',
          height: '600px',
          backgroundColor: '#0b0f19',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          border: '1px solid rgba(34, 197, 94, 0.2)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(11, 15, 25, 0.9), rgba(34, 197, 94, 0.05))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.img
              src={otherUser.avatar}
              alt={otherUser.name}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #22c55e',
              }}
              whileHover={{ scale: 1.1 }}
            />
            <div>
              <p style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                {otherUser.name}
              </p>
              <p style={{ margin: 0, color: '#aaa', fontSize: '12px' }}>
                🟢 Online
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#aaa',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0',
            }}
          >
            ✕
          </motion.button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <AnimatePresence>
            {messages.map((msg, idx) => {
              const isOwn = msg.sender === currentUser.id;
              return (
                <motion.div
                  key={msg.id}
                  variants={messageBubbleVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: isOwn ? '#22c55e' : 'rgba(147, 197, 253, 0.1)',
                        color: isOwn ? '#0b0f19' : '#fff',
                        padding: '10px 14px',
                        borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        fontSize: '13px',
                        lineHeight: '1.4',
                        border: isOwn ? 'none' : '1px solid rgba(147, 197, 253, 0.3)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.text}
                    </div>
                    <span style={{  color: '#666', fontSize: '11px' }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <motion.div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#93c5fd',
                }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
              <motion.div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#93c5fd',
                }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
              />
              <motion.div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#93c5fd',
                }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              />
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '12px',
            borderTop: '1px solid rgba(34, 197, 94, 0.2)',
            display: 'flex',
            gap: '8px',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type message..."
            style={{
              flex: 1,
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(34, 197, 94, 0.4)';
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '10px 14px',
              backgroundColor: '#22c55e',
              color: '#0b0f19',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'all 0.2s ease',
            }}
          >
            Send
          </motion.button>
        </form>
      </motion.div>
    );
  }

  // Full Page Version
  return (
    <motion.div
      className="ux-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
            background: 'linear-gradient(135deg, rgba(11, 15, 25, 0.9), rgba(34, 197, 94, 0.05))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <motion.img
              src={otherUser.avatar}
              alt={otherUser.name}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #22c55e',
              }}
              whileHover={{ scale: 1.1 }}
            />
            <div>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>
                {otherUser.name}
              </h2>
              <p style={{ margin: 0, color: '#22c55e', fontSize: '12px' }}>
                🟢 Online
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#aaa',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ✕
          </motion.button>
        </motion.div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <AnimatePresence>
            {messages.map((msg) => {
              const isOwn = msg.sender === currentUser.id;
              return (
                <motion.div
                  key={msg.id}
                  variants={messageBubbleVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: '12px',
                  }}
                >
                  {!isOwn && (
                    <img
                      src={otherUser.avatar}
                      alt={otherUser.name}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  <div
                    style={{
                      maxWidth: '60%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: isOwn ? '#22c55e' : 'rgba(147, 197, 253, 0.15)',
                        color: isOwn ? '#0b0f19' : '#fff',
                        padding: '12px 16px',
                        borderRadius: isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        border: isOwn ? 'none' : '1px solid rgba(147, 197, 253, 0.3)',
                      }}
                    >
                      {msg.text}
                    </div>
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  {isOwn && (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}
            >
              <img
                src={otherUser.avatar}
                alt={otherUser.name}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
              <div style={{ display: 'flex', gap: '6px', padding: '12px 16px', alignItems: 'center' }}>
                <motion.div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#93c5fd',
                  }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
                <motion.div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#93c5fd',
                  }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                />
                <motion.div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#93c5fd',
                  }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <motion.form
          onSubmit={handleSendMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(34, 197, 94, 0.2)',
            display: 'flex',
            gap: '12px',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="ux-input"
            style={{ flex: 1 }}
            autoFocus
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="ux-btn primary"
          >
            Send
          </motion.button>
        </motion.form>
      </div>
    </motion.div>
  );
}
