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

const getEnvValue = (keys) => {
    for (const key of keys) {
        if (process.env[key]) {
            return { key, value: process.env[key] };
        }
    }
    return { key: null, value: null };
};

const getTelegramConfig = () => {
    const tokenLookup = getEnvValue([
        'TELEGRAM_BOT_TOKEN',
        'TELEGRAM_TOKEN',
        'TELEGRAM_API_TOKEN',
        'TG_BOT_TOKEN',
        'BOT_TOKEN',
        'TELEGRAM_BOT',
        'BOT_API_TOKEN'
    ]);
    const chatIdLookup = getEnvValue([
        'TELEGRAM_CHAT_ID',
        'TELEGRAM_CHAT',
        'TELEGRAM_CHANNEL_ID',
        'TELEGRAM_GROUP_ID',
        'TG_CHAT_ID',
        'BOT_CHAT_ID',
        'CHAT_ID'
    ]);

    return {
        token: tokenLookup.value,
        chatId: chatIdLookup.value,
        tokenKey: tokenLookup.key,
        chatIdKey: chatIdLookup.key
    };
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
            tokenKey,
            chatIdKey,
            envFileLoaded: loadedEnvFile,
            envVars: {
                TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
                TELEGRAM_TOKEN: !!process.env.TELEGRAM_TOKEN,
                TELEGRAM_API_TOKEN: !!process.env.TELEGRAM_API_TOKEN,
                TG_BOT_TOKEN: !!process.env.TG_BOT_TOKEN,
                BOT_TOKEN: !!process.env.BOT_TOKEN,
                TELEGRAM_BOT: !!process.env.TELEGRAM_BOT,
                BOT_API_TOKEN: !!process.env.BOT_API_TOKEN,
                TELEGRAM_CHAT_ID: !!process.env.TELEGRAM_CHAT_ID,
                TELEGRAM_CHAT: !!process.env.TELEGRAM_CHAT,
                TELEGRAM_CHANNEL_ID: !!process.env.TELEGRAM_CHANNEL_ID,
                TELEGRAM_GROUP_ID: !!process.env.TELEGRAM_GROUP_ID,
                TG_CHAT_ID: !!process.env.TG_CHAT_ID,
                BOT_CHAT_ID: !!process.env.BOT_CHAT_ID,
                CHAT_ID: !!process.env.CHAT_ID
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
