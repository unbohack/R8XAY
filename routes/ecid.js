const express = require('express');
const router = express.Router();
const { loadRecords, saveRecords, findRecord, removeRecord, normalizeEcid } = require('../utils/ecidStorage');
const { sendEcidTelegramNotification } = require('../services/telegram');

let ecidRecords = loadRecords();

router.post('/register', (req, res) => {
    try {
        const { ecid, deviceModel, customerName, phone, notes, deviceInfo } = req.body;

        if (!ecid) {
            return res.status(400).json({
                success: false,
                message: 'الرجاء إدخال ECID'
            });
        }

        const existingRecord = findRecord(ecidRecords, ecid);

        if (existingRecord) {
            return res.status(200).json({
                success: true,
                alreadyRegistered: true,
                message: 'ECID already registered',
                data: existingRecord,
                debug: {
                    received: ecid,
                    normalized: normalizeEcid(ecid)
                }
            });
        }

        const record = {
            id: `ECID-${Date.now()}`,
            ecid,
            deviceModel: deviceModel || deviceInfo?.deviceModel || 'غير محدد',
            customerName: customerName || 'غير محدد',
            phone: phone || 'غير محدد',
            notes: notes || '',
            deviceInfo: deviceInfo || null,
            createdAt: new Date().toISOString()
        };

        ecidRecords = [...ecidRecords, record];
        saveRecords(ecidRecords);

        sendEcidTelegramNotification(record).catch(() => {});

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
    ecidRecords = loadRecords();
    const existingRecord = findRecord(ecidRecords, req.params.ecid);

    res.json({
        success: true,
        exists: !!existingRecord,
        message: existingRecord ? 'ECID already registered' : 'ECID not registered',
        data: existingRecord || null,
        debug: {
            received: req.params.ecid,
            normalized: normalizeEcid(req.params.ecid)
        }
    });
});

router.get('/records', (req, res) => {
    ecidRecords = loadRecords();
    res.json({
        success: true,
        count: ecidRecords.length,
        records: ecidRecords
    });
});

router.delete('/:id', (req, res) => {
    try {
        ecidRecords = loadRecords();
        const recordId = req.params.id;
        const nextRecords = removeRecord(ecidRecords, recordId);

        if (nextRecords.length === ecidRecords.length) {
            return res.status(404).json({
                success: false,
                message: 'السجل غير موجود'
            });
        }

        ecidRecords = nextRecords;
        saveRecords(ecidRecords);

        res.json({
            success: true,
            message: 'تم حذف السجل بنجاح'
        });
    } catch (error) {
        console.error('ECID delete error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء حذف السجل'
        });
    }
});

module.exports = router;
