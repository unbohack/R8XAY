const express = require('express');
const router = express.Router();

// Simple in-memory storage for ECID registrations
const ecidRecords = [];

const normalizeEcid = (value) => (value || '').toString().trim().toLowerCase();

router.post('/register', (req, res) => {
    try {
        const { ecid, deviceModel, customerName, phone, notes } = req.body;

        if (!ecid) {
            return res.status(400).json({
                success: false,
                message: 'الرجاء إدخال ECID'
            });
        }

        const normalizedEcid = normalizeEcid(ecid);
        const existingRecord = ecidRecords.find(record => normalizeEcid(record.ecid) === normalizedEcid);

        if (existingRecord) {
            return res.status(200).json({
                success: true,
                alreadyRegistered: true,
                message: 'ECID already registered',
                data: existingRecord
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
            alreadyRegistered: false,
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

router.get('/check/:ecid', (req, res) => {
    const normalizedEcid = normalizeEcid(req.params.ecid);
    const existingRecord = ecidRecords.find(record => normalizeEcid(record.ecid) === normalizedEcid);

    res.json({
        success: true,
        exists: !!existingRecord,
        message: existingRecord ? 'ECID already registered' : 'ECID not registered',
        data: existingRecord || null
    });
});

router.get('/records', (req, res) => {
    res.json({
        success: true,
        count: ecidRecords.length,
        records: ecidRecords
    });
});

module.exports = router;
