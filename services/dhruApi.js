const axios = require('axios');
const config = require('../config/dhru-api');

class DhruApiService {
    constructor() {
        this.config = config.ifreeicloud;
        this.baseURL = this.config.url;
    }

    // إنشاء request للـ API
    async makeRequest(action, additionalParams = {}) {
        try {
            const params = {
                username: this.config.username,
                apiaccesskey: this.config.apiKey,
                action: action,
                ...additionalParams
            };

            const response = await axios.post(
                `${this.baseURL}${config.endpoints.placeOrder}`,
                null,
                { params }
            );

            return response.data;
        } catch (error) {
            console.error('Dhru API Error:', error.message);
            throw new Error(`API Request Failed: ${error.message}`);
        }
    }

    // الحصول على قائمة الخدمات
    async getServices() {
        try {
            const response = await this.makeRequest('services');
            return response;
        } catch (error) {
            throw error;
        }
    }

    // إنشاء طلب جديد
    async placeOrder(serviceId, imei, email = '') {
        try {
            const response = await this.makeRequest('order', {
                service: serviceId,
                imei: imei,
                email: email || 'noreply@techservices.com'
            });

            return {
                success: response.SUCCESS === 'true' || response.SUCCESS === true,
                orderId: response.ORDERID || response.orderid,
                message: response.MESSAGE || response.message,
                status: response.STATUS || response.status,
                response: response
            };
        } catch (error) {
            throw error;
        }
    }

    // فحص حالة الطلب
    async checkOrderStatus(orderId) {
        try {
            const response = await this.makeRequest('status', {
                orderid: orderId
            });

            return {
                orderId: response.ORDERID || response.orderid,
                status: response.STATUS || response.status,
                code: response.CODE || response.code,
                message: response.MESSAGE || response.message,
                response: response
            };
        } catch (error) {
            throw error;
        }
    }

    // الحصول على الرصيد
    async getBalance() {
        try {
            const response = await this.makeRequest('balance');
            return {
                balance: response.BALANCE || response.balance,
                currency: response.CURRENCY || 'USD'
            };
        } catch (error) {
            throw error;
        }
    }

    // فحص IMEI (خدمة مجانية إن وجدت)
    async checkIMEI(imei) {
        try {
            // محاولة الحصول على معلومات من API
            const response = await this.makeRequest('checkimei', {
                imei: imei
            });

            if (response && response.SUCCESS) {
                return response;
            }
        } catch (error) {
            console.log('API checkimei not available, using TAC database');
        }

        // استخدام قاعدة بيانات TAC المحلية
        const tacInfo = this.getTACInfo(imei);
        return {
            imei: imei,
            valid: this.validateIMEI(imei),
            ...tacInfo,
            source: 'TAC Database'
        };
    }

    // الحصول على معلومات من TAC (أول 8 أرقام من IMEI)
    getTACInfo(imei) {
        const tac = imei.substring(0, 8);
        
        // قاعدة بيانات TAC محلية (عينة من الأجهزة الشائعة)
        const tacDatabase = {
            // Apple iPhones
            '35328711': { brand: 'Apple', model: 'iPhone 14 Pro Max', type: 'Smartphone' },
            '35328611': { brand: 'Apple', model: 'iPhone 14 Pro', type: 'Smartphone' },
            '35328511': { brand: 'Apple', model: 'iPhone 14 Plus', type: 'Smartphone' },
            '35328411': { brand: 'Apple', model: 'iPhone 14', type: 'Smartphone' },
            '35930310': { brand: 'Apple', model: 'iPhone 13 Pro Max', type: 'Smartphone' },
            '35930210': { brand: 'Apple', model: 'iPhone 13 Pro', type: 'Smartphone' },
            '35930110': { brand: 'Apple', model: 'iPhone 13', type: 'Smartphone' },
            '35930010': { brand: 'Apple', model: 'iPhone 13 Mini', type: 'Smartphone' },
            '35456910': { brand: 'Apple', model: 'iPhone 12 Pro Max', type: 'Smartphone' },
            '35456810': { brand: 'Apple', model: 'iPhone 12 Pro', type: 'Smartphone' },
            '35456710': { brand: 'Apple', model: 'iPhone 12', type: 'Smartphone' },
            '35456610': { brand: 'Apple', model: 'iPhone 12 Mini', type: 'Smartphone' },
            '35364411': { brand: 'Apple', model: 'iPhone 11 Pro Max', type: 'Smartphone' },
            '35364311': { brand: 'Apple', model: 'iPhone 11 Pro', type: 'Smartphone' },
            '35364211': { brand: 'Apple', model: 'iPhone 11', type: 'Smartphone' },
            
            // Samsung Galaxy
            '35699110': { brand: 'Samsung', model: 'Galaxy S23 Ultra', type: 'Smartphone' },
            '35699010': { brand: 'Samsung', model: 'Galaxy S23+', type: 'Smartphone' },
            '35698910': { brand: 'Samsung', model: 'Galaxy S23', type: 'Smartphone' },
            '35822510': { brand: 'Samsung', model: 'Galaxy S22 Ultra', type: 'Smartphone' },
            '35822410': { brand: 'Samsung', model: 'Galaxy S22+', type: 'Smartphone' },
            '35822310': { brand: 'Samsung', model: 'Galaxy S22', type: 'Smartphone' },
            '35741810': { brand: 'Samsung', model: 'Galaxy S21 Ultra', type: 'Smartphone' },
            '35741710': { brand: 'Samsung', model: 'Galaxy S21+', type: 'Smartphone' },
            '35741610': { brand: 'Samsung', model: 'Galaxy S21', type: 'Smartphone' },
            '35855010': { brand: 'Samsung', model: 'Galaxy A54', type: 'Smartphone' },
            '35855110': { brand: 'Samsung', model: 'Galaxy A34', type: 'Smartphone' },
            
            // Huawei
            '86891505': { brand: 'Huawei', model: 'P50 Pro', type: 'Smartphone' },
            '86891405': { brand: 'Huawei', model: 'P40 Pro', type: 'Smartphone' },
            '86891305': { brand: 'Huawei', model: 'Mate 40 Pro', type: 'Smartphone' },
            '86891205': { brand: 'Huawei', model: 'Mate 30 Pro', type: 'Smartphone' },
            
            // Xiaomi
            '86478005': { brand: 'Xiaomi', model: 'Mi 13 Pro', type: 'Smartphone' },
            '86477905': { brand: 'Xiaomi', model: 'Mi 12 Pro', type: 'Smartphone' },
            '86477805': { brand: 'Xiaomi', model: 'Redmi Note 12 Pro', type: 'Smartphone' },
            '86477705': { brand: 'Xiaomi', model: 'Redmi Note 11 Pro', type: 'Smartphone' },
            
            // Oppo
            '86856405': { brand: 'Oppo', model: 'Find X5 Pro', type: 'Smartphone' },
            '86856305': { brand: 'Oppo', model: 'Reno 8 Pro', type: 'Smartphone' },
            '86856205': { brand: 'Oppo', model: 'A96', type: 'Smartphone' },
            
            // Vivo
            '86731905': { brand: 'Vivo', model: 'X90 Pro', type: 'Smartphone' },
            '86731805': { brand: 'Vivo', model: 'V27 Pro', type: 'Smartphone' }
        };

        const deviceInfo = tacDatabase[tac];
        
        if (deviceInfo) {
            return {
                brand: deviceInfo.brand,
                model: deviceInfo.model,
                deviceType: deviceInfo.type,
                found: true
            };
        }

        // إذا لم يُعثر على TAC، نحاول تحديد العلامة التجارية من أول رقمين
        const tacPrefix = tac.substring(0, 2);
        let brand = 'غير معروف';
        
        if (tacPrefix === '35') brand = 'Apple أو Samsung';
        else if (tacPrefix === '86') brand = 'Huawei أو Xiaomi أو Oppo';
        else if (tacPrefix === '35' || tacPrefix === '86') brand = 'Android Device';

        return {
            brand: brand,
            model: 'غير معروف - TAC: ' + tac,
            deviceType: 'Smartphone',
            found: false,
            note: 'لم يتم العثور على معلومات مفصلة. للحصول على تقرير كامل، اطلب خدمة التقرير المتقدم.'
        };
    }

    // التحقق من صحة IMEI (Luhn Algorithm)
    validateIMEI(imei) {
        if (!imei || imei.length !== 15) return false;

        let sum = 0;
        let shouldDouble = false;

        for (let i = imei.length - 1; i >= 0; i--) {
            let digit = parseInt(imei.charAt(i));

            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }

            sum += digit;
            shouldDouble = !shouldDouble;
        }

        return (sum % 10) === 0;
    }

    // الحصول على معلومات الخدمة
    async getServiceInfo(serviceId) {
        try {
            const response = await this.makeRequest('serviceinfo', {
                service: serviceId
            });
            return response;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new DhruApiService();
