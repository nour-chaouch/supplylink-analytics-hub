// backend/routes/faostatRoutes.js
const express = require('express');
const router = express.Router();
const { getAvailableCrops, getAvailableCountries, getCropData, getClimateData, getFarmAnalytics } = require('../controllers/faostatController');

router.get('/crops', getAvailableCrops);
router.get('/countries', getAvailableCountries);
router.get('/crop-data/:cropCode', getCropData);
router.get('/climate-data', getClimateData);
router.get('/farm-analytics', getFarmAnalytics);

module.exports = router;