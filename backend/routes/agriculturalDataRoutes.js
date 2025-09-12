const express = require('express');
const router = express.Router();
const ProducerPrice = require('../models/ProducerPrice');
const CropsLivestock = require('../models/CropsLivestock');

// Get all producer prices with optional filters
router.get('/producer-prices', async (req, res) => {
  try {
    const { area, item, year, domainCode, limit = 50, page = 1 } = req.query;
    
    const filter = {};
    if (area) filter.area = new RegExp(area, 'i');
    if (item) filter.item = new RegExp(item, 'i');
    if (year) filter.year = parseInt(year);
    if (domainCode) filter.domainCode = domainCode;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const data = await ProducerPrice.find(filter)
      .sort({ year: -1, scrapedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await ProducerPrice.countDocuments(filter);

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all crops and livestock data with optional filters
router.get('/crops-livestock', async (req, res) => {
  try {
    const { area, item, year, domainCode, limit = 50, page = 1 } = req.query;
    
    const filter = {};
    if (area) filter.area = new RegExp(area, 'i');
    if (item) filter.item = new RegExp(item, 'i');
    if (year) filter.year = parseInt(year);
    if (domainCode) filter.domainCode = domainCode;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const data = await CropsLivestock.find(filter)
      .sort({ year: -1, scrapedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await CropsLivestock.countDocuments(filter);

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search across both datasets
router.get('/search', async (req, res) => {
  try {
    const { query, domainCode, area, year, limit = 50, page = 1 } = req.query;
    
    const filter = {};
    if (query) {
      filter.$or = [
        { item: new RegExp(query, 'i') },
        { area: new RegExp(query, 'i') },
        { element: new RegExp(query, 'i') }
      ];
    }
    if (domainCode) filter.domainCode = domainCode;
    if (area) filter.area = new RegExp(area, 'i');
    if (year) filter.year = parseInt(year);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Search in both collections
    const [producerPrices, cropsLivestock] = await Promise.all([
      ProducerPrice.find(filter)
        .sort({ year: -1, scrapedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      CropsLivestock.find(filter)
        .sort({ year: -1, scrapedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
    ]);

    // Combine and sort results
    const combinedData = [...producerPrices, ...cropsLivestock]
      .sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt))
      .slice(0, parseInt(limit));

    const total = await Promise.all([
      ProducerPrice.countDocuments(filter),
      CropsLivestock.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: combinedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0] + total[1],
        pages: Math.ceil((total[0] + total[1]) / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { domainCode, area, year } = req.query;
    
    const filter = {};
    if (domainCode) filter.domainCode = domainCode;
    if (area) filter.area = new RegExp(area, 'i');
    if (year) filter.year = parseInt(year);

    // Get aggregated data
    const [producerPricesStats, cropsLivestockStats] = await Promise.all([
      ProducerPrice.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            avgValue: { $avg: '$value' },
            minValue: { $min: '$value' },
            maxValue: { $max: '$value' },
            uniqueAreas: { $addToSet: '$area' },
            uniqueItems: { $addToSet: '$item' },
            yearRange: { $addToSet: '$year' }
          }
        }
      ]),
      CropsLivestock.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            avgValue: { $avg: '$value' },
            minValue: { $min: '$value' },
            maxValue: { $max: '$value' },
            uniqueAreas: { $addToSet: '$area' },
            uniqueItems: { $addToSet: '$item' },
            yearRange: { $addToSet: '$year' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        producerPrices: producerPricesStats[0] || {
          totalRecords: 0,
          avgValue: 0,
          minValue: 0,
          maxValue: 0,
          uniqueAreas: [],
          uniqueItems: [],
          yearRange: []
        },
        cropsLivestock: cropsLivestockStats[0] || {
          totalRecords: 0,
          avgValue: 0,
          minValue: 0,
          maxValue: 0,
          uniqueAreas: [],
          uniqueItems: [],
          yearRange: []
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unique values for filters
router.get('/filters', async (req, res) => {
  try {
    const [areas, items, years, domainCodes] = await Promise.all([
      ProducerPrice.distinct('area'),
      ProducerPrice.distinct('item'),
      ProducerPrice.distinct('year'),
      ProducerPrice.distinct('domainCode')
    ]);

    const [cropsAreas, cropsItems, cropsYears, cropsDomainCodes] = await Promise.all([
      CropsLivestock.distinct('area'),
      CropsLivestock.distinct('item'),
      CropsLivestock.distinct('year'),
      CropsLivestock.distinct('domainCode')
    ]);

    // Combine and deduplicate
    const allAreas = [...new Set([...areas, ...cropsAreas])].sort();
    const allItems = [...new Set([...items, ...cropsItems])].sort();
    const allYears = [...new Set([...years, ...cropsYears])].sort((a, b) => b - a);
    const allDomainCodes = [...new Set([...domainCodes, ...cropsDomainCodes])].sort();

    res.json({
      success: true,
      data: {
        areas: allAreas,
        items: allItems,
        years: allYears,
        domainCodes: allDomainCodes
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;







