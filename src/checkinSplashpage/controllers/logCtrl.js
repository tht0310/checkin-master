const router = Express.Router();
const UaParser = require('ua-parser-js');
const url = require('url');

//Log impression
router.get(/^\/(imp|imp.gif)$/, (req, res, next) => {
    res.header('Cache-Control', 'Cache-Control: max-age=60, must-revalidate');
    return res.sendFile(CONF.IMG_1x1, { headers: { 'Content-Type': 'image/gif' } });
})

//Log click and redirect
router.get('/click', (req, res, next) => {
    var query = req.query || {};
    var referer = req.headers.referrer || req.headers.referer || req.get('referrer') || false;

    const classData = Util.classify({
        lId: { type: String }, //Shorhand of Location Id
        apId: { type: String, required: true }, //Shorhand of Access Point Id
        cId: { type: String, required: true }, //Shorthand of Campaign Id
        bId: { type: String, required: true }, //Shorthand of Banner Id. Advoid browser remove ads
        mac_device: { type: String },
        mac_ap: { type: String },
        venue: { type: String },
        rdId: { type: String },
        hashId: { type: String }
    }, query);

    logger.info(JSON.stringify(query))

    classData.good.clientIP = req.headers['x-forwarded-for'] || '';
    classData.good.userAgent = UaParser(req.headers['user-agent']);
    classData.good.updatedAt = Util.now();


    var lId = classData.good.lId;
    var apId = classData.good.apId;
    var groupId = classData.good.groupId;
    var username = classData.good.username;
    var password = classData.good.password;
    var mac_device = classData.good.mac_device;
    var mac_ap = classData.good.mac_ap;
    var reason = classData.good.reason;
    var rdId = classData.good.rdId;
    var hashId1 = classData.good.hashId;
    logger.info(hashId1);

    var plain2 = lId + apId + mac_device + rdId + moment().subtract(1, "hours").format("YYYYMMDDHH");
    var hashId2 = Util.hash(plain2, rdId);
    logger.info(hashId2);

    var plain3 = lId + apId + mac_device + rdId + Util.now("YYYYMMDDHH");
    var hashId3 = Util.hash(plain3, rdId);
    logger.info(hashId3);

    if (referer && hashId1 && (hashId1 == hashId2 || hashId1 == hashId3)) {
        logger.info("CHECKIN CLICK INVALID HASH: ", hashId1, hashId2);
        var data = JSON.parse(JSON.stringify(classData.good));
        data.l = "post"
        data.invalid = "hash"
        data.radius = data.radius || 0;
        Log.logCheat(data);

        var query_args = { schema: 'AccessPoint', query: { mac_ap: mac_ap }, select: "session idle bwdown bwup group location till group" };
        logger.info("[" + mac_ap + "][" + mac_device + "]:", JSON.stringify(query_args.query));

        JCloud.findOne(query_args, (err, ap) => {
            if (err) {
                logger.error(err)
            }

            if (ap) {
                ap = JSON.parse(JSON.stringify(ap));
                var groupId = classData.groupId = ap.group;
                var d = Util.now("YYYY-MM-DD");

                var args = { schema: "Employee", query: [] }
                args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
                
                args.query.push({ $project: { pw: 0 } });
                args.query.push({ $match: { $expr: { $and: [{ $gte: [d, { $ifNull: ["$startAt", d] }] }, { $gte: [{ $ifNull: ["$endAt", d] }, d] }] } } })

                if (mac_device) {
                    args.query.push({ $match: { groupId: groupId, $or: [{ mac_device: mac_device }, { mmac: mac_device }, { dmac: mac_device }] } });
                }
                else if (username && password) {
                    args.query.push({ $match: { groupId: groupId, $or: [{ username: username }, { email: username }, { phone: username }] } });
                }
                else {
                    return;
                }

                args.query.push({
                    $lookup: {
                        from: "policy",
                        let: { pId: "$pId" },
                        pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } }],
                        as: "policy"
                    }
                });

                args.query.push({ $unwind: "$policy" });

                JCloud.aggregate(args, (err, employee) => {
                    if (err) {
                        logger.error(err)
                    }

                    employee = employee[0];
                    if (employee) {
                        if (username || password) {
                            if (password && Util.hashPassword(password, employee.salt).indexOf(employee.password) != -1) {
                                if (Util.isMac(mac_device)) {
                                    var device_type = (typeof classData.good.userAgent.device != 'undefined' && typeof classData.good.userAgent.device.type != 'undefined') ? classData.good.userAgent.device.type : "desktop";
                                    Checkin.updateMac({ eId: employee._id, mac_device: mac_device, device_type: device_type });
                                }
                            }
                            else {
                                Assistant.loginEOffice(username, password, (error, isValid) => {
                                    if (isValid) {
                                        if (Util.isMac(mac_device)) {
                                            var device_type = (typeof classData.good.userAgent.device != 'undefined' && typeof classData.good.userAgent.device.type != 'undefined') ? classData.good.userAgent.device.type : "desktop";
                                            Checkin.updateMac({ eId: employee._id, mac_device: mac_device, device_type: device_type });
                                        }
                                    }
                                })
                            }
                        }

                        var args = { schema: "Location", query: { _id: lId }, select: "_id lat long" }
                        JCloud.findOne(args, (err, location) => {
                            if (err) {
                                logger.error(err);
                                return;
                            }

                            if (location) {
                                location = JSON.parse(JSON.stringify(location));
                                employee = JSON.parse(JSON.stringify(employee));
                                employee.lId = lId;
                                employee.lat = location.lat;
                                employee.long = location.long;
                                employee.radius = 0;
                                if (reason) employee.reason = reason;
                                employee.l = "click";

                                Log.logTimeSheet(employee, function (err, result) {
                                    var hours = Math.floor(result.wt / 60);
                                    var minutes = result.wt % 60;

                                    var hoursOfWork = hours.toString() + "H" + minutes.toString() + "\"";

                                    var data = JSON.parse(JSON.stringify(classData.good));
                                    data.eId = employee._id;
                                    // delete data.username;
                                    delete data.password;
                                    data.lId = lId;
                                    data.l = "click";
                                    data.check = result.check;
                                    
                                    Log.logUser(data);
                                });
                            }
                        });
                    }
                })
            }
        })
    }

    var flag = false;
    var customLandingPage = query.landingpage || '';
    logger.info("customLandingPage:", customLandingPage);
    //Get Landingpage from DB
    JCloud.findOne({ schema: 'Banner', query: { _id: classData.good.bId } }, (err, result) => {
        if (err) logger.error(err)
        if (result) {
            logger.info(result.landingpage)
            flag = true;
            if (typeof result.openBrowser == "string" && result.openBrowser == "Active") {
                var ua = classData.good.userAgent.ua.toLowerCase();

                Cache.get("landingPage", { mac_device: query.mac_device }, (err, landingPage) => {
                    if (err) logger.error(err);
                    if (landingPage && landingPage.indexOf("landingpage") != -1) {
                        landingPage = decodeURIComponent(landingPage.split("landingpage=")[1]);
                        logger.info("landingPage[" + query.mac_device + "] =", landingPage);
                        return res.render("portal", { landingPage: landingPage, whenError: result.landingpage });
                    }
                    else if (customLandingPage) {
                        return res.render("portal", { landingPage: customLandingPage, whenError: "" });
                    } else {
                        return res.render("portal", { landingPage: result.landingpage, whenError: "" });
                    }
                })
            }
            else if (customLandingPage) {
                logger.info(customLandingPage);
                return res.redirect(customLandingPage);
            } else {
                return res.redirect(result.landingpage);
            }
        }
    })

    setTimeout(function () {
        if (!flag) {
            if (customLandingPage) {
                return res.redirect(customLandingPage);
            } else {
                return res.redirect(CONF.LANDINGPAGE);
            }
        }
    }, 3000);
})

//Log click by image
router.get('/click.gif', (req, res, next) => {
    res.header('Cache-Control', 'Cache-Control: max-age=60, must-revalidate');
    res.sendFile(CONF.IMG_1x1, { headers: { 'Content-Type': 'image/gif' } });
})

//Log hit: Before click to access internet. Detect losing click
router.get(/^\/(hit|hit.gif)$/, (req, res, next) => {
    res.header('Cache-Control', 'Cache-Control: max-age=60, must-revalidate');
    return res.sendFile(CONF.IMG_1x1, { headers: { 'Content-Type': 'image/gif' } });
})

//Log watched video
router.get(/^\/(watch|watch.gif)$/, (req, res, next) => {
    return res.sendFile(CONF.IMG_1x1, { headers: { 'Content-Type': 'image/gif', msg: JSON.stringify(err) } });
})

//Log profile.
router.get(/^\/(profile|profile.gif)$/, (req, res, next) => {
    res.sendFile(CONF.IMG_1x1, { headers: { 'Content-Type': 'image/gif' } });
})

router.get('/imp.js', (req, res, next) => {
    var query = req.query;
    var script = "";

    var referrer = req.headers.referrer || req.headers.referer || req.get('referrer') || "";

    if (referrer.indexOf("preview=true") == -1) {
        var rdId = Util.randomId();
        var imp = req.protocol + "://" + req.get('host') + "/log/imp.gif?";
        imp += "&lId=" + (query.lId || 1) + "&apId=" + (query.apId || 1) + "&cId=" + (query.cId || 1) + "&bId=" + (query.bId || 1) + "&rdId=" + rdId;

        var endLine = "";

        script = '(function (i, v, r) { ' + endLine;
        script += '        r = "&rd=" + Math.floor(1000 + Math.random() * 9000); ' + endLine;
        script += '        i = "&mac_device=" + ((typeof mac_device == "string") ? mac_device : ""); ' + endLine;
        script += '        v = "&venue=" + ((typeof venue == "string") ? venue : "");' + endLine;

        //Add to report AP
        script += '        var z =  ((typeof apId == "string") ? ("&apId=" + apId) : "");' + endLine;

        script += '        (new Image()).src = "' + imp + '" + i + v + z + "&" + r; ' + endLine;
        script += '})(); ' + endLine;

        script += 'window.onerror = function (msg, file, line, column, error) {' + endLine;
        script += '    try {' + endLine;
        script += '        if(typeof bannerId != "undefined") msg += ". bannerId=" + bannerId;' + endLine;
        script += '        var err = ["msg=" + msg, "url=" + encodeURIComponent(window.location.href), "file=" + encodeURIComponent(file), "line=" + line + ":" + column, "object=" + JSON.stringify(error)]; ' + endLine;
        script += '        console.log(JSON.stringify(err));' + endLine;
        script += '        (new Image()).src = "http://checkin.becawifi.vn/sp/log/error/?" + err.join("&");' + endLine;
        script += '    }' + endLine;
        script += '    catch (err) {' + endLine;
        script += '        console.log(err);' + endLine;
        script += '    }' + endLine;
        script += '    return false;' + endLine;
        script += '};' + endLine;
    }

    res.send(script);
})

//Log click by function js
//Usage: Add into body tag: <script src="http://{HOST}/log/click.js"></script>
//And call jwifi_click() when you need.
router.get('/click.js', (req, res, next) => {
    var query = req.query;
    var script = "";

    var referrer = req.headers.referrer || req.headers.referer || req.get('referrer') || "";

    if (referrer.indexOf("preview=true") == -1) {
        var rdId = Util.randomId();
        var fn = query.fn || "jwifi_logClick";

        var query = "&lId=" + (query.lId || 1) + "&apId="
            + (query.apId || 1) + "&cId=" + (query.cId || 1)
            + "&bId=" + (query.bId || 1) + "&rdId=" + rdId;

        var clickImage = req.protocol + "://" + req.get('host') + "/log/click.gif?" + query;
        var clickUrl = req.protocol + "://" + req.get('host') + "/log/click?" + query;

        // var endLine = "\n";
        var endLine = "";

        script = 'window.jwifi_clickUrl = "' + clickUrl + '&venue=" + ((typeof venue == "string") ? venue : "HCM");' + endLine;
        script += 'window.jwifi_clicked = false; function ' + fn + '(callback) {' + endLine;
        script += '    if (typeof jwifi_logHit == "function") jwifi_logHit();' + endLine;
        script += '    if(!window.jwifi_clicked) {' + endLine;
        script += '        (function (i, v, r) { ' + endLine;
        script += '             r = "&rd=" + Math.floor(1000 + Math.random() * 9000); ' + endLine;
        script += '             i = "&mac_device=" + ((typeof mac_device == "string") ? mac_device : ""); ' + endLine;
        script += '             v = "&venue=" + ((typeof venue == "string") ? venue : "HCM");' + endLine;

        //Add to report AP
        script += '             var z =  ((typeof apId == "string") ? ("&apId=" + apId) : "");' + endLine;

        script += '             (new Image()).src = "' + clickImage + '" + i + v + z + "&" + r; ' + endLine;
        script += '             if (typeof callback == "function") callback();' + endLine;
        script += '        })(); ' + endLine;
        script += '    }' + endLine;
        script += '    window.jwifi_clicked = true;' + endLine;
        script += '};  ' + endLine;
    }

    res.send(script);
})

//Get Profile user
router.get('/profile.js', (req, res, next) => {
    var query = req.query;
    var script = "";

    // var referrer = req.headers.referrer || req.headers.referer || req.get('referrer') || "";

    var rdId = Util.randomId();
    var fn = query.fn || "jwifi_logProfile";
    var profile = req.protocol + "://" + req.get('host') + "/log/profile.gif?";
    profile += "&lId=" + (query.lId || 1) + "&apId=" + (query.apId || 1) + "&cId=" + (query.cId || 1) + "&bId=" + (query.bId || 1) + "&rdId=" + rdId;

    var endLine = "";
    script = 'function ' + fn + '(p, callback) {' + endLine;
    script += '    var v = (typeof venue != "undefined")?("&venue=" + venue):""; ' + endLine;
    script += '    (function (i, r) { ' + endLine;
    script += '        r = "&rd=" + Math.floor(1000 + Math.random() * 9000); ' + endLine;
    script += '        i = "&mac_device=" + ((typeof mac_device == "string") ? mac_device : ""); ' + endLine;
    script += '        (new Image()).src = "' + profile + '" + p + i + v + "&" + r; ' + endLine;
    script += '       if (typeof callback == "function") callback();' + endLine;
    script += '    })(); ' + endLine;
    script += '};  ' + endLine;

    res.send(script);
})

//Log watch video by function js
router.get('/watch.js', (req, res, next) => {
    var query = req.query;
    var script = "";

    var referrer = req.headers.referrer || req.headers.referer || req.get('referrer') || "";

    if (referrer.indexOf("ads6") == -1 && referrer.indexOf("ads7") == -1) {
        var rdId = Util.randomId();
        var fn = query.fn || "jwifi_logVideo";
        var watch = req.protocol + "://" + req.get('host') + "/log/watch.gif?";
        watch += "&lId=" + (query.lId || 1) + "&apId=" + (query.apId || 1) + "&cId=" + (query.cId || 1) + "&bId=" + (query.bId || 1) + "&rdId=" + rdId;

        var endLine = "";

        //new
        script = 'function ' + fn + '(w) {' + endLine;
        script += '    (function (i, v, r) { ' + endLine;
        script += '        r = "&rd=" + Math.floor(1000 + Math.random() * 9000); ' + endLine;
        script += '        i = "&mac_device=" + ((typeof mac_device == "string") ? mac_device : ""); ' + endLine;
        script += '        v = "&venue=" + ((typeof venue == "string") ? venue : "");' + endLine;
        script += '       (new Image()).src = "' + watch + '" + i + v + "&w=" + w + "&" + r; ' + endLine;
        script += '       if (typeof callback == "function") callback();' + endLine;
        script += '    })(); ' + endLine;
        script += '}';
    }

    res.send(script);
})

//Friendly URL log click. Use for stupid browser.
router.get('/:type_ap/click/:lId/:apId/:cId/:bId/:mac_device/:venue/:kindof/', (req, res, next) => {
    var query = req.query;
    var params = req.params;
    if (!params.mac_device) {
        params.mac_device == "DD-EE-FF-DD-EE-FF";
    }

    var host = url.format({ protocol: req.protocol, host: req.get('host') })
    params.mac_device = params.mac_device.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();

    var urlClick = host + "/log/click/";
    urlClick += "?lId=" + params.lId;
    urlClick += "&apId=" + params.apId;
    urlClick += "&cId=" + params.cId;
    urlClick += "&bId=" + params.bId;
    urlClick += "&mac_device=" + params.mac_device;
    urlClick += "&venue=" + params.venue;
    urlClick += "&city=" + params.venue;
    urlClick += "&kindof=" + params.kindof;
    urlClick += "&type_ap=" + params.type_ap;
    if (query.landingpage) urlClick += "&landingpage=" + query.landingpage;

    return res.redirect(urlClick);
})

//Friendly URL log click without venue and kindof. Use for stupid browser.
router.get('/:type_ap/click/:lId/:apId/:cId/:bId/:mac_device/:venue/', (req, res, next) => {
    var query = req.query;
    var params = req.params;
    if (!params.mac_device) {
        params.mac_device == "DD-EE-FF-DD-EE-FF";
    }

    var host = url.format({ protocol: req.protocol, host: req.get('host') })
    params.mac_device = params.mac_device.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();

    var urlClick = host + "/log/click/";
    urlClick += "?lId=" + params.lId;
    urlClick += "&apId=" + params.apId;
    urlClick += "&cId=" + params.cId;
    urlClick += "&bId=" + params.bId;
    urlClick += "&mac_device=" + params.mac_device;
    urlClick += "&type_ap=" + params.type_ap;
    urlClick += "&venue=" + params.venue;
    urlClick += "&kindof=free";
    if (query.landingpage) urlClick += "&landingpage=" + query.landingpage;

    return res.redirect(urlClick);
})

//Friendly URL log click without venue and kindof. Use for stupid browser.
router.get('/:type_ap/click/:lId/:apId/:cId/:bId/:mac_device/', (req, res, next) => {
    var query = req.query;
    var params = req.params;
    if (!params.mac_device) {
        params.mac_device == "DD-EE-FF-DD-EE-FF";
    }

    var host = url.format({ protocol: req.protocol, host: req.get('host') })
    params.mac_device = params.mac_device.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();

    var urlClick = host + "/log/click/";
    urlClick += "?lId=" + params.lId;
    urlClick += "&apId=" + params.apId;
    urlClick += "&cId=" + params.cId;
    urlClick += "&bId=" + params.bId;
    urlClick += "&mac_device=" + params.mac_device;
    urlClick += "&type_ap=" + params.type_ap;
    urlClick += "&venue=HCM&kindof=free";
    if (query.landingpage) urlClick += "&landingpage=" + query.landingpage;

    return res.redirect(urlClick);
})

//Log error
router.get('/error/', (req, res, next) => {
    res.header('Cache-Control', 'Cache-Control: max-age=60, must-revalidate');
    var query = req.query || {};

    try {
        var ua = UaParser(req.headers['user-agent']);
        var browser = ua.browser.name + (ua.browser.version || "");
        var os = ua.os.name + ua.os.version;
        if (typeof query.url == "object") {
            query.url = query.url[0]
        }

        var msg = "";
        if (typeof query.url != "undefined") {
            var mac = query.url.match(/&(mac_device|client_mac|mac|clientMac)=([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/)[0].replace(/&(mac_device|client_mac|mac|clientMac)=/, "").replace(/:/g, "").toUpperCase();

            msg += "\n[ERROR] [" + mac + "] [" + os + "] [" + browser + "] [Message]:" + query.msg;
            msg += "\n[ERROR] [" + mac + "] [" + os + "] [" + browser + "] [URL]:" + query.url;
            msg += "\n[ERROR] [" + mac + "] [" + os + "] [" + browser + "] [File]:" + query.file;
            msg += "\n[ERROR] [" + mac + "] [" + os + "] [" + browser + "] [Line]:" + query.line;
            msg += "\n[ERROR] [" + mac + "] [" + os + "] [" + browser + "] [Object]:" + query.object;
            logger.info(msg)
        }
        else {
            msg += "\n[ERROR] [" + os + "] [" + browser + "] [Message]:" + query.msg;
            msg += "\n[ERROR] [" + os + "] [" + browser + "] [URL]:" + query.url;
            msg += "\n[ERROR] [" + os + "] [" + browser + "] [File]:" + query.file;
            msg += "\n[ERROR] [" + os + "] [" + browser + "] [Line]:" + query.line;
            msg += "\n[ERROR] [" + os + "] [" + browser + "] [Object]:" + query.object;
            logger.info(msg)
        }

        return res.sendFile(CONF.IMG_1x1, { headers: { 'Content-Type': 'image/gif' } });
    } catch (err) {
        logger.error(err)
        return res.sendFile(CONF.IMG_1x1, { headers: { 'Content-Type': 'image/gif', msg: JSON.stringify(err) } });
    }
})

module.exports = router
