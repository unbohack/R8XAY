const fs = require('fs');
const path = require('path');

const storageFile = path.join(__dirname, '..', 'data', 'ecid-records.json');

const ensureDirectory = () => {
    const dir = path.dirname(storageFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const loadRecords = () => {
    ensureDirectory();
    if (!fs.existsSync(storageFile)) {
        return [];
    }

    try {
        const raw = fs.readFileSync(storageFile, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const saveRecords = (records) => {
    ensureDirectory();
    fs.writeFileSync(storageFile, JSON.stringify(records, null, 2));
    return records;
};

const normalizeEcid = (value) => {
    if (value === null || value === undefined) return '';

    const text = value.toString().trim().toLowerCase();
    const withoutPrefix = text.startsWith('0x') ? text.slice(2) : text;
    return withoutPrefix.replace(/\s+/g, '');
};

const findRecord = (records, ecid) => {
    const normalizedEcid = normalizeEcid(ecid);
    return records.find(record => normalizeEcid(record.ecid) === normalizedEcid) || null;
};

module.exports = {
    loadRecords,
    saveRecords,
    findRecord,
    normalizeEcid
};
