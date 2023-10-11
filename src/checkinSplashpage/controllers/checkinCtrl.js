const router = Express.Router();
const { calendarFormat } = require('moment');
const UaParser = require('ua-parser-js');

var multer = require('multer')({
    dest: '/tmp/',
    limits: {
        fileSize: 300000 //300kb
    }
}).any();

var fs = require('fs');
var shell = require('shelljs');

//Get event Everywhen Checkin
router.post("/", (req, res, next) => {
    try {
        var body = req.body || {};
        const classData = Util.classify({
            groupId: { type: String, required: true },
            lId: { type: String }, //Shorthand of location Id.
            apId: { type: String }, //Shorthand of location Id.
            eId: { type: String }, //Shorthand of employee Id
            username: { type: String },
            password: { type: String },
            mac_ap: { type: String },
            mac_device: { type: String },
            rdId: { type: String },
            hashId: { type: String },
        }, body);

        if (Object.keys(classData.bad).length) {
            return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "BAD QUERY: missed field", translate: "Yêu cầu không hợp lệ (Thiếu dữ liệu)" });
        }

        let l = "click";
        let by = "wifi";
        let method = "wifi";
        classData.good.userAgent = UaParser(req.headers['user-agent']);
        var eId = classData.good.eId;
        var lId = classData.good.lId;
        var apId = classData.good.apId;
        var groupId = classData.good.groupId;
        var username = classData.good.username;
        var password = classData.good.password;
        var mac_device = classData.good.mac_device;
        var rdId = classData.good.rdId;
        var hashId1 = classData.good.hashId;

        var plain2 = lId + apId + mac_device + rdId + moment().subtract(1, "hours").format("YYYYMMDDHH");
        var hashId2 = encodeURIComponent(Util.hash(plain2, rdId));

        var plain3 = lId + apId + mac_device + rdId + Util.now("YYYYMMDDHH");
        var hashId3 = encodeURIComponent(Util.hash(plain3, rdId));

        // logger.debug(hashId1);
        // logger.debug(hashId2);
        // logger.debug(hashId3);
        // logger.debug(!hashId1, "||", hashId1 != hashId2, "&&", hashId1 != hashId3, "=", (!hashId1 || (hashId1 != hashId2 && hashId1 != hashId3)));

        if (!hashId1 || (hashId1 != hashId2 && hashId1 != hashId3)) {
            logger.debug("CHECKIN INVALID HASH: ", hashId1, hashId2);
            var data = JSON.parse(JSON.stringify(classData.good));
            data.l = l;
            data.by = by;
            data.invalid = "hash"
            data.radius = data.radius || 0;
            Log.logCheat(data);
        }

        Checkin.getEmployee(classData.good, (err, employee) => {
            if (err) { logger.error(err) }
            if (employee) {
                logger.debug("Employee: ", employee.name);
                Checkin.getRSbyMethod(classData.good, (err, location) => {
                    if (err) {
                        logger.error(err);
                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message, translate: "Đã có lỗi xảy ra!" });
                    }

                    var allowMethod = (location && location.priority === true) ? (location.method || {}) : employee.policy.method;
                    if (allowMethod[method] && allowMethod[method] !== false) {
                        location = JSON.parse(JSON.stringify(location));
                        employee = JSON.parse(JSON.stringify(employee));
                        employee.l = l;
                        employee.by = by;
                        employee.lId = location._id || 0;
                        employee.lat = classData.good.lat = classData.good.lat || location.lat;
                        employee.long = classData.good.long = classData.good.long || location.long;
                        employee.radius = location.radius || 0;

                        Log.checkTimeSheet(employee, function (err, result) {
                            var hours = Math.floor(result.wt / 60);
                            var minutes = result.wt % 60;
                            var hoursOfWork = hours.toString() + "H" + minutes.toString() + "\"";

                            return res.json({ status: true, code: 200, hoursOfWork: hoursOfWork, ...result, code: 200 });
                        });
                    }
                    else {
                        return res.status(405).json({ status: false, code: 405, msgCode: "not-allowed", message: "Method Not Allowed!", translate: "Yêu cầu không hợp lệ (Vị trí này không cho phép chấm bằng wifi hotspot)" });
                    }
                });
            }
            else {
                return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Employee Not Found!", translate: "Xin lỗi! Không tìm thấy tên bạn." });
            }
        })
    }
    catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
    }
})

//Checkin by QR Code
router.post("/qr", (req, res, next) => {
    try {
        var token = req.headers.token;

        if (!token) {
            return res.status(403).json({ status: false, code: 403, msgCode: "token-missed", message: "Token missed", translate: "Yêu cầu không hợp lệ (Thiếu Token)" });
        }

        var body = req.body || {};
        const classData = Util.classify({
            // groupId: { type: String, required: true },
            // eId: { type: String },
            code: { type: String },
            lId: { type: String },
            lat: { type: Number },
            long: { type: Number },
            radius: { type: Number },
            sc: { type: String },
            rd: { type: String },
            uniqueId: { type: String },
            deviceInfo: { type: String }
        }, body);

        if (Object.keys(classData.bad).length) {
            return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "BAD QUERY: missed field", translate: "Yêu cầu không hợp lệ (Thiếu dữ liệu)" });
        }

        let l = "qr";
        let by = "qr";
        let method = "qr";

        classData.good.userAgent = UaParser(req.headers['user-agent']);
        logger.debug(JSON.stringify(classData.good));
        let decodeToken = Util.decryptToken(token);
        let secret = CONF.SECRET

        if (decodeToken && decodeToken.s) {
            secret += decodeToken.s
        }

        Util.verifyToken(token, secret, (err, result) => {
            if (err) {
                logger.error(err.message);
            }

            if (result) {
                var eId = result._id;
                classData.good.eId = eId;
                var groupId = result.group._id;
                classData.good.groupId = groupId;

                var plain = classData.good.groupId + classData.good.eId + classData.good.lId + classData.good.code + classData.good.lat + classData.good.long + Util.now("YYYYMMDD");
                var hash = Util.hash(plain, classData.good.sc);

                if (!classData.good.sc || classData.good.rd != hash) {
                    logger.debug("CHECKIN INVALID HASH: ", hash, classData.good.rd);
                    var data = JSON.parse(JSON.stringify(classData.good));
                    data.l = l
                    data.by = by;
                    data.invalid = "hash"
                    data.radius = data.radius || 0;
                    Log.logCheat(data);
                    return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid Hash", translate: "Yêu cầu không hợp lệ (Mã hóa sai )" });
                }

                Checkin.getEmployee(classData.good, (err, employee) => {
                    if (err) { logger.error(err) }
                    if (employee) {
                        logger.debug("Employee: ", employee.name);
                        Checkin.getRSbyMethod(classData.good, (err, group) => {
                            if (err) {
                                logger.error(err);
                                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message, translate: "Đã có lỗi xảy ra!" });
                            }

                            var allowMethod = (group.location && group.location.priority === true) ? (group.location.method || {}) : employee.policy.method;
                            if (allowMethod[method] && allowMethod[method] !== false) {
                                if (group) {
                                    var qrcode = group.qrcode || group._id;
                                    logger.debug("QRCode", classData.good.code, qrcode);
                                    // if (classData.good.code == qrcode) {
                                    if (classData.good.radius > employee.policy.radius) {
                                        var data = JSON.parse(JSON.stringify(classData.good));
                                        data.l = l
                                        data.by = by;
                                        Log.logUser(data);
                                        return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid Location!", translate: "Yêu cầu không hợp lệ (Sai vị trí)" });
                                    }
                                    else {
                                        employee = JSON.parse(JSON.stringify(employee));
                                        employee.lat = classData.good.lat;
                                        employee.long = classData.good.long;
                                        employee.lId = classData.good.lId;
                                        employee.l = l;
                                        employee.radius = classData.good.radius || 0;
                                        if (classData.good.hash) employee.hash = classData.good.hash

                                        Log.logTimeSheet(employee, function (err, result) {
                                            if (err) {
                                                logger.debug(err);
                                                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
                                            }

                                            var hours = Math.floor(result.wt / 60);
                                            var minutes = result.wt % 60;

                                            var hoursOfWork = hours.toString() + "H" + minutes.toString() + "\"";

                                            var data = JSON.parse(JSON.stringify(classData.good));
                                            data.l = l;
                                            data.by = by;
                                            data.check = result.check;
                                            Log.logUser(data);

                                            let check = CONF.BECAWORK.CHECK[(result.check ? result.check : "checkout")]

                                            var logUser = {
                                                ...result.data,
                                                userId: employee.email,//Id Nhan vien
                                                method: CONF.BECAWORK.METHOD[method], // 1:GPS, 2: Wifi, 3: BSSID, 4:QRCode, 5:FaceID
                                                check: check,//checkin: cham vao, checkout: cham ra                                                   
                                                at: moment.parseZone().utc(true).format()
                                            }

                                            Log.sendLogUser(logUser);

                                            return res.json({ status: true, code: 200, message: "Success", hoursOfWork: hoursOfWork, ...result });
                                        });
                                    }
                                }
                                else {
                                    return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "QRCode Not Found!", translate: "Không tìm thấy QR Code" });
                                }
                            }
                            else {
                                return res.status(405).json({ status: false, code: 405, msgCode: "not-allowed", message: "Method Not Allowed!", translate: "Yêu cầu không hợp lệ (Vị trí này không cho phép chấm bằng QR Code)" });
                            }
                        })
                    }
                })

                var uniqueId = classData.good.uniqueId;
                var deviceInfo = classData.good.deviceInfo;
                if (uniqueId && eId) {
                    Assistant.setUserDevice({ uniqueId, groupId, eId, deviceInfo });
                }
            }
        })
    }
    catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
    }
})

//Checkin by app/mac_ap
router.post("/:method(bssid|byap)", (req, res, next) => {
    try {
        // logger.debug("HEADER:", JSON.stringify(req.headers));
        // logger.debug("BODY", JSON.stringify(req.body));

        var token = req.headers.token;

        if (!token) {
            return res.status(403).json({ status: false, code: 403, msgCode: "token-missed", message: "Token missed", translate: "Yêu cầu không hợp lệ (Thiếu Token)" });
        }

        var body = req.body || {};

        const classData = Util.classify({
            mac_ap: { type: String },
            bssid: { type: String },
            mac_device: { type: String },
            sc: { type: String },
            rd: { type: String },
            uniqueId: { type: String },
            deviceInfo: { type: String },
        }, body);

        if (Object.keys(classData.bad).length) {
            return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "BAD QUERY: missed field", translate: "Yêu cầu không hợp lệ (Thiếu dữ liệu)" });
        }

        let l = "byap";
        let by = "bssid";
        let method = "bssid";

        let decodeToken = Util.decryptToken(token);
        let secret = CONF.SECRET

        if (decodeToken && decodeToken.s) {
            secret += decodeToken.s
        }

        Util.verifyToken(token, secret, (err, result) => {
            if (err) {
                logger.error(err.message);
            }

            if (result) {
                var eId = result._id;
                var groupId = result.group._id;
                var mac_ap = classData.good.bssid || classData.good.mac_ap;
                classData.good.eId = eId;
                classData.good.groupId = groupId;
                classData.good.eId = eId //always (mac_device can blank)

                var plain = classData.good.groupId + classData.good.eId + classData.good.bssid + classData.good.uniqueId + Util.now("YYYYMMDD");
                var hash = Util.hash(plain, classData.good.sc);

                if (!classData.good.sc || classData.good.rd != hash) {
                    logger.debug("[CHECKIN] INVALID HASH: ", hash, classData.good.rd);
                    var data = JSON.parse(JSON.stringify(classData.good));
                    data.l = l
                    data.by = by;
                    data.invalid = "hash"
                    data.radius = data.radius || 0;
                    Log.logCheat(data);
                    return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid Hash", translate: "Yêu cầu không hợp lệ (Mã hóa sai )" });
                }
                else {
                    logger.debug("[CHECKIN] VALID HASH: ", hash, classData.good.rd);
                }

                if (classData.good.mac_device) classData.good.mac_device = classData.good.mac_device.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();
                // logger.debug("MAC AP", mac_ap);
                if (mac_ap) {
                    mac_ap = mac_ap.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();
                }

                if (!Util.isMac(mac_ap)) {
                    return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid MAC address", translate: "Yêu cầu không hợp lệ (BSSID không đúng format)" });
                }

                if (!eId) {
                    var data = JSON.parse(JSON.stringify(classData.good));
                    data.l = l;
                    data.by = by;
                    data.radius = data.radius || 0;
                    data.invalid = "token"
                    logger.debug("CHEAT TOKEN");
                    Log.logCheat(data);
                    return res.json({ status: true, code: 200 });
                }

                Checkin.getEmployee(classData.good, (err, employee) => {
                    if (err) {
                        logger.error(err)
                    }

                    if (employee) {
                        logger.debug("Employee: ", employee.name);
                        Checkin.getRSbyMethod(classData.good, (err, ap) => {
                            if (err) {
                                logger.error(err);
                                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message, translate: "Đã có lỗi xảy ra!" });
                            }

                            var allowMethod = (ap.location && ap.location.priority === true) ? (ap.location.method || {}) : employee.policy.method;
                            if (allowMethod[method] && allowMethod[method] !== false) {
                                if (ap) {
                                    employee = JSON.parse(JSON.stringify(employee));
                                    employee.lat = ap.location.lat;
                                    employee.long = ap.location.long;
                                    employee.lId = ap.location._id;
                                    employee.l = l;
                                    employee.radius = 0;

                                    Log.logTimeSheet(employee, function (err, result) {
                                        if (err) {
                                            logger.debug(err);
                                            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
                                        }

                                        var hours = Math.floor(result.wt / 60);
                                        var minutes = result.wt % 60;

                                        var hoursOfWork = hours.toString() + "H" + minutes.toString() + "\"";

                                        var data = JSON.parse(JSON.stringify(classData.good));
                                        data.l = l;
                                        data.by = by;
                                        data.check = result.check;

                                        data.lId = ap.location._id;
                                        data.eId = eId;
                                        data.groupId = employee.groupId;
                                        data.lat = ap.location.lat;
                                        data.long = ap.location.long;
                                        Log.logUser(data);

                                        let check = CONF.BECAWORK.CHECK[(result.check ? result.check : "checkout")]

                                        var logUser = {
                                            ...result.data,
                                            userId: employee.email,//Id Nhan vien
                                            method: CONF.BECAWORK.METHOD[method], // 1:GPS, 2: Wifi, 3: BSSID, 4:QRCode, 5:FaceID
                                            check: check,//checkin: cham vao, checkout: cham ra                                                   
                                            at: moment.parseZone().utc(true).format()
                                        }

                                        Log.sendLogUser(logUser);

                                        return res.json({ status: true, code: 200, message: "Success", hoursOfWork: hoursOfWork, ...result });
                                    });
                                }
                                else {
                                    res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "BSSID Not Found!", translate: "BSSID chưa được khai báo!" });
                                }
                            }
                            else {
                                return res.status(405).json({ status: false, code: 405, msgCode: "not-allowed", message: "Method Not Allowed!", translate: "Yêu cầu không hợp lệ (Vị trí này không cho phép chấm bằng wifi BSSID)" });
                            }
                        })
                    }
                    else {
                        res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Employee Not Found!", translate: "Xin lỗi! Không tìm thấy tên bạn." });
                    }
                });

                var uniqueId = classData.good.uniqueId;
                var deviceInfo = classData.good.deviceInfo;
                if (uniqueId && eId) {
                    Assistant.setUserDevice({ uniqueId, groupId, eId, deviceInfo });
                }
            }
        })
    }
    catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
    }
})

//Checkin by app/mac_ap
router.post("/hik", (req, res, next) => {
    try {
        var body = req.body || {};

        var token = req.headers.token;

        if (!token || token != CONF.HIK_TOKEN) {
            return res.status(403).json({ status: false, code: 403, msgCode: "token-missed", message: "Token missed", translate: "Yêu cầu không hợp lệ (Thiếu Token)" });
        }

        const classData = Util.classify({
            type: { type: String },
            eId: { type: String },
            hikId: { type: String },
            apId: { type: String }
        }, body);

        if (Object.keys(classData.bad).length) {
            return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "BAD QUERY: missed field", translate: "Yêu cầu không hợp lệ (Thiếu dữ liệu)" });
        }

        if (["face", "fingerprint"].indexOf(classData.good.type) == -1) {
            return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "BAD QUERY: type invalid", translate: "Yêu cầu không hợp lệ" });
        }

        let l = "hik-" + classData.good.type
        let by = "byhik";
        let method = "hik";

        Checkin.getEmployee(classData.good, (err, employee) => {
            if (err) {
                logger.error(err)
            }

            if (employee) {
                logger.debug("Employee: ", employee.name);
                classData.good.groupId = employee.groupId;
                Checkin.getRSbyMethod(classData.good, (err, device) => {
                    if (err) {
                        logger.error(err);
                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message, translate: "Đã có lỗi xảy ra!" });
                    }

                    var allowMethod = (device.location && device.location.priority === true) ? (device.location.method || {}) : employee.policy.method;
                    if (allowMethod[method] && allowMethod[method] !== false) {
                        if (device) {
                            employee = JSON.parse(JSON.stringify(employee));
                            employee.lat = device.location.lat;
                            employee.long = device.location.long;
                            employee.lId = device.location._id;
                            employee.l = l;
                            employee.radius = 0;

                            Log.logTimeSheet(employee, function (err, result) {
                                if (err) {
                                    logger.debug(err);
                                    return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
                                }

                                var hours = Math.floor(result.wt / 60);
                                var minutes = result.wt % 60;

                                var hoursOfWork = hours.toString() + "H" + minutes.toString() + "\"";

                                var data = JSON.parse(JSON.stringify(classData.good));
                                data.l = l;
                                data.by = by;
                                data.check = result.check;

                                data.lId = device.location._id;
                                data.groupId = employee.groupId;
                                data.lat = device.location.lat;
                                data.long = device.location.long;
                                Log.logUser(data);

                                let check = CONF.BECAWORK.CHECK[(result.check ? result.check : "checkout")]

                                var logUser = {
                                    ...result.data,
                                    userId: employee.email,//Id Nhan vien
                                    method: CONF.BECAWORK.METHOD[method], // 1:GPS, 2: Wifi, 3: BSSID, 4:QRCode, 5:FaceID
                                    check: check,//checkin: cham vao, checkout: cham ra                                                   
                                    at: moment.parseZone().utc(true).format()
                                }

                                Log.sendLogUser(logUser);

                                return res.json({ status: true, code: 200, message: "Success", hoursOfWork: hoursOfWork, ...result });
                            });
                        }
                        else {
                            return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "HiK Device Not Found!", translate: "Yêu cầu không hợp lệ (Máy chấm công chưa được khai báo)" });
                        }
                    }
                    else {
                        return res.status(405).json({ status: false, code: 405, msgCode: "not-allowed", message: "Method Not Allowed!", translate: "Yêu cầu không hợp lệ (Vị trí này không cho phép chấm bằng máy chấm công)" });
                    }
                })
            }
            else {
                return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Employee Not Found!", translate: "Xin lỗi! Không tìm thấy tên bạn." });
            }
        });
    }
    catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
    }
})

//Checkin by QR Code
router.post("/:method(bygps|gps)", (req, res, next) => {
    try {
        var token = req.headers.token;

        if (!token) {
            return res.status(403).json({ status: false, code: 403, msgCode: "token-missed", message: "Token missed", translate: "Yêu cầu không hợp lệ (Thiếu Token)" });
        }

        var body = req.body || {};
        const classData = Util.classify({
            lId: { type: String },
            lat: { type: Number },
            long: { type: Number },
            radius: { type: Number },
            sc: { type: String },
            rd: { type: String },
            uniqueId: { type: String },
            deviceInfo: { type: String }
        }, body);

        if (Object.keys(classData.bad).length) {
            return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "BAD QUERY: missed field", translate: "Yêu cầu không hợp lệ (Thiếu dữ liệu)" });
        }

        let l = "bygps";
        let by = "gps";
        let method = "gps";

        classData.good.userAgent = UaParser(req.headers['user-agent']);

        let decodeToken = Util.decryptToken(token);
        let secret = CONF.SECRET

        if (decodeToken && decodeToken.s) {
            secret += decodeToken.s
        }

        Util.verifyToken(token, secret, (err, result) => {
            if (err) {
                logger.error(err.message);
            }

            if (result) {
                var eId = result._id;
                var groupId = result.group._id;
                classData.good.eId = eId;
                classData.good.groupId = groupId;

                var plain = classData.good.groupId + classData.good.eId + classData.good.lId + classData.good.lat + classData.good.long + Util.now("YYYYMMDD");
                var hash = Util.hash(plain, classData.good.sc);

                if (classData.good.sc) {
                    if (!classData.good.sc || classData.good.rd != hash) {
                        logger.debug("[CHECKIN] INVALID HASH: ", hash, classData.good.rd);
                        var data = JSON.parse(JSON.stringify(classData.good));
                        data.l = l;
                        data.by = by;
                        data.invalid = "hash";
                        data.radius = data.radius || 0;
                        Log.logCheat(data);
                        return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid Hash", translate: "Yêu cầu không hợp lệ (Mã hóa sai )" });
                    }
                    else {
                        logger.debug("[CHECKIN] VALID HASH: ", hash, classData.good.rd);
                    }
                }

                Checkin.getEmployee(classData.good, (err, employee) => {
                    if (err) {
                        logger.error(err)
                    }

                    if (employee) {
                        logger.debug("Employee: ", employee.name);
                        classData.good.groupId = groupId;
                        classData.good.pId = employee.policy._id;

                        Checkin.getRSbyMethod(classData.good, (err, location) => {
                            if (err) {
                                logger.error(err);
                                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
                            }

                            var allowMethod = (location && location.priority === true) ? (location.method || {}) : employee.policy.method;
                            if (allowMethod[method] && allowMethod[method] !== false) {
                                logger.debug(JSON.stringify(location));
                                if (!location || typeof location.radius == "undefined") {
                                    var data = JSON.parse(JSON.stringify(classData.good));
                                    data.l = l;
                                    data.by = by;
                                    Log.logUser(data);

                                    return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid Location!", translate: "Yêu cầu không hợp lệ (Sai vị trí)" });
                                }
                                else {
                                    employee = JSON.parse(JSON.stringify(employee));
                                    employee.lat = classData.good.lat;
                                    employee.long = classData.good.long;
                                    employee.lId = location._id;
                                    employee.l = "bygps";
                                    employee.radius = location.radius || classData.good.radius;

                                    if (classData.good.hash) employee.hash = classData.good.hash;

                                    Log.logTimeSheet(employee, function (err, result) {
                                        if (err) {
                                            logger.debug(err);
                                            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
                                        }

                                        var hours = Math.floor(result.wt / 60);
                                        var minutes = result.wt % 60;

                                        var hoursOfWork = hours.toString() + "H" + minutes.toString() + "\"";

                                        classData.good.lId = location._id;
                                        classData.good.radius = location.radius || classData.good.radius;

                                        var data = JSON.parse(JSON.stringify(classData.good));
                                        data.l = l;
                                        data.by = by;
                                        data.check = result.check;
                                        Log.logUser(data);

                                        let check = CONF.BECAWORK.CHECK[(result.check ? result.check : "checkout")]

                                        var logUser = {
                                            ...result.data,
                                            userId: employee.email,//Id Nhan vien
                                            method: CONF.BECAWORK.METHOD[method], // 1:GPS, 2: Wifi, 3: BSSID, 4:QRCode, 5:FaceID
                                            check: check,//checkin: cham vao, checkout: cham ra                                                   
                                            at: moment.parseZone().utc(true).format()
                                        }

                                        Log.sendLogUser(logUser);

                                        return res.json({ status: true, code: 200, message: "Success", hoursOfWork: hoursOfWork, ...result });
                                    });
                                }
                            }
                            else {
                                return res.status(405).json({ status: false, code: 405, msgCode: "not-allowed", message: "Method Not Allowed!", translate: "Yêu cầu không hợp lệ (Vị trí này không cho phép chấm bằng gps)" });
                            }
                        })
                    }
                    else {
                        return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Employee Not Found!", translate: "Xin lỗi! Không tìm thấy tên bạn." });
                    }
                })

                var uniqueId = classData.good.uniqueId;
                var deviceInfo = classData.good.deviceInfo;
                if (uniqueId && eId) {
                    Assistant.setUserDevice({ uniqueId, groupId, eId, deviceInfo });
                }
            }
        })
    }
    catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
    }
})

//Checkin by QR Code
router.post("/gpsselfie", (req, res, next) => {
    multer(req, res, function (err) {
        if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message, translate: "Đã có lỗi xảy ra!" });
        }
        try {
            var token = req.headers.token;

            if (!token) {
                return res.status(403).json({ status: false, code: 403, msgCode: "token-missed", message: "Token missed", translate: "Yêu cầu không hợp lệ (Thiếu Token)" });
            }

            var body = req.body || {};
            const classData = Util.classify({
                lId: { type: String },
                lat: { type: Number },
                long: { type: Number },
                radius: { type: Number },
                sc: { type: String },
                rd: { type: String },
                uniqueId: { type: String },
                deviceInfo: { type: String }
            }, body);

            if (Object.keys(classData.bad).length) {
                return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "BAD QUERY: missed field", translate: "Yêu cầu không hợp lệ (Thiếu dữ liệu)" });
            }

            var files = req.files;
            if (files.length > 0) {
                var file = files[0];
                if (file.mimetype.indexOf("image") == -1) {
                    return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid File", translate: "Yêu cầu không hợp lệ (Sai hình ảnh)" });
                }

                let l = "bygps";
                let by = "gps";
                let method = "gpsselfie";

                classData.good.userAgent = UaParser(req.headers['user-agent']);

                let decodeToken = Util.decryptToken(token);
                let secret = CONF.SECRET

                if (decodeToken && decodeToken.s) {
                    secret += decodeToken.s
                }

                Util.verifyToken(token, secret, (err, result) => {
                    if (err) {
                        logger.error(err.message);
                    }

                    if (result) {
                        var eId = result._id;
                        var groupId = result.group._id;
                        classData.good.eId = eId;
                        classData.good.groupId = groupId;

                        var plain = classData.good.groupId + classData.good.eId + classData.good.lId + classData.good.lat + classData.good.long + Util.now("YYYYMMDD");
                        var hash = Util.hash(plain, classData.good.sc);

                        if (classData.good.sc) {
                            if (!classData.good.sc || classData.good.rd != hash) {
                                logger.debug("[CHECKIN] INVALID HASH: ", hash, classData.good.rd);
                                var data = JSON.parse(JSON.stringify(classData.good));
                                data.l = l;
                                data.by = by;
                                data.invalid = "hash";
                                data.radius = data.radius || 0;
                                Log.logCheat(data);
                                return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid Hash", translate: "Yêu cầu không hợp lệ (Mã hóa sai )" });
                            }
                            else {
                                logger.debug("[CHECKIN] VALID HASH: ", hash, classData.good.rd);
                            }
                        }

                        Checkin.getEmployee(classData.good, (err, employee) => {
                            if (err) {
                                logger.error(err)
                            }

                            if (employee) {
                                logger.debug("Employee: ", employee.name);
                                classData.good.groupId = groupId;
                                classData.good.pId = employee.policy._id;

                                Checkin.getRSbyMethod(classData.good, (err, location) => {
                                    if (err) {
                                        logger.error(err);
                                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
                                    }


                                    var allowMethod = (location && location.priority === true) ? (location.method || {}) : employee.policy.method;
                                    if (allowMethod[method] && allowMethod[method] !== false) {
                                        logger.debug(JSON.stringify(location));
                                        if (!location || typeof location.radius == "undefined") {
                                            var data = JSON.parse(JSON.stringify(classData.good));
                                            data.l = l;
                                            data.by = by;
                                            Log.logUser(data);

                                            return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid Location!", translate: "Yêu cầu không hợp lệ (Sai vị trí)" });
                                        }
                                        else {
                                            employee = JSON.parse(JSON.stringify(employee));
                                            employee.lat = classData.good.lat;
                                            employee.long = classData.good.long;
                                            employee.lId = location._id;
                                            employee.l = "bygps";
                                            employee.radius = location.radius || classData.good.radius;

                                            if (classData.good.hash) employee.hash = classData.good.hash;

                                            Log.logTimeSheet(employee, function (err, result) {
                                                if (err) {
                                                    logger.debug(err);
                                                    return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
                                                }

                                                var hours = Math.floor(result.wt / 60);
                                                var minutes = result.wt % 60;

                                                var hoursOfWork = hours.toString() + "H" + minutes.toString() + "\"";

                                                classData.good.lId = location._id;
                                                classData.good.radius = location.radius || classData.good.radius;

                                                var data = JSON.parse(JSON.stringify(classData.good));
                                                data.l = l;
                                                data.by = by;
                                                data.check = result.check;

                                                var fullPath = PATH.join(CONF.SELFIE + groupId + "/");
                                                var fullPath_remote = PATH.join(CONF.SELFIE_REMOTE + groupId + "/");

                                                var file = files[0];

                                                if (file) {
                                                    file.fieldname = "selfie";

                                                    let stats = fs.statSync(file.path);
                                                    let fileSize = stats.size;

                                                    // if (fileSize > 300000) {
                                                    //    return res.status(503).json({ status: false, code: 503, msgCode: "error", message: "File too large", translate: "Yêu cầu không hợp lệ (File hình ảnh quá lớn)" });
                                                    // }

                                                    var source = file.path;//Get file temp uploaded                
                                                    var fieldname = file.fieldname;//Get fieldname

                                                    let unix = moment().unix()

                                                    var destination = fullPath + eId + "-" + unix;// Declare File Path Storage
                                                    var destination_remote = fullPath_remote + eId + "-" + unix;// Declare File Path Storage
                                                    var shortPath = "/public/" + fieldname + "/" + groupId + "/";
                                                    data[fieldname] = shortPath + eId + "-" + unix + "." + file.mimetype.split("/")[1] + "?H=" + process.env.HOSTID;
                                                    data[fieldname + "Type"] = file.mimetype;
                                                    data[fieldname + "Size"] = fileSize;

                                                    logger.debug(source, destination);

                                                    shell.mkdir('-p', fullPath);
                                                    fs.copyFile(source, destination, (err) => {
                                                        if (err) {
                                                            logger.error(err);
                                                        }
                                                    })

                                                    if (process.env.SERVER_MODE != "primary") {
                                                        shell.mkdir('-p', fullPath_remote);
                                                        fs.copyFile(source, destination_remote, (err) => {
                                                            if (err) {
                                                                logger.error(err);
                                                            }
                                                        })
                                                    }
                                                }

                                                Log.logUser(data);

                                                let check = CONF.BECAWORK.CHECK[(result.check ? result.check : "checkout")]

                                                var logUser = {
                                                    ...result.data,
                                                    userId: employee.email,//Id Nhan vien
                                                    method: CONF.BECAWORK.METHOD[method], // 1:GPS, 2: Wifi, 3: BSSID, 4:QRCode, 5:FaceID
                                                    check: check,//checkin: cham vao, checkout: cham ra                                                   
                                                    at: moment.parseZone().utc(true).format()
                                                }

                                                Log.sendLogUser(logUser);

                                                return res.json({ status: true, code: 200, message: "Success", hoursOfWork: hoursOfWork, ...result });
                                            });
                                        }
                                    }
                                    else {
                                        return res.status(405).json({ status: false, code: 405, msgCode: "not-allowed", message: "Method Not Allowed!", translate: "Yêu cầu không hợp lệ (Vị trí này không cho phép chấm bằng gps có ảnh)" });
                                    }
                                })
                            }
                            else {
                                return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Employee Not Found!", translate: "Xin lỗi! Không tìm thấy tên bạn." });
                            }
                        })

                        var uniqueId = classData.good.uniqueId;
                        var deviceInfo = classData.good.deviceInfo;
                        if (uniqueId && eId) {
                            Assistant.setUserDevice({ uniqueId, groupId, eId, deviceInfo });
                        }
                    }
                })
            }
            else {
                return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Selfie Missed", translate: "Yêu cầu không hợp lệ (Thiếu hình ảnh)" });
            }
        }
        catch (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
        }
    })
})

//Checkin by qrscanner
router.post("/qrscanner/:serial/", (req, res, next) => {
    try {
        var serial = req.params.serial;

        var body = req.body || {};

        const classData = Util.classify({
            eId: { type: String },
            mac_device: { type: String }
        }, body);

        if (Object.keys(classData.bad).length) {
            return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "BAD QUERY: missed field", translate: "Yêu cầu không hợp lệ (Thiếu dữ liệu)" });
        }

        let l = "byqrscanner";
        let by = "scanner";
        let method = "scanner";

        Checkin.getEmployee(classData.good, (err, employee) => {
            if (err) {
                logger.error(err)
            }

            if (employee) {
                logger.debug("Employee: ", employee.name);
                Checkin.getRSbyMethod({ serial: serial, groupId: employee.groupId }, (err, scanner) => {
                    if (err) {
                        logger.error(err);
                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
                    }

                    if (scanner) {
                        employee = JSON.parse(JSON.stringify(employee));
                        employee.lat = scanner.location.lat;
                        employee.long = scanner.location.long;
                        employee.lId = scanner.location._id;
                        employee.l = scanner.l || l;
                        employee.by = by;
                        employee.radius = 0;

                        Log.logTimeSheet(employee, function (err, result) {
                            if (err) {
                                logger.debug(err);
                                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
                            }

                            var hours = Math.floor(result.wt / 60);
                            var minutes = result.wt % 60;

                            var hoursOfWork = hours.toString() + "H" + minutes.toString() + "\"";

                            var data = JSON.parse(JSON.stringify(classData.good));
                            data.lId = scanner.location._id;
                            data.groupId = employee.groupId;
                            data.check = result.check;

                            data.l = scanner.l || "byqrscanner";
                            data.by = by;
                            Log.logUser(data);

                            let check = CONF.BECAWORK.CHECK[(result.check ? result.check : "checkout")]

                            var logUser = {
                                ...result.data,
                                userId: employee.email,//Id Nhan vien
                                method: CONF.BECAWORK.METHOD[method], // 1:GPS, 2: Wifi, 3: BSSID, 4:QRCode, 5:FaceID
                                check: check,//checkin: cham vao, checkout: cham ra                                                   
                                at: moment.parseZone().utc(true).format()
                            }

                            Log.sendLogUser(logUser);

                            var _employee = JSON.parse(JSON.stringify(employee));
                            delete _employee.setting;
                            delete _employee.policy;
                            delete _employee.availableLeaveDay;
                            delete _employee.lat;
                            delete _employee.long;
                            delete _employee.l;
                            delete _employee.lId;
                            delete _employee.radius;
                            delete _employee.salt;
                            delete _employee.password;
                            delete _employee.resetPassword;

                            return res.json({ status: true, code: 200, message: "Success", hoursOfWork: hoursOfWork, ...result, employee: _employee });
                        });
                    }
                    else {
                        res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Scanner Not Found!" });
                    }
                })
            }
            else {
                res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Employee Not Found!", translate: "Xin lỗi! Không tìm thấy tên bạn." });
            }
        });
    }
    catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: JSON.stringify(err), translate: "Đã có lỗi xảy ra!" });
    }
})

//Get employee info to show checkin page
router.get('/employee.js', (req, res, next) => {
    try {
        //Get agrument from URL query string
        var query = req.query || {};

        if (query.mac_device) {
            var args = { schema: "Employee", query: [] };
            args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
            
            args.query.push({ $match: { groupId: query.groupId, $or: [{ mac_device: query.mac_device }, { mmac: query.mac_device }] } });

            var d = Util.now("YYYY-MM-DD");
            args.query.push({ $match: { $expr: { $and: [{ $gte: [d, { $ifNull: ["$startAt", d] }] }, { $gte: [{ $ifNull: ["$endAt", d] }, d] }] } } })

            args.query.push({ $lookup: { from: "group", let: { groupId: "$group" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$groupId"] }] } } }, { $project: { _id: 1, name: 1, keyword: 1, type: 1 } }], as: "group" } });

            args.query.push({ $unwind: "$group" });

            args.query.push({
                $lookup: {
                    from: "policy",
                    let: { pId: "$pId" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
                        { $addFields: { worktime: "$office." + Util.now("ddd"), lateAlert: "$office.lateAlert" } },
                        { $project: { _id: 0, worktime: 1, lateAlert: 1 } }
                    ],
                    as: "policy"
                }
            });
            args.query.push({ $unwind: "$policy" });
            if (process.env.SERVER_MODE != "dev") {
                args.query.push({ $addFields: { setting: "$policy" } });
            }

            args.query.push({
                $lookup: {
                    from: "timesheet",
                    let: { "eId": "$_id", groupId: "$groupId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$eId", "$$eId"] },
                                        { $eq: ["$d", Util.now("YYYY-MM-DD")] },
                                    ]
                                }
                            }
                        },
                    ],
                    as: "timesheet"
                }
            })

            args.query.push({ $unwind: { path: "$timesheet", preserveNullAndEmptyArrays: true } });
            args.query.push({ $addFields: { log: "$timesheet.log", checkinAt: { $ifNull: ["$timesheet.inAt", { $arrayElemAt: ["$timesheet.log.t", 0] }] }, checkoutAt: { $ifNull: ["$timesheet.outAt", { $arrayElemAt: ["$timesheet.log.t", -1] }] } } });
            args.query.push({ $project: { timesheet: 0, pw: 0, password: 0 } });

            JCloud.aggregateOne(args, (err, result) => {
                if (err) {
                    logger.error(err);
                    return res.send("var employee = {}; var worktime = {}; var lateIn = 0;//Error");
                }

                if (result) {
                    var lateIn = 0;
                    var isLate = false;
                    var check = "checkout";
                    if (!result.checkinAt) {
                        check = "checkin";
                        var inAt = (result.checkinAt) ? new moment(result.checkinAt, 'HH:mm:ss') : new moment(); //get firsttime checkin

                        var inAM = (result.policy.worktime.inAM) ? new moment(result.policy.worktime.inAM, 'HH:mm:ss') : null; //Thoi gian bat dau buoi sang
                        var outAM = (result.policy.worktime.outAM) ? new moment(result.policy.worktime.outAM, 'HH:mm:ss') : null;//Thoi gian ket thuc buoi sang
                        var inPM = (result.policy.worktime.inPM) ? new moment(result.policy.worktime.inPM, 'HH:mm:ss') : null; //Thoi gian bat dau buoi chieu

                        if (inAM && inAt.diff(outAM, "minutes") < 0) {
                            logger.debug(check)
                            if (inAt.diff(inAM, "minutes") > 0) {
                                lateIn = inAt.diff(inAM, "minutes"); //Tinh so phut di tre buoi sang
                                logger.debug("Di tre buoi sang:", lateIn);
                            }
                        }
                        else if (inPM) {
                            if (inAt.diff(inPM, "minutes") > 0) {
                                lateIn = inAt.diff(inPM, "minutes"); //Tinh so phut di tre buoi chieu
                                logger.debug("Di tre buoi chieu:", lateIn);
                            }
                        }

                        logger.debug(lateIn);
                        if (lateIn <= result.policy.lateAlert) {
                            lateIn = 0;
                        }
                        else {
                            isLate = true;
                        }
                    }

                    return res.send("var employee = " + JSON.stringify(result) + "; var worktime = " + JSON.stringify(result.policy.worktime) + "; var lateIn = " + lateIn + "; var isLate = " + isLate + "; var check = '" + check + "';");
                }
                else {
                    return res.send("var employee = {}; var worktime = {}; var lateIn = 0;"); //Not Found"
                }
            })
        }
        else {
            return res.send("var employee = {}; var worktime = {}; var lateIn = 0;//Mac Null");
        }
    }
    catch (err) {
        logger.error(err);
        return res.send("var employee = {}; var worktime = {}; var lateIn = 0;//Catch Error");
    }
})

//Get list employee have birthday today
router.get("/birthday.js", (req, res, next) => {
    try {
        var query = req.query || {};//Get agrument from URL query string

        var args = { schema: "Employee", query: [] }
        args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
        
        args.query.push({ $match: { groupId: query.groupId } });//demo get all
        args.query.push({ $addFields: { avatar: { $ifNull: ["$portrait", "$avatar"] } } })
        var d = Util.now("YYYY-MM-DD");
        args.query.push({ $match: { $expr: { $and: [{ $gte: [d, { $ifNull: ["$startAt", d] }] }, { $gte: [{ $ifNull: ["$endAt", d] }, d] }] } } })

        args.query.push({
            $project: {
                _id: 1,
                name: 1,
                gender: 1,
                nickname: 1,
                birthday: 1,
                avatar: 1, portrait: 1,
                dm: { $concat: [Util.now("YYYY-"), { $substr: ["$birthday", 5, 5] }] },
                count: { $round: [{ $divide: [{ $subtract: [{ $dateFromString: { dateString: { $concat: [Util.now("YYYY-"), { $substr: ["$birthday", 5, 5] }] }, format: "%Y-%m-%d" } }, new Date()] }, 24 * 3600000] }, 0] }
            }
        });
        args.query.push({ $match: { dm: { $gte: Util.now("YYYY-MM-DD"), $lt: moment().add(3, "months").format("YYYY-MM-01") } } });
        args.query.push({ $sort: { count: 1 } });

        logger.debug(JSON.stringify(args.query))
        JCloud.aggregate(args, (err, result) => {
            if (err) {
                logger.debug(JSON.stringify(err));
                return res.send("var listBirthday = [];//Error");
            }
            if (!result) return res.send("var listBirthday = [];//Null")
            return res.send("var listBirthday = " + JSON.stringify(result));
        })
    }
    catch (err) {
        logger.error(err);
        return res.send("var listBirthday = [];//catch error");

    }
})

module.exports = router;
