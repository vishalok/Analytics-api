const express = require('express');
const router = express.Router();
const {
    getTotalSalesOverTime,
    getSalesGrowthRate,
    getNewCustomersOverTime,
    getRepeatCustomers,
    getGeographicalDistribution,
    getCustomerLifetimeValueByCohorts
} = require('../controllers/analytics.controller');

router.get('/total-sales', getTotalSalesOverTime);
router.get('/sales-growth-rate', getSalesGrowthRate);
router.get('/new-customers', getNewCustomersOverTime);
router.get('/repeat-customers', getRepeatCustomers);
router.get('/geographical-distribution', getGeographicalDistribution);
router.get('/customer-lifetime-value', getCustomerLifetimeValueByCohorts);

module.exports = router;
