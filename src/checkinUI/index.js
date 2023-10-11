const path = require('path');
const router = Express.Router();

router.use('/assets/', Express.static(PATH.join(__UI__, "/assets/")));
router.use('/admin/assets/', Express.static(PATH.join(__UI__, "/assets/")));
router.use('/admin/sw.js', (req, res) => { res.sendFile(__UI__ + '/sw.js'); });
router.use('/admin/*', (req, res) => { res.sendFile(__UI__ + '/index.html'); });
router.use('/sw.js', (req, res) => { res.sendFile(__UI__ + '/sw.js'); })
router.use('/', (req, res) => { res.redirect('/admin'); });

module.exports = router;
