const express = require('express');
const router = express.Router();
const dhruApi = require('../services/dhruApi');

// @route   POST /api/iphone/check
// @desc    Check iPhone with Dhru API
// @access  Public
router.post('/check', async (req, res) => {
    try {
        const { imei, checkType } = req.body;

        // التحقق من البيانات
        if (!imei || !checkType) {
            return res.status(400).json({
                success: false,
                message: 'الرجاء إدخال IMEI ونوع الفحص'
            });
        }

        // التحقق من صحة IMEI
        if (imei.length === 15 && !dhruApi.validateIMEI(imei)) {
            return res.status(400).json({
                success: false,
                message: 'رقم IMEI غير صحيح'
            });
        }

        // تحديد service ID حسب نوع الفحص
        const serviceId = getCheckServiceId(checkType);

        try {
            // استدعاء Dhru API
            const apiResponse = await dhruApi.placeOrder(serviceId, imei, 'check@techservices.com');

            if (apiResponse.success) {
                // انتظار النتيجة من API
                await new Promise(resolve => setTimeout(resolve, 2000));

                // فحص حالة الطلب
                const statusResponse = await dhruApi.checkOrderStatus(apiResponse.orderId);

                // تحليل النتيجة
                const result = parseCheckResult(statusResponse, imei, checkType);

                return res.json({
                    success: true,
                    result: result,
                    apiOrderId: apiResponse.orderId
                });
            } else {
                // في حالة فشل API، نرجع نتائج أساسية
                return res.json({
                    success: true,
                    result: getBasicCheckResult(imei, checkType),
                    demo: true
                });
            }
        } catch (apiError) {
            console.error('API Error:', apiError);
            
            // في حالة خطأ API، نرجع نتائج أساسية
            return res.json({
                success: true,
                result: getBasicCheckResult(imei, checkType),
                demo: true
            });
        }
    } catch (error) {
        console.error('Check Error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في النظام'
        });
    }
});

// @route   GET /api/iphone/services
// @desc    Get available iPhone check services
// @access  Public
router.get('/services', async (req, res) => {
    try {
        const services = await dhruApi.getServices();
        
        // تصفية الخدمات الخاصة بـ iPhone
        const iphoneServices = filterIPhoneServices(services);

        res.json({
            success: true,
            services: iphoneServices
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'فشل في الحصول على قائمة الخدمات'
        });
    }
});

// دالة لتحديد service ID حسب نوع الفحص
function getCheckServiceId(checkType) {
    const serviceMap = {
        'icloud': '10',        // iCloud Status Check
        'carrier': '11',       // Carrier Check
        'findmy': '12',        // Find My iPhone Check
        'blacklist': '13',     // Blacklist Check
        'warranty': '14',      // Warranty Check
        'full': '15'           // Full Check
    };

    return serviceMap[checkType] || '15';
}

// دالة لتحليل نتيجة الفحص من API
function parseCheckResult(apiResponse, imei, checkType) {
    const response = apiResponse.response || {};
    const message = apiResponse.message || '';
    const code = apiResponse.code || '';

    // استخراج المعلومات من الرد
    const result = {
        imei: imei,
        model: extractInfo(message, 'Model') || 'iPhone',
        color: extractInfo(message, 'Color') || 'غير محدد',
        storage: extractInfo(message, 'Storage') || 'غير محدد',
        iCloudStatus: determineICloudStatus(message, code),
        findMyStatus: determineFindMyStatus(message, code),
        carrierLock: determineCarrierStatus(message, code),
        blacklistStatus: determineBlacklistStatus(message, code),
        warrantyStatus: determineWarrantyStatus(message, code),
        country: extractInfo(message, 'Country') || 'غير محدد'
    };

    return result;
}

// دوال مساعدة لتحليل النتائج
function extractInfo(text, key) {
    const regex = new RegExp(`${key}:\\s*([^,\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
}

function determineICloudStatus(message, code) {
    const cleanPatterns = ['clean', 'off', 'disabled', 'unlocked', 'free'];
    const lockedPatterns = ['locked', 'on', 'enabled', 'lost'];
    
    const lowerMessage = message.toLowerCase();
    
    if (cleanPatterns.some(pattern => lowerMessage.includes(pattern))) {
        return 'Clean - نظيف';
    } else if (lockedPatterns.some(pattern => lowerMessage.includes(pattern))) {
        return 'Locked - مقفل';
    }
    
    return 'Unknown - غير محدد';
}

function determineFindMyStatus(message, code) {
    if (message.toLowerCase().includes('find my') || message.toLowerCase().includes('fmi')) {
        if (message.toLowerCase().includes('on') || message.toLowerCase().includes('enabled')) {
            return 'مفعل - ON';
        } else if (message.toLowerCase().includes('off') || message.toLowerCase().includes('disabled')) {
            return 'معطل - OFF';
        }
    }
    return 'غير متاح';
}

function determineCarrierStatus(message, code) {
    if (message.toLowerCase().includes('unlock') || message.toLowerCase().includes('factory')) {
        return 'Unlocked - مفتوح';
    } else if (message.toLowerCase().includes('lock')) {
        return 'Locked - مقفل';
    }
    return 'غير متاح';
}

function determineBlacklistStatus(message, code) {
    const cleanPatterns = ['clean', 'not blacklist', 'clear'];
    const blacklistedPatterns = ['blacklist', 'reported', 'stolen'];
    
    const lowerMessage = message.toLowerCase();
    
    if (cleanPatterns.some(pattern => lowerMessage.includes(pattern))) {
        return 'Clean - نظيف';
    } else if (blacklistedPatterns.some(pattern => lowerMessage.includes(pattern))) {
        return 'Blacklisted - في القائمة السوداء';
    }
    
    return 'Clean - نظيف';
}

function determineWarrantyStatus(message, code) {
    if (message.toLowerCase().includes('warranty')) {
        if (message.toLowerCase().includes('active') || message.toLowerCase().includes('valid')) {
            return 'Active - ساري';
        } else if (message.toLowerCase().includes('expired')) {
            return 'Expired - منتهي';
        }
    }
    return 'غير متاح';
}

// دالة للحصول على نتائج أساسية في حالة عدم توفر API
function getBasicCheckResult(imei, checkType) {
    // استخدام Luhn algorithm للتحقق من IMEI
    const isValidIMEI = imei.length === 15 && dhruApi.validateIMEI(imei);

    return {
        imei: imei,
        model: 'iPhone',
        color: 'غير محدد',
        storage: 'غير محدد',
        iCloudStatus: isValidIMEI ? 'يتطلب فحص API' : 'IMEI غير صحيح',
        findMyStatus: 'يتطلب فحص API',
        carrierLock: 'يتطلب فحص API',
        blacklistStatus: 'يتطلب فحص API',
        warrantyStatus: 'يتطلب فحص API',
        country: 'غير محدد',
        note: 'للحصول على نتائج دقيقة، يجب الاتصال بـ API'
    };
}

// دالة لتصفية خدمات iPhone من قائمة الخدمات
function filterIPhoneServices(services) {
    if (!services || !Array.isArray(services)) {
        return [];
    }

    return services.filter(service => {
        const name = service.name || service.serviceName || '';
        return name.toLowerCase().includes('iphone') || 
               name.toLowerCase().includes('icloud') ||
               name.toLowerCase().includes('ios') ||
               name.toLowerCase().includes('apple');
    });
}

module.exports = router;
