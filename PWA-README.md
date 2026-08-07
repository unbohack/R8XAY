# 🚀 Tech Services - Full Stack Platform

## 📱 المميزات الجديدة

### 🌍 تعدد اللغات (i18n)
- ✅ العربية (الافتراضي)
- ✅ الإنجليزية
- ✅ الفرنسية
- تبديل فوري بين اللغات
- حفظ تلقائي للغة المختارة
- دعم RTL/LTR

### 📱 Progressive Web App (PWA)
- ✅ تثبيت التطبيق على الجهاز
- ✅ يعمل بدون إنترنت (Offline)
- ✅ Service Worker للتخزين المؤقت
- ✅ إشعارات Push Notifications
- ✅ تجربة تطبيق أصلي
- ✅ أيقونات متعددة الأحجام
- ✅ Splash screen مخصص

## 🎯 الخدمات المتوفرة

### الخدمات الأساسية:
1. **Server Service** - إدارة السيرفرات
2. **IMEI Service** - خدمات IMEI
3. **Remote Service** - الدعم عن بعد

### الخدمات الجديدة:
4. **🔓 فتح الأجهزة** - iPhone, Samsung, Huawei
5. **🎮 بطاقات الألعاب** - PlayStation, Xbox, Steam
6. **💳 البطاقات الرقمية** - iTunes, Google Play, Amazon, Netflix, Spotify
7. **📞 شحن رصيد الهاتف** - Maroc Telecom, Orange, Inwi
8. **🛡️ خدمات الحماية** - Antivirus & VPN

## 🛠️ التقنيات المستخدمة

### Frontend:
- HTML5, CSS3, JavaScript ES6+
- Progressive Web App (PWA)
- Service Worker
- i18n (Internationalization)
- Responsive Design
- Font Awesome Icons

### Backend:
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.io (Real-time)
- JWT Authentication
- Stripe Payments
- Nodemailer (Email)

### Security:
- Helmet.js
- Rate Limiting
- CORS Protection
- Input Validation
- Bcrypt Password Hashing

## 🚀 التثبيت والتشغيل

### المتطلبات:
```bash
Node.js v16+
npm v8+
MongoDB Atlas account
```

### خطوات التشغيل:

1. **Clone المشروع:**
```bash
git clone <repository-url>
cd service
```

2. **تثبيت Dependencies:**
```bash
npm install
```

3. **إعداد Environment Variables:**
```bash
# انسخ .env وعدل القيم
cp .env.example .env
```

في ملف `.env`:
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tech-services

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Server
PORT=3000
NODE_ENV=development
```

4. **إنشاء Admin User:**
```bash
npm run seed
```

بيانات الدخول الافتراضية:
- Email: `admin@techservices.com`
- Password: `Admin@123456`

5. **تشغيل السيرفر:**
```bash
npm start
# أو للتطوير:
npm run dev
```

## 🌐 الوصول للتطبيق

- **الموقع الرئيسي:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **API Docs:** http://localhost:3000/api

## 📱 تثبيت PWA

### على المتصفح:
1. افتح الموقع في Chrome/Edge/Safari
2. انقر على أيقونة التثبيت في شريط العنوان
3. أو اضغط على زر "تثبيت التطبيق" في الصفحة

### على الموبايل:
1. افتح الموقع في Safari (iOS) أو Chrome (Android)
2. iOS: اضغط على زر المشاركة → "إضافة إلى الشاشة الرئيسية"
3. Android: اضغط على "تثبيت التطبيق" من القائمة

## 🌍 تغيير اللغة

استخدم القائمة المنسدلة في أعلى الصفحة:
- العربية (الافتراضي)
- English
- Français

اللغة يتم حفظها تلقائياً في localStorage

## 📂 هيكل المشروع

```
service/
├── admin/              # Admin dashboard
│   ├── index.html
│   ├── admin-style.css
│   └── admin-script.js
├── css/                # Stylesheets
│   ├── style.css
│   └── services.css
├── js/                 # JavaScript files
│   ├── main.js
│   ├── i18n.js        # Translations
│   └── services.js
├── pages/              # Service pages
│   ├── server.html
│   ├── imei.html
│   ├── remote.html
│   ├── unlock.html
│   ├── gaming.html
│   ├── cards.html
│   ├── telecom.html
│   └── security.html
├── config/             # Configuration
│   ├── database.js
│   └── email.js
├── models/             # Mongoose models
│   ├── User.js
│   ├── Order.js
│   ├── Payment.js
│   ├── Contact.js
│   └── ChatMessage.js
├── routes/             # API routes
│   ├── auth.js
│   ├── orders.js
│   ├── payments.js
│   └── contact.js
├── middleware/         # Middleware
│   ├── auth.js
│   ├── rateLimiter.js
│   └── error.js
├── scripts/            # Utility scripts
│   └── seed.js
├── index.html          # Main page
├── offline.html        # Offline page
├── manifest.json       # PWA manifest
├── service-worker.js   # Service worker
├── server.js           # Main server
├── package.json
└── .env               # Environment variables
```

## 🔑 API Endpoints

### Authentication:
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/me` - معلومات المستخدم الحالي
- `GET /api/auth/logout` - تسجيل الخروج

### Orders:
- `POST /api/orders` - إنشاء طلب جديد
- `GET /api/orders` - جميع الطلبات (Admin)
- `GET /api/orders/:id` - طلب محدد
- `PUT /api/orders/:id/status` - تحديث حالة الطلب
- `GET /api/orders/stats/overview` - إحصائيات

### Payments:
- `POST /api/payments/create-intent` - إنشاء دفعة Stripe
- `POST /api/payments/confirm` - تأكيد الدفعة
- `POST /api/payments/:id/refund` - استرداد (Admin)

### Contact:
- `POST /api/contact` - إرسال رسالة
- `GET /api/contact` - جميع الرسائل (Admin)
- `PUT /api/contact/:id/reply` - الرد على رسالة

## 🔒 الأمان

- ✅ HTTPS (Production)
- ✅ Helmet.js للحماية من الهجمات
- ✅ Rate Limiting (100 req/15min)
- ✅ JWT Authentication
- ✅ Password Hashing (Bcrypt)
- ✅ CORS Protection
- ✅ Input Validation
- ✅ XSS Protection
- ✅ CSRF Protection

## 📊 الإحصائيات

- 8 خدمات مختلفة
- 3 لغات مدعومة
- PWA كامل الميزات
- Offline Support
- Real-time Chat
- Payment Gateway
- Email Notifications

## 🎨 التخصيص

### الألوان:
عدّل `css/style.css`:
```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #8b5cf6;
    --accent-color: #ec4899;
}
```

### الترجمات:
عدّل `js/i18n.js`:
```javascript
const translations = {
    ar: { ... },
    en: { ... },
    fr: { ... }
};
```

## 🐛 المشاكل الشائعة

### MongoDB Connection Failed:
```bash
# تحقق من:
1. MONGODB_URI صحيح في .env
2. IP Address مضاف في MongoDB Atlas Network Access
3. Username & Password صحيحان
```

### PWA لا يظهر زر التثبيت:
```bash
# تأكد من:
1. HTTPS (أو localhost)
2. manifest.json موجود
3. service-worker.js مسجل
4. أيقونات موجودة
```

### اللغة لا تتغير:
```bash
# تحقق من:
1. js/i18n.js محمل
2. data-i18n موجود في العناصر
3. localStorage يعمل
```

## 📝 الترخيص

© 2024 Tech Services. All rights reserved.

## 👨‍💻 المطور

Made with ❤️ in Morocco

## 🤝 المساهمة

المساهمات مرحب بها! افتح Pull Request أو Issue.

## 📞 الدعم

- Email: info@techservices.com
- Website: http://localhost:3000
- Admin: http://localhost:3000/admin

---

**ملاحظة:** هذا مشروع كامل full-stack مع جميع المميزات الحديثة!
