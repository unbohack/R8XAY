// In-Memory Storage for when database is not available
class InMemoryStorage {
    constructor() {
        this.orders = [];
        this.contacts = [];
        this.chatMessages = [];
        this.users = [];
    }

    // Orders
    createOrder(orderData) {
        const order = {
            _id: Date.now().toString(),
            ...orderData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.orders.unshift(order);
        return order;
    }

    getOrders(limit = 50) {
        return this.orders.slice(0, limit);
    }

    getOrderById(id) {
        return this.orders.find(order => order._id === id);
    }

    updateOrder(id, updateData) {
        const index = this.orders.findIndex(order => order._id === id);
        if (index !== -1) {
            this.orders[index] = {
                ...this.orders[index],
                ...updateData,
                updatedAt: new Date()
            };
            return this.orders[index];
        }
        return null;
    }

    deleteOrder(id) {
        const index = this.orders.findIndex(order => order._id === id);
        if (index !== -1) {
            this.orders.splice(index, 1);
            return true;
        }
        return false;
    }

    // Contacts
    createContact(contactData) {
        const contact = {
            _id: Date.now().toString(),
            ...contactData,
            createdAt: new Date(),
            status: 'new'
        };
        this.contacts.unshift(contact);
        return contact;
    }

    getContacts(limit = 50) {
        return this.contacts.slice(0, limit);
    }

    updateContact(id, updateData) {
        const index = this.contacts.findIndex(contact => contact._id === id);
        if (index !== -1) {
            this.contacts[index] = {
                ...this.contacts[index],
                ...updateData
            };
            return this.contacts[index];
        }
        return null;
    }

    // Chat Messages
    createMessage(messageData) {
        const message = {
            _id: Date.now().toString() + Math.random(),
            ...messageData,
            createdAt: new Date(),
            isRead: false
        };
        this.chatMessages.push(message);
        return message;
    }

    getMessages(sessionId, limit = 100) {
        return this.chatMessages
            .filter(msg => msg.sessionId === sessionId)
            .slice(-limit);
    }

    getUniqueSessions() {
        const sessions = new Set();
        this.chatMessages.forEach(msg => sessions.add(msg.sessionId));
        return Array.from(sessions);
    }

    markMessagesAsRead(sessionId) {
        this.chatMessages
            .filter(msg => msg.sessionId === sessionId)
            .forEach(msg => {
                msg.isRead = true;
                msg.readAt = new Date();
            });
    }

    // Statistics
    getStats() {
        return {
            totalOrders: this.orders.length,
            pendingOrders: this.orders.filter(o => o.status === 'pending').length,
            completedOrders: this.orders.filter(o => o.status === 'completed').length,
            totalContacts: this.contacts.length,
            unreadContacts: this.contacts.filter(c => c.status === 'new').length,
            totalMessages: this.chatMessages.length,
            activeSessions: this.getUniqueSessions().length
        };
    }

    // Clear all data
    clearAll() {
        this.orders = [];
        this.contacts = [];
        this.chatMessages = [];
        this.users = [];
    }

    // Export data (for backup when DB becomes available)
    exportData() {
        return {
            orders: this.orders,
            contacts: this.contacts,
            chatMessages: this.chatMessages,
            exportedAt: new Date()
        };
    }
}

// Create singleton instance
const storage = new InMemoryStorage();

module.exports = storage;
