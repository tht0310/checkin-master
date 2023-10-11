const FCM_URL = "https://fcm.googleapis.com/fcm/send"

module.exports = {
    getEmployee: (obj, callback) => {
        var eId = obj.eId;
        var groupId = obj.groupId;
        var username = obj.username;
        var password = obj.password;
        var mac_device = obj.mac_device;
        var d = Util.now("YYYY-MM-DD");

        var args = { schema: "Employee", query: [] };
        args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
        
        // args.query.push({ $project: { pw: 0, password: 0 } });
        args.query.push({ $match: { $expr: { $and: [{ $gte: [d, { $ifNull: ["$startAt", d] }] }, { $gte: [{ $ifNull: ["$endAt", d] }, d] }] } } });

        if (eId) {
            args.query.push({ $match: { _id: eId } });
        }
        else if (username && password) {
            args.query.push({ $match: { groupId: groupId, $or: [{ username: username }, { email: username }, { phone: username }] } });
        }
        else if (mac_device) {
            args.query.push({ $match: { $or: [{ mac_device: mac_device }, { mmac: mac_device }, { dmac: mac_device }] } });
        }
        else {
            return callback(null, null);
        }

        args.query.push({
            $lookup: {
                from: "policy",
                let: { pId: "$pId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
                    { $addFields: { method: { $ifNull: ["$method", { wifi: { $ifNull: ["$wifi", false] }, bssid: { $ifNull: ["$bssid", false] }, qr: { $ifNull: ["$qr", false] }, qrAccess: { $ifNull: ["$qrAccess", false] }, gps: { $ifNull: ["$gps", false] }, gpsselfie: { $ifNull: ["$gpsselfie", false] }, hik: { $ifNull: ["$hik", false] }, faceId: { $ifNull: ["$faceId", false] } }] } } },
                    { $addFields: { wifi: { $ifNull: ["$method.wifi", false] }, bssid: { $ifNull: ["$method.bssid", false] }, qr: { $ifNull: ["$method.qr", false] }, qrAccess: { $ifNull: ["$method.qrAccess", false] }, gps: { $ifNull: ["$method.gps", false] }, hik: { $ifNull: ["$method.hik", false] }, faceId: { $ifNull: ["$method.faceId", false] } } },
                    { $addFields: { pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] } } },
                    { $addFields: { fixedShift: { $ifNull: ["$fixedShift", false] } } },
                    {
                        $addFields: {
                            notifyChecked: { $cond: { if: { $eq: ["$notifyChecked", {}] }, then: null, else: "$notifyChecked" } },
                            notifyLate: { $cond: { if: { $eq: ["$notifyLate", {}] }, then: null, else: "$notifyLate" } },
                            notifyCheckoutLate: { $cond: { if: { $eq: ["$notifyCheckoutLate", {}] }, then: null, else: "$notifyCheckoutLate" } },
                            office: { $cond: { if: { $eq: ["$office", {}] }, then: null, else: "$office" } },
                            shift: { $cond: { if: { $eq: ["$shift", {}] }, then: null, else: "$shift" } }
                        }
                    },
                    { $project: { department: 0, position: 0, token: 0, webhook: 0, inherited: 0, status: 0, updatedBy: 0, default: 0, keyword: 0 } }
                ],
                as: "policy"
            }
        });

        args.query.push({ $unwind: "$policy" });
        
        args.query.push({ $addFields: { pType: "$policy.pType" } });

        args.query.push({
            $lookup: {
                from: "group",
                let: { groupId: "$groupId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$groupId"] }] } } },
                    { $project: { _id: 1, name: 1, keyword: 1, type: 1, positions: 1, holidays: 1, pcDate: 1, resetDate: 1 } }
                ],
                as: "group"
            }
        });

        args.query.push({ $unwind: { path: "$group", preserveNullAndEmptyArrays: true } });

        args.query.push({
            $lookup: {
                from: "department",
                let: { groupId: "$groupId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$groupId", "$$groupId"] }] } } },
                    { $group: { _id: null, name: { $addToSet: "$name" } } }
                ],
                as: "department"
            }
        });
        args.query.push({ $unwind: { path: "$department", preserveNullAndEmptyArrays: true } });

        args.query.push({ $addFields: { "group.departments": "$department.name" } });

        JCloud.aggregateOne(args, (err, employee) => {
            if (err) {
                logger.error(err);
                return callback(err, employee);
            }

            if (employee) {
                if (password) {
                    if (password && Util.hashPassword(password, employee.salt).indexOf(employee.password) != -1) {
                        if (Util.isMac(mac_device)) {
                            var device_type = (typeof obj.userAgent.device != 'undefined' && typeof obj.userAgent.device.type != 'undefined') ? obj.userAgent.device.type : "desktop";
                            Checkin.updateMac({ eId: employee._id, mac_device: mac_device, device_type: device_type });
                        }

                        return callback(null, employee);
                    }
                    else {
                        Assistant.loginEOffice(username, password, (error, isValid) => {
                            if (isValid) {
                                if (Util.isMac(mac_device)) {
                                    var device_type = (typeof obj.userAgent.device != 'undefined' && typeof obj.userAgent.device.type != 'undefined') ? obj.userAgent.device.type : "desktop";
                                    Checkin.updateMac({ eId: employee._id, mac_device: mac_device, device_type: device_type });
                                }

                                return callback(null, employee);
                            }
                            else {
                                return callback(null, null);
                            }
                        })
                    }
                }
                else {
                    return callback(null, employee);
                }
            }
            else {
                logger.debug("Not Found!")
                return callback(null, null);
            }
        })
    },
    getSchedule: (employee, callback) => {
        let timesheet = employee.timesheet; // when import

        if (!employee.policy.fixedShift) { // Flexible Shift
            var today = Util.now("ddd");//today
            var yesterday = new moment().add(-1, "days").format("ddd").toString();//yesterday

            if (timesheet) {
                today = timesheet.ddd;//today ddd
                yesterday = new moment(timesheet.d).add(-1, "days").format("ddd").toString();//yesterday;
                d = new moment(timesheet.d).format("YYYY-MM-DD")
            }

            if (employee.time) {
                today = employee.time.ddd;//today ddd
                yesterday = new moment(employee.time.d).add(-1, "days").format("ddd").toString();//yesterday
                d = new moment(employee.time.d).format("YYYY-MM-DD")
            }

            var args = { schema: 'Policy', query: [] };
            args.query.push({ $match: { _id: employee.policy._id } });
            args.query.push({ $unwind: { path: "$week." + today, "preserveNullAndEmptyArrays": true } });
            args.query.push({
                $lookup: {
                    from: "shift",
                    let: {
                        sId: "$week." + today + ".sId",
                        // lId: "$week." + today + ".lId",
                    },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$sId"] } } },
                        { $addFields: { sId: "$_id" } },
                        { $project: { inherited: 0, status: 0, createdAt: 0, createdBy: 0, updatedBy: 0, keyword: 0 } },
                        { $sort: { in: -1 } },
                        { $addFields: { breakTime: { $cond: { if: { $eq: ["$breakTime", {}] }, then: null, else: "$breakTime" } } } }
                        // { $addFields: { lId: "$$lId" } },
                        // {
                        //     $lookup: {
                        //         from: "location",
                        //         let: { lId: "$lId" },
                        //         pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$lId"] } } }, { $project: { splashpage: 0 } }],
                        //         as: "location"
                        //     }
                        // },
                        // { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
                        // { $replaceRoot: { newRoot: { $mergeObjects: ["$$ROOT", "$location"] } } },
                        // { $project: { location: 0, _id: 0 } }
                    ],
                    as: today
                }
            });
            args.query.push({ $unwind: { path: "$" + today, preserveNullAndEmptyArrays: true } });

            args.query.push({ $unwind: { path: "$week." + yesterday, preserveNullAndEmptyArrays: true } });
            args.query.push({
                $lookup: {
                    from: "shift",
                    let: {
                        sId: "$week." + yesterday + ".sId",
                        // lId: "$week." + yesterday + ".lId",
                    },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$sId"] } } },
                        { $addFields: { sId: "$_id" } },
                        { $project: { inherited: 0, status: 0, createdAt: 0, createdBy: 0, updatedBy: 0, keyword: 0 } },
                        { $sort: { in: -1 } },
                        { $addFields: { breakTime: { $cond: { if: { $eq: ["$breakTime", {}] }, then: null, else: "$breakTime" } } } }
                        // { $addFields: { lId: "$$lId" } },
                        // {
                        //     $lookup: {
                        //         from: "location",
                        //         let: { lId: "$lId" },
                        //         pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$lId"] } } }, { $project: { splashpage: 0 } }],
                        //         as: "location"
                        //     }
                        // },
                        // { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
                        // { $replaceRoot: { newRoot: { $mergeObjects: ["$$ROOT", "$location"] } } },
                        // { $project: { location: 0, _id: 0 } }
                    ],
                    as: yesterday
                }
            });

            args.query.push({ $unwind: { path: "$" + yesterday, preserveNullAndEmptyArrays: true } });
            args.query.push({ $group: { _id: "$_id", [today]: { $addToSet: "$" + today }, [yesterday]: { $addToSet: "$" + yesterday } } });

            JCloud.aggregateOne(args, (err, plan) => {
                if (err) {
                    logger.error(err);
                    return callback(err, employee);
                }

                logger.debug(JSON.stringify(plan))
                employee.plan = plan || {};
                return callback(err, employee);
            })
        }
        else { // Fixed Shift / Plan shift by day
            var eId = employee._id;
            var pId = employee.pId;

            var today = Util.now("YYYY-MM-DD");//today
            var yesterday = new moment().add(-1, "days").format("YYYY-MM-DD").toString();//yesterday

            if (timesheet) {
                today = timesheet.d;//today ddd
                yesterday = new moment(timesheet.d).add(-1, "days").format("YYYY-MM-DD").toString();//yesterday;
            }

            if (employee.time) {
                today = employee.time.d;//today ddd
                yesterday = new moment(employee.time.d).add(-1, "days").format("YYYY-MM-DD").toString();//yesterday
            }

            var args = { schema: 'Plan', query: [] };
            args.query.push({ $match: { pId: pId, eId: eId, d: { $in: [today, yesterday] }, checked: true } })

            args.query.push({
                $lookup: {
                    from: "policy",
                    let: { pId: "$pId", sId: "$sId", ddd: "$ddd" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
                        { $addFields: { pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] } } },
                        { $match: { pType: "Shift", fixedShift: true } },
                        { $addFields: { w: { $objectToArray: "$week" } } },
                        { $unwind: "$w" },
                        { $match: { $expr: { $and: [{ $eq: ["$w.k", "$$ddd"] }] } } },
                        { $unwind: "$w.v" },
                        { $addFields: { sId: "$w.v.sId" } },
                        { $match: { $expr: { $and: [{ $eq: ["$sId", "$$sId"] }] } } },
                        { $project: { _id: 1 } }
                    ],
                    as: "w"
                }
            });
            args.query.push({ $unwind: "$w" });

            args.query.push({
                $lookup: {
                    from: "shift",
                    let: {
                        sId: "$sId",
                        sCode: "$sCode",
                        // lId: "$shift.lId"
                    },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$sId"], } } },
                        { $addFields: { sCode: { $ifNull: ["$$sCode", ""] } } },
                        { $addFields: { sId: "$_id" } },
                        { $addFields: { breakTime: { $cond: { if: { $eq: ["$breakTime", {}] }, then: null, else: "$breakTime" } } } }

                        // { $addFields: { "lId": "$$lId" } },
                        // {
                        //     $lookup: {
                        //         from: "location",
                        //         let: { "lId": "$lId" },
                        //         pipeline: [
                        //             { $match: { $expr: { "$eq": ["$_id", "$$lId"] } } },
                        //             { $project: { "splashpage": 0 } }
                        //         ],
                        //         as: "location"
                        //     }
                        // },
                        // { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } }
                    ],
                    as: "shift"
                }
            });

            args.query.push({ $unwind: { path: "$shift", preserveNullAndEmptyArrays: true } });
            args.query.push({ $group: { _id: "$d", k: { $first: "$d" }, v: { $addToSet: "$shift" } } });
            args.query.push({ $project: { _id: 0, shift: { k: "$k", v: "$v" } } });
            args.query.push({ $group: { _id: null, shift: { $addToSet: "$shift" } } });
            args.query.push({ $replaceRoot: { newRoot: { $arrayToObject: "$shift" } } });

            JCloud.aggregateOne(args, (err, plan) => {
                if (err) {
                    logger.error(err);
                    return callback(err, employee);
                }

                logger.debug(JSON.stringify(plan))
                employee.plan = plan || {};
                return callback(err, employee);
            })
        }
    },
    get2Select1Shift: (employee, callback) => {
        let t, y;
        var aShift = [];

        let timesheet = employee.timesheet;
        let checkOutTime = new moment();

        if (timesheet) { // Khi import
            if (!employee.policy.fixedShift) {
                t = timesheet.ddd;//today ddd
                y = new moment(timesheet.d).add(-1, "days").format("ddd").toString();//yesterday
            }
            else {
                t = timesheet.DD;//today "YYYY-MM-DD"
                y = new moment(timesheet.d).add(-1, "days").format("YYYY-MM-DD").toString();//yesterday
            }
            var tShift = (t in employee.plan) ? employee.plan[t] : []; //Shift of today

            if (tShift && tShift.length > 0) {
                logger.debug("******************Check Date", timesheet.d);
                for (i = 0, n = tShift.length; i < n; i++) {
                    var inEarlier = (tShift[i].inEarlier || 0) * -1;
                    var outLater = (tShift[i].outLater || 0) * -1;

                    let inAt = new moment(timesheet.d + tShift[i].in, 'YYYY-MM-DDHH:mm:ss');
                    let outAt = new moment(timesheet.d + tShift[i].out, 'YYYY-MM-DDHH:mm:ss');
                    if (inAt >= outAt) {
                        outAt = outAt.add(1, "days");
                        // logger.debug("inAt = today, outAt = tomorrow");
                    }
                    else {
                        // logger.debug("inAt = outAt = today");
                    }

                    var ts_inAt = new moment(timesheet.d + timesheet.inAt, 'YYYY-MM-DDHH:mm:ss')
                    var ts_outAt = new moment(timesheet.d + timesheet.outAt, 'YYYY-MM-DDHH:mm:ss')
                    checkOutTime = ts_outAt;

                    logger.debug(inAt, ts_inAt, inAt.diff(ts_inAt, "minutes"), inEarlier);

                    if (ts_inAt.diff(inAt, "minutes") >= inEarlier && ts_inAt.diff(outAt, "minutes") < 0) {
                        logger.debug("Add Shift", tShift[i]._id);
                        aShift.push({ shift: tShift[i], inShift: tShift, inAt, outAt, i, t, y });
                    }
                }
            }
        }
        else if (employee.time) {
            if (!employee.policy.fixedShift) {
                t = employee.time.ddd;//today
                y = new moment(employee.d).add(-1, "days").format("ddd").toString();//yesterday
            }
            else {
                t = employee.time.DD;//today
                y = new moment(employee.d).add(-1, "days").format("YYYY-MM-DD").toString();//yesterday
            }

            var tShift = (t in employee.plan) ? employee.plan[t] : []; //Shift of today
            var yShift = (y in employee.plan) ? employee.plan[y] : []; //Shift of yesterday
            var h = new moment(employee.time.h);
            checkOutTime = h

            if (yShift && yShift.length > 0) {
                logger.debug("===Check Yesterday===");
                for (i = 0, n = yShift.length; i < n; i++) {
                    var inEarlier = (yShift[i].inEarlier || 0) * -1;
                    var outLater = (yShift[i].outLater || 0) * -1;

                    // let inAt = new moment(yShift[i].in, 'HH:mm:ss').utcOffset(420).add(-1, "days");
                    // let outAt = new moment(yShift[i].out, 'HH:mm:ss').utcOffset(420).add(-1, "days");

                    let inAt = new moment(employee.time.DD + "T" + yShift[i].in, 'YYYY-MM-DDTHH:mm:ss').utcOffset(420).add(-1, "days");
                    let outAt = new moment(employee.time.DD + "T" + yShift[i].out, 'YYYY-MM-DDTHH:mm:ss').utcOffset(420).add(-1, "days");

                    if (inAt >= outAt) {
                        outAt = outAt.add(1, "days");
                        if (h.diff(inAt, "minutes") >= inEarlier && outAt.diff(h, "minutes") >= outLater) {//Giờ checkin thỏa => inAt là hôm qua, outAt là hôm nay
                            logger.debug("inAt = yesterday, outAt = today", inAt, outAt);
                            logger.debug("Add Yesterday: ca", yShift[i]._id);
                            aShift.push({ shift: yShift[i], inShift: yShift, inAt, outAt, i, t, y });
                        }
                    }
                }
            }
            if (tShift && tShift.length > 0) {
                logger.debug("===Check Today===");
                for (i = 0, n = tShift.length; i < n; i++) {
                    var inEarlier = (tShift[i].inEarlier || 0) * -1;
                    var outLater = (tShift[i].outLater || 0) * -1;

                    // let inAt = new moment(tShift[i].in, 'HH:mm:ss');
                    // let outAt = new moment(tShift[i].out, 'HH:mm:ss');

                    let inAt = new moment(employee.time.DD + "T" + tShift[i].in, 'YYYY-MM-DDTHH:mm:ss');
                    let outAt = new moment(employee.time.DD + "T" + tShift[i].out, 'YYYY-MM-DDTHH:mm:ss');

                    if (inAt >= outAt) {
                        outAt = outAt.add(1, "days");
                        logger.debug("inAt = today, outAt = tomorrow", inAt, outAt);
                    }

                    logger.debug(h.diff(inAt, "minutes"), ">=", inEarlier, outAt.diff(h, "minutes"), ">=", outLater)
                    if (h.diff(inAt, "minutes") >= inEarlier && outAt.diff(h, "minutes") >= outLater) {
                        logger.debug("Add Today: ca", tShift[i]._id);
                        aShift.push({ shift: tShift[i], inShift: tShift, inAt, outAt, i, t, y });
                    }
                }
            }
        }
        else {
            if (!employee.policy.fixedShift) {
                t = Util.now("ddd");//today
                y = new moment().add(-1, "days").format("ddd").toString();//yesterday
            }
            else {
                t = Util.now("YYYY-MM-DD");//today
                y = new moment().add(-1, "days").format("YYYY-MM-DD").toString();//yesterday
            }

            var tShift = (t in employee.plan) ? employee.plan[t] : []; //Shift of today
            var yShift = (y in employee.plan) ? employee.plan[y] : []; //Shift of yesterday
            var now = new moment();
            checkOutTime = now

            if (yShift && yShift.length > 0) {
                logger.debug("Check Yesterday");
                var checkYesterday = false
                for (i = 0, n = yShift.length; i < n; i++) {
                    var inEarlier = (yShift[i].inEarlier || 0) * -1;
                    var outLater = (yShift[i].outLater || 0) * -1;

                    let inAt = new moment(yShift[i].in, 'HH:mm:ss').utcOffset(420).add(-1, "days");
                    let outAt = new moment(yShift[i].out, 'HH:mm:ss').utcOffset(420).add(-1, "days");

                    if (inAt >= outAt) {
                        outAt = outAt.add(1, "days");
                        if (now.diff(inAt, "minutes") >= inEarlier && outAt.diff(now, "minutes") >= outLater) {//Giờ checkin thỏa => inAt là hôm qua, outAt là hôm nay
                            checkYesterday = true;
                            logger.debug("Add Yesterday: ca", yShift[i]._id);
                            aShift.push({ shift: yShift[i], inShift: yShift, inAt, outAt, i, t, y });
                        }
                    }
                }

                if (checkYesterday) logger.debug("Yesterday Matched");
            }

            if (tShift && tShift.length > 0) {
                logger.debug("Check Today");
                var checkToday = false
                for (i = 0, n = tShift.length; i < n; i++) {
                    var inEarlier = (tShift[i].inEarlier || 0) * -1;
                    var outLater = (tShift[i].outLater || 0) * -1;

                    let inAt = new moment(tShift[i].in, 'HH:mm:ss');
                    let outAt = new moment(tShift[i].out, 'HH:mm:ss');

                    if (inAt >= outAt) {
                        outAt = outAt.add(1, "days");
                        logger.debug("inAt = today, outAt = tomorrow");
                    }

                    logger.debug(now.diff(inAt, "minutes"), ">=", inEarlier, outAt.diff(now, "minutes"), ">=", outLater)
                    if (now.diff(inAt, "minutes") >= inEarlier && outAt.diff(now, "minutes") >= outLater) {
                        checkToday = true;
                        logger.debug("Add Today: ca", tShift[i]._id);
                        aShift.push({ shift: tShift[i], inShift: tShift, inAt, outAt, i, t, y });
                    }
                }

                if (checkToday) logger.debug("Today Matched");
            }
        }

        if (aShift.length == 0) { //Nếu ngoài giờ làm việc
            return callback(null, null);
        }
        else {
            if (aShift.length == 1) { //Nếu có 1 ca thì chọn luôn
                logger.debug("Co 1 ca: ", aShift[0].shift._id, aShift[0].inAt, aShift[0].outAt);
                return callback(null, aShift[0]);
            }

            //Nếu có 2 ca thì chọn 1 thỏa thời gian làm việc
            logger.debug("Co 2 ca");
            logger.debug("Chon 1 ca thoa.");

            var shift1 = aShift[0].shift;
            var sId1 = shift1._id;
            var outLater1 = shift1.outLater || 0;
            var d1 = aShift[0].inAt.format("YYYY-MM-DD");

            var shift2 = aShift[1].shift;
            var sId2 = shift2._id;
            var outLater2 = shift2.outLater || 0;
            var d2 = aShift[1].inAt.format("YYYY-MM-DD");

            var eId = employee._id;
            var groupId = employee.groupId;

            args = {
                schema: "Timesheet",
                query: {
                    _v: _v,
                    eId: eId,
                    d: { $in: [d1, d2] },
                    sId: { $in: [sId1, sId2] },

                    $expr: {
                        $or: [
                            { $lt: ["$hOutAt", moment(aShift[0].outAt).add(outLater1, "minutes").format("YYYY-MM-DD HH:mm:ss")] },
                            { $lt: ["$hOutAt", moment(aShift[1].outAt).add(outLater2, "minutes").format("YYYY-MM-DD HH:mm:ss")] }
                        ]
                    }
                },
                sort: { hOutAt: -1 }
            };

            logger.info(JSON.stringify(args.query))

            JCloud.find(args, (err, timesheets) => {
                if (err) {
                    logger.error(err);
                    return callback(err, null);
                }

                if (timesheets.length >= 2) {
                    if (timesheets[0].sId == aShift[0].shift._id) {
                        //Log both
                        //Log 1st
                        _employee = JSON.parse(JSON.stringify(employee));
                        _employee.objShift = aShift[0];
                        Log.logTimeSheetShift(_employee, function (err, result) { });

                        //Return to log 2nd
                        return callback(null, aShift[1]);
                    }
                    else {
                        //Log both
                        //Log 1st
                        _employee = JSON.parse(JSON.stringify(employee));
                        _employee.objShift = aShift[1];
                        Log.logTimeSheetShift(_employee, function (err, result) { });

                        //Return to log 2nd
                        return callback(null, aShift[0]);
                    }

                }
                else if (timesheets.length == 1) {
                    if (timesheets[0].sId == sId1) {
                        b2 = checkOutTime < aShift[1].outAt.add(outLater2, "minutes")
                        if (b2) {
                            //Log 1st
                            _employee = JSON.parse(JSON.stringify(employee));
                            _employee.objShift = aShift[1];
                            Log.logTimeSheetShift(_employee, function (err, result) { });

                        }
                        return callback(null, aShift[0]);
                    }
                    else {
                        b1 = checkOutTime < aShift[0].outAt.add(outLater1, "minutes")
                        if (b1) {
                            //Log 1st
                            _employee = JSON.parse(JSON.stringify(employee));
                            _employee.objShift = aShift[0];
                            Log.logTimeSheetShift(_employee, function (err, result) { });

                        }

                        return callback(null, aShift[1]);
                    }
                }
                else {

                    b1 = checkOutTime < aShift[0].outAt.add(outLater1, "minutes")
                    b2 = checkOutTime < aShift[1].outAt.add(outLater2, "minutes")

                    if (b1 && b2) { //Log both
                        if (aShift[0].outAt.add(outLater1, "minutes") > aShift[1].outAt.add(outLater2, "minutes")) {
                            //Log 1 first
                            _employee = JSON.parse(JSON.stringify(employee));
                            _employee.objShift = aShift[0];
                            Log.logTimeSheetShift(_employee, function (err, result) { });

                            //Log 2
                            return callback(null, aShift[1]);
                        }
                        else {
                            //Log 2 first
                            _employee = JSON.parse(JSON.stringify(employee));
                            _employee.objShift = aShift[1];
                            Log.logTimeSheetShift(_employee, function (err, result) { });

                            //Log 1
                            return callback(null, aShift[0]);
                        }
                    }

                    if (b1) {
                        return callback(null, aShift[0]);
                    }
                    else if (b2) {
                        return callback(null, aShift[1]);
                    }
                    else {
                        return callback(null, null);
                    }
                }
            })
        }
    },
    getRSbyMethod: (obj, callback) => {
        var args;
        if (obj.code) {
            logger.debug("Check by qrCode");
            args = { schema: "Group", query: [] }
            // args.query.push({ $match: { _id: obj.groupId } });

            try {
                if (obj.code == obj.groupId) {
                    args = { schema: "Group", query: [] }
                    args.query.push({ $match: { _id: obj.groupId } });
                }
                else {
                    var decoded = Util.verifyToken(obj.code, CONF.SECRET);
                    if (decoded._id) {
                        args = { schema: "Group", query: [] }
                        logger.debug("Check by QRCode include Group Id");
                        args.query.push({ $match: { _id: decoded._id } });
                    }
                    else if (decoded.groupId) {
                        logger.debug("Check by QRCode include Group Id");
                        args = { schema: "Group", query: [] }
                        args.query.push({ $match: { _id: decoded.groupId } });
                    }
                    else if (decoded.lId) {
                        logger.debug("Check by QRCode include Location Id");
                        args = { schema: "Location", query: [] }
                        args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
                        args.query.push({ $match: { groupId: obj.groupId, _id: decoded.lId } });
                        args.query.push({ $addFields: { radius: obj.radius || 0 } });
                    }
                }
            }
            catch (err) {
                logger.debug(err);
                args.query.push({ $match: { _id: obj.groupId } });
                args.query.push({ $match: { qrcode: obj.code } });
            }
        }
        else if (obj.lId) { // && !obj.lat
            logger.debug("Check by Location Id");
            var args = { schema: "Location", query: [] }
            args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
            args.query.push({ $match: { groupId: obj.groupId, _id: obj.lId } });
            args.query.push({ $addFields: { radius: obj.radius || 0 } });
        }
        else if (obj.mac_ap) {
            logger.debug("Check by MAC AP");

            var args = { schema: "AccessPoint", query: [] };
            args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
            // args.query.push({ $match: { groupId: obj.groupId} }); //Removed
            args.query.push({ $match: { mac_ap: obj.mac_ap, status: "Active" } });

            args.query.push({
                $lookup: {
                    from: "location",
                    let: { location_id: "$location" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$location_id"] }] } } }
                    ],
                    as: "location"
                }
            });

            args.query.push({ $unwind: { path: "$location", preserveNullAndEmptyArrays: true } });

            args.query.push({ $addFields: { radius: obj.radius || 0 } });

            // args.query.push({ $project: { session: 1, idle: 1, bwdown: 1, bwup: 1, group: 1, location: 1, till: 1, group: 1, radius: 1 } })
        }
        else if (obj.bssid) {
            logger.debug("Check by BSSID");
            var args = { schema: "AccessPoint", query: [] }
            args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
            // args.query.push({ $match: { groupId: obj.groupId} }); //Removed
            args.query.push({ $match: { mac_ap: obj.bssid, status: "Active" } });

            args.query.push({
                $lookup: {
                    from: "location",
                    let: { location_id: "$location" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$location_id"] }] } } },
                    ],
                    as: "location"
                }
            });

            args.query.push({ $unwind: { path: "$location", preserveNullAndEmptyArrays: true } });

            args.query.push({ $addFields: { radius: obj.radius || 0 } });
        }
        else if (obj.serial) {
            logger.debug("Check by Scanner Serial");
            args = { schema: "Scanner", query: [] }
            args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
            args.query.push({ $match: { groupId: obj.groupId, scanner: obj.serial } });

            args.query.push({
                $lookup: {
                    from: "location",
                    let: { location_id: "$location" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$location_id"] }] } } }, ,
                    ],
                    as: "location"
                }
            });

            args.query.push({ $unwind: { path: "$location", preserveNullAndEmptyArrays: true } });

            args.query.push({ $addFields: { radius: obj.radius || 0 } });
        }
        else if (obj.lat && obj.long) {
            logger.debug("Check by GPS");
            args = { schema: "Location", query: [] }
            args.query.push({
                $geoNear: {
                    near: { type: "Point", coordinates: [obj.long, obj.lat] },
                    distanceField: "distance",
                    query: {},
                    spherical: true
                },
            });

            args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
            args.query.push({ $match: { groupId: obj.groupId } });
            args.query.push({ $sort: { distance: 1 } });

            args.query.push({
                $lookup: {
                    from: "policy",
                    let: {}, //get policy default
                    pipeline: [
                        { $match: { _id: obj.pId } },
                        { $project: { _id: 0, radius: 1 } }
                    ],
                    as: "policy"
                }
            });
            args.query.push({ $unwind: { path: "$policy", preserveNullAndEmptyArrays: true } });
            
            args.query.push({ $match: { $expr: { $gte: [{ $toDouble: { $ifNull: ["$policy.radius", 500] } }, "$distance"] } } });
        }
        else if (obj.hikId && obj.apId) {
            logger.debug("Check by HiK");
            args = { schema: "HIKCentral", query: [] }
            args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
            args.query.push({ $match: { _id: obj.hikId, groupId: obj.groupId } });
            args.query.push({ $unwind: "$mapAp" });
            args.query.push({ $addFields: { apId: "$mapAp.apId", lId: "$mapAp.lId" } });
            args.query.push({ $match: { apId: obj.apId } });

            args.query.push({
                $lookup: {
                    from: "location",
                    let: { lId: "$lId" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$lId"] }] } } },
                    ],
                    as: "location"
                }
            });

            args.query.push({ $unwind: { path: "$location", preserveNullAndEmptyArrays: true } });

            args.query.push({ $addFields: { radius: obj.radius || 0 } });
        }

        if (!args) return callback(null, null);

        logger.debug("getRSbyMethod", JSON.stringify(args.query));

        JCloud.aggregateOne(args, (err, resource) => {
            if (err) {
                logger.error(err);
                return callback(err, resource);
            }

            if (resource && resource.distance) resource.radius = Math.floor(resource.distance);

            return callback(null, resource);
        })
    },
    getPolicyFixed: (groupId, callback) => {
        var args = { schema: "Policy", query: [] };

        args.query.push({ $match: { groupId: groupId } });
        args.query.push({
            $addFields: {
                pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] },
                fixedShift: { $ifNull: ["$fixedShift", false] }
            }
        });
        args.query.push({ $match: { pType: "Shift" } });
        args.query.push({ $unwind: { path: "$week.Mon", preserveNullAndEmptyArrays: true } });
        args.query.push({ $lookup: { from: "shift", let: { sId: "$week.Mon.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } });
        args.query.push({ $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } });
        args.query.push({ $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, arr: { $addToSet: "$dow.v" }, obj: { $addToSet: "$dow" } } });
        args.query.push({ $addFields: { "weekArr.Mon": "$arr", "weekObj:.Mon": { $arrayToObject: "$obj" } } });

        args.query.push({ $unwind: { path: "$week.Tue", preserveNullAndEmptyArrays: true } });
        args.query.push({ $lookup: { from: "shift", let: { sId: "$week.Tue.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } });
        args.query.push({ $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } });
        args.query.push({ $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, arr: { $addToSet: "$dow.v" }, obj: { $addToSet: "$dow" } } });
        args.query.push({ $addFields: { "weekArr.Tue": "$arr", "weekObj.Tue": { $arrayToObject: "$obj" } } });
        args.query.push({ $unwind: { path: "$week.Wed", preserveNullAndEmptyArrays: true } });

        args.query.push({ $lookup: { from: "shift", let: { sId: "$week.Wed.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } });
        args.query.push({ $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } });
        args.query.push({ $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, arr: { $addToSet: "$dow.v" }, obj: { $addToSet: "$dow" } } });
        args.query.push({ $addFields: { "weekArr.Wed": "$arr", "weekObj.Wed": { $arrayToObject: "$obj" } } });

        args.query.push({ $unwind: { path: "$week.Thu", preserveNullAndEmptyArrays: true } });
        args.query.push({ $lookup: { from: "shift", let: { sId: "$week.Thu.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } });
        args.query.push({ $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } });
        args.query.push({ $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, arr: { $addToSet: "$dow.v" }, obj: { $addToSet: "$dow" } } });
        args.query.push({ $addFields: { "weekArr.Thu": "$arr", "weekObj.Thu": { $arrayToObject: "$obj" } } });

        args.query.push({ $unwind: { path: "$week.Fri", preserveNullAndEmptyArrays: true } });
        args.query.push({ $lookup: { from: "shift", let: { sId: "$week.Fri.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } });
        args.query.push({ $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } });
        args.query.push({ $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, arr: { $addToSet: "$dow.v" }, obj: { $addToSet: "$dow" } } });
        args.query.push({ $addFields: { "weekArr.Fri": "$arr", "weekObj.Fri": { $arrayToObject: "$obj" } } });

        args.query.push({ $unwind: { path: "$week.Sat", preserveNullAndEmptyArrays: true } });
        args.query.push({ $lookup: { from: "shift", let: { sId: "$week.Sat.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } });
        args.query.push({ $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } });
        args.query.push({ $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, arr: { $addToSet: "$dow.v" }, obj: { $addToSet: "$dow" } } });
        args.query.push({ $addFields: { "weekArr.Sat": "$arr", "weekObj.Sat": { $arrayToObject: "$obj" } } });

        args.query.push({ $unwind: { path: "$week.Sun", preserveNullAndEmptyArrays: true } });
        args.query.push({ $lookup: { from: "shift", let: { sId: "$week.Sun.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } });
        args.query.push({ $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } });
        args.query.push({ $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, arr: { $addToSet: "$dow.v" }, obj: { $addToSet: "$dow" } } });
        args.query.push({ $addFields: { "weekArr.Sun": "$arr", "weekObj.Sun": { $arrayToObject: "$obj" } } });

        args.query.push({ $project: { Sun: 0 } })

        JCloud.aggregate(args, (err, policy) => {
            if (err) {
                logger.error(err);
            }

            logger.debug(JSON.stringify(policy))
            callback(err, policy)
        })
    },
    getPlan: (query, callback) => {
        var groupId = query.groupId;
        var search = (query.search) ? JSON.parse(query.search) : {};
        if (search.name) {
            search.keyword = Util.removeDMV(search.name);
            delete search.name;
        }
        var keys = Object.keys(search);
        var page = parseInt(query.page || 1);
        var pageSize = parseInt(query.pageSize || 2147483647);
        var sort = ((query.sort) ? JSON.parse(query.sort) : { no: 1 });
        var skip = (page - 1) * pageSize;

        var fromDate = query.fromDate ? query.fromDate.substr(0, 10) : Util.now("YYYY-MM-DD");
        var toDate = query.toDate ? query.toDate.substr(0, 10) : Util.now("YYYY-MM-DD");
        var _fromDate = moment(fromDate, "YYYY-MM-DD");
        var _toDate = moment(toDate, "YYYY-MM-DD");
        var today = moment();
        var m = _toDate.format("YYYY-MM").toString();
        var d = Util.now("YYYY-MM-DD");

        var pId = query.pId;

        isPast = true;
        if (_fromDate <= moment()) {
            isPast = false;
        }

        var args = { schema: "Policy", query: { _id: pId } }

        JCloud.findOne(args, (err, policy) => {

            if (!policy) {
                return null;
            }

            var dom = [];
            var sQuery = [];

            while (_toDate.diff(_fromDate, 'days', true) >= 0) {
                var ddd = _fromDate.format("ddd").toString();
                dom.push({ e: ddd, d: _fromDate.format("YYYY-MM-DD") })
                _fromDate.add(1, 'days');
            }
            var args = { schema: "Employee", query: [] };
            args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
            
            args.query.push({ $match: { groupId: groupId, pId: pId } });
            if (process.env.SERVER_MODE != "dev") args.query.push({ $match: { department: { $ne: "TEST" } } });
            args.query.push({ $match: { $expr: { $and: [{ $gte: [toDate, { $ifNull: ["$startAt", toDate] }] }, { $gte: [{ $ifNull: ["$endAt", toDate] }, fromDate] }] } } })
            args.query.push({ $addFields: { availableLeaveDay: { $add: ["$oldLeaveDay", "$newLeaveDay"] } } });

            if (keys.length > 0) {
                keys.forEach((key) => {
                    if (typeof search[key] != "object") {
                        if (key == "department" || key == "position" || key == "_id" || key == "pId") {
                            args.query.push({ $match: { [key]: search[key] } });
                        }
                        else {
                            args.query.push({ $match: { [key]: { $regex: Util.removeDMV(search[key]), $options: "i" } } });
                        }
                    }
                });
            }

            args.query.push({ $project: { _id: 1, name: 1, no: 1, gender: 1, email: 1, phone: 1, birthday: 1, groupId: 1, department: 1, position: 1, startAt: 1, type: 1, pId: 1 } });

            args.query.push({
                $lookup: {
                    from: "policy",
                    let: { pId: "$pId" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },

                        { $addFields: { pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] } } },
                        { $match: { pType: "Shift" } },
                        { $match: { fixedShift: true } },

                        { $unwind: { path: "$week.Mon", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Mon.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out", checked: null } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
                        { $addFields: { "weekArr.Mon": "$arr", "weekObj.Mon": { $arrayToObject: "$obj" } } },


                        { $unwind: { path: "$week.Tue", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Tue.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out", checked: null } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
                        { $addFields: { "weekArr.Tue": "$arr", "weekObj.Tue": { $arrayToObject: "$obj" } } },

                        { $unwind: { path: "$week.Wed", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Wed.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out", checked: null } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
                        { $addFields: { "weekArr.Wed": "$arr", "weekObj.Wed": { $arrayToObject: "$obj" } } },

                        { $unwind: { path: "$week.Thu", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Thu.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out", checked: null } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
                        { $addFields: { "weekArr.Thu": "$arr", "weekObj.Thu": { $arrayToObject: "$obj" } } },

                        { $unwind: { path: "$week.Fri", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Fri.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out", checked: null } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
                        { $addFields: { "weekArr.Fri": "$arr", "weekObj.Fri": { $arrayToObject: "$obj" } } },

                        { $unwind: { path: "$week.Sat", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Sat.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out", checked: null } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
                        { $addFields: { "weekArr.Sat": "$arr", "weekObj.Sat": { $arrayToObject: "$obj" } } },

                        { $unwind: { path: "$week.Sun", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Sun.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out", checked: null } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
                        { $addFields: { "weekArr.Sun": "$arr", "weekObj.Sun": { $arrayToObject: "$obj" } } },

                        { $project: { Sun: 0 } }

                    ],
                    as: "policy"
                }
            });

            args.query.push({ $unwind: "$policy" });

            if (!query.noCount) {
                sQuery.push({ $skip: skip });

                if (pageSize) {
                    sQuery.push({ $limit: pageSize });
                }
            }

            sQuery.push({ $addFields: { dom: dom } });

            sQuery.push({
                $addFields: {
                    planObj: {
                        $reduce: {
                            input: "$dom", initialValue: [], in: {
                                $concatArrays: ["$$value",
                                    {
                                        $switch: {
                                            branches: [
                                                { case: { $eq: ["$$this.e", "Mon"] }, then: [{ k: "$$this.d", v: "$policy.weekObj.Mon" }] },
                                                { case: { $eq: ["$$this.e", "Tue"] }, then: [{ k: "$$this.d", v: "$policy.weekObj.Tue" }] },
                                                { case: { $eq: ["$$this.e", "Wed"] }, then: [{ k: "$$this.d", v: "$policy.weekObj.Wed" }] },
                                                { case: { $eq: ["$$this.e", "Thu"] }, then: [{ k: "$$this.d", v: "$policy.weekObj.Thu" }] },
                                                { case: { $eq: ["$$this.e", "Fri"] }, then: [{ k: "$$this.d", v: "$policy.weekObj.Fri" }] },
                                                { case: { $eq: ["$$this.e", "Sat"] }, then: [{ k: "$$this.d", v: "$policy.weekObj.Sat" }] },
                                                { case: { $eq: ["$$this.e", "Sun"] }, then: [{ k: "$$this.d", v: "$policy.weekObj.Sun" }] }
                                            ],
                                            default: 0
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            });

            sQuery.push({ $unwind: "$planObj" });

            //Start Timesheet Total by date
            sQuery.push({
                $lookup: {
                    from: "plan",
                    let: {
                        eId: "$_id",
                        groupId: "$groupId",
                        policy: "$policy",
                        pId: "$policy._id",
                        planObj: "$planObj"
                    },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$eId", "$$eId"] }, { $eq: ["$pId", "$$pId"] }, { $eq: ["$d", "$$planObj.k"] }] } } },
                        {
                            $lookup: {
                                from: "shift",
                                let: { sId: "$sId" },
                                pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$sId"] }] } } }],
                                as: "shift"
                            }
                        },
                        { $unwind: { path: "$shift", preserveNullAndEmptyArrays: true } },
                        {
                            $lookup: {
                                from: "policy",
                                let: { pId: "$pId", sId: "$sId", ddd: "$ddd" },
                                pipeline: [
                                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
                                    { $addFields: { pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] } } },
                                    { $match: { pType: "Shift", fixedShift: true } },
                                    { $addFields: { w: { $objectToArray: "$week" } } },
                                    { $unwind: "$w" },
                                    { $match: { $expr: { $and: [{ $eq: ["$w.k", "$$ddd"] }] } } },
                                    { $unwind: "$w.v" },
                                    { $addFields: { sId: "$w.v.sId" } },
                                    { $match: { $expr: { $and: [{ $eq: ["$sId", "$$sId"] }] } } },
                                    { $project: { _id: 1 } }
                                ],
                                as: "w"
                            }
                        },
                        {
                            $addFields: {
                                checked: { $cond: { if: { $gt: [{ $size: "$w" }, 0] }, then: { $ifNull: ["$checked", false] }, else: null } },
                                sCode: { $ifNull: ["$sCode", ""] },
                                sColor: { $ifNull: ["$shift.color", "default"] },
                                message: { $cond: { if: { $gt: [{ $size: { $ifNull: ["$w", []] } }, 0] }, then: null, else: "This shift is removed by Policy" } }
                            }
                        },
                        {
                            $addFields: {
                                k: "$d",
                                v: {
                                    k: "$sId",
                                    v: {
                                        sId: "$sId",
                                        sName: "$shift.name",
                                        sCode: "$sCode",
                                        sColor: "$sColor",
                                        sIn: "$shift.in",
                                        sOut: "$shift.out",
                                        checked: "$checked",
                                        message: "$message",
                                    }
                                }
                            }
                        },
                        {
                            $group: {
                                _id: "$k",
                                k: { $first: "$k" },
                                v: { $addToSet: "$v" }
                            }
                        },
                        { $addFields: { v: { $arrayToObject: "$v" } } },
                        { $project: { _id: 0, k: 1, v: 1 } },
                        { $sort: { k: 1 } }
                    ],
                    as: "planbydate"
                }
            });

            sQuery.push({ $unwind: { path: "$planbydate", preserveNullAndEmptyArrays: true } });

            sQuery.push({ $addFields: { plan: { k: "$planObj.k", v: { $mergeObjects: ["$planObj.v", "$planbydate.v"] } } } });

            sQuery.push({
                $group: {
                    _id: "$_id",
                    eId: { $first: "$_id" },
                    name: { $first: "$name" },
                    birthday: { $first: "$birthday" },
                    phone: { $first: "$phone" },
                    email: { $first: "$email" },
                    gender: { $first: "$gender" },
                    department: { $first: "$department" },
                    position: { $first: "$position" },
                    no: { $first: "$no" },
                    startAt: { $first: "$startAt" },
                    policy: { $first: "$policy" },
                    groupId: { $first: "$groupId" },
                    week: { $first: "$policy.weekObj" },
                    plan: { $addToSet: "$plan" },
                }
            });

            sQuery.push({ $addFields: { plan: { $arrayToObject: "$plan" } } });
            //End

            sQuery.push({
                $addFields: {
                    shift: {
                        $reduce: {
                            input: { $objectToArray: "$policy.weekArr" },
                            initialValue: [],
                            in: { "$concatArrays": ["$$value", { $cond: { if: { $setIsSubset: ["$$this.v", "$$value"] }, then: [], else: "$$this.v" } }] }
                        }
                    }
                }
            });

            sQuery.push({ $addFields: { shift: { $filter: { input: "$shift", as: "x", cond: { $ne: ["$$x", null] } } } } });

            sQuery.push({ $unwind: { path: "$shift", preserveNullAndEmptyArrays: true } });
            sQuery.push({ $unwind: { path: "$shift.v", preserveNullAndEmptyArrays: true } });
            sQuery.push({ $sort: { "shift.sIn": 1, "shift.sName": 1 } });

            sQuery.push({
                $group: {
                    _id: "$_id",
                    eId: { $first: "$_id" },
                    name: { $first: "$name" },
                    birthday: { $first: "$birthday" },
                    phone: { $first: "$phone" },
                    email: { $first: "$email" },
                    gender: { $first: "$gender" },
                    department: { $first: "$department" },
                    position: { $first: "$position" },
                    no: { $first: "$no" },
                    startAt: { $first: "$startAt" },
                    groupId: { $first: "$groupId" },
                    plan: { $first: "$plan" },
                    week: { $first: "$week" },
                    shift: { $push: "$shift" }
                }
            });

            if (sort) {
                sQuery.push({ $sort: sort });
            }

            sQuery.push({
                $group: {
                    _id: null,
                    schedule: {
                        $push: {
                            _id: "$_id",
                            eId: "$eId",
                            name: "$name",
                            birthday: "$birthday",
                            phone: "$phone",
                            email: "$email",
                            gender: "$gender",
                            department: "$department",
                            position: "$position",
                            no: "$no",
                            startAt: "$startAt",
                            groupId: "$groupId",
                            plan: "$plan",
                        }
                    },
                    week: { $first: "$week" },
                    shift: { $first: "$shift" }
                }
            })

            sQuery.push({ $project: { _id: 0 } })

            //End

            if (query.noCount == true) {
                args.query.push(...sQuery);

                JCloud.aggregate(args, (err, result) => {
                    if (err) {
                        logger.error(err);
                    }

                    result.fromDate = fromDate
                    result.toDate = toDate;
                    result.detail = true;
                    result.group = group;

                    return callback(err, result);
                })
            }
            else {
                args.query.push({ $group: { _id: null, count: { $sum: 1 } } });

                JCloud.aggregate(args, (err, result) => {
                    if (err) {
                        logger.error(err);
                    }

                    if (result.length == 0) {
                        var response = { doc: [], total: 0, pages: 0 };
                        return callback(err, response);
                    }

                    //Assign count.
                    var count = result[0].count;
                    if (count == 0) {
                        var response = { doc: [], total: count, pages: 0 };
                        return response;
                    }

                    //Remove $group count
                    args.query.pop();

                    args.query.push(...sQuery);
                    // logger.debug(JSON.stringify(args.query));
                    JCloud.aggregateOne(args, (err, result) => {
                        if (err) {
                            logger.error(err);
                        }

                        if (!result || result.length == 0) {
                            count = 0
                        }

                        var response = { doc: result, total: count, pages: Math.ceil(count / pageSize) };

                        return callback(err, response);
                    })
                })
            }
        });
    },
    checkShiftInPolicy: (obj, callback) => {
        var ddd = obj.ddd;

        var args = { schema: 'Policy', query: [] };
        args.query.push({ $match: { _id: obj.pId } });
        args.query.push({ $unwind: { path: "$week." + ddd, "preserveNullAndEmptyArrays": true } });
        args.query.push({ $match: { ["week." + ddd + ".sId"]: obj.sId } });

        // logger.debug(JSON.stringify(args.query));
        JCloud.aggregateOne(args, (err, result) => {
            if (err) {
                logger.error(err);
            }

            return callback(err, result);
        })
    },

    checkShiftInPlan: (obj, callback) => {
        var args = { schema: 'Plan', query: [] };
        args.query.push({ $match: { eId: obj.eId, pId: obj.pId, sId: obj.sId, d: obj.d } });

        // logger.debug(JSON.stringify(args.query));
        JCloud.aggregateOne(args, (err, result) => {
            if (err) {
                logger.error(err);
            }

            return callback(err, result);
        })
    },
    updateMac: (obj) => {
        logger.debug(JSON.stringify(obj));

        if (Util.isMAC(obj.mac_device)) {

            var args = { schema: "Employee", query: { $or: [{ mmac: obj.mac_device }, { dmac: obj.mac_device }] } };

            JCloud.findOne(args, (err, result) => {
                if (err) {
                    logger.error(err);
                }
                if (!result) {
                    var update = {};

                    if (obj.device_type && obj.device_type == "desktop") {
                        update = { $push: { dmac: { $each: [obj.mac_device], $position: 0, $slice: 1 } } };
                    }
                    else {
                        update = { $push: { mmac: { $each: [obj.mac_device], $position: 0, $slice: 2 } } };
                    }

                    var args = { schema: "Employee", query: { _id: obj.eId }, update: update, select: "-pw -password" };

                    JCloud.findOneAndUpdate(args, (err, result) => {
                        if (err) {
                            logger.error(err);
                        }
                        logger.debug("Mac updated", obj.mac_device);
                    });
                }
            });
        }
    },
    removeDesktopMac: (obj) => {
        logger.debug(JSON.stringify(obj));
        update = { $set: { dmac: [] } };

        var args = { schema: "Employee", query: { _id: obj._id }, update: update, select: "-pw -password" };

        JCloud.findOneAndUpdate(args, (err, result) => {
            if (err) {
                logger.error(err);
            }
            logger.debug("Destop Mac removed");
        });
    },
    resetPasswordAllEmployee(groupId) {
        var args = { schema: "Employee", query: { groupId: groupId } };

        JCloud.find(args, (err, result) => {
            if (err) {
                logger.error(err);
                return callback(err, null);
            }

            result = JSON.parse(JSON.stringify(result))

            logger.debug("Employee", JSON.stringify(result));

            var fAsync = [];
            for (i = 0, n = result.length; i < n; i++) {
                let employee = result[i];

                fAsync.push(function (callback) {
                    let eId = employee._id;
                    let initPassword = employee.initPassword || eId.substr(0, 6);

                    var update = { initPassword: initPassword, password: Util.hashPassword(initPassword, employee.salt) }

                    var args = { schema: "Employee", query: { _id: eId, groupId: groupId }, update: update };
                    JCloud.findOneAndUpdate(args, (err, result) => {
                        if (err) {
                            logger.error(err);
                            callback(err, null);
                        }

                        callback(null, result);
                    })
                })
            }

            if (fAsync.length > 0) {
                async.parallel(fAsync, function (err, results) {
                    if (err) {
                        logger.error(err);
                    }

                    logger.debug("resetPasswordAllEmployee DONE", JSON.stringify(results));
                });
            }
        })
    },

    postFCM: ({ registration_ids, title, message, listId, policy }) => {
        if (registration_ids && registration_ids.length > 0) {
            var body = {
                registration_ids: registration_ids,
                notification: { title: title, body: message },
                android: {
                    // priority: "normal"
                    priority: "hight"
                },
                apns: {
                    headers: {
                        // "apns-priority": "5"
                        "apns-priority": "10"
                    }
                },
                webpush: {
                    headers: {
                        Urgency: "high"
                    }
                },
                time_to_live: 10
            }

            var option = { headers: { 'content-type': 'application/json', "authorization": CONF.FIBASE_KEY }, url: FCM_URL, body: JSON.stringify(body) };

            if (policy) logger.debug("[POST FCM] Policy", JSON.stringify(policy));
            logger.debug("[POST FCM] LIST ID", JSON.stringify(listId));
            logger.debug("[POST FCM] POST", FCM_URL);
            logger.debug("[POST FCM] content-type: application/json");
            logger.debug("[POST FCM] token:", CONF.FIBASE_KEY);
            logger.debug("[POST FCM]", JSON.stringify(body));

            request.post(option, function (err, response, data) {
                if (err) {
                    logger.error(err);
                }

                logger.debug("[POST FCM] Result:", JSON.stringify(data));
            });
        }
    }
}
