const router = Express.Router();
const radius = require('radius');
const dgram = require("dgram");

router.get('/openmesh/uam/', (req, res, next) => {
    res.header("Content-Type", "text/plain");
    var query = req.query;
    var type = query.type;
    var username = query.username || CONF.AP.username;
    var password = query.username || CONF.AP.password; //Get username because password encrypted.
    var mac_ap = query.node;
    var mac_device = "";
    var ra = query.ra;

    if (typeof query.mac == "object") {
        mac_device = query.mac[0];
    }
    else {
        mac_device = query.mac;
    }

    switch (type) {
        case 'login':
            try {
                if (username && password && mac_device) {

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
                            var response = '';
                            response += '"CODE" "ACCEPT"\n';
                            response += '"SECONDS" "3600"\n';
                            response += '"DOWNLOAD" "4294967295"\n';
                            response += '"UPLOAD" "4294967295"';

                            Util.calculate_new_ra(ra, CONF.SIGSECRET, (err, result) => {
                                if (err) {
                                    return res.send('"CODE" "REJECT"');
                                }

                                response = '"RA" "' + result + '"\n' + response;
                                return res.send(response);
                            })
                        }
                        else {
                            return res.send('"CODE" "REJECT"');
                        }
                    })
                }
            }
            catch (err) {
                logger.error(err);
                return res.send('"CODE" "REJECT"');
            }
            break;
        case 'status':
            if (username && password && mac_device) {
                var packet = { code: "Access-Request", attributes: { 'Calling-Station-Id': mac_device, "Called-Station-Id": mac_ap }, secret: CONF.PROXY.SECRET };
                // packet.attributes['User-Name'] = username;
                // packet.attributes['User-Password'] = password;

                var client = dgram.createSocket("udp4");
                var msg = radius.encode(packet);

                client.send(msg, 0, msg.length, CONF.PROXY.PORT, CONF.PROXY["IP" + (Math.round(Math.random() * 1) + 1)]);
                client.on('message', (msg, rinfo) => {
                    var packet = radius.decode({ packet: msg, secret: CONF.PROXY.SECRET });
                    logger.info("[" + mac_ap + "][" + mac_device + "]:", '[RADIUS RESPONSE]:', packet.code);

                    if (packet.code == "Access-Accept") {
                        var response = '';
                        response += '"CODE" "ACCEPT"\n';
                        response += '"SECONDS" "' + packet.attributes['Session-Timeout'] + '"\n';
                        response += '"DOWNLOAD" "' + packet.attributes['Vendor-Specific']['WISPr-Bandwidth-Max-Down'] + '"\n';
                        response += '"UPLOAD" "' + packet.attributes['Vendor-Specific']['WISPr-Bandwidth-Max-Up'] + '"';

                        Util.calculate_new_ra(ra, CONF.SIGSECRET, (err, result) => {
                            if (err) {
                                return res.send('"CODE" "REJECT"');
                            }

                            response = '"RA" "' + result + '"\n' + response;
                            return res.send(response);
                        })
                    }
                    else {
                        return res.send('"CODE" "REJECT"');
                    }
                })
            }
            else {
                return res.send('"CODE" "REJECT"');
            }

            break;
        case 'acct':
            return res.send('"CODE" "OK"');
            break;
        case 'logout':
            if (typeof mac_device == "undefined") {
                break;
            }

            var key = mac_device.replace(":", "-");
            Cache.clearSession(key, (err, result) => {
                if (err) logger.error(err)

                logger.info("[Clear Key Cache By Ap]");
            });

            return res.send('"CODE" "OK"');
            break;
        default:
            return res.send('"CODE" "OK"');
            break;
    }
})

//http://checkin.becawifi.vn/openmesh/enpwd/encode_password/becawifi1h/greatsecret/9BF1C095415E2AA8C1B342453FDB3F6DA5E658B9907BA2363F971DC5CA0096D3/
router.get('/openmesh/enpwd/:callback/:password/:secret/:challenge', (req, res, next) => {

    var callback = decodeURIComponent(req.params.callback);
    var password = decodeURIComponent(req.params.password);
    var secret = decodeURIComponent(req.params.secret);
    var challenge = decodeURIComponent(req.params.challenge);

    logger.info(callback, password, secret, challenge);

    if (password && secret && challenge && callback) {
        Util.encode_password(password, challenge, secret, (err, result) => {
            if (err) {
                return res.send("if(" + callback + ") { " + callback + '(false); }');
            }
            return res.send("if(" + callback + ") { " + callback + '("' + result + '"); }');
        })
    }
    else {
        return res.send("if(" + callback + ") { " + callback + '(false); }');
    }
})

module.exports = router;