const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'الرجاء إدخال الاسم'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'الرجاء إدخال البريد الإلكتروني'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'الرجاء إدخال بريد إلكتروني صحيح']
    },
    phone: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        required: [true, 'الرجاء إدخال الرسالة']
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied'],
        default: 'new'
    },
    response: {
        type: String
    },
    respondedAt: {
        type: Date
    },
    respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Contact', contactSchema);
