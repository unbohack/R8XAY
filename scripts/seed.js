require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

async function createAdminUser() {
    try {
        // Connect to database
        await connectDB();

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@techservices.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            console.log('📧 Email:', adminEmail);
            process.exit(0);
            return;
        }

        // Create admin user
        const admin = await User.create({
            name: 'Admin',
            email: adminEmail,
            password: adminPassword,
            role: 'admin'
        });

        console.log('\n==============================================');
        console.log('✅ Admin user created successfully!');
        console.log('==============================================');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('==============================================');
        console.log('⚠️  Please change the password after first login');
        console.log('🔗 Login at: http://localhost:3000/admin');
        console.log('==============================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
}

// Run the seed
createAdminUser();
