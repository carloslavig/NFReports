const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboardController');

router.get('/resumo', controller.resumo);
router.get('/produtividade', controller.produtividade);
router.get('/distribuicao', controller.distribuicao);
router.get('/evolucao', controller.evolucao);

module.exports = router;
