const request = require('request-promise')
const router = Express.Router();
const radius = require('radius');
const dgram = require("dgram");

router.get("/guest/s/:sitename/", (req, res, next) => {
    var query = req.query;
    var params = req.params;
    try {
        query.ap = query.ap.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();
        query.id = query.id.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();
        query.id = query.id.replace('#', '').replace('/', '');

        var sitename = params.sitename || "default";
        return res.redirect("/unifi/?mac_ap=" + query.ap + "&mac_device=" + query.id + "&sitename=" + sitename);
    }
    catch(err) {
        logger.error(err);
    }
});

//http://checkin.becawifi.vn/unifi/login?cloudkey=10.5.10.11&site=default&min=3 //sitename in cloud unifi
//http://checkin.becawifi.vn/unifi/login?cloudkey=10.5.10.11:8443&min=3
router.post('/unifi/login', (req, res, next) => {
    try {
        var username = req.body.username || "click_to_connect";
        var password = req.body.password || "click_to_connect";
        var mac_device = req.body.mac_device.replace(/-/g, ':').toLowerCase();
        var sitename = req.body.sitename || "default";
        // var mac_ap = req.body.mac_ap.replace(/-/g, ':').toLowerCase();
        var redirectUrl = req.body.redirectUrl || CONF.LANDINGPAGE;
        var cloudkey = req.query.cloudkey;
        var min = parseInt(req.query.min) || "30";

        var requestOptions = ({ method: 'POST', jar: true, json: true, strictSSL: false, uri: "", body: {} });
        requestOptions.uri = "https://" + cloudkey + "/api/login";
        requestOptions.body = { username: username, password: password };
        logger.debug("[unifi] POST", "https://" + cloudkey + "/api/login");
        logger.debug("Unifi requestOptions", JSON.stringify(requestOptions))

        request(requestOptions)
            .then(loginResp => {
                logger.debug("Unifi Logged", JSON.stringify(loginResp))

                // var packet = { code: "Access-Request", attributes: { 'Calling-Station-Id': mac_device, "Called-Station-Id": mac_ap }, secret: CONF.PROXY.SECRET };
                // packet.attributes['User-Name'] = username;
                // packet.attributes['User-Password'] = password;

                // var client = dgram.createSocket("udp4");
                // var msg = radius.encode(packet);

                // client.send(msg, 0, msg.length, CONF.PROXY.PORT, CONF.PROXY["IP" + (Math.round(Math.random() * 1) + 1)]);
                // client.on('message', (msg, rinfo) => {
                //     var packet = radius.decode({ packet: msg, secret: CONF.PROXY.SECRET });
                //     logger.debug("[" + mac_ap + "][" + mac_device + "]:", '[RADIUS RESPONSE]:', packet.code);

                //     if (packet.code == "Access-Accept") {
                //         requestOptions.uri = "https://" + cloudkey + "/api/s/" + sitename + "/cmd/stamgr";
                //         requestOptions.body = {
                //             cmd: 'authorize-guest',
                //             mac: mac_device, minutes: Math.round(packet.attributes['Session-Timeout'] / 60),
                //             down: packet.attributes['Vendor-Specific']['WISPr-Bandwidth-Max-Down'],
                //             up: packet.attributes['Vendor-Specific']['WISPr-Bandwidth-Max-Up']
                //         };
                //         return request(requestOptions);
                //     }
                // })

                requestOptions.uri = "https://" + cloudkey + "/api/s/" + sitename + "/cmd/stamgr";
                logger.debug("[unifi] POST", "https://" + cloudkey + "/api/s/" + sitename + "/cmd/stamgr");
                requestOptions.body = { cmd: 'authorize-guest', mac: mac_device, minutes: min };
                logger.debug("[unifi] body:", JSON.stringify({ cmd: 'authorize-guest', mac: mac_device, minutes: min }));
                return request(requestOptions);
            })
            .then(authResp => {
                logger.debug("Unifi Authenticated", JSON.stringify(authResp))
                requestOptions.uri = "https://" + cloudkey + "/api/logout";
                return request(requestOptions);
            })
            .then(logoutResp => {
                logger.debug("Unifi Logout", JSON.stringify(logoutResp))
                setTimeout(function () {
                    logger.debug("Unifi  Redirect", redirectUrl);
                    return res.redirect(redirectUrl);
                }, 2500);
            })
            .catch(err => { logger.error(err); })
    }
    catch (err) {
        logger.error(err);
    }
})

router.get('/unifi/login', (req, res, next) => {
    try {
        var username = req.query.username || "click_to_connect";
        var password = req.query.password || "click_to_connect";
        // var mac_ap = req.query.mac_ap.replace(/-/g, ':').toLowerCase();
        var mac_device = req.query.mac_device.replace(/-/g, ':').toLowerCase();
        var sitename = req.query.sitename || "default";
        var cloudkey = req.query.cloudkey;
        var min = parseInt(req.query.min) || 30;

        var requestOptions = ({ method: 'POST', jar: true, json: true, strictSSL: false, uri: "", body: {} });
        requestOptions.uri = "https://" + cloudkey + "/api/login";
        requestOptions.body = { username: username, password: password };
        logger.debug("[unifi] POST", "https://" + cloudkey + "/api/login");
        logger.debug("Unifi requestOptions", JSON.stringify(requestOptions))

        request(requestOptions)
            .then(loginResp => {
                logger.debug("Unifi Logged", JSON.stringify(loginResp));
                requestOptions.uri = "https://" + cloudkey + "/api/s/" + sitename + "/cmd/stamgr";
            //     requestOptions.body = { cmd: 'unauthorize-guest', mac: mac_device };
            //     return request(requestOptions);
            // })
            // .then(authResp => {
            //     logger.debug("Unifi unauthorize-guest", JSON.stringify(authResp))
                logger.debug("[unifi] POST", "https://" + cloudkey + "/api/s/" + sitename + "/cmd/stamgr");
                requestOptions.body = { cmd: 'authorize-guest', mac: mac_device, minutes: min };
                logger.debug("[unifi] body:", JSON.stringify({ cmd: 'authorize-guest', mac: mac_device, minutes: min }));
                return request(requestOptions);
            })
            .then(authResp => {
                logger.debug("Unifi authorize-guest", JSON.stringify(authResp))
                requestOptions.uri = "https://" + cloudkey + "/api/logout";
                return request(requestOptions);
            })
            .then(logoutResp => {
                logger.debug("Unifi Logout", JSON.stringify(logoutResp))
                return res.json({ status: true, code: 200, message: "Success" });
            })
            .catch(err => { logger.error(err); })
    }
    catch (err) {
        logger.error(err);
    }
})

module.exports = router;