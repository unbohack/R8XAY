const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - check if user is authenticated
exports.protect = async (req, res, next) => {
    let token;

    // Check for token in headers or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
        token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح لك بالوصول إلى هذا المورد'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        req.user = await User.findById(decoded.id);

        if (!req.user || !req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'المستخدم غير موجود أو غير نشط'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح لك بالوصول إلى هذا المورد'
        });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `دور ${req.user.role} غير مصرح له بالوصول إلى هذا المورد`
            });
        }
        next();
    };
};
