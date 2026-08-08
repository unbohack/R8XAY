const fs = require('fs');
const path = require('path');
const axios = require('axios');

let loadedEnvFile = null;
const loadEnvIfAvailable = () => {
    const candidates = [
        path.resolve(__dirname, '..', '.env'),
        path.resolve(__dirname, '..', '..', '.env'),
        path.resolve(process.cwd(), '.env')
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            loadedEnvFile = candidate;
            require('dotenv').config({ path: candidate });
            break;
        }
    }
};

loadEnvIfAvailable();

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
        console.error('Telegram missing config', {
            tokenPresent: !!token,
            chatIdPresent: !!chatId,
            envFileLoaded: loadedEnvFile,
            envVars: {
                TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
                TELEGRAM_TOKEN: !!process.env.TELEGRAM_TOKEN,
                TELEGRAM_CHAT_ID: !!process.env.TELEGRAM_CHAT_ID,
                TELEGRAM_CHANNEL_ID: !!process.env.TELEGRAM_CHANNEL_ID,
                TELEGRAM_GROUP_ID: !!process.env.TELEGRAM_GROUP_ID
            }
        });

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
