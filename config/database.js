const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Try to connect to MongoDB Atlas or local MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/techservices';
        
        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`❌ MongoDB Error: ${error.message}`);
        console.log('⚠️  Running without database. Some features may be limited.');
        // Don't exit, continue without database
    }
};

module.exports = connectDB;
