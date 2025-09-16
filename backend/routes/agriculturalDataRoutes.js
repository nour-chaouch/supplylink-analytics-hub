const express = require('express');
const router = express.Router();
const ProducerPriceService = require('../services/ProducerPriceService');
const CropsLivestockService = require('../services/CropsLivestockService');

const producerPriceService = new ProducerPriceService();
const cropsLivestockService = new CropsLivestockService();

// Get all producer prices with optional filters
router.get('/producer-prices', async (req, res) => {
  try {
    const { area, item, year, domainCode, limit = 50, page = 1 } = req.query;
    
    const filters = {};
    if (area) filters.area = area;
    if (item) filters.item = item;
    if (year) filters.year = year;
    if (domainCode) filters.domainCode = domainCode;

    const result = await producerPriceService.getProducerPrices(filters, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all crops and livestock data with optional filters
router.get('/crops-livestock', async (req, res) => {
  try {
    const { area, item, year, domainCode, element, limit = 50, page = 1 } = req.query;
    
    const filters = {};
    if (area) filters.area = area;
    if (item) filters.item = item;
    if (year) filters.year = year;
    if (domainCode) filters.domainCode = domainCode;
    if (element) filters.element = element;

    const result = await cropsLivestockService.getCropsLivestock(filters, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search across both datasets
router.get('/search', async (req, res) => {
  try {
    const { query, domainCode, area, year, limit = 50, page = 1 } = req.query;
    
    const filters = {};
    if (domainCode) filters.domainCode = domainCode;
    if (area) filters.area = area;
    if (year) filters.year = year;

    // Search in both collections
    const [producerPrices, cropsLivestock] = await Promise.all([
      producerPriceService.searchProducerPrices(query, filters),
      cropsLivestockService.searchCropsLivestock(query, filters)
    ]);

    // Combine and sort results
    const combinedData = [...producerPrices, ...cropsLivestock]
      .sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: combinedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: combinedData.length,
        pages: Math.ceil(combinedData.length / parseInt(limit))
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
    
    const filters = {};
    if (domainCode) filters.domainCode = domainCode;
    if (area) filters.area = area;
    if (year) filters.year = year;

    // Get aggregated data from both services
    const [producerPricesStats, cropsLivestockStats] = await Promise.all([
      producerPriceService.getAnalytics(filters),
      cropsLivestockService.getAnalytics(filters)
    ]);

    res.json({
      success: true,
      data: {
        producerPrices: producerPricesStats,
        cropsLivestock: cropsLivestockStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get filter options
router.get('/filters', async (req, res) => {
  try {
    const [producerFilters, cropsFilters] = await Promise.all([
      producerPriceService.getFilterOptions(),
      cropsLivestockService.getFilterOptions()
    ]);

    // Combine and deduplicate filter options
    const allAreas = [...new Set([...producerFilters.areas, ...cropsFilters.areas])].sort();
    const allItems = [...new Set([...producerFilters.items, ...cropsFilters.items])].sort();
    const allYears = [...new Set([...producerFilters.years, ...cropsFilters.years])].sort((a, b) => b - a);
    const allDomainCodes = [...new Set([...producerFilters.domainCodes, ...cropsFilters.domainCodes])].sort();
    const allElements = [...new Set([...cropsFilters.elements])].sort();

    res.json({
      success: true,
      data: {
        areas: allAreas,
        items: allItems,
        years: allYears,
        domainCodes: allDomainCodes,
        elements: allElements
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;









