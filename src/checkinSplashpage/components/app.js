const path = require('path');
const router = Express.Router();

router.use(require("cors")());
router.use(require("body-parser").json({ limit: "50mb" }));
router.use(require("body-parser").urlencoded({ limit: "50mb", extended: true, parameterLimit: 1000000 }));
router.use(require("cookie-parser")());

router.use('/assets/', Express.static(path.join(__SP__, '/public/assets')));
router.use('/public/', Express.static(path.join(__, "../checkin-media")));
router.use('/media/', Express.static(path.join(__, "../checkin-media/")));
router.use('/exmedia/', Express.static(path.join(__, "../checkin-media/exmedia/")));

//Define routes
router.use('/', require(__SP__ + '/controllers/splashCtrl'));
router.use('/', require(__SP__ + '/controllers/redirectCtrl'));

router.use('/', require(__SP__ + '/controllers/ap/openmeshCtrl'));
router.use('/', require(__SP__ + '/controllers/ap/unifiCtrl'));
router.use('/', require(__SP__ + '/controllers/ap/tplinkCtrl'));
router.use('/', require(__SP__ + '/controllers/ap/wifidogCtrl'));

router.use('/', require(__SP__ + '/controllers/profileCtrl'));
router.use('/', require(__SP__ + '/controllers/debugCtrl'));
router.use('/log/', require(__SP__ + '/controllers/logCtrl'));
router.use('/cache', require(__SP__ + '/controllers/cacheCtrl'));
router.use('/checkin/', require(__SP__ + '/controllers/checkinCtrl'));

module.exports = router;