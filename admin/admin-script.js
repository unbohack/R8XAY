// Global variables
let token = localStorage.getItem('admin_token');
let socket;
let currentChatSession = null;

// Check if user is logged in
window.addEventListener('DOMContentLoaded', () => {
    if (token) {
        verifyToken();
    } else {
        showLogin();
    }
});

// Show login page
function showLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            if (data.user.role !== 'admin') {
                alert('غير مصرح لك بالوصول إلى لوحة التحكم');
                return;
            }

            token = data.token;
            localStorage.setItem('admin_token', token);
            localStorage.setItem('admin_name', data.user.name);
            
            showDashboard();
            initializeSocket();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('حدث خطأ في تسجيل الدخول');
    }
});

// Verify token
async function verifyToken() {
    try {
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success && data.data.role === 'admin') {
            showDashboard();
            initializeSocket();
        } else {
            logout();
        }
    } catch (error) {
        console.error('Token verification error:', error);
        logout();
    }
}

// Show dashboard
function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
    
    const adminName = localStorage.getItem('admin_name') || 'المدير';
    document.getElementById('adminName').textContent = adminName;

    loadDashboardData();
}

// Logout
function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_name');
    token = null;
    if (socket) socket.disconnect();
    showLogin();
}

// Initialize Socket.IO
function initializeSocket() {
    socket = io(window.location.origin);

    socket.on('connect', () => {
        console.log('✅ Socket connected');
        socket.emit('admin-join');
        showNotification('تم الاتصال بالسيرفر بنجاح', 'success');
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        showNotification('تم قطع الاتصال بالسيرفر', 'warning');
    });

    socket.on('new-message', (data) => {
        console.log('📩 New contact message received:', data);
        showNotification(`رسالة جديدة من ${data.name}: ${data.message}`, 'info');
        playNotificationSound();
        
        // Update contacts badge
        const contactsBadge = document.getElementById('contactsBadge');
        if (contactsBadge) {
            const currentCount = parseInt(contactsBadge.textContent) || 0;
            contactsBadge.textContent = currentCount + 1;
        }

        // Update notification bell
        const notificationCount = document.querySelector('.notification-count');
        if (notificationCount) {
            const currentCount = parseInt(notificationCount.textContent) || 0;
            notificationCount.textContent = currentCount + 1;
        }

        // Reload messages if on contacts page
        if (document.getElementById('contactsPage') && document.getElementById('contactsPage').classList.contains('active')) {
            loadMessages();
        }
        
        loadDashboardData();
    });

    socket.on('new-order', (notification) => {
        console.log('🛒 New order received:', notification);
        showNotification(`طلب جديد من ${notification.customerName} - ${notification.serviceName}`, 'success');
        
        // Update orders badge
        const ordersBadge = document.getElementById('ordersBadge');
        if (ordersBadge) {
            const currentCount = parseInt(ordersBadge.textContent) || 0;
            ordersBadge.textContent = currentCount + 1;
        }

        // Update notification bell
        const notificationCount = document.querySelector('.notification-count');
        if (notificationCount) {
            const currentCount = parseInt(notificationCount.textContent) || 0;
            notificationCount.textContent = currentCount + 1;
        }

        // Reload orders if on orders page
        if (document.getElementById('ordersPage').classList.contains('active')) {
            loadOrders();
        }
        
        loadDashboardData();
    });

    socket.on('order-notification', (notification) => {
        console.log('📦 Order notification:', notification);
        showNotification(notification.message, 'info');
        loadOrders();
        loadDashboardData();
    });

    socket.on('notification', (notification) => {
        console.log('🔔 Notification:', notification);
        showNotification(notification.data.message || 'إشعار جديد', 'info');
    });
}

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Show page
        const page = link.getAttribute('data-page');
        showPage(page);
    });
});

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + 'Page').classList.add('active');

    const titles = {
        dashboard: 'لوحة المعلومات',
        orders: 'إدارة الطلبات',
        payments: 'المدفوعات',
        contacts: 'رسائل الاتصال',
        chat: 'الدردشة المباشرة',
        users: 'إدارة المستخدمين',
        settings: 'الإعدادات'
    };

    document.getElementById('pageTitle').textContent = titles[page];

    // Load data for specific pages
    if (page === 'orders') loadOrders();
    else if (page === 'payments') loadPayments();
    else if (page === 'contacts') loadContacts();
    else if (page === 'chat') loadChatSessions();
    else if (page === 'users') loadUsers();
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/orders/stats/overview', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('totalOrders').textContent = data.data.totalOrders;
            document.getElementById('pendingOrders').textContent = data.data.pendingOrders;
            document.getElementById('completedOrders').textContent = data.data.completedOrders;
            document.getElementById('totalRevenue').textContent = '$' + data.data.totalRevenue.toFixed(2);
            document.getElementById('ordersBadge').textContent = data.data.pendingOrders;
        }

        // Load recent orders
        loadRecentOrders();
    } catch (error) {
        console.error('Dashboard data error:', error);
    }
}

// Load recent orders
async function loadRecentOrders() {
    try {
        const response = await fetch('/api/orders?limit=5', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success) {
            const table = document.getElementById('recentOrdersTable');
            table.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>رقم الطلب</th>
                            <th>الخدمة</th>
                            <th>العميل</th>
                            <th>الحالة</th>
                            <th>التاريخ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.data.map(order => `
                            <tr>
                                <td>${order.orderId}</td>
                                <td>${getServiceName(order.service)}</td>
                                <td>${order.customerInfo.name}</td>
                                <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
                                <td>${new Date(order.createdAt).toLocaleDateString('ar-EG')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Recent orders error:', error);
    }
}

// Load orders
async function loadOrders() {
    try {
        const status = document.getElementById('orderStatusFilter')?.value || '';
        const service = document.getElementById('orderServiceFilter')?.value || '';
        
        let url = '/api/orders?limit=50';
        if (status) url += `&status=${status}`;
        if (service) url += `&service=${service}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success) {
            const table = document.getElementById('ordersTable');
            table.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>رقم الطلب</th>
                            <th>الخدمة</th>
                            <th>العميل</th>
                            <th>البريد</th>
                            <th>الهاتف</th>
                            <th>الحالة</th>
                            <th>السعر</th>
                            <th>التاريخ</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.data.map(order => `
                            <tr>
                                <td>${order.orderId}</td>
                                <td>${getServiceName(order.service)}</td>
                                <td>${order.customerInfo.name}</td>
                                <td>${order.customerInfo.email}</td>
                                <td>${order.customerInfo.phone}</td>
                                <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
                                <td>${order.price ? '$' + order.price : 'N/A'}</td>
                                <td>${new Date(order.createdAt).toLocaleDateString('ar-EG')}</td>
                                <td>
                                    <button class="btn-sm btn-primary" onclick="viewOrder('${order._id}')">عرض</button>
                                    <button class="btn-sm btn-success" onclick="updateOrderStatus('${order._id}')">تحديث</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Orders error:', error);
    }
}

// Load payments
async function loadPayments() {
    // Similar structure to loadOrders
    document.getElementById('paymentsTable').innerHTML = '<p>جاري التحميل...</p>';
}

// Load contacts
async function loadContacts() {
    try {
        const response = await fetch('/api/contact', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success) {
            const table = document.getElementById('contactsTable');
            table.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>البريد</th>
                            <th>الهاتف</th>
                            <th>الرسالة</th>
                            <th>الحالة</th>
                            <th>التاريخ</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.data.map(contact => `
                            <tr>
                                <td>${contact.name}</td>
                                <td>${contact.email}</td>
                                <td>${contact.phone || 'N/A'}</td>
                                <td>${contact.message.substring(0, 50)}...</td>
                                <td><span class="status-badge status-${contact.status}">${contact.status}</span></td>
                                <td>${new Date(contact.createdAt).toLocaleDateString('ar-EG')}</td>
                                <td>
                                    <button class="btn-sm btn-primary" onclick="replyContact('${contact._id}')">رد</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Contacts error:', error);
    }
}

// Load chat sessions
async function loadChatSessions() {
    // Implement chat sessions loading
    document.getElementById('sessionsList').innerHTML = '<p>لا توجد جلسات نشطة</p>';
}

// Load users
function loadUsers() {
    document.getElementById('usersTable').innerHTML = '<p>قريباً...</p>';
}

// Helper functions
function getServiceName(service) {
    const names = {
        server: 'Server Service',
        imei: 'IMEI Service',
        remote: 'Remote Service'
    };
    return names[service] || service;
}

function getStatusText(status) {
    const texts = {
        pending: 'قيد الانتظار',
        processing: 'قيد المعالجة',
        completed: 'مكتمل',
        cancelled: 'ملغي'
    };
    return texts[status] || status;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add to body
    document.body.appendChild(notification);

    // Play sound
    playNotificationSound();

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function playNotificationSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzbM7O6JNCgGHW7A7OShWRULSnD');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
        console.log('Sound error:', e);
    }
}

function viewOrder(orderId) {
    alert('عرض تفاصيل الطلب: ' + orderId);
}

function updateOrderStatus(orderId) {
    const newStatus = prompt('الحالة الجديدة (pending/processing/completed/cancelled):');
    if (newStatus) {
        updateStatus(orderId, newStatus);
    }
}

async function updateStatus(orderId, status) {
    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (data.success) {
            alert('تم تحديث الحالة بنجاح');
            loadOrders();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Update status error:', error);
        alert('حدث خطأ');
    }
}

function replyContact(contactId) {
    const response = prompt('اكتب ردك:');
    if (response) {
        sendContactReply(contactId, response);
    }
}

async function sendContactReply(contactId, response) {
    try {
        const res = await fetch(`/api/contact/${contactId}/reply`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ response })
        });

        const data = await res.json();

        if (data.success) {
            alert('تم إرسال الرد بنجاح');
            loadContacts();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Reply error:', error);
        alert('حدث خطأ');
    }
}

function updateChatBadge() {
    // Update chat badge count
}

function displayMessage(message) {
    // Display message in chat window
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (message && currentChatSession) {
        socket.emit('send-message', {
            sessionId: currentChatSession,
            sender: 'admin',
            senderName: localStorage.getItem('admin_name') || 'المدير',
            message
        });

        input.value = '';
    }
}

// Filter handlers
document.getElementById('orderStatusFilter')?.addEventListener('change', loadOrders);
document.getElementById('orderServiceFilter')?.addEventListener('change', loadOrders);

// Sidebar toggle for mobile
document.querySelector('.sidebar-toggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('active');
});
