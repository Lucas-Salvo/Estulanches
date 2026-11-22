const router = require('express').Router();
const c = require('../controllers/pedidoController');
const { autenticar, somenteAdmin } = require('../middlewares/auth');

router.post('/', autenticar, c.criar);
router.get('/', autenticar, c.listar);
router.patch('/:id/status', autenticar, somenteAdmin, c.atualizarStatus);

module.exports = router;
