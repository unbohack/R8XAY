const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../config/email');
const dhruApi = require('../services/dhruApi');

// @route   POST /api/orders/icloud
// @desc    Create iCloud order with Dhru API
// @access  Public
router.post('/icloud', async (req, res) => {
    try {
        const { service, imei, model, email, phone, name, notes } = req.body;

        // التحقق من البيانات المطلوبة
        if (!service || !imei || !email) {
            return res.status(400).json({
                success: false,
                message: 'الرجاء إدخال جميع البيانات المطلوبة'
            });
        }

        // التحقق من صحة IMEI
        if (!dhruApi.validateIMEI(imei)) {
            return res.status(400).json({
                success: false,
                message: 'رقم IMEI غير صحيح'
            });
        }

        // حفظ الطلب في قاعدة البيانات أولاً
        const order = await Order.create({
            service: service,
            customerInfo: {
                name: name,
                email: email,
                phone: phone
            },
            details: {
                imei: imei,
                model: model,
                notes: notes
            },
            status: 'pending',
            apiProvider: 'ifreeicloud'
        });

        // إرسال الطلب للـ API
        try {
            // يجب تحديد service ID من Dhru API
            const serviceId = getServiceId(service);
            
            const apiResponse = await dhruApi.placeOrder(serviceId, imei, email);

            if (apiResponse.success) {
                // تحديث الطلب بمعلومات API
                order.apiOrderId = apiResponse.orderId;
                order.apiResponse = apiResponse.response;
                order.status = 'processing';
                await order.save();

                return res.status(201).json({
                    success: true,
                    message: 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.',
                    order: {
                        id: order._id,
                        apiOrderId: apiResponse.orderId,
                        status: order.status,
                        message: apiResponse.message
                    }
                });
            } else {
                // فشل في API لكن الطلب محفوظ
                order.status = 'failed';
                order.apiResponse = apiResponse.response;
                await order.save();

                return res.status(400).json({
                    success: false,
                    message: apiResponse.message || 'فشل في معالجة الطلب',
                    orderId: order._id
                });
            }
        } catch (apiError) {
            // خطأ في الاتصال بـ API
            order.status = 'failed';
            order.notes = `API Error: ${apiError.message}`;
            await order.save();

            return res.status(500).json({
                success: false,
                message: 'حدث خطأ في معالجة الطلب. سنتواصل معك قريباً.',
                orderId: order._id
            });
        }
    } catch (error) {
        console.error('Order Error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في النظام'
        });
    }
});

// @route   GET /api/orders/icloud/status/:orderId
// @desc    Check order status
// @access  Public
router.get('/icloud/status/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        // إذا كان لدينا API order ID، نتحقق من الحالة
        if (order.apiOrderId) {
            try {
                const apiStatus = await dhruApi.checkOrderStatus(order.apiOrderId);
                
                // تحديث حالة الطلب
                order.status = mapApiStatus(apiStatus.status);
                order.apiResponse = apiStatus.response;
                await order.save();

                return res.json({
                    success: true,
                    order: {
                        id: order._id,
                        apiOrderId: order.apiOrderId,
                        status: order.status,
                        apiStatus: apiStatus.status,
                        code: apiStatus.code,
                        message: apiStatus.message
                    }
                });
            } catch (apiError) {
                return res.json({
                    success: true,
                    order: {
                        id: order._id,
                        status: order.status,
                        message: 'تحت المعالجة'
                    }
                });
            }
        }

        res.json({
            success: true,
            order: {
                id: order._id,
                status: order.status
            }
        });
    } catch (error) {
        console.error('Status Check Error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في التحقق من الحالة'
        });
    }
});

// @route   GET /api/orders/icloud/services
// @desc    Get available iCloud services
// @access  Public
router.get('/icloud/services', async (req, res) => {
    try {
        const services = await dhruApi.getServices();
        res.json({
            success: true,
            services: services
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'فشل في الحصول على قائمة الخدمات'
        });
    }
});

// دالة مساعدة لتحديد service ID حسب اسم الخدمة
function getServiceId(serviceName) {
    const serviceMap = {
        'iCloud Unlock Clean': '1',
        'iCloud Unlock Lost Mode': '2',
        'iPad iCloud Unlock': '3',
        'MacBook iCloud Unlock': '4',
        'Apple Watch Unlock': '5',
        'Apple ID Password Reset': '6',
        'Apple ID Complete Removal': '7'
    };

    return serviceMap[serviceName] || '1';
}

// دالة مساعدة لتحويل حالة API إلى حالة النظام
function mapApiStatus(apiStatus) {
    const statusMap = {
        'Pending': 'pending',
        'Processing': 'processing',
        'In Progress': 'processing',
        'Completed': 'completed',
        'Success': 'completed',
        'Failed': 'failed',
        'Rejected': 'rejected',
        'Refunded': 'refunded'
    };

    return statusMap[apiStatus] || 'pending';
}

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
router.post('/', async (req, res, next) => {
    try {
        const order = await Order.create(req.body);

        // Send confirmation email
        try {
            await sendEmail({
                to: order.customerInfo.email,
                subject: 'تأكيد الطلب - خدمات التقنية',
                html: emailTemplates.orderConfirmation(order)
            });
        } catch (emailError) {
            console.error('Email error:', emailError);
        }

        res.status(201).json({
            success: true,
            data: order,
            message: 'تم إنشاء الطلب بنجاح'
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { status, service, page = 1, limit = 10 } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (service) query.service = service;

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('user', 'name email')
            .populate('assignedTo', 'name email');

        const count = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: orders
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('assignedTo', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        // Make sure user is order owner or admin
        if (order.user && order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح لك بالوصول إلى هذا الطلب'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { status, notes } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        order.status = status;
        if (notes) order.notes = notes;
        if (status === 'completed') order.completedAt = Date.now();

        await order.save();

        res.status(200).json({
            success: true,
            data: order,
            message: 'تم تحديث حالة الطلب بنجاح'
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Assign order to admin
// @route   PUT /api/orders/:id/assign
// @access  Private/Admin
router.put('/:id/assign', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { adminId } = req.body;

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { assignedTo: adminId },
            { new: true, runValidators: true }
        ).populate('assignedTo', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        res.status(200).json({
            success: true,
            data: order,
            message: 'تم تعيين الطلب بنجاح'
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        await order.deleteOne();

        res.status(200).json({
            success: true,
            message: 'تم حذف الطلب بنجاح'
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get order statistics
// @route   GET /api/orders/stats/overview
// @access  Private/Admin
router.get('/stats/overview', protect, authorize('admin'), async (req, res, next) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const processingOrders = await Order.countDocuments({ status: 'processing' });
        const completedOrders = await Order.countDocuments({ status: 'completed' });
        
        const totalRevenue = await Order.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: null, total: { $sum: '$price' } } }
        ]);

        const ordersByService = await Order.aggregate([
            { $group: { _id: '$service', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                pendingOrders,
                processingOrders,
                completedOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                ordersByService
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
