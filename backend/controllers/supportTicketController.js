const SupportTicket = require('../models/SupportTicket');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Create support ticket
exports.createTicket = async (req, res) => {
  try {
    const { category, subject, description, bookingId, attachments } = req.body;
    const customerId = req.user?.id;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const ticket = new SupportTicket({
      customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      category,
      subject,
      description,
      bookingId: bookingId || null,
      attachments: attachments || [],
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket,
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};

// Get all tickets (admin)
exports.getAllTickets = async (req, res) => {
  try {
    const { status, priority, category, sortBy = '-createdAt' } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const tickets = await SupportTicket.find(filter)
      .populate('customerId', 'name email phone')
      .populate('bookingId', 'pickupLocation dropLocation rideType')
      .sort(sortBy)
      .limit(500);

    res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

// Get ticket by ID
exports.getTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await SupportTicket.findOne({ ticketId })
      .populate('customerId', 'name email phone')
      .populate('bookingId');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
};

// Update ticket status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, assignedTo } = req.body;

    const ticket = await SupportTicket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (status) {
      ticket.status = status;
      if (status === 'resolved' || status === 'closed') {
        ticket.resolvedAt = new Date();
      }
    }

    if (assignedTo) {
      ticket.assignedTo = assignedTo;
    }

    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket updated',
      ticket,
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
};

// Add response to ticket
exports.addResponse = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, responder } = req.body;
    const responderId = req.user?.id;

    const ticket = await SupportTicket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    ticket.responses.push({
      responder,
      responderId,
      message,
    });

    // Move to in_progress if customer responded
    if (responder === 'customer' && ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    // Move to waiting_customer if admin responded
    if (responder === 'admin' && ticket.status === 'in_progress') {
      ticket.status = 'waiting_customer';
    }

    await ticket.save();

    res.json({
      success: true,
      message: 'Response added',
      ticket,
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
};

// Resolve ticket with action
exports.resolveTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { action, amount, details } = req.body;

    const ticket = await SupportTicket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    ticket.resolution = {
      action,
      amount: amount || 0,
      details,
      resolvedAt: new Date(),
    };

    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket resolved',
      ticket,
    });
  } catch (error) {
    console.error('Error resolving ticket:', error);
    res.status(500).json({ error: 'Failed to resolve ticket' });
  }
};

// Get ticket statistics
exports.getTicketStats = async (req, res) => {
  try {
    const totalTickets = await SupportTicket.countDocuments();
    const openTickets = await SupportTicket.countDocuments({ status: 'open' });
    const inProgressTickets = await SupportTicket.countDocuments({
      status: 'in_progress',
    });
    const resolvedTickets = await SupportTicket.countDocuments({
      status: 'resolved',
    });

    const byCategory = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    const avgResolutionTime = await SupportTicket.aggregate([
      {
        $match: { resolvedAt: { $ne: null } },
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$resolutionTime' },
        },
      },
    ]);

    const totalRefunded = await SupportTicket.aggregate([
      {
        $match: { 'resolution.action': 'refund' },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$resolution.amount' },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        byCategory,
        avgResolutionTimeHours: avgResolutionTime[0]?.avgTime || 0,
        totalRefunded: totalRefunded[0]?.totalAmount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
