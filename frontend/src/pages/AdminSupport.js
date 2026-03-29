import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/AdminSupport.css';

function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [response, setResponse] = useState('');
  const [stats, setStats] = useState(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/support-tickets/all?status=${filter}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) setTickets(data.tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/support-tickets/admin/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [fetchStats, fetchTickets]);

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const response = await fetch(
        `/api/support-tickets/${ticketId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await response.json();
      if (data.success) {
        setSelectedTicket(data.ticket);
        fetchTickets();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const addResponse = async (ticketId) => {
    if (!response.trim()) return;

    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          message: response,
          responder: 'admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(data.ticket);
        setResponse('');
        fetchTickets();
      }
    } catch (error) {
      console.error('Error adding response:', error);
    }
  };

  const resolveTicket = async (ticketId, action, amount = 0) => {
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action,
          amount,
          details: response || 'Resolved',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(null);
        setResponse('');
        fetchTickets();
        fetchStats();
      }
    } catch (error) {
      console.error('Error resolving ticket:', error);
    }
  };

  return (
    <div className="admin-support-page">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Support Tickets
      </motion.h1>

      {/* Stats Cards */}
      {stats && (
        <div className="support-stats">
          <div className="stat-card">
            <div className="stat-number">{stats.totalTickets}</div>
            <div className="stat-label">Total Tickets</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-number">{stats.openTickets}</div>
            <div className="stat-label">Open</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.inProgressTickets}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.resolvedTickets}</div>
            <div className="stat-label">Resolved</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {stats.avgResolutionTimeHours?.toFixed(1) || 0}h
            </div>
            <div className="stat-label">Avg Resolution Time</div>
          </div>
        </div>
      )}

      <div className="support-container">
        {/* Tickets List */}
        <motion.div
          className="tickets-list-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="list-header">
            <h2>Tickets</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_customer">Waiting Customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading tickets...</div>
          ) : tickets.length > 0 ? (
            <div className="tickets-list">
              {tickets.map((ticket) => (
                <motion.div
                  key={ticket._id}
                  className={`ticket-item ${
                    selectedTicket?._id === ticket._id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="ticket-id">{ticket.ticketId}</div>
                  <div className="ticket-subject">{ticket.subject}</div>
                  <div className="ticket-meta">
                    <span className={`status-badge ${ticket.status}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`priority-badge ${ticket.priority}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="ticket-customer">
                    {ticket.customerName}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="no-data">No tickets to display</div>
          )}
        </motion.div>

        {/* Ticket Detail */}
        <AnimatePresence>
          {selectedTicket && (
            <motion.div
              className="ticket-detail-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="detail-header">
                <div>
                  <h2>{selectedTicket.ticketId}</h2>
                  <p className="detail-subject">{selectedTicket.subject}</p>
                </div>
                <button
                  className="close-btn"
                  onClick={() => setSelectedTicket(null)}
                >
                  ✕
                </button>
              </div>

              <div className="detail-content">
                {/* Customer Info */}
                <div className="detail-section">
                  <h3>Customer Information</h3>
                  <div className="info-grid">
                    <div>
                      <label>Name</label>
                      <p>{selectedTicket.customerName}</p>
                    </div>
                    <div>
                      <label>Phone</label>
                      <p>{selectedTicket.customerPhone}</p>
                    </div>
                    <div>
                      <label>Email</label>
                      <p>{selectedTicket.customerEmail}</p>
                    </div>
                    <div>
                      <label>Category</label>
                      <p>{selectedTicket.category.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="detail-section">
                  <h3>Issue Description</h3>
                  <p className="description">{selectedTicket.description}</p>
                </div>

                {/* Conversation */}
                <div className="detail-section">
                  <h3>Conversation</h3>
                  <div className="conversation">
                    {selectedTicket.responses?.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`message ${msg.responder}`}
                      >
                        <div className="message-header">
                          <strong>{msg.responder === 'admin' ? '👨‍💼 Admin' : '👤 Customer'}</strong>
                          <small>
                            {new Date(msg.timestamp).toLocaleString()}
                          </small>
                        </div>
                        <div className="message-body">{msg.message}</div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Input */}
                  {selectedTicket.status !== 'resolved' &&
                    selectedTicket.status !== 'closed' && (
                      <div className="reply-form">
                        <textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Type your response..."
                          rows="4"
                        />
                        <button
                          className="btn-reply"
                          onClick={() =>
                            addResponse(selectedTicket.ticketId)
                          }
                        >
                          Send Response
                        </button>
                      </div>
                    )}
                </div>

                {/* Status & Actions */}
                <div className="detail-section">
                  <h3>Actions</h3>
                  <div className="action-buttons">
                    {selectedTicket.status !== 'resolved' && (
                      <>
                        <button
                          className="btn btn-warning"
                          onClick={() =>
                            updateTicketStatus(
                              selectedTicket.ticketId,
                              'in_progress'
                            )
                          }
                        >
                          Mark In Progress
                        </button>
                        <button
                          className="btn btn-success"
                          onClick={() =>
                            resolveTicket(selectedTicket.ticketId, 'explanation')
                          }
                        >
                          Resolve Ticket
                        </button>
                        <button
                          className="btn btn-info"
                          onClick={() =>
                            resolveTicket(selectedTicket.ticketId, 'refund', 100)
                          }
                        >
                          Refund ₹100
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-danger"
                      onClick={() =>
                        updateTicketStatus(selectedTicket.ticketId, 'closed')
                      }
                    >
                      Close Ticket
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AdminSupport;
