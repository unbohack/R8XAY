# 🚀 دليل التشغيل السريع

## ✅ تم بنجاح!

تم تطوير السيرفر بنجاح بجميع المميزات المتقدمة! 

## 📋 المميزات المضافة:

### 1. ✅ قاعدة بيانات MongoDB
- Models: User, Order, Payment, Contact, ChatMessage
- علاقات بين الجداول
- حفظ دائم للبيانات

### 2. ✅ نظام المصادقة JWT
- تسجيل دخول آمن
- JWT Authentication
- حماية API routes
- صلاحيات (admin/user)

### 3. ✅ إشعارات البريد Nodemailer
- إيميلات تلقائية للعملاء
- تأكيد الطلبات
- تأكيد المدفوعات
- قوالب HTML جاهزة

### 4. ✅ لوحة تحكم Admin كاملة
- إدارة الطلبات
- إدارة المدفوعات
- الرد على الرسائل
- إحصائيات مفصلة
- Dashboard جميل

### 5. ✅ نظام الدفع Stripe
- Create payment intents
- Confirm payments
- Refunds
- Webhooks support

### 6. ✅ Socket.IO للدردشة
- دردشة مباشرة
- إشعارات فورية
- Real-time updates
- تاريخ المحادثات

## 🔧 خطوات التشغيل:

### الخطوة 1: تثبيت MongoDB

**على macOS:**
```bash
# إذا لم يكن مثبت
brew tap mongodb/brew
brew install mongodb-community

# تشغيل MongoDB
brew services start mongodb-community
```

**على Linux:**
```bash
sudo systemctl start mongod
```

**على Windows:**
```bash
# ابحث عن MongoDB Compass وشغله
# أو استخدم MongoDB Atlas (سحابي)
```

**أو استخدم MongoDB Atlas (مجاني):**
1. افتح https://www.mongodb.com/cloud/atlas
2. سجل حساب جديد
3. أنشئ Cluster مجاني
4. احصل على Connection String
5. ضعه في ملف .env

### الخطوة 2: إنشاء مستخدم Admin

```bash
cd /Users/ayoub/Desktop/service
npm run seed
```

### الخطوة 3: تشغيل السيرفر

```bash
npm start
```

## 🌐 الوصول للموقع:

**الموقع الرئيسي:**
```
http://localhost:3000
```

**لوحة التحكم Admin:**
```
http://localhost:3000/admin
```

**بيانات الدخول:**
- Email: `admin@techservices.com`
- Password: `Admin@123456`

## 📧 إعداد البريد الإلكتروني:

عدّل ملف `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

**للحصول على Gmail App Password:**
1. https://myaccount.google.com/
2. Security → 2-Step Verification
3. App passwords → Generate

## 💳 إعداد Stripe:

1. افتح https://dashboard.stripe.com/
2. Developers → API keys
3. انسخ المفاتيح إلى `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📁 الملفات المهمة:

### Backend:
- `server.js` - السيرفر الرئيسي مع Socket.IO
- `config/database.js` - اتصال MongoDB
- `config/email.js` - إعدادات البريد
- `models/` - نماذج قاعدة البيانات
- `routes/` - API endpoints
- `middleware/` - المصادقة والحماية

### Admin Panel:
- `admin/index.html` - لوحة التحكم
- `admin/admin-style.css` - التصميم
- `admin/admin-script.js` - الوظائف

### Scripts:
- `scripts/seed.js` - إنشاء admin user

## 🔌 API Endpoints:

### Authentication:
- POST `/api/auth/register` - تسجيل
- POST `/api/auth/login` - تسجيل دخول
- GET `/api/auth/me` - معلومات المستخدم
- GET `/api/auth/logout` - تسجيل خروج

### Orders:
- POST `/api/orders` - طلب جديد
- GET `/api/orders` - جميع الطلبات (Admin)
- GET `/api/orders/:id` - طلب محدد
- PUT `/api/orders/:id/status` - تحديث حالة (Admin)
- GET `/api/orders/stats/overview` - إحصائيات (Admin)

### Payments:
- POST `/api/payments/create-intent` - إنشاء دفعة
- POST `/api/payments/confirm` - تأكيد دفعة
- POST `/api/payments/:id/refund` - استرداد (Admin)

### Contact:
- POST `/api/contact` - رسالة جديدة
- GET `/api/contact` - جميع الرسائل (Admin)
- PUT `/api/contact/:id/reply` - رد (Admin)

## 🔒 الأمان:

- ✅ Helmet.js
- ✅ Rate Limiting
- ✅ JWT Authentication
- ✅ Bcrypt Password Hashing
- ✅ CORS Protection
- ✅ Input Validation
- ✅ Error Handling

## ⚠️ ملاحظات مهمة:

1. **قبل الإنتاج:**
   - غيّر JWT_SECRET
   - غيّر كلمة مرور Admin
   - استخدم HTTPS
   - استخدم MongoDB Atlas
   - راجع جميع الإعدادات

2. **MongoDB:**
   - يجب أن يكون MongoDB شغال
   - النسخ الاحتياطي مهم!

3. **Stripe:**
   - استخدم Test keys في التطوير
   - Live keys في الإنتاج فقط

## 🎉 كلشي جاهز!

السيرفر دابا فيه:
- ✅ MongoDB
- ✅ JWT Auth
- ✅ Nodemailer
- ✅ Admin Dashboard
- ✅ Stripe Payments
- ✅ Socket.IO Chat
- ✅ Rate Limiting
- ✅ Error Handling

---

Made with ❤️ في المغرب
