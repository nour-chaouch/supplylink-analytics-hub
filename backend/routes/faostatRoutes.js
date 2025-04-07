// backend/routes/faostatRoutes.js
const express = require('express');
const router = express.Router();
const { getAvailableCrops, getAvailableCountries, getCropData } = require('../controllers/faostatController');

router.get('/crops', getAvailableCrops);
router.get('/countries', getAvailableCountries);
router.get('/crop-data/:cropCode', getCropData);

module.exports = router;