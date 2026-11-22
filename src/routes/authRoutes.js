const router = require('express').Router();
const c = require('../controllers/authController');
const { autenticar } = require('../middlewares/auth');

router.post('/register', c.registrar);
router.post('/login', c.login);
router.post('/logout', c.logout);
router.get('/me', autenticar, c.me);

module.exports = router;
