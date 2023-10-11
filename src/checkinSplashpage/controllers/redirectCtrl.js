//Redirect to dynamic landingpage. 
const router = Express.Router();

var getLandingPage = (mac_device, callback) => {
    //Format Mac Address from ':' to '-'
    mac_device = mac_device.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();

    //Cached in when request "/setpage"
    Cache.get("landingPage", { mac_device: mac_device }, (err, landingPage) => {
        if (err) logger.error(err);

        if (landingPage) {
            logger.info("landingPage[" + mac_device + "] =", landingPage);
            return callback(landingPage);
        }

        logger.info("landingPage[" + mac_device + "] = " + CONF.LANDINGPAGE);
        return callback(CONF.LANDINGPAGE);
    })
}

//For chilli openmesh and relay2 beacause they used same core controller.
router.get("/redirect/:type_ap(chilli|openmesh|relay2|peplink)", (req, res, next) => {

    //Get agrument from URL query string
    var arg = req.query || {};

    var mac_ap = arg.mac_ap;
    var mac_device = arg.mac_device;

    getLandingPage(mac_device, (landingPage) => {
        return res.redirect(landingPage);
    })
})

//Declare in Admin Page of AP
// http://checkin.becawifi.vn/motorola/?mac_device=WING_TAG_CLIENT_MAC&mac_ap=WING_TAG_AP_MAC
// http://checkin.becawifi.vn/redirect/motorola/?mac_device=WING_TAG_CLIENT_MAC&mac_ap=WING_TAG_AP_MAC
//For motorola
router.get("/redirect/motorola/", (req, res, next) => {
    //Get agrument from URL query string
    var arg = req.query || {};

    var mac_ap = arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
    var mac_device = arg.mac_device || 'UN-KK-NN-OO-WW-NN';

    getLandingPage(mac_device, (landingPage) => {
        return res.redirect(landingPage);
    })
})

//For cisco
router.get("/redirect/cisco/", (req, res, next) => {
    //Get agrument from URL query string
    var arg = req.query || {};
    var mac_ap = arg.ap_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
    var mac_device = arg.client_mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';

    logger.info("redirect/cisco", JSON.stringify(arg));

    getLandingPage(mac_device, (landingPage) => {
        return res.redirect(landingPage);
    })
})

//For grandstream but not supported yet.
// router.get("/redirect/grandstream/", (req, res, next) => {
//     //Get agrument from URL query string
//     var arg = req.query || {};
//     var mac_ap = arg.ap_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
//     var mac_device = arg.client_mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';

//     logger.info("redirect/grandstream", JSON.stringify(arg));

//     getLandingPage(mac_device, (landingPage) => {
//         return res.redirect(landingPage);
//     })
// })

//For cambium
router.get("/redirect/cambium/", (req, res, next) => {
    //Get agrument from URL query string
    var arg = req.query || {};

    var mac_ap = arg.ga_ap_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
    var mac_device = arg.ga_cmac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';

    getLandingPage(mac_device, (landingPage) => {
        return res.redirect(landingPage);
    })
})

//For all ap not supported dynamic landingpage
router.get("/redirect/:type_ap(aerohive|engenius|grandstream)", (req, res, next) => {
    var query = req.query;
    var default_landingpage = query.landingpage || CONF.LANDINGPAGE;

    return res.render('nosupportlandingpage', { landingpage: default_landingpage });
})


//For cambium
router.get("/redirect/nuclias/", (req, res, next) => {
    //Get agrument from URL query string
    var arg = req.query || {};

    var mac_ap = arg.ap_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
    var mac_device = arg.mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';

    getLandingPage(mac_device, (landingPage) => {
        return res.redirect(landingPage);
    })
})

//For cambium
router.get("/redirect/ruckus/", (req, res, next) => {
    //Get agrument from URL query string
    var arg = req.query || {};

     var mac_ap = arg.mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
     var mac_device = arg.client_mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';

     if (mac_ap.indexOf("-") == -1 && mac_ap.indexOf(":") == -1) {
        var temp = mac_ap.match(/(([0-9]|[A-Fa-f]){2})/g);
        mac_ap = temp[0] + "-" + temp[1] + "-" + temp[2] + "-" + temp[3] + "-" + temp[4] + "-" + temp[5];
    }

    if (mac_device.indexOf("-") == -1 && mac_device.indexOf(":") == -1) {
        temp = mac_device.match(/(([0-9]|[A-Fa-f]){2})/g);
        mac_device = temp[0] + "-" + temp[1] + "-" + temp[2] + "-" + temp[3] + "-" + temp[4] + "-" + temp[5];
    }

    getLandingPage(mac_device, (landingPage) => {
        return res.redirect(landingPage);
    })
})

//For cambium
router.get("/redirect/ruckusz/", (req, res, next) => {
    //Get agrument from URL query string
    var arg = req.query || {};

     var mac_ap = arg.mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
     var mac_device = arg.client_mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';

     if (mac_ap.indexOf("-") == -1 && mac_ap.indexOf(":") == -1) {
        var temp = mac_ap.match(/(([0-9]|[A-Fa-f]){2})/g);
        mac_ap = temp[0] + "-" + temp[1] + "-" + temp[2] + "-" + temp[3] + "-" + temp[4] + "-" + temp[5];
    }

    if (mac_device.indexOf("-") == -1 && mac_device.indexOf(":") == -1) {
        temp = mac_device.match(/(([0-9]|[A-Fa-f]){2})/g);
        mac_device = temp[0] + "-" + temp[1] + "-" + temp[2] + "-" + temp[3] + "-" + temp[4] + "-" + temp[5];
    }

    getLandingPage(mac_device, (landingPage) => {
        return res.redirect(landingPage);
    })
})

module.exports = router;