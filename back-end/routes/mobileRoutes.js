const express = require('express');
const { getDashboardSummary, getMobileCustomers, getRecentCollections, downloadSyncData, uploadSyncData } = require('../controllers/mobileController');

const router = express.Router();

router.get('/mobile/dashboard', getDashboardSummary);
router.get('/mobile/customers', getMobileCustomers);
router.get('/mobile/collections/recent', getRecentCollections);

// Offline Sync Routes
router.get('/mobile/sync/download', downloadSyncData);
router.post('/mobile/sync/upload', uploadSyncData);

module.exports = router;
