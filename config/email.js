const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

// Send email function
const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✉️  Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Email error:', error);
        throw error;
    }
};

// Email templates
const emailTemplates = {
    orderConfirmation: (order) => `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 25px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ تأكيد الطلب</h1>
                </div>
                <div class="content">
                    <h2>مرحباً ${order.name},</h2>
                    <p>شكراً لك على طلبك! تم استلام طلبك بنجاح وسنبدأ في معالجته قريباً.</p>
                    
                    <div class="order-details">
                        <h3>تفاصيل الطلب:</h3>
                        <p><strong>رقم الطلب:</strong> ${order.orderId}</p>
                        <p><strong>الخدمة:</strong> ${order.service}</p>
                        <p><strong>الباقة:</strong> ${order.package || 'N/A'}</p>
                        <p><strong>التاريخ:</strong> ${new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
                        ${order.price ? `<p><strong>المبلغ:</strong> $${order.price}</p>` : ''}
                    </div>
                    
                    <p>سنتواصل معك خلال 24 ساعة لتأكيد تفاصيل الطلب.</p>
                    
                    <center>
                        <a href="${process.env.FRONTEND_URL}" class="button">زيارة الموقع</a>
                    </center>
                </div>
                <div class="footer">
                    <p>خدمات التقنية © 2025</p>
                    <p>للاستفسار: info@techservices.com</p>
                </div>
            </div>
        </body>
        </html>
    `,

    contactResponse: (data) => `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📧 شكراً لتواصلك معنا</h1>
                </div>
                <div class="content">
                    <h2>مرحباً ${data.name},</h2>
                    <p>تم استلام رسالتك بنجاح. سيقوم فريقنا بالرد عليك في أقرب وقت ممكن.</p>
                    <p>نحن نقدر تواصلك معنا ونعدك بالرد خلال 24 ساعة.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    paymentSuccess: (payment) => `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ تم الدفع بنجاح</h1>
                </div>
                <div class="content">
                    <h2>شكراً لك!</h2>
                    <p>تم استلام دفعتك بنجاح وتأكيد طلبك.</p>
                    
                    <div class="payment-details">
                        <h3>تفاصيل الدفع:</h3>
                        <p><strong>المبلغ:</strong> $${payment.amount}</p>
                        <p><strong>رقم العملية:</strong> ${payment.transactionId}</p>
                        <p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
                    </div>
                    
                    <p>سنبدأ في تنفيذ طلبك فوراً.</p>
                </div>
            </div>
        </body>
        </html>
    `
};

module.exports = { sendEmail, emailTemplates };
