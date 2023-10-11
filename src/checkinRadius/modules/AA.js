const radius = require('radius');
radius.add_dictionary(__RDAPI__ + '/dictionary');

module.exports = {
    getInfo: (obj, callback) => {
        try {
            var packet = radius.decode({ packet: obj.msg, secret: CONF.PROXY.SECRET });

            if (packet.code != 'Accounting-Request' && packet.code != "Access-Request") {
                logger.debug('Invalid Packet: ', packet.code);
                return AA.reject(obj, callback);
            }

            packet.secret = CONF.PROXY.SECRET;

            var mac_device = packet.attributes['Calling-Station-Id'];
            var mac_ap = (packet.attributes['Called-Station-Id']) ? packet.attributes['Called-Station-Id'].substr(0, 17) : undefined;

            logger.debug("[" + mac_ap + "][" + mac_device + "]: [IP|PORT]", obj.rinfo.address + ":" + obj.rinfo.port);

            if (typeof mac_device == "undefined") {
                mac_device = "00-00-00-00-00-00";
            }

            if (typeof mac_ap == "undefined") {
                mac_ap = "00-00-00-00-00-00";
            }

            if (!Util.isMAC(mac_device)) {
                var temp = mac_device.match(/(([0-9]|[A-Fa-f]){2})/g);
                if (!temp) {
                    mac_device = "00-00-00-00-00-00";
                }
                else if (temp.length >= 6) {
                    mac_device = temp[0] + "-" + temp[1] + "-" + temp[2] + "-" + temp[3] + "-" + temp[4] + "-" + temp[5];
                }
            }

            if (!Util.isMAC(mac_ap)) {
                var temp = mac_ap.match(/(([0-9]|[A-Fa-f]){2})/g);
                if (!temp) {
                    mac_ap = "00-00-00-00-00-00";
                }
                else if (temp.length >= 6) {
                    mac_ap = temp[0] + "-" + temp[1] + "-" + temp[2] + "-" + temp[3] + "-" + temp[4] + "-" + temp[5];
                }
            }

            var nas_id = packet.attributes['NAS-Identifier'];
            if (nas_id) logger.debug("[" + mac_ap + "][" + mac_device + "]:", "NAS Id: ", nas_id);

            mac_ap = mac_ap.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();
            mac_device = mac_device.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();

            if (mac_ap == "00-00-00-00-00-00") {
                if (Util.isMAC(nas_id)) {
                    mac_ap = nas_id = nas_id.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();
                }
            }

            obj = { ...obj, packet: packet, secret: CONF.PROXY.SECRET, mac_ap: mac_ap, mac_device: mac_device, updatedAt: Util.now(), address: obj.rinfo.address, port: obj.rinfo.port };
            logger.info("[--------AP-------][------DEVICE-----]");
            logger.info("[" + mac_ap + "][" + mac_device + "]:", "PACKET RECEIVED: ", JSON.stringify(packet))
            logger.info("[" + mac_ap + "][" + mac_device + "]: ATTRIBUTES: ", JSON.stringify(packet.attributes));

            //For only Authen
            obj.args = {};
            obj.args.username = obj.packet.attributes['User-Name'];
            obj.args.password = obj.packet.attributes['User-Password'];

            if (obj.args.password == null) {
                obj.args.password = obj.args.username;
            }
            else if (/�/g.test(obj.args.password)) { //Accept [0-9][A-Za-z] '/' '_' '-'
                obj.args.password = obj.args.username;
            }

            logger.debug("[" + mac_ap + "][" + mac_device + "]:", '[GetInfo]: Username/Password = ' + obj.args.username + "/" + obj.args.password);
            //

            callback(null, obj);
        }
        catch (error) {
            logger.error(obj.rinfo.address, error);
        }
    },
    getEmployeeByPacketInfo: (obj, callback) => {

        var mac_device = obj.mac_device;
        var mac_ap = obj.mac_ap;
        var method = "wifi";

        var username = obj.args.username;
        var password = obj.args.password;
        var ddd = Util.now("ddd");
        var groupId = obj.data.group;

        logger.debug("[" + mac_ap + "][" + mac_device + "]:", username, password);

        Checkin.getEmployee({ mac_device: mac_device, groupId: groupId }, (err, employee) => {
            if (err) {
                logger.error(err);
                callback("Error!", null)
            }

            if (employee) {
                callback(null, employee);
            }
            else {
                logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Mac Device Not Found")
                Checkin.getEmployee({ username: username, password: password, groupId: groupId }, (err, employee) => {
                    if (err) {
                        logger.error(err);
                        callback("Error!", null)
                    }

                    if (employee) {
                        callback(null, employee);
                    }
                    else {
                        callback(null, null)
                    }
                })
            }
        })
    },
    authen: (obj, callback) => {
        var mac_device = obj.mac_device;
        var mac_ap = obj.mac_ap;
        var method = "wifi";

        var username = obj.args.username;
        var password = obj.args.password;
        var ddd = Util.now("ddd");
        logger.debug("[" + mac_ap + "][" + mac_device + "]:", username, password);

        Checkin.getRSbyMethod({ mac_ap: mac_ap }, (err, ap) => {
            if (err) {
                logger.error(err);
                return AA.reject(ap, callback);
            }

            if (ap) {
                ap = JSON.parse(JSON.stringify(ap));
                var groupId = ap.group;
                obj.data = ap;

                logger.debug("[" + mac_ap + "][" + mac_device + "]:", JSON.stringify(ap));

                AA.getEmployeeByPacketInfo(obj, (err, employee) => {
                    if (err) {
                        logger.error(err);
                        return AA.reject(ap, callback);
                    }

                    if (employee) {
                        var allowMethod = (ap.location && ap.location.priority === true) ? (ap.location.method || {}) : employee.policy.method;
                        if (allowMethod[method] && allowMethod[method] !== false) {
                            logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Employee: ", employee.name);
                            if (employee.policy.type == "Fixed" || employee.policy.pType == "Shift") {
                                Checkin.getSchedule(employee, (err, employee) => {
                                    Checkin.get2Select1Shift(employee, (err, objShift) => {
                                        if (!objShift) { //Nếu ngoài giờ làm việc
                                            employee.group = employee.group || {}
                                            var holidays = employee.group.holidays || employee.policy.holidays || [];
                                            var DD = Util.now("YYYY-MM-DD");

                                            if (employee.time) {
                                                DD = employee.time.DD;
                                            }

                                            if (holidays.indexOf(DD) != -1) {
                                                logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Happy holidays!");
                                                return AA.reject(ap, callback);
                                            }
                                            //Neu hom nay la ngay nghi
                                            else {
                                                logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Have a nice day!");
                                                return AA.reject(ap, callback);
                                            }
                                        }
                                        else {
                                            employee.objShift = objShift;
                                            if (employee.mmac.indexOf(mac_device) != -1) {
                                                var data = {};
                                                data.eId = employee._id;
                                                data.groupId = employee.groupId;
                                                data.mac_device = mac_device;
                                                data.mac_ap = mac_ap;
                                                data.lId = ap.location._id;
                                                data.lat = ap.location.lat;
                                                data.long = ap.location.long;
                                                data.radius = 0;
                                                data.l = "mac_authen";
                                                Log.logUser(data);

                                                employee = JSON.parse(JSON.stringify(employee));
                                                employee.lId = ap.location._id;
                                                employee.lat = ap.location.lat;
                                                employee.long = ap.location.long;
                                                employee.l = "mac_authen";
                                                employee.radius = 0;

                                                Log.logTimeSheetShift(employee, function (err, result) {
                                                    let check = CONF.BECAWORK.CHECK[(result.check ? result.check : "checkout")]

                                                    var logUser = {
                                                        ...result.data,
                                                        userId: employee.email,//Id Nhan vien
                                                        method: CONF.BECAWORK.METHOD[method], // 1:GPS, 2: Wifi, 3: BSSID, 4:QRCode, 5:FaceID
                                                        check: check,//checkin: cham vao, checkout: cham ra                                                        
                                                        at: moment.parseZone().utc(true).format()
                                                    }

                                                    Log.sendLogUser(logUser);
                                                });

                                                logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Success");
                                                return AA.accept(obj, callback);
                                            }
                                            else if (username && password) {
                                                // if (password && (Util.hashPassword(password, employee.salt).indexOf(employee.password) != -1 || (username == password && employee.dmac.indexOf(mac_device) != -1))) {

                                                var data = {};
                                                data.eId = employee._id;
                                                data.groupId = employee.groupId;
                                                data.mac_device = mac_device;
                                                data.mac_ap = mac_ap;
                                                data.lId = ap.location._id;
                                                data.lat = ap.location.lat;
                                                data.long = ap.location.long;
                                                data.radius = 0;
                                                data.l = "pass_authen";
                                                Log.logUser(data);

                                                employee = JSON.parse(JSON.stringify(employee));
                                                employee.lId = ap.location._id;
                                                employee.lat = ap.location.lat;
                                                employee.long = ap.location.long;
                                                employee.l = "pass_authen";
                                                employee.radius = 0;

                                                Log.logTimeSheetShift(employee, function (err, result) {
                                                    let check = CONF.BECAWORK.CHECK[(result.check ? result.check : "checkout")]

                                                    var logUser = {
                                                        ...result.data,
                                                        userId: employee.email,//Id Nhan vien
                                                        method: CONF.BECAWORK.METHOD[method], // 1:GPS, 2: Wifi, 3: BSSID, 4:QRCode, 5:FaceID
                                                        check: check,//checkin: cham vao, checkout: cham ra                                                   
                                                        at: moment.parseZone().utc(true).format()
                                                    }

                                                    Log.sendLogUser(logUser);
                                                });

                                                Checkin.removeDesktopMac(employee);

                                                logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Success");
                                                return AA.accept(obj, callback);
                                            }
                                            else {
                                                logger.debug("[" + mac_ap + "][" + mac_device + "]:", "The username or password is incorrect!");
                                                return AA.reject(obj, callback);
                                            }
                                        }
                                    })
                                })
                                return;
                            }
                            else {
                                var now = moment();
                                var policy = employee.policy;
                                var office = policy.office;
                                var setToday = office[ddd];

                                var _outAt = now;
                                if (setToday.outPM) {
                                    _outAt = moment(setToday.outPM, "HH:mm:ss");
                                }
                                else if (setToday.outAM) {
                                    _outAt = moment(setToday.outAM, "HH:mm:ss");
                                }

                                if (_outAt && now.diff(_outAt, "minutes") > 60) {
                                    logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Overtime");
                                    return AA.reject(ap, callback);
                                }
                            }

                            if (employee.mmac.indexOf(mac_device) != -1) {
                                var data = {};
                                data.eId = employee._id;
                                data.groupId = employee.groupId;
                                data.mac_device = mac_device;
                                data.mac_ap = mac_ap;
                                data.lId = ap.location._id;
                                data.lat = ap.location.lat;
                                data.long = ap.location.long;
                                data.radius = 0;
                                data.l = "mac_authen";
                                Log.logUser(data);

                                employee = JSON.parse(JSON.stringify(employee));
                                employee.lId = ap.location._id;
                                employee.lat = ap.location.lat;
                                employee.long = ap.location.long;
                                employee.l = "mac_authen";
                                employee.radius = 0;

                                Log.logTimeOffice(employee, function (err, result) {
                                    let check = CONF.BECAWORK.CHECK[(result.check ? result.check : "checkout")]

                                    var logUser = {
                                        ...result.data,
                                        userId: employee.email,//Id Nhan vien
                                        method: CONF.BECAWORK.METHOD[method], // 1:GPS, 2: Wifi, 3: BSSID, 4:QRCode, 5:FaceID
                                        check: check,//checkin: cham vao, checkout: cham ra                                                   
                                        at: moment.parseZone().utc(true).format()
                                    }

                                    Log.sendLogUser(logUser);
                                });

                                logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Success");
                                return AA.accept(obj, callback);
                            }
                            else if (username && password) {
                                // if (password && (Util.hashPassword(password, employee.salt).indexOf(employee.password) != -1 || (username == password && employee.dmac.indexOf(mac_device) != -1))) {
                                var data = {};
                                data.eId = employee._id;
                                data.groupId = employee.groupId;
                                data.mac_device = mac_device;
                                data.mac_ap = mac_ap;
                                data.lId = ap.location._id;
                                data.lat = ap.location.lat;
                                data.long = ap.location.long;
                                data.radius = 0;
                                data.l = "pass_authen";
                                Log.logUser(data);

                                employee = JSON.parse(JSON.stringify(employee));
                                employee.lId = ap.location._id;
                                employee.lat = ap.location.lat;
                                employee.long = ap.location.long;
                                employee.l = "pass_authen";
                                employee.radius = 0;

                                Log.logTimeOffice(employee, function (err, result) {
                                    let check = CONF.BECAWORK.CHECK[(result.check ? result.check : "checkout")]

                                    var logUser = {
                                        ...result.data,
                                        userId: employee.email,//Id Nhan vien
                                        method: CONF.BECAWORK.METHOD[method], // 1:GPS, 2: Wifi, 3: BSSID, 4:QRCode, 5:FaceID
                                        check: check,//checkin: cham vao, checkout: cham ra                                                   
                                        at: moment.parseZone().utc(true).format()
                                    }

                                    Log.sendLogUser(logUser);
                                });

                                Checkin.removeDesktopMac(employee);

                                logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Success");
                                return AA.accept(obj, callback);
                            }
                            else {
                                logger.debug("[" + mac_ap + "][" + mac_device + "]:", "The username or password is incorrect!");
                                return AA.reject(obj, callback);
                            }
                        }
                        else {
                            logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Method Not Allowed!");
                            return AA.reject(obj, callback);
                        }
                    }
                    else {
                        logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Employee Not Found");

                        //If device vendor cambium. Authen session 30s for client connect SSID
                        if (ap.vendor == "cambium") {

                            logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Cambium");

                            Cache.getRaw("TMP", mac_device, (err, result) => {
                                if (err) logger.error(err);

                                if (!result) {
                                    Cache.setRaw("TMP", mac_device, true, (err) => {
                                        logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Cache Saved!")

                                    })

                                    obj.data = { bwup: 1000000, bwdown: 1000000, session: 3, idle: 3 };
                                    logger.debug("[" + mac_ap + "][" + mac_device + "]:", JSON.stringify(obj.data));

                                    return AA.accept(obj, callback);
                                }
                                else {
                                    Cache.setRaw("TMP", mac_device, false, (err) => {
                                        logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Cache Removed!")
                                    })
                                    return AA.reject(obj, callback);
                                }
                            })
                        }
                        else {
                            return AA.reject(obj, callback);
                        }
                    }
                })
            }
            else {
                logger.debug("[" + mac_ap + "][" + mac_device + "]:", "AP NOT FOUND");
                return AA.reject(obj, callback);
            }
        })
    },
    accounting: (obj, callback) => {
        var mac_device = obj.mac_device;
        var mac_ap = obj.mac_ap;
        var acct_status_type = (typeof obj.packet.attributes['Acct-Status-Type'] != "undefined") ? "_" + obj.packet.attributes['Acct-Status-Type'].toLowerCase() : "";
        var ddd = Util.now("ddd");
        var method = "wifi";

        Checkin.getRSbyMethod({ mac_ap: mac_ap }, (err, ap) => {
            if (err) {
                logger.error(err)
            }

            if (ap) {
                ap = JSON.parse(JSON.stringify(ap));
                var groupId = ap.group;


                Checkin.getEmployee({ mac_device, groupId: groupId }, (err, employee) => {
                    if (err) {
                        logger.error(err)
                    }

                    if (employee) {
                        logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Employee: ", employee.name);
                        var isOffTime = false;
                        if (employee.policy.type == "Fixed" || employee.policy.pType == "Shift") {
                            Checkin.getSchedule(employee, (err, employee) => {
                                Checkin.get2Select1Shift(employee, (err, objShift) => {
                                    if (!objShift) { //Nếu ngoài giờ làm việc
                                        employee.group = employee.group || {}
                                        var holidays = employee.group.holidays || employee.policy.holidays || [];

                                        var DD = Util.now("YYYY-MM-DD");

                                        if (employee.time) {
                                            DD = employee.time.DD;
                                        }

                                        if (holidays.indexOf(DD) != -1) {
                                            logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Happy holidays!");
                                            isOffTime = true;
                                        }
                                        //Neu hom nay la ngay nghi
                                        else {
                                            logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Have a nice day!");
                                            isOffTime = true;
                                        }
                                    }

                                    if (!isOffTime) {
                                        employee.objShift = objShift
                                        employee = JSON.parse(JSON.stringify(employee));
                                        employee.lId = ap.location._id;
                                        employee.lat = ap.location.lat;
                                        employee.long = ap.location.long;
                                        employee.l = "acct" + acct_status_type;
                                        employee.radius = 0;

                                        Log.logTimeSheetShift(employee, function (err, result) {
                                            let check = CONF.BECAWORK.CHECK[(result.check ? result.check : "checkout")]

                                            var logUser = {
                                                ...result.data,
                                                userId: employee.email,//Id Nhan vien
                                                method: CONF.BECAWORK.METHOD[method], // 1:GPS, 2: Wifi, 3: BSSID, 4:QRCode, 5:FaceID
                                                check: check,//checkin: cham vao, checkout: cham ra                                                   
                                                at: moment.parseZone().utc(true).format()
                                            }

                                            Log.sendLogUser(logUser);
                                        });

                                        var data = {};
                                        data.eId = employee._id;
                                        data.groupId = employee.groupId;
                                        data.mac_device = mac_device;
                                        data.mac_ap = mac_ap;
                                        data.lId = ap.location._id;
                                        data.lat = ap.location.lat;
                                        data.long = ap.location.long;
                                        data.radius = 0;
                                        data.l = "acct" + acct_status_type;
                                        Log.logUser(data);
                                    }
                                })
                            })
                        }
                        else {
                            var now = moment();
                            var policy = employee.policy;
                            var office = policy.office;
                            var setToday = office[ddd];

                            var _outAt = null;
                            if (setToday.outPM) {
                                _outAt = moment(setToday.outPM, "HH:mm:ss");
                            }
                            else if (setToday.outAM) {
                                _outAt = moment(setToday.outAM, "HH:mm:ss");
                            }

                            if (!_outAt || now.diff(_outAt, "minutes") > 60) {
                                logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Too late");
                                isOffTime = true;
                            }

                            var _inAt = null;
                            if (setToday.inAM) {
                                _inAt = moment(setToday.inAM, "HH:mm:ss");
                            }
                            else if (setToday.inPM) {
                                _inAt = moment(setToday.inPM, "HH:mm:ss");
                            }

                            if (!_inAt || now.diff(_inAt, "minutes") < -60) {
                                logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Too early");
                                isOffTime = true;
                            }

                            if (!isOffTime) {
                                employee = JSON.parse(JSON.stringify(employee));
                                employee.lId = ap.location._id;
                                employee.lat = ap.location.lat;
                                employee.long = ap.location.long;
                                employee.l = "acct" + acct_status_type;
                                employee.radius = 0;

                                Log.logTimeOffice(employee, function (err, result) {
                                    let check = CONF.BECAWORK.CHECK[(result.check ? result.check : "checkout")]

                                    var logUser = {
                                        ...result.data,
                                        userId: employee.email,//Id Nhan vien
                                        method: CONF.BECAWORK.METHOD[method], // 1:GPS, 2: Wifi, 3: BSSID, 4:QRCode, 5:FaceID
                                        check: check,//checkin: cham vao, checkout: cham ra                                                   
                                        at: moment.parseZone().utc(true).format()
                                    }

                                    Log.sendLogUser(logUser);
                                });

                                var data = {};
                                data.eId = employee._id;
                                data.groupId = employee.groupId;
                                data.mac_device = mac_device;
                                data.mac_ap = mac_ap;
                                data.lId = ap.location._id;
                                data.lat = ap.location.lat;
                                data.long = ap.location.long;
                                data.radius = 0;
                                data.l = "acct" + acct_status_type;
                                Log.logUser(data);
                            }
                        }
                    }
                })
            }
        })

        var _packet = {};
        _packet.packet = obj.packet;
        _packet.secret = CONF.PROXY.SECRET;
        _packet.code = 'Accounting-Response';

        var response = radius.encode_response(_packet);

        return callback(response);
    },
    accept: (obj, callback) => {
        var mac_device = obj.mac_device;
        var mac_ap = obj.mac_ap;
        var username = obj.args.username;
        var password = obj.args.password;
        var data = obj.data;

        if (data.till) {
            var diff = moment(data.till, 'HH:mm:ss').diff(moment(), "seconds");
            logger.debug("[" + mac_ap + "][" + mac_device + "]:", "Till", diff);

            if (diff > 0) {
                data.session = diff;
            }
        }

        var packet = {}
        packet.code = 'Access-Accept';
        packet.packet = obj.packet;
        packet.secret = obj.secret;

        packet.attributes = [];
        if (obj.packet.attributes['NAS-Identifier'] && obj.packet.attributes['NAS-Identifier'].indexOf("Cisco Meraki") != -1) {
            //Meraki
            packet.attributes.push(['Vendor-Specific', 3561, [['Maximum-Data-Rate-Upstream', data.bwup]]]);
            packet.attributes.push(['Vendor-Specific', 3561, [['Maximum-Data-Rate-Downstream', data.bwdown]]]);
        }
        else { //WISPr
            packet.attributes.push(['Vendor-Specific', 14122, [['WISPr-Bandwidth-Max-Up', data.bwup]]]);
            packet.attributes.push(['Vendor-Specific', 14122, [['WISPr-Bandwidth-Max-Down', data.bwdown]]]);

            //Coova chilli
            packet.attributes.push(['Vendor-Specific', 14559, [['CoovaChilli-Bandwidth-Max-Up', data.bwup], ['CoovaChilli-Bandwidth-Max-Down', data.bwdown]]]);

            //Meraki
            packet.attributes.push(['Vendor-Specific', 3561, [['Maximum-Data-Rate-Upstream', data.bwup]]]);
            packet.attributes.push(['Vendor-Specific', 3561, [['Maximum-Data-Rate-Downstream', data.bwdown]]]);

            // //Airespace  Meraki
            // packet.attributes.push(
            //     ['Vendor-Specific', 14179, [['Airespace-Data-Bandwidth-Average-Contract-Upstream', data.bwup / 1000],
            //     ['Airespace-Real-Time-Bandwidth-Average-Contract-Upstream', data.bwup / 1000],
            //     ['Airespace-Data-Bandwidth-Burst-Contract-Upstream', data.bwup / 1000],
            //     ['Airespace-Real-Time-Bandwidth-Burst-Contract-Upstream', data.bwup / 1000],
            //     ['Airespace-Data-Bandwidth-Average-Contract', data.bwdown / 1000],
            //     ['Airespace-Real-Time-Bandwidth-Average-Contract', data.bwdown / 1000],
            //     ['Airespace-Data-Bandwidth-Burst-Contract', data.bwdown / 1000],
            //     ['Airespace-Real-Time-Bandwidth-Burst-Contract', data.bwdown / 1000]]]);

            // //Cisco
            // packet.attributes.push(['Vendor-Specific', 9, [['Cisco-Policy-Up', data.bwup / 1000], ['Cisco-Policy-Down', data.bwdown / 1000]]]);

            //Aruba
            packet.attributes.push(['Vendor-Specific', 14823, [['Aruba-User-Role', "authenticated"]]]);
        }

        packet.attributes.push(['Session-Timeout', data.session]);
        packet.attributes.push(['Idle-Timeout', data.idle]);

        logger.debug("[" + mac_ap + "][" + mac_device + "]:", JSON.stringify({ bwup: data.bwup, bwdown: data.bwdown, session: data.session, idle: data.idle }));
        logger.debug("[" + mac_ap + "][" + mac_device + "]:", '[ACCEPT]');
        var response = radius.encode_response(packet);

        return callback(response);
    },
    reject: (obj, callback) => {
        var mac_device = obj.mac_device;
        var mac_ap = obj.mac_ap;

        var packet = {}
        packet.code = 'Access-Reject';
        packet.packet = obj.packet;
        packet.secret = obj.secret;
        logger.debug("[" + mac_ap + "][" + mac_device + "]:", '[REJECT]');
        var response = radius.encode_response(packet);

        return callback(response);
    }
}
