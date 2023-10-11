const router = Express.Router();

//Welcome page for Access Point Tp-Link
router.get("/redirect/tplink/", (req, res, next) => {

    //Get agrument from URL query string
    var arg = req.query || {};

    var mac_ap = arg.ap_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
    var mac_device = arg.client_mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';

    //Format Mac Address from ':' to '-'
    mac_ap = mac_ap.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();
    mac_device = mac_device.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();

    //Cached in Process.js
    Cache.get("landingPage", { mac_device: mac_device }, (err, landingPage) => {
        if (err) logger.error(err)
        logger.info("lp", landingPage);
        if (landingPage) {
            // Cache.clearByPrefix("landingPage", { mac_device: mac_device }, (err, result) => {
            //     if (err) logger.error(err)
            // })

            return res.redirect(landingPage);
        }
        else {
            flag = true;
            return res.redirect(CONF.LANDINGPAGE);
        }
    })
})

module.exports = router;