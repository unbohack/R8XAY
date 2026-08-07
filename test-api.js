// Test script to send order and message via API
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test sending an order
async function testOrder() {
    console.log('\n📦 Testing IMEI Order...');
    try {
        const response = await axios.post(`${BASE_URL}/api/imei/order`, {
            imei: '353287110123456',
            serviceType: 'icloud-check',
            name: 'أحمد محمد',
            email: 'test@example.com',
            phone: '0612345678'
        });
        
        console.log('✅ Order sent successfully!');
        console.log('Order ID:', response.data.data.orderId);
        console.log('Price:', response.data.data.price);
        console.log('Response:', response.data);
    } catch (error) {
        console.error('❌ Order failed:', error.response?.data || error.message);
    }
}

// Test sending a contact message
async function testContact() {
    console.log('\n💬 Testing Contact Message...');
    try {
        const response = await axios.post(`${BASE_URL}/api/contact`, {
            name: 'فاطمة الزهراء',
            email: 'contact@example.com',
            phone: '0698765432',
            message: 'مرحباً، أريد الاستفسار عن خدماتكم. هل يمكنكم مساعدتي؟'
        });
        
        console.log('✅ Message sent successfully!');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('❌ Message failed:', error.response?.data || error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🧪 Starting API Tests...');
    console.log('Make sure admin panel is open: http://localhost:3000/admin');
    console.log('Watch for notifications there!\n');
    
    await testOrder();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    await testContact();
    
    console.log('\n✅ All tests completed!');
    console.log('Check the admin panel for notifications.');
}

runTests();
