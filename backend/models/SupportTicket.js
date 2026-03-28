const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerName: String,
    customerPhone: String,
    customerEmail: String,
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    category: {
      type: String,
      enum: [
        'payment_issue',
        'driver_behavior',
        'wrong_route',
        'cancellation',
        'lost_item',
        'safety_concern',
        'app_bug',
        'other',
      ],
      required: true,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assignedTo: {
      type: String, // admin email/id
      default: null,
    },
    responses: [
      {
        responder: String, // 'customer' or 'admin'
        responderId: mongoose.Schema.Types.ObjectId,
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resolution: {
      action: String, // 'refund', 'compensation', 'replacement', 'explanation', 'other'
      amount: {
        type: Number,
        default: 0,
      },
      details: String,
      resolvedAt: Date,
    },
    attachments: [
      {
        filename: String,
        fileUrl: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
      index: true,
    },
    resolutionTime: Number, // hours to resolve
  },
  { timestamps: true }
);

// Auto-generate ticket ID before saving
supportTicketSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.ticketId = `TKT-${Date.now()}-${(count + 1).toString().padStart(5, '0')}`;
  }
  next();
});

// Calculate resolution time on resolution
supportTicketSchema.pre('save', function (next) {
  if (this.resolvedAt && this.createdAt) {
    this.resolutionTime = Math.ceil(
      (this.resolvedAt - this.createdAt) / (1000 * 60 * 60)
    );
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
