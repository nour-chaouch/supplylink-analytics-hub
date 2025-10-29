const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createChartConfiguration,
  getMyConfigurations,
  getConfigurationById,
  updateConfiguration,
  deleteConfiguration,
  searchPublicConfigurations,
  generateChartData,
  getIndexFieldsForBuilder,
  duplicateConfiguration
} = require('../controllers/chartConfigurationController');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Récupérer les champs disponibles d'un index (pour le builder)
router.get('/builder/indexes/:indexName/fields', getIndexFieldsForBuilder);

// Routes CRUD pour les configurations
router.route('/')
  .post(createChartConfiguration)      // POST /api/charts - Créer une configuration
  .get(getMyConfigurations);            // GET /api/charts - Mes configurations

// Routes pour les configurations publiques
router.route('/public')
  .get(searchPublicConfigurations);     // GET /api/charts/public?q=search&tags=tag1,tag2

// Routes pour une configuration spécifique
router.route('/:id')
  .get(getConfigurationById)            // GET /api/charts/:id - Récupérer une config
  .put(updateConfiguration)             // PUT /api/charts/:id - Mettre à jour
  .delete(deleteConfiguration);         // DELETE /api/charts/:id - Supprimer

// Dupliquer une configuration
router.route('/:id/duplicate')
  .post(duplicateConfiguration);       // POST /api/charts/:id/duplicate

// Générer les données d'un graphique
router.route('/:id/data')
  .get(generateChartData);              // GET /api/charts/:id/data - Générer les données

module.exports = router;

