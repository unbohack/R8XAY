const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const axios = require('axios');

const getTelegramConfig = () => {
    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_GROUP_ID;
    return { token, chatId };
};

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const sendTelegramMessage = async (text) => {
    const { token, chatId } = getTelegramConfig();

    if (!token || !chatId) {
        return {
            success: false,
            reason: 'missing-config',
            message: 'لم يتم تكوين بوت Telegram أو معرف الدردشة'
        };
    }

    try {
        const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        });

        return {
            success: response?.data?.ok === true,
            data: response?.data || null
        };
    } catch (error) {
        console.error('Telegram send error:', error.message);
        return {
            success: false,
            reason: 'request-failed',
            message: error.message
        };
    }
};

const sendEcidTelegramNotification = async (record) => {
    const info = record.deviceInfo || {};
    const message = `
🔐 طلب ECID جديد

ECID: <code>${escapeHtml(record.ecid || '')}</code>
الموديل: ${escapeHtml(record.deviceModel || 'غير محدد')}
المتصفح: ${escapeHtml(info.browser || 'غير محدد')}
النظام: ${escapeHtml(info.os || 'غير محدد')}
الشاشة: ${escapeHtml(info.screen || 'غير محدد')}
اللغة: ${escapeHtml(info.language || 'غير محدد')}
التاريخ: ${escapeHtml(new Date(record.createdAt || Date.now()).toLocaleString('ar-EG'))}
`; 

    return sendTelegramMessage(message.trim());
};

module.exports = {
    sendTelegramMessage,
    sendEcidTelegramNotification
};
