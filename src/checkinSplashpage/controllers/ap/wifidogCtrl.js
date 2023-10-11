
const router = Express.Router();
const radius = require('radius');
const dgram = require("dgram");

//Redirect to splashpage ->router.get("/wifidog")
router.get('/wifidog/login/', (req, res, next) => {
    var query = req.query;
    var gw_address = query.gw_address || "1.2.3.4";
    var gw_port = query.gw_port || "2060";
    var gw_id = query.gw_id;
    var gw_sn = query.gw_sn;
    var mac_device = query.mac;
    var url = query.url;

    if (typeof query.apmac != "undefined" && query.apmac.indexOf(".") != -1) {
        var spl = query.apmac.replace(/\./g, '').split("");
        query.apmac = spl[0] + spl[1] + "-" + spl[2] + spl[3] + "-" + spl[4] + spl[5] + "-" + spl[6] + spl[7] + "-" + spl[8] + spl[9] + "-" + spl[10] + spl[11];
    }

    mac_device = req.query.mac.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();
    var mac_ap = req.query.apmac.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();

    var queryString = "mac_ap=" + mac_ap + "&mac_device=" + mac_device + "&gw_id=" + gw_id + "&gw_address=" + gw_address + "&gw_sn=" + gw_sn + "&gw_port=" + gw_port + "&url=" + url;
    return res.redirect("/wifidog/?" + queryString);
})

//Wifidog authenitcation before.
router.get('/wifidog/login.gif', (req, res, next) => {
    var query = req.query;
    var gw_address = query.gw_address || "1.2.3.4";
    var gw_port = query.gw_port || "2060";
    var gw_id = query.gw_id;
    var mac_device = query.mac_device;
    var mac_ap = query.mac_ap;
    var username = query.username;
    var password = query.password;
    var url = query.url;
    var token = mac_device + "_" + mac_ap;

    // logger.info("Redirect to http://" + gw_address + ":" + gw_port + "/auth?token=" + token);
    // res.redirect("http://" + gw_address + ":" + gw_port + "/auth?token=" + token);
    
    try {
        var packet = { code: "Access-Request", attributes: { 'Calling-Station-Id': mac_device, "Called-Station-Id": mac_ap }, secret: CONF.PROXY.SECRET };
        packet.attributes['User-Name'] = username;
        packet.attributes['User-Password'] = password;

        var client = dgram.createSocket("udp4");
        var msg = radius.encode(packet);

        client.send(msg, 0, msg.length, CONF.PROXY.PORT, CONF.PROXY["IP" + (Math.round(Math.random() * 1) + 1)]);
        client.on('message', (msg, rinfo) => {
            var packet = radius.decode({ packet: msg, secret: CONF.PROXY.SECRET });
            logger.info("[" + mac_ap + "][" + mac_device + "]:", '[RADIUS RESPONSE]:', packet.code);

            if (packet.code == "Access-Accept") {
                Cache.set("landingPage", { mac_device: mac_device }, url, (err, result) => {
                    if (err) logger.error(err)
                });
            }
        })
    }
    catch (err) {
        logger.error(err);
    }

    return res.sendFile(CONF.IMG_1x1, { headers: { 'Content-Type': 'image/gif' } });
})

// Wifidog authenitcation.
router.post('/wifidog/login', (req, res, next) => {
    var body = req.body;
    var gw_address = body.gw_address || "1.2.3.4";
    var gw_port = body.gw_port || "2060";
    var gw_id = body.gw_id;
    var mac_device = body.mac_device;
    var mac_ap = body.mac_ap;
    var username = body.username;
    var password = body.password;
    var url = body.url;
    var token = mac_device + "_" + mac_ap;

    logger.info("Redirect to http://" + gw_address + ":" + gw_port + "/auth?token=" + token);
    res.redirect("http://" + gw_address + ":" + gw_port + "/auth?token=" + token);

    try {
        var packet = { code: "Access-Request", attributes: { 'Calling-Station-Id': mac_device, "Called-Station-Id": mac_ap }, secret: CONF.PROXY.SECRET };
        packet.attributes['User-Name'] = username;
        packet.attributes['User-Password'] = password;

        var client = dgram.createSocket("udp4");
        var msg = radius.encode(packet);

        client.send(msg, 0, msg.length, CONF.PROXY.PORT, CONF.PROXY["IP" + (Math.round(Math.random() * 1) + 1)]);
        client.on('message', (msg, rinfo) => {
            var packet = radius.decode({ packet: msg, secret: CONF.PROXY.SECRET });
            logger.info("[" + mac_ap + "][" + mac_device + "]:", '[RADIUS RESPONSE]:', packet.code);

            if (packet.code == "Access-Accept") {
                Cache.set("landingPage", { mac_device: mac_device }, url, (err, result) => {
                    if (err) logger.error(err)
                });
            }
        })
    }
    catch (err) {
        logger.error(err);
    }

    return;
})

router.get('/wifidog/auth', (req, res, next) => {
    var query = req.query;
    var stage = query.stage;
    var ip = query.ip;
    var mac = query.mac;
    var token = query.token;
    var incoming = query.incoming;
    var outgoing = query.outgoing;
    var gw_id = query.gw_id;

    try {
        var spl = token.split("_");
        var mac_device = spl[0];
        var mac_ap = spl[1];

        var packet = { code: "Access-Request", attributes: { 'Calling-Station-Id': mac_device, "Called-Station-Id": mac_ap }, secret: CONF.PROXY.SECRET };
        packet.attributes['User-Name'] = mac_device;
        packet.attributes['User-Password'] = mac_ap;

        var client = dgram.createSocket("udp4");
        var msg = radius.encode(packet);
        client.send(msg, 0, msg.length, CONF.PROXY.PORT, CONF.PROXY["IP" + (Math.round(Math.random() * 1) + 1)]);
        client.on('message', (msg, rinfo) => {
            var packet = radius.decode({ packet: msg, secret: CONF.PROXY.SECRET });
            logger.info("[" + mac_ap + "][" + mac_device + "]:", '[RADIUS RESPONSE]:', packet.code);

            if (packet.code == "Access-Accept") {
                return res.send('{ auth: 1 }');
            }
            else {
                return res.send('{ auth: 0 }');
            }
        })
    }
    catch (err) {
        logger.error(err);
        return res.send('{ auth: 0 }');
    }
})

// router.get('/wifidog/portal', function (req, res) {
//  res.set('Content-Type', 'text/plain; charset=utf-8');
//  res.send("Success!");
// })

router.get('/wifidog/portal', function (req, res) {
    var query = req.query || {};//Get agrument from URL query string   
    var mac_device = query.mac.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase(); //Format Mac Address from ':' to '-'

    Cache.get("landingPage", { mac_device: mac_device }, (err, landingPage) => {
        if (err) logger.error(err)

        if (landingPage) {
            return res.redirect(landingPage);
        }
        else {
            flag = true;
            return res.redirect(CONF.LANDINGPAGE);
        }
    })
});

router.get('/wifidog/ping', function (req, res) {
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send('Pong');
});

router.get('/wifidog/gw_message', function (req, res) {
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(req.query.message);
});

router.get("/wifidog/", (req, res) => {
    res.send("Hello World!")
})

module.exports = router;
