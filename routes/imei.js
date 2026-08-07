const express = require('express');
const router = express.Router();
const dhruApi = require('../services/dhruApi');
const Order = require('../models/Order');
const inMemoryStorage = require('../utils/inMemoryStorage');
const mongoose = require('mongoose');

// @desc    Check IMEI - Free basic check
// @route   POST /api/imei/check
router.post('/check', async (req, res) => {
    try {
        const { imei } = req.body;

        if (!imei || imei.length !== 15) {
            return res.status(400).json({
                success: false,
                message: 'الرجاء إدخال رقم IMEI صحيح (15 رقم)'
            });
        }

        // Validate IMEI using Luhn algorithm
        const isValid = dhruApi.validateIMEI(imei);
        
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'رقم IMEI غير صحيح'
            });
        }

        // Try to check IMEI with API
        try {
            const apiResponse = await dhruApi.checkIMEI(imei);
            
            // If API returns data, format and return it
            if (apiResponse) {
                return res.json({
                    success: true,
                    data: {
                        imei: imei,
                        valid: apiResponse.valid !== false,
                        brand: apiResponse.brand || apiResponse.BRAND || 'غير معروف',
                        model: apiResponse.model || apiResponse.MODEL || 'غير معروف',
                        deviceType: apiResponse.deviceType || apiResponse.TYPE || 'Smartphone',
                        status: apiResponse.status || apiResponse.STATUS || 'غير معروف',
                        network: apiResponse.network || apiResponse.SIMLOCK || 'غير معروف',
                        warranty: apiResponse.warranty || apiResponse.WARRANTY || 'غير معروف',
                        color: apiResponse.color || apiResponse.COLOR || 'N/A',
                        storage: apiResponse.storage || apiResponse.STORAGE || 'N/A',
                        serial: apiResponse.serial || apiResponse.SERIAL || 'N/A',
                        purchaseDate: apiResponse.purchaseDate || apiResponse.PURCHASE_DATE || 'N/A',
                        source: apiResponse.source || 'API',
                        found: apiResponse.found !== false,
                        note: apiResponse.note || null
                    }
                });
            }
        } catch (error) {
            console.log('API check failed:', error.message);
        }

        // If API check is not available or failed, return basic validation
        return res.json({
            success: true,
            data: {
                imei: imei,
                valid: true,
                brand: 'غير معروف',
                model: 'غير معروف',
                message: 'IMEI صحيح - للحصول على تقرير مفصل، يرجى طلب خدمة التقرير المتقدم',
                basicCheck: true
            }
        });

    } catch (error) {
        console.error('IMEI Check Error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء فحص IMEI'
        });
    }
});

// @desc    Get available IMEI services
// @route   GET /api/imei/services
router.get('/services', async (req, res) => {
    try {
        const services = await dhruApi.getServices();
        
        // Filter IMEI related services
        const imeiServices = services.filter(service => 
            service.name && (
                service.name.toLowerCase().includes('imei') ||
                service.name.toLowerCase().includes('unlock') ||
                service.name.toLowerCase().includes('check')
            )
        );

        res.json({
            success: true,
            services: imeiServices
        });
    } catch (error) {
        console.error('Get Services Error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء الحصول على الخدمات',
            error: error.message
        });
    }
});

// @desc    Place IMEI service order (unlock, report, etc)
// @route   POST /api/imei/order
router.post('/order', async (req, res) => {
    try {
        const { 
            name, 
            email, 
            phone, 
            imei, 
            deviceBrand, 
            model, 
            serviceType,
            details 
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !imei || !serviceType) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة'
            });
        }

        // Validate IMEI - accept 14-15 digits
        const cleanImei = imei.replace(/\s/g, '').trim();
        if (cleanImei.length < 14 || cleanImei.length > 15 || !/^\d+$/.test(cleanImei)) {
            return res.status(400).json({
                success: false,
                message: 'رقم IMEI غير صحيح - يجب أن يكون 15 رقماً'
            });
        }

        // Map service types to service IDs and prices
        const serviceMap = {
            'unlock': { id: 1, price: 29, name: 'فتح IMEI' },
            'icloud-unlock': { id: 2, price: 79, name: 'فتح iCloud' },
            'icloud-check': { id: 3, price: 9, name: 'فحص iCloud' },
            'report': { id: 4, price: 9, name: 'تقرير IMEI' },
            'icloud': { id: 3, price: 79, name: 'خدمة iCloud' },
            'blacklist': { id: 5, price: 9, name: 'فحص القائمة السوداء' },
            'carrier-check': { id: 6, price: 9, name: 'فحص الشبكة' },
            'info': { id: 7, price: 5, name: 'معلومات الجهاز' }
        };

        const serviceInfo = serviceMap[serviceType];
        
        if (!serviceInfo) {
            return res.status(400).json({
                success: false,
                message: `نوع الخدمة غير صحيح: ${serviceType}`
            });
        }

        const orderData = {
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            serviceType: serviceType,
            serviceName: serviceInfo.name,
            imei: cleanImei,
            deviceBrand: deviceBrand,
            deviceModel: model,
            status: 'pending',
            price: serviceInfo.price,
            notes: details
        };

        let order;
        const isDbConnected = mongoose.connection.readyState === 1;

        // Create order in database or memory storage
        if (isDbConnected) {
            order = await Order.create(orderData);
        } else {
            order = inMemoryStorage.createOrder(orderData);
            console.log('⚠️  Order saved in memory (DB not connected)');
        }

        // Try to place order with API
        try {
            const apiResponse = await dhruApi.placeOrder(serviceInfo.id, cleanImei, email);
            
            if (apiResponse.success) {
                // Update order with API order ID
                if (isDbConnected) {
                    order.apiOrderId = apiResponse.orderId;
                    order.apiStatus = apiResponse.status;
                    await order.save();
                } else {
                    inMemoryStorage.updateOrder(order._id, {
                        apiOrderId: apiResponse.orderId,
                        apiStatus: apiResponse.status
                    });
                }

                // Send notification via Socket.IO if available
                const io = req.app.get('io');
                if (io) {
                    const notificationData = {
                        orderId: order._id,
                        customerName: name,
                        serviceType: serviceType,
                        serviceName: orderData.serviceName,
                        price: orderData.price,
                        timestamp: new Date()
                    };
                    io.emit('new-order', notificationData);
                    console.log('✅ Socket.IO notification sent:', notificationData);
                } else {
                    console.log('⚠️ Socket.IO not available');
                }

                return res.json({
                    success: true,
                    message: 'تم إرسال طلبك بنجاح!',
                    orderId: order._id,
                    apiOrderId: apiResponse.orderId,
                    estimatedTime: '24-48 ساعة'
                });
            } else {
                // API order failed but we keep the order
                if (isDbConnected) {
                    order.status = 'manual_review';
                    order.notes = (order.notes || '') + ` | API Error: ${apiResponse.message}`;
                    await order.save();
                } else {
                    inMemoryStorage.updateOrder(order._id, {
                        status: 'manual_review',
                        notes: (order.notes || '') + ` | API Error: ${apiResponse.message}`
                    });
                }

                // Send notification
                const io = req.app.get('io');
                if (io) {
                    io.emit('new-order', {
                        orderId: order._id,
                        customerName: name,
                        serviceType: serviceType,
                        serviceName: orderData.serviceName,
                        price: orderData.price,
                        status: 'manual_review',
                        timestamp: new Date()
                    });
                }

                return res.json({
                    success: true,
                    message: 'تم استلام طلبك وسيتم مراجعته يدوياً',
                    orderId: order._id
                });
            }
        } catch (apiError) {
            console.error('API Order Error:', apiError);
            
            // Keep order for manual processing
            if (isDbConnected) {
                order.status = 'manual_review';
                order.notes = (order.notes || '') + ` | API Connection Error: ${apiError.message}`;
                await order.save();
            } else {
                inMemoryStorage.updateOrder(order._id, {
                    status: 'manual_review',
                    notes: (order.notes || '') + ` | API Connection Error: ${apiError.message}`
                });
            }

            // Send notification
            const io = req.app.get('io');
            if (io) {
                io.emit('new-order', {
                    orderId: order._id,
                    customerName: name,
                    serviceType: serviceType,
                    serviceName: orderData.serviceName,
                    price: orderData.price,
                    status: 'manual_review',
                    timestamp: new Date()
                });
            }

            return res.json({
                success: true,
                message: 'تم استلام طلبك وسيتم مراجعته يدوياً',
                orderId: order._id
            });
        }

    } catch (error) {
        console.error('Order Error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء معالجة طلبك',
            error: error.message
        });
    }
});

// @desc    Check order status
// @route   GET /api/imei/order/:orderId
router.get('/order/:orderId', async (req, res) => {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        let order;

        if (isDbConnected) {
            order = await Order.findById(req.params.orderId);
        } else {
            order = inMemoryStorage.getOrderById(req.params.orderId);
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        // If order has API order ID, check its status
        if (order.apiOrderId) {
            try {
                const apiStatus = await dhruApi.checkOrderStatus(order.apiOrderId);
                
                // Update order status from API
                const updateData = {
                    apiStatus: apiStatus.status
                };
                
                if (apiStatus.code) {
                    updateData.unlockCode = apiStatus.code;
                }
                
                // Map API status to our status
                if (apiStatus.status === 'Success' || apiStatus.status === 'Completed') {
                    updateData.status = 'completed';
                } else if (apiStatus.status === 'Rejected' || apiStatus.status === 'Failed') {
                    updateData.status = 'failed';
                } else if (apiStatus.status === 'Processing' || apiStatus.status === 'Pending') {
                    updateData.status = 'processing';
                }
                
                if (isDbConnected) {
                    Object.assign(order, updateData);
                    await order.save();
                } else {
                    inMemoryStorage.updateOrder(order._id, updateData);
                    order = inMemoryStorage.getOrderById(req.params.orderId);
                }
            } catch (error) {
                console.error('API Status Check Error:', error);
            }
        }

        res.json({
            success: true,
            order: {
                id: order._id,
                status: order.status,
                apiStatus: order.apiStatus,
                serviceName: order.serviceName,
                imei: order.imei,
                deviceBrand: order.deviceBrand,
                deviceModel: order.deviceModel,
                createdAt: order.createdAt,
                unlockCode: order.unlockCode,
                result: order.result
            }
        });

    } catch (error) {
        console.error('Get Order Error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب معلومات الطلب'
        });
    }
});

// @desc    Get all orders (Admin)
// @route   GET /api/imei/orders
router.get('/orders', async (req, res) => {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        let orders;

        if (isDbConnected) {
            orders = await Order.find({ serviceType: 'imei' })
                .sort({ createdAt: -1 })
                .limit(100);
        } else {
            orders = inMemoryStorage.getOrders(100);
        }

        res.json({
            success: true,
            count: orders.length,
            orders: orders,
            source: isDbConnected ? 'database' : 'memory'
        });
    } catch (error) {
        console.error('Get Orders Error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء جلب الطلبات'
        });
    }
});

module.exports = router;
