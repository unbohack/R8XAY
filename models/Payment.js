const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    paymentMethod: {
        type: String,
        enum: ['stripe', 'paypal', 'cash'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'succeeded', 'failed', 'refunded'],
        default: 'pending'
    },
    stripePaymentIntentId: {
        type: String
    },
    stripeChargeId: {
        type: String
    },
    paypalOrderId: {
        type: String
    },
    transactionId: {
        type: String,
        unique: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    refundedAmount: {
        type: Number,
        default: 0
    },
    refundedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate transaction ID before saving
paymentSchema.pre('save', async function(next) {
    if (!this.transactionId) {
        this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    }
    next();
});

module.exports = mongoose.model('Payment', paymentSchema);
