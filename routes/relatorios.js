const express = require('express');
const router = express.Router();
const controller = require('../controllers/relatoriosController');

router.get('/diario', controller.diario);
router.get('/semanal', controller.semanal);
router.get('/mensal', controller.mensal);
router.get('/exportar/pdf', controller.exportarPdf);
router.get('/exportar/excel', controller.exportarExcel);

module.exports = router;
