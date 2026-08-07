require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');

// Import configurations
const connectDB = require('./config/database');
const errorHandler = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import models
const ChatMessage = require('./models/ChatMessage');
const Order = require('./models/Order');

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const io = socketio(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(cookieParser());

// Body parser - with raw body for Stripe webhooks
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);

// Static files
app.use(express.static(path.join(__dirname)));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Make io accessible to routes
app.set('io', io);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/iphone', require('./routes/iphone'));
app.use('/api/imei', require('./routes/imei'));
app.use('/api/ecid', require('./routes/ecid'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        mongodb: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Socket.IO for real-time chat and notifications
io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    // Join room
    socket.on('join-room', (sessionId) => {
        socket.join(sessionId);
        console.log(`User joined room: ${sessionId}`);
    });

    // Chat message
    socket.on('send-message', async (data) => {
        try {
            const { sessionId, sender, senderName, message } = data;

            // Check if database is connected
            if (require('mongoose').connection.readyState === 1) {
                // Save message to database
                const chatMessage = await ChatMessage.create({
                    sessionId,
                    sender,
                    senderName,
                    message
                });

                // Broadcast to room
                io.to(sessionId).emit('new-message', {
                    id: chatMessage._id,
                    sessionId,
                    sender,
                    senderName,
                    message,
                    createdAt: chatMessage.createdAt
                });
            } else {
                // Broadcast without saving
                io.to(sessionId).emit('new-message', {
                    id: Date.now().toString(),
                    sessionId,
                    sender,
                    senderName,
                    message,
                    createdAt: new Date()
                });
            }
        } catch (error) {
            console.error('Chat error:', error);
            socket.emit('error', { message: 'فشل إرسال الرسالة' });
        }
    });

    // Mark messages as read
    socket.on('mark-read', async (data) => {
        try {
            if (require('mongoose').connection.readyState === 1) {
                const { sessionId } = data;
                await ChatMessage.updateMany(
                    { sessionId, isRead: false },
                    { isRead: true, readAt: Date.now() }
                );
                io.to(sessionId).emit('messages-read', { sessionId });
            }
        } catch (error) {
            console.error('Mark read error:', error);
        }
    });

    // Get chat history
    socket.on('get-history', async (sessionId) => {
        try {
            if (require('mongoose').connection.readyState === 1) {
                const messages = await ChatMessage.find({ sessionId })
                    .sort({ createdAt: 1 })
                    .limit(100);
                socket.emit('chat-history', messages);
            } else {
                socket.emit('chat-history', []);
            }
        } catch (error) {
            console.error('Get history error:', error);
        }
    });

    // Admin joins all active sessions
    socket.on('admin-join', async () => {
        try {
            if (require('mongoose').connection.readyState === 1) {
                const sessions = await ChatMessage.distinct('sessionId');
                sessions.forEach(session => {
                    socket.join(session);
                });
                console.log('Admin joined all active sessions');
            } else {
                console.log('Admin join: Database not connected');
            }
        } catch (error) {
            console.error('Admin join error:', error);
        }
    });

    // Typing indicator
    socket.on('typing', (data) => {
        socket.to(data.sessionId).emit('user-typing', {
            sessionId: data.sessionId,
            user: data.user
        });
    });

    socket.on('stop-typing', (data) => {
        socket.to(data.sessionId).emit('user-stop-typing', {
            sessionId: data.sessionId,
            user: data.user
        });
    });

    // Order notifications
    socket.on('order-update', async (orderId) => {
        try {
            const order = await Order.findById(orderId);
            if (order) {
                io.emit('order-notification', {
                    type: 'order-update',
                    orderId: order.orderId,
                    status: order.status,
                    message: `تم تحديث الطلب ${order.orderId}`
                });
            }
        } catch (error) {
            console.error('Order notification error:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// Global notification function
global.sendNotification = (type, data) => {
    io.emit('notification', { type, data, timestamp: Date.now() });
};

// 404 handler
app.use((req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({ 
            success: false, 
            message: 'API endpoint not found' 
        });
    } else {
        res.status(404).sendFile(path.join(__dirname, '404.html'));
    }
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
server.listen(PORT, HOST, () => {
    console.log('\n==============================================');
    console.log('🚀 Server is running!');
    console.log('==============================================');
    console.log(`📱 Website: http://localhost:${PORT}`);
    console.log(`👨‍💼 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`🔌 Socket.IO: Enabled`);
    console.log(`💾 Environment: ${process.env.NODE_ENV}`);
    console.log('==============================================\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});
