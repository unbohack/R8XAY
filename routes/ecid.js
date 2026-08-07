const express = require('express');
const router = express.Router();

// Simple in-memory storage for ECID registrations
const ecidRecords = [];

router.post('/register', (req, res) => {
    try {
        const { ecid, deviceModel, customerName, phone, notes } = req.body;

        if (!ecid) {
            return res.status(400).json({
                success: false,
                message: 'الرجاء إدخال ECID'
            });
        }

        const record = {
            id: `ECID-${Date.now()}`,
            ecid,
            deviceModel: deviceModel || 'غير محدد',
            customerName: customerName || 'غير محدد',
            phone: phone || 'غير محدد',
            notes: notes || '',
            createdAt: new Date().toISOString()
        };

        ecidRecords.push(record);

        res.json({
            success: true,
            message: 'تم تسجيل ECID بنجاح',
            recordId: record.id,
            data: record
        });
    } catch (error) {
        console.error('ECID registration error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء حفظ ECID'
        });
    }
});

router.get('/records', (req, res) => {
    res.json({
        success: true,
        count: ecidRecords.length,
        records: ecidRecords
    });
});

module.exports = router;
