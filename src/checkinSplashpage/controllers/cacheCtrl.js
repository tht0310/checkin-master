const router = Express.Router();

//Clear All cache.
router.get('/clear', (req, res, next) => {
    try {
        Cache.clearAll((err, result) => {
            if (err) logger.error(err)

            logger.info("[Clear All Cache By User]");
            return res.send("<h1>Thank You For Destroying Me.</h1><br/><h1>-- Cache --</h1>");
        })
    }
    catch (err) {
        logger.error(err);
        return res.send("Error when remove cache");
    }
})

//Clear cache by keyword
router.get('/clear/:key', (req, res, next) => {
    try {
        var key = req.params.key.replace(CONF.CACHE_PREFIX, '');
        Cache.clear(key, (err, result) => {
            if (err) logger.error(err)

            logger.info("[Clear Cache By User]");
            return res.send("<h1>Thank You For Destroying Me.</h1><br/><h1>-- Cache --</h1>");
        })
    }
    catch (err) {
        logger.error(err);
        return res.send("Error when remove cache");
    }
})

//Clear cache by prefix of keyword
router.get('/clearByPrefix/:key', (req, res, next) => {
    try {
        var key = req.params.key.replace(CONF.CACHE_PREFIX, '');
        Cache.clearByPrefix(key, "", (err, result) => {
            if (err) logger.error(err)

            logger.info("[Clear Key Cache By User]");
            return res.send("<h1>Thank You For Destroying Me.</h1><br/><h1>-- Cache --</h1>");
        });
    } catch (err) {
        logger.error(err);
        return res.send("Error when remove cache");
    }
})

//Clear cache ap
router.get('/clearAP/:key', (req, res, next) => {
    try {
        var key = req.params.key
        Cache.set(AP, key, null, (err, result) => {
            if (err) logger.error(err);

            logger.info("[Clear Key Cache By User]");
            return res.send("<h1>Thank You For Destroying Me.</h1><br/><h1>-- Cache --</h1>");
        });
    } catch (err) {
        logger.error(err);
        return res.send("Error when remove cache");
    }
})

//Get cache ap
router.get('/getAP/:key', (req, res, next) => {
    try {
        var key = req.params.key;
        logger.info(key);
        Cache.getRaw("AccessPoint", key, (err, result) => {
            if (err) return res.send("ERROR");
            return res.send("DATA: " + (JSON.stringify(result) || "NULL"));
        });
    } catch (err) {
        logger.error(err);
        return res.send("ERROR");
    }
})

//Get cache by keyword
router.get('/get/:key', (req, res) => {
    try {
        var key = req.params.key.replace(CONF.CACHE_PREFIX, '');
        logger.info(key);
        Cache.get(key, '', (err, result) => {
            if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            return res.send(result);
        });
        return;
    } catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
})

//Get cache by prefix of keyword
router.get('/getByPrefix/:key', (req, res) => {
    try {
        var key = req.params.key.replace(CONF.CACHE_PREFIX, '');
        logger.info(key);
        Cache.getByPrefix(key, (err, result) => {
            if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            return res.send(result);
        });
        return;
    } catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
})

//Logoff user session hotspot by mac client
router.get('/logoff/:mac_device', (req, res, next) => {
    try {
        if (Util.isMAC(req.params.mac_device)) {
            var key = req.params.mac_device.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();
            Cache.clearSession(key, (err, result) => {
                if (err) logger.error(err)

                logger.info("[Clear Key Cache By User]");
                return res.send("<h1>Thank You For Destroying Me.</h1><br/><h1>-- Cache --</h1>");
            });
        }
        else {
            logger.info("[Mac Invalid]");
            return res.send("<h1>Mac Invalid.</h1><br/><h1>-- Cache --</h1>");
        }
    } catch (err) {
        logger.error(err);
        return res.send("Error when remove cache");
    }
})

//Logoff user session hotspot by mac client
router.get('/status/:mac_device', (req, res, next) => {
    try {
        var key = req.params.mac_device.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();
        logger.info(key);
        Cache.getSession(key, (err, result) => {
            if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            return res.send(result);
        });
        return;
    } catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
})

module.exports = router;