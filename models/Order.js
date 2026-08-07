const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    customerInfo: {
        name: {
            type: String,
            required: [true, 'الرجاء إدخال الاسم']
        },
        email: {
            type: String,
            required: [true, 'الرجاء إدخال البريد الإلكتروني']
        },
        phone: {
            type: String,
            required: [true, 'الرجاء إدخال رقم الهاتف']
        }
    },
    service: {
        type: String,
        required: [true, 'الرجاء تحديد نوع الخدمة'],
        enum: ['server', 'imei', 'remote']
    },
    package: {
        type: String,
        required: false
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    },
    price: {
        type: Number,
        required: false
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: {
        type: Date
    },
    paymentInfo: {
        type: mongoose.Schema.Types.Mixed
    },
    notes: {
        type: String
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    completedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Generate order ID before saving
orderSchema.pre('save', async function(next) {
    if (!this.orderId) {
        const prefix = this.service.toUpperCase().substring(0, 3);
        this.orderId = `${prefix}-${Date.now()}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
