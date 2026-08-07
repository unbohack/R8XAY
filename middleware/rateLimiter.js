const rateLimit = require('express-rate-limit');

// General API rate limiter
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'تم تجاوز عدد الطلبات المسموح بها. الرجاء المحاولة لاحقاً'
    }
});

// Strict rate limiter for authentication routes
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'تم تجاوز عدد محاولات تسجيل الدخول. الرجاء المحاولة بعد 15 دقيقة'
    }
});

// Email rate limiter
exports.emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 emails per hour
    message: {
        success: false,
        message: 'تم تجاوز عدد الرسائل المسموح بها. الرجاء المحاولة لاحقاً'
    }
});
