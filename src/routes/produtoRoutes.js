const router = require('express').Router();
const c = require('../controllers/produtoController');
const { autenticar, somenteAdmin } = require('../middlewares/auth');

router.get('/', c.listar);                                  // público
router.post('/', autenticar, somenteAdmin, c.criar);
router.put('/:id', autenticar, somenteAdmin, c.atualizar);
router.delete('/:id', autenticar, somenteAdmin, c.remover);

module.exports = router;
