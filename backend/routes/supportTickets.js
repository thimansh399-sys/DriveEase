const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const supportTicketController = require('../controllers/supportTicketController');

// Admin: Get ticket statistics (before /:ticketId to avoid route conflicts)
router.get('/admin/stats', authMiddleware, supportTicketController.getTicketStats);

// Customer: Create ticket
router.post('/create', authMiddleware, supportTicketController.createTicket);

// Admin: Get all tickets
router.get('/all', authMiddleware, supportTicketController.getAllTickets);

// Get ticket by ID
router.get('/:ticketId', authMiddleware, supportTicketController.getTicket);

// Admin: Update ticket status
router.patch('/:ticketId/status', authMiddleware, supportTicketController.updateTicketStatus);

// Add response to ticket
router.post('/:ticketId/response', authMiddleware, supportTicketController.addResponse);

// Admin: Resolve ticket
router.patch('/:ticketId/resolve', authMiddleware, supportTicketController.resolveTicket);

module.exports = router;
