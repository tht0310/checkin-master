const router = Express.Router();
global.Process = require(__ + '/modules/Process');
global.Checkin = require(__ + '/modules/Checkin');

const q = "/:type_ap(demo|chilli|motorola|cisco|mikrotik|aruba|ruckus|ruckusz|meraki|unifi|wifidog|tplink|openmesh|relay2|engenius|peplink|grandstream|cambium|aerohive|everest|nuclias|meganet)";

router.get("/", (req, res, next) => {
    return res.status(404).send('Not Found!');
})

//Get splagepage by mac_ap
router.get(q, (req, res, next) => {
    var rq = req.query || {};//Get agrument from URL query string

    Process.getMac(req, (jsonRes) => {
        try {
            if ((rq.type_ap == "openmesh" || rq.type_ap == "chilli" || rq.type_ap == "relay2" || rq.type_ap == "peplink") && (rq.res == "success" || rq.res == "already")) {
                return res.redirect("/redirect/" + rq.type_ap + "/?mac_device=" + jsonRes.mac_device + "&mac_ap=" + jsonRes.mac_ap);
            }

            Process.getAccessPoint(jsonRes, (err, ap) => {
                if (err) {
                    logger.error("ERROR", err);
                }

                Dashboard.getLogCheckin({ groupId: ap.group._id, mac_device: jsonRes.mac_device }, (err, logCheckin) => {
                    //Render main.ejs with jsonRes
                    jsonRes.ap = ap;
                    jsonRes.username = ap.username || CONF.AP.username;
                    jsonRes.password = ap.password || CONF.AP.password;
                    jsonRes.cloudkey = decodeURIComponent(ap.ip);

                    Process.start(jsonRes, (obj) => {
                        jsonRes.HTML = obj.html;
                        jsonRes.SCRIPT = obj.script;
                        jsonRes.scriptHead = obj.scriptHead || "";
                        jsonRes.scriptBody = obj.scriptBody || "";
                        jsonRes.cId = obj.cId;

                        if (typeof obj.password != "undefined") {
                            jsonRes.password = obj.password;
                            logger.debug(jsonRes.password);
                        }

                        // if (logCheckin && logCheckin.isChecked) {
                        //     var ddd = Util.now("ddd");
                        //     //Neu co lam chieu
                        //     if (logCheckin.policy.office[ddd].outPM && new moment(logCheckin.policy.office[ddd].outPM, 'HH:mm:ss').diff(moment(), "minutes") > 60) {
                        //         jsonRes.redirectlink = jsonRes.banner.landingpage || CONF.LANDINGPAGE;
                        //         return res.render('main_autologin', jsonRes);
                        //         // var url = "/sp/autologin" + queryString;
                        //         // logger.debug("Auto Login: ", url)
                        //         // return res.redirect(url);
                        //     }

                        //     //Neu chi lam buoi sang
                        //     if (!logCheckin.policy.office[ddd].outPM && logCheckin.policy.office[ddd].outAM && new moment(logCheckin.policy.office[ddd].outAM, 'HH:mm:ss').diff(moment(), "minutes") > 60) {
                        //         jsonRes.redirectlink = jsonRes.banner.landingpage || CONF.LANDINGPAGE;
                        //         return res.render('main_autologin', jsonRes);
                        //         // var url = "/sp/autologin" + queryString;
                        //         // logger.debug("Auto Login: ", url)
                        //         // return res.redirect(url);
                        //     }
                        // }

                        if (jsonRes.type_ap == "aerohive") { return res.render('main_' + jsonRes.type_ap, jsonRes); } else { return res.render('main', jsonRes) }
                    })
                })
            })
        }
        catch (err) {
            logger.error("ERROR", err);
            jsonRes.ap = ap = CONF.AP
            jsonRes.username = ap.username
            jsonRes.password = ap.password
            jsonRes.mac_device = rq.mac_device
            jsonRes.cloudkey = decodeURIComponent(ap.ip);

            Process.whenError(jsonRes, (jsonRes) => {
                if (jsonRes.type_ap == "aerohive") { return res.render('main_' + jsonRes.type_ap, jsonRes); } else { return res.render('main', jsonRes) }
            })
        }
    })
})

//Get splagepage by campaignId. Use for link demo
router.get("/demo/c/:cId/", (req, res, next) => {
    var rq = req.query || {};//Get agrument from URL query string
    rq.cId = req.params.cId || "1";

    Process.getMac(req, (jsonRes) => {
        try {
            var obj = { lId: (rq.lId || 1), apId: (rq.apId || 1), mac_ap: jsonRes.mac_ap, mac_device: jsonRes.mac_device, type_ap: jsonRes.type_ap, rdId: jsonRes.rdId, ssid: jsonRes.ssid };
            obj.userAgent = jsonRes.userAgent;

            obj.queryString = "?lId=" + obj.lId;
            obj.queryString += "&apId=" + obj.apId;
            obj.queryString += "&mac_device=" + obj.mac_device;
            obj.queryString += "&mac_ap=" + obj.mac_ap;
            obj.queryString += "&type_ap=" + obj.type_ap;
            obj.queryString += "&ssid=" + obj.ssid;
            obj.queryString += "&rdId=" + obj.rdId;
            obj.override = [];
            obj.remnant = [];

            var start = (cb) => {
                var args = { schema: "Campaign", query: [] }
                args.query.push({ $match: { _id: rq.cId } });

                args.query.push({
                    $lookup: {
                        from: "banner",
                        let: { cId: "$_id" },
                        pipeline: [
                            { $match: { $expr: { $and: [{ $eq: ["$campaign", "$$cId"] }] } } },
                        ],
                        as: "banner"
                    }
                });

                args.query.push({ $unwind: { path: "$banner", preserveNullAndEmptyArrays: true } });

                JCloud.aggregate(args, (err, campaigns) => {
                    if (err) { //If error return banner default
                        logger.error(err);
                        return cb(null, obj); //Return cCampaigns=[]
                    }

                    if (campaigns[0].override) {
                        obj.override.push(campaigns[0]);
                    }
                    else {
                        obj.remnant.push(campaigns[0]);
                    }

                    return cb(null, obj);
                })
            }

            var step4 = Process.getRandomBannerByWeight;
            var step5 = Process.renderEJS;

            var final = (obj) => {
                logger.debug("[End Processing] " + obj.queryString);
                jsonRes.ap = ap = CONF.AP;
                jsonRes.username = obj.campaign.banner.username || CONF.AP.username;
                jsonRes.password = obj.campaign.banner.password || CONF.AP.password;
                jsonRes.HTML = obj.html;
                jsonRes.SCRIPT = obj.script;
                jsonRes.scriptHead = obj.scriptHead || "";
                jsonRes.scriptBody = obj.scriptBody || "";
                jsonRes.cId = obj.cId;

                if (jsonRes.type_ap == "openmesh") {
                    SPUT.encode_password(jsonRes.password, jsonRes.challenge, CONF.SECRET, (err, result) => {
                        jsonRes.password = result;

                        if (jsonRes.type_ap == "aerohive") { return res.render('main_' + jsonRes.type_ap, jsonRes); } else { return res.render('main', jsonRes) }
                    })
                }
                else {
                    if (jsonRes.type_ap == "aerohive") { return res.render('main_' + jsonRes.type_ap, jsonRes); } else { return res.render('main', jsonRes) }
                }
            }

            async.waterfall([start, step4, step5], final);
        }
        catch (err) {
            logger.error("ERROR", err);
            jsonRes.ap = ap = CONF.AP
            jsonRes.username = ap.username
            jsonRes.password = ap.password
            jsonRes.mac_device = rq.mac_device
            jsonRes.cloudkey = decodeURIComponent(ap.ip);

            Process.whenError(jsonRes, (jsonRes) => {
                if (jsonRes.type_ap == "aerohive") { return res.render('main_' + jsonRes.type_ap, jsonRes); } else { return res.render('main', jsonRes) }
            })
        }
    })
})

//Get splagepage by apId. Use for link demo
router.get("/demo/ap/:mac_ap/", (req, res, next) => {
    var rq = req.query || {};//Get agrument from URL query string
    rq.mac_ap = req.params.mac_ap || "1";

    Process.getMac(req, (jsonRes) => {
        try {

            jsonRes.mac_device = "00-00-00-00-00-00";
            jsonRes.mac_ap = rq.mac_ap;

            var args = { schema: "AccessPoint", query: [{ $match: { mac_ap: jsonRes.mac_ap } }] };

            args.query.push({
                $lookup: {
                    from: "group",
                    let: { groupId: "$group" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$groupId"] }] } } },
                        { $project: { _id: 1, name: 1, keyword: 1, click_limit: 1, expiry_date: 1, campaign_default: 1 } },
                    ],
                    as: "group"
                }
            });

            args.query.push({ $unwind: { path: "$group", preserveNullAndEmptyArrays: true } });

            args.query.push({
                $lookup: {
                    from: "location",
                    let: { location: "$location" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$location"] }] } } },
                        { $project: { _id: 1, name: 1, keyword: 1, fullname: 1 } }
                    ],
                    as: "location"
                }
            })

            args.query.push({ $unwind: { path: "$location", preserveNullAndEmptyArrays: true } });
            args.query.push({ $project: { _id: 1, createdAt: 1, updatedAt: -1, name: 1, group: 1, location: 1, keyword: 1 } });

            JCloud.aggregate(args, (err, ap) => {
                try {
                    if (err) {
                        logger.error("[GET AP FROM DB] ERROR", err)
                        jsonRes.ap = ap = [CONF.AP]
                    }

                    logger.debug("[GET AP FROM DB]", JSON.stringify(ap));
                    if (!ap[0]) {
                        logger.debug("NULL")
                        jsonRes.ap = ap = [CONF.AP]
                    }

                    ap = ap[0];

                    jsonRes.ap = ap;
                    jsonRes.username = ap.username || CONF.AP.username;
                    jsonRes.password = ap.password || CONF.AP.password;
                    jsonRes.cloudkey = decodeURIComponent(CONF.AP.ip);

                    Process.start(jsonRes, (obj) => {
                        jsonRes.HTML = obj.html;
                        jsonRes.SCRIPT = obj.script;
                        jsonRes.scriptHead = obj.scriptHead || "";
                        jsonRes.scriptBody = obj.scriptBody || "";
                        jsonRes.cId = obj.cId;

                        if (typeof obj.password != "undefined") {
                            jsonRes.password = obj.password;
                            logger.debug(jsonRes.password);
                        }

                        if (jsonRes.type_ap == "aerohive") { return res.render('main_' + jsonRes.type_ap, jsonRes); } else { return res.render('main', jsonRes) }
                    })
                }
                catch (err) {
                    logger.error("ERROR", err);
                    jsonRes.ap = ap = CONF.AP;
                    jsonRes.username = ap.username;
                    jsonRes.password = ap.password;
                    jsonRes.cloudkey = decodeURIComponent(ap.ip);

                    Process.start(jsonRes, (obj) => {
                        jsonRes.HTML = obj.html;
                        jsonRes.SCRIPT = obj.script;
                        jsonRes.scriptHead = obj.scriptHead || "";
                        jsonRes.scriptBody = obj.scriptBody || "";
                        jsonRes.cId = obj.cId;


                        if (typeof obj.password != "undefined") {
                            jsonRes.password = obj.password;
                            logger.debug(jsonRes.password);
                        }

                        if (jsonRes.type_ap == "aerohive") { return res.render('main_' + jsonRes.type_ap, jsonRes); } else { return res.render('main', jsonRes) }
                    })
                }
            })
        }
        catch (err) {
            logger.error("ERROR", err);
            jsonRes.ap = ap = CONF.AP;
            jsonRes.username = ap.username;
            jsonRes.password = ap.password;
            jsonRes.cloudkey = decodeURIComponent(ap.ip);

            Process.start(jsonRes, (obj) => {
                jsonRes.HTML = obj.html;
                jsonRes.SCRIPT = obj.script;
                jsonRes.scriptHead = obj.scriptHead || "";
                jsonRes.scriptBody = obj.scriptBody || "";
                jsonRes.cId = obj.cId;

                if (typeof obj.password != "undefined") {
                    jsonRes.password = obj.password;
                    logger.debug(jsonRes.password);
                }


                if (jsonRes.type_ap == "aerohive") { return res.render('main_' + jsonRes.type_ap, jsonRes); } else { return res.render('main', jsonRes) }
            })
        }
    })
})

//Get Banner for Pulisher (Web Admin).
router.get('/js/jwifi.js', (req, res, next) => {
    var query = req.query;
    req.headers.referer = req.headers.referrer || req.headers.referer || req.get('referrer') || false;

    if (!req.headers.referer) {
        return res.send("");
    }

    var protocol = ((req.headers.referer || "").split(':')[0]) || "http";
    var host = protocol + "://" + CONF.HOST

    var bId = query.bId;
    var cId = query.cId;
    var apId = query.apId;
    var lId = query.lId;
    var mac_device = query.mac_device;
    var mac_ap = query.mac_ap;
    var type_ap = query.type_ap;
    var ssid = query.ssid || "";
    var rdId = query.rdId;
    var landingpage = query.landingpage;
    var client_ip = query.client_ip || "";
    var user_url = encodeURIComponent(query.user_url) || "";
    var mode = query.mode;
    var layout = query.layout;

    var plain = lId + apId + mac_device + rdId + Util.now("YYYYMMDDHH");
    var hashId = encodeURIComponent(Util.hash(plain, rdId));
    logger.debug(hashId)

    var q = "?";
    q += "lId=" + lId;
    q += "&apId=" + apId;
    q += "&cId=" + cId;
    q += "&bId=" + bId;
    q += "&mac_device=" + mac_device;
    q += "&mac_ap=" + mac_ap;
    q += "&type_ap=" + type_ap;
    q += "&client_ip=" + client_ip;
    q += "&user_url=" + user_url;
    q += "&ssid=" + ssid;
    q += "&rdId=" + rdId;
    q += "&hashId=" + hashId;

    var endLine = "";
    // if (mode == "debug") {
    endLine = "\n";
    // }

    var script = 'window.jwifi_impression = false;window.jwifi_hit = false;';
    script += 'window.hostLog = "' + host + '/log/";' + endLine;
    script += 'window.cId = "' + cId + '"; ' + endLine;
    script += 'window.bId = "' + bId + '"; ' + endLine;
    script += 'window.jwifi_landingpage = "' + landingpage + '"; ' + endLine;
    script += 'window.rdId = "' + rdId + '"; ' + endLine;
    script += 'window.hashId = "' + hashId + '"; ' + endLine;

    script += 'window.q = "' + q + '";' + endLine;
    script += 'window.jwifi_impUrl = "' + host + '/log/imp.gif" + window.q;' + endLine;
    script += 'window.jwifi_clickUrl = "' + host + '/log/click" + window.q;' + endLine;
    script += 'window.jwifi_clickGif = "' + host + '/log/click.gif" + window.q;' + endLine;
    script += 'window.jwifi_friendly_clickUrl = "' + host + '/log/' + type_ap + '/click/' + lId + "/" + apId + "/" + cId + "/" + bId + "/" + mac_device + '/";' + endLine;

    //connectToWifi
    script += '     if(typeof connectToWifi != "function") { window.connectToWifi = jwifi_login_hotspot; }; ' + endLine;

    //jwifi_loading
    script += 'window.jwifi_loading = function (loop) { ' + endLine;
    script += '    document.getElementsByClassName("vntt-loading")[0].style.display = "block"; ' + endLine;
    script += '    if(!loop) { setTimeout(function () { document.getElementsByClassName("vntt-loading")[0].style.display = "none"; }, 10000); }' + endLine;
    script += '}; ' + endLine;
    //End jwifi_loading

    script += 'if(type_ap != "demo") {/*demo*/' + endLine;

    script += 'function addListener(event, obj, fn) {' + endLine;
    script += '    if (obj.addEventListener) {' + endLine;
    script += '        obj.addEventListener(event, fn, false);' + endLine; // modern browsers
    script += '    } else {' + endLine;
    script += '        obj.attachEvent("on"+event, fn);' + endLine; // older versions of IE
    script += '    }' + endLine;
    script += '};' + endLine;

    //Tracking Impression Auto
    script += '(function (t, u, r) { ' + endLine;
    script += '     r = "&rd=" + Math.floor(1000 + Math.random() * 9000); ' + endLine;
    script += '     var img = new Image();' + endLine;
    script += '     img.src = hostLog + t + u + "&" + r; ' + endLine;
    script += '     img.onerror = function() {throw "Impression unload";}; ' + endLine;
    script += '     img.onload = function() {window.jwifi_impression = true;}; ' + endLine;
    script += '})("imp", q); ' + endLine;
    //End Tracking Impression Auto

    script += 'window.jwifi_setRedirectPage = function (url, callback) {' + endLine;
    script += '    r = "&rd=" + Math.floor(1000 + Math.random() * 9000);' + endLine;
    script += '    if(typeof url == "string") jwifi_clickUrl = jwifi_clickUrl + "&landingpage=" + encodeURIComponent(url);' + endLine;
    script += '    (new Image()).src = "/setredirectpage/?mac_device=' + mac_device + '&redirecturl=" + encodeURIComponent(jwifi_clickUrl) + "&" + r;' + endLine;
    script += '    if (typeof callback == "function") callback();' + endLine;
    script += '};' + endLine;

    script += 'window.jwifi_logClick = function (callback) { ' + endLine;
    script += '    if (typeof jwifi_logHit == "function") jwifi_logHit();' + endLine;
    script += '    (function (t, u, r) { ' + endLine;
    script += '      r = "&rd=" + Math.floor(1000 + Math.random() * 9000); ' + endLine;
    script += '      var img = new Image();' + endLine;
    script += '      img.src = hostLog + t + u + "&" + r; ' + endLine;
    script += '      img.onerror = function() {throw "Click unload";}; ' + endLine;
    script += '      img.onload = function() {if (typeof callback == "function") callback();}; ' + endLine;
    script += '     })("click.gif", q); ' + endLine;
    script += '};  ' + endLine;

    //jwifi_logHit new
    script += 'window.jwifiNumHit = 0; ' + endLine;
    script += 'window.jwifi_logHit = function (callback) { ' + endLine;
    script += '    window.jwifiNumHit++;' + endLine;
    script += '    (function (t, u, r) { ' + endLine;
    script += '      r = "&rd=" + Math.floor(1000 + Math.random() * 9000); ' + endLine;
    script += '      var img = new Image();' + endLine;
    script += '      img.src = hostLog + t + u + "&" + r; ' + endLine;
    script += '      img.onerror = function() {if (typeof callback == "function") callback(); throw "Hit unload";}; ' + endLine;
    script += '      img.onload = function() {if (typeof callback == "function") callback();}; ' + endLine;
    script += '     })("hit", q); ' + endLine;
    script += '};  ' + endLine;
    //End jwifi_logHit new

    script += 'window.jwifi_login_hotspot_withoutssl = function (profile, callback) { ' + endLine;
    script += '   var url = "http://' + CONF.HOST + '/login/' + type_ap + '/" + window.location.search + "&redirect=" + encodeURIComponent(jwifi_clickUrl); ' + endLine;
    script += '   window.location =  url;' + endLine;
    script += '};  ' + endLine;

    script += '} else { /*demo*/ ' + endLine;
    script += '    jwifi_clickUrl = jwifi_landingpage;' + endLine;
    script += '}' + endLine;

    return res.send(script);
})

//Set landingpage for Access Point which not support parameter "redirectUrl"
router.get("/setredirectpage/", (req, res, next) => {
    //Get agrument from URL query string
    var query = req.query || {};

    // var mac_ap = query.ap_mac || query.mac_ap || 'DD-EE-FF-DD-EE-FF';
    // mac_ap = mac_ap.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();
    var mac_device = query.client_mac || query.mac_device || 'UN-KK-NN-OO-WW-NN';
    mac_device = mac_device.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();

    var redirectURL = query.redirecturl || CONF.LANDINGPAGE;

    logger.debug("landingpage[" + mac_device + "] =", redirectURL);
    Cache.setRaw("landingPage", mac_device, redirectURL, (err, result) => {
        if (err) logger.error(err)
    });

    res.header('Cache-Control', 'Cache-Control: max-age=60, must-revalidate');
    return res.sendFile(CONF.IMG_1x1, { headers: { 'Content-Type': 'image/gif' } });
})

//Set autologin for other page
router.post('/autologin/:type_ap/', (req, res, next) => {
    var query = req.query || {};//Get agrument from URL query string
    var body = req.body || {};//Get agrument from post data

    Process.getMac(req, (jsonRes) => {
        if (err) {
            logger.error("ERROR", err);
        }

        logger.debug(JSON.stringify(ap));
        jsonRes.ap = ap;
        jsonRes.username = body.username || "custombyap";
        jsonRes.password = body.password || "custombyap";
        jsonRes.redirectlink = body.redirect || CONF.LANDINGPAGE;

        return res.render('main_autologin', jsonRes);
    })
})

//Set autologin for other page
router.get('/autologin/:type_ap/', (req, res, next) => {
    var query = req.query || {};//Get agrument from URL query string
    var body = req.body || {};//Get agrument from post data

    logger.debug(query.redirect)
    Process.getMac(req, (jsonRes) => {
        jsonRes.username = query.username || "jwifi10m";
        jsonRes.password = query.password || "jwifi10m";
        jsonRes.redirectlink = query.redirect || CONF.LANDINGPAGE;

        return res.render('main_autologin', jsonRes);
    })
})

//Set autologin for other page
router.get('/login/:type_ap', (req, res, next) => {
    var query = req.query || {};//Get agrument from URL query string

    logger.debug(query.redirect)
    Process.getMac(req, (jsonRes) => {
        Cache.getRaw("AccessPoint", jsonRes.mac_ap, (err, ap) => {
            if (err) {
                logger.error("[GET AP FROM CACHE] ERROR", err);
            }

            if (ap) {
                jsonRes.apId = ap._id

                Process.getAccessPoint(jsonRes, (err, ap) => {
                    if (err) {
                        logger.error("ERROR", err);
                    }

                    //Render main.ejs with jsonRes
                    jsonRes.ap = ap;
                    jsonRes.username = query.username || "jwifi1h";
                    jsonRes.password = query.password || "jwifi1h";
                    jsonRes.redirectlink = query.redirect || CONF.LANDINGPAGE;
                    jsonRes.cloudkey = decodeURIComponent(ap.ip);

                    return res.render('main_autologin', jsonRes);
                })
            }
            else {
                var args = { schema: "AccessPoint", query: { status: "Active", mac: jsonRes.mac_ap } };

                logger.debug("[QUERY] -", JSON.stringify(args.query));
                JCloud.findOne(args, (err, ap) => {
                    if (err) {
                        logger.error("[GET AP FROM DB] ERROR", err);
                    }

                    if (!ap) {
                        ap = CONF.AP;
                    }
                    else {
                        Cache.setRaw("AccessPoint", ap.mac, ap, (err, result) => {
                            if (err) logger.error(err);
                        });
                    }

                    jsonRes.apId = ap._id;
                    Process.getAccessPoint(jsonRes, (err, ap) => {
                        if (err) {
                            logger.error("ERROR", err);
                        }

                        //Render main.ejs with jsonRes
                        jsonRes.ap = ap;
                        jsonRes.username = query.username || ap.username || "jwifi1h";
                        jsonRes.password = query.password || ap.password || "jwifi1h";
                        jsonRes.redirectlink = query.redirect || CONF.LANDINGPAGE;
                        jsonRes.cloudkey = decodeURIComponent(ap.ip);

                        return res.render('main_autologin', jsonRes);
                    })
                })
            }
        })
    })
})

module.exports = router;