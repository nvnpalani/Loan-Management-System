const express = require('express');
const { login, getDashboard } = require('../controllers/customerAppController');

const router = express.Router();

router.post('/customer-app/login', login);
router.get('/customer-app/dashboard/:customerId', getDashboard);

module.exports = router;
