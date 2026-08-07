const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../config/email');
const { emailLimiter } = require('../middleware/rateLimiter');
const mongoose = require('mongoose');
const inMemoryStorage = require('../utils/inMemoryStorage');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
router.post('/', emailLimiter, async (req, res, next) => {
    try {
        const { name, email, phone, message } = req.body;
        let contact;

        // Try to save in database
        if (mongoose.connection.readyState === 1) {
            contact = await Contact.create({
                name,
                email,
                phone,
                message
            });
            console.log('✅ Contact message saved to database');
        } else {
            // Fallback to in-memory storage
            contact = inMemoryStorage.createContact({
                name,
                email,
                phone,
                message
            });
            console.log('⚠️ Contact message saved in memory (DB not connected)');
        }

        // Emit Socket.IO event for real-time notification
        const io = req.app.get('io');
        if (io) {
            const notificationData = {
                messageId: contact._id || contact.id,
                name: name,
                email: email,
                phone: phone,
                message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
                timestamp: new Date()
            };
            io.emit('new-message', notificationData);
            console.log('✅ Socket.IO message notification sent:', notificationData);
        } else {
            console.log('⚠️ Socket.IO not available for message');
        }

        // Send auto-response to user
        try {
            await sendEmail({
                to: email,
                subject: 'شكراً لتواصلك معنا - خدمات التقنية',
                html: emailTemplates.contactResponse({ name })
            });
        } catch (emailError) {
            console.error('Email error:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'تم إرسال رسالتك بنجاح. سنتواصل معك قريباً',
            data: contact
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        let contacts, count;

        // Try to get from database
        if (mongoose.connection.readyState === 1) {
            const query = {};
            if (status) query.status = status;

            contacts = await Contact.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .populate('respondedBy', 'name email');

            count = await Contact.countDocuments(query);
        } else {
            // Fallback to in-memory storage
            contacts = inMemoryStorage.getContacts(limit);
            count = contacts.length;
        }

        res.status(200).json({
            success: true,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: contacts
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Reply to contact message
// @route   PUT /api/contact/:id/reply
// @access  Private/Admin
router.put('/:id/reply', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { response } = req.body;

        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'الرسالة غير موجودة'
            });
        }

        contact.response = response;
        contact.status = 'replied';
        contact.respondedAt = Date.now();
        contact.respondedBy = req.user.id;

        await contact.save();

        // Send reply email
        try {
            await sendEmail({
                to: contact.email,
                subject: 'رد على استفسارك - خدمات التقنية',
                html: `
                    <h2>مرحباً ${contact.name},</h2>
                    <p>شكراً لتواصلك معنا. إليك الرد على استفسارك:</p>
                    <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        ${response}
                    </div>
                    <p>إذا كان لديك أي استفسارات إضافية، لا تتردد في التواصل معنا.</p>
                `
            });
        } catch (emailError) {
            console.error('Email error:', emailError);
        }

        res.status(200).json({
            success: true,
            message: 'تم إرسال الرد بنجاح',
            data: contact
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Mark contact as read
// @route   PUT /api/contact/:id/read
// @access  Private/Admin
router.put('/:id/read', protect, authorize('admin'), async (req, res, next) => {
    try {
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status: 'read' },
            { new: true, runValidators: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'الرسالة غير موجودة'
            });
        }

        res.status(200).json({
            success: true,
            data: contact
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'الرسالة غير موجودة'
            });
        }

        await contact.deleteOne();

        res.status(200).json({
            success: true,
            message: 'تم حذف الرسالة بنجاح'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
