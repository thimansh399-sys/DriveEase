import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/UnifiedUI.css';
import '../styles/EnhancedAnimations.css';

/**
 * Notification Context for App-wide Notifications
 * Usage: const { addNotification } = useNotification();
 */
const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [history, setHistory] = useState([]);

  const addNotification = useCallback(
    (message, type = 'info', duration = 4000, title = '') => {
      const id = Date.now();
      const notification = {
        id,
        message,
        title,
        type, // 'success' | 'error' | 'warning' | 'info'
        timestamp: new Date(),
      };

      setNotifications((prev) => [...prev, notification]);
      setHistory((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50

      if (duration > 0) {
        const timer = setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, duration);

        return () => clearTimeout(timer);
      }

      return () => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      };
    },
    []
  );

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    history,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToast notifications={notifications} removeNotification={removeNotification} />
    </NotificationContext.Provider>
  );
};

/**
 * Toast Notification Component
 */
function NotificationToast({ notifications, removeNotification }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '400px',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {notifications.map((notification, idx) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 400, y: 0 }}
            animate={{ opacity: 1, x: 0, y: idx * 100 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            style={{ marginBottom: '12px', pointerEvents: 'auto' }}
          >
            <NotificationItem notification={notification} onDismiss={() => removeNotification(notification.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual Notification Item
 */
function NotificationItem({ notification, onDismiss }) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const colors = {
    success: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.4)', icon: '#22c55e', text: '#22c55e' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', icon: '#ef4444', text: '#ef4444' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', icon: '#f59e0b', text: '#f59e0b' },
    info: { bg: 'rgba(147, 197, 253, 0.15)', border: 'rgba(147, 197, 253, 0.4)', icon: '#93c5fd', text: '#93c5fd' },
  };

  const color = colors[notification.type] || colors.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        backgroundColor: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        marginBottom: '8px',
      }}
    >
      <div style={{ fontSize: '20px', color: color.icon, minWidth: '24px', textAlign: 'center' }}>
        {icons[notification.type]}
      </div>
      <div style={{ flex: 1 }}>
        {notification.title && (
          <p style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '14px', fontWeight: 600 }}>
            {notification.title}
          </p>
        )}
        <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>
          {notification.message}
        </p>
      </div>
      <motion.button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#aaa',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0',
          marginLeft: '8px',
          minWidth: '24px',
          textAlign: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#aaa';
        }}
      >
        ×
      </motion.button>
    </motion.div>
  );
}

/**
 * Notification Center Component
 * Shows notification history and preferences
 */
export function NotificationCenter() {
  const { history, clearAll } = useNotification();
  const [open, setOpen] = useState(false);

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#93c5fd',
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        width: '380px',
        maxHeight: '600px',
        backgroundColor: '#0b0f19',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9998,
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
        <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>
          Notifications
        </h3>
        {history.length > 0 && (
          <motion.button
            onClick={clearAll}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              background: 'none',
              border: 'none',
              color: '#aaa',
              cursor: 'pointer',
              fontSize: '12px',
              textDecoration: 'underline',
            }}
          >
            Clear All
          </motion.button>
        )}
      </div>

      {/* Notification List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#666' }}>
            <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
          </div>
        ) : (
          history.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                borderLeft: `3px solid ${colors[notification.type]}`,
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '16px', color: colors[notification.type] }}>
                  {icons[notification.type]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {notification.title && (
                    <p style={{ margin: '0 0 2px 0', color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                      {notification.title}
                    </p>
                  )}
                  <p style={{
                    margin: 0,
                    color: '#aaa',
                    fontSize: '12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {notification.message}
                  </p>
                  <span style={{ color: '#666', fontSize: '10px', marginTop: '4px', display: 'block' }}>
                    {formatTime(notification.timestamp)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

/**
 * Bell Icon / Notification Toggle
 */
export function NotificationBell({ position = 'fixed' }) {
  const { notifications, history } = useNotification();
  const [showCenter, setShowCenter] = useState(false);
  const unreadCount = history.length;

  return (
    <>
      <motion.button
        onClick={() => setShowCenter(!showCenter)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position,
          top: '20px',
          right: '80px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#22c55e',
          cursor: 'pointer',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9997,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* Notification Center */}
      <AnimatePresence>
        {showCenter && <NotificationCenter />}
      </AnimatePresence>
    </>
  );
}

export default NotificationProvider;
