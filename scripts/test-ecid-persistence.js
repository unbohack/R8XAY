const assert = require('assert');
const fs = require('fs');
const path = require('path');

const storageFile = path.join(__dirname, '..', 'data', 'ecid-records.json');

if (fs.existsSync(storageFile)) {
    fs.unlinkSync(storageFile);
}

const storage = require('../utils/ecidStorage');

const record = {
    id: 'ECID-test',
    ecid: 'ABC123',
    deviceModel: 'iPhone',
    customerName: 'Test User',
    phone: '0000000000',
    notes: '',
    createdAt: new Date().toISOString()
};

storage.saveRecords([record]);
const reloadedStorage = require('../utils/ecidStorage');
const found = reloadedStorage.findRecord(reloadedStorage.loadRecords(), 'abc123');
const prefixedMatch = reloadedStorage.findRecord(reloadedStorage.loadRecords(), '0xabc123');

assert(found, 'Expected ECID record to be found after reloading storage');
assert.strictEqual(found.ecid, 'ABC123');
assert(prefixedMatch, 'Expected ECID lookup to match the same value even when prefixed with 0x');
console.log('ECID persistence test passed');
