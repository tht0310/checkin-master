var axios = require('axios');
var schedule = require("node-schedule");

module.exports = {
    autoLogTimeSheet: (groupId, eId, date) => {
        var X = { code: "X" };
        var K = { code: "K" };
        var H = { code: "NL" };
        var d = date || Util.now("YYYY-MM-DD");
        var ddd = moment(d, "YYYY-MM-DD").format("ddd");
        var m = moment(d, "YYYY-MM-DD").format("YYYY-MM");

        var args = { schema: "Employee", query: [] };
        args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });

        args.query.push({ $match: { $expr: { $and: [{ $gte: [d, { $ifNull: ["$startAt", d] }] }, { $gte: [{ $ifNull: ["$endAt", d] }, d] }] } } });

        if (groupId) {
            args.query.push({ $match: { groupId: groupId } });
        }

        if (eId) {
            args.query.push({ $match: { _id: eId } });
        }

        args.query.push({
            $lookup: {
                from: "policy",
                let: { pId: "$pId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
                    { $addFields: { pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] } } },
                    { $match: { pType: "Office" } },
                ],
                as: "policy"
            }
        });
        args.query.push({ $unwind: "$policy" });

        args.query.push({
            $lookup: {
                from: "timesheet",
                let: { "eId": "$_id", groupId: "$groupId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$eId", "$$eId"] }, { $eq: ["$d", d] }] } } },
                    { $addFields: { code: { $ifNull: ["$code", ""] } } }
                ],
                as: "timesheet"
            }
        });


        args.query.push({ $unwind: { path: "$timesheet", preserveNullAndEmptyArrays: true } });
        args.query.push({ $addFields: { timesheet: { $ifNull: ["$timesheet", null] } } })
        args.query.push({ $match: { $expr: { $or: [{ $eq: ["$timesheet", null] }, { $eq: ["$timesheet.code", null] }, { $eq: ["$timesheet.code", ""] }, { $eq: ["$timesheet.code", "K"] }, { $eq: ["$checkin", null] }, { $eq: ["$checkin.alowAlert", true] }] } } });

        args.query.push({ $project: { _id: 1, group: 1, timesheet: 1, policy: 1, checkin: 1, groupId: 1 } });
        logger.debug(JSON.stringify(args.query))

        JCloud.aggregate(args, (err, result) => {
            if (err) {
                logger.error(err);
            }

            if (result) {
                result = JSON.parse(JSON.stringify(result));
                logger.debug("[CRON AUTO LOG TIMESHEET]");

                var fAsync = [];
                for (i = 0; i < result.length; i++) {
                    let employee = result[i];
                    logger.debug("Employee", employee._id, JSON.stringify(employee.checkin));

                    logger.debug(ddd, JSON.stringify(employee.policy.office))

                    if (employee.policy.office[ddd].inAM || employee.policy.office[ddd].inPM) {
                        let groupId = employee.groupId;
                        let eId = employee._id;

                        logger.debug(eId, groupId, d, Util.hashKey(eId + groupId + d));

                        let _id = Util.hashKey(eId + groupId + d);
                        let doc = {
                            d: d,
                            m: m,
                            eId: eId,
                            groupId: groupId,
                            l: "auto"
                        }
                        employee.group = employee.group || {}
                        var holidays = employee.group.holidays || employee.policy.holidays || [];
                        if (holidays.indexOf(d) != -1) {
                            doc = { ...doc, ...H };
                        }
                        else if (typeof employee.checkin == "undefined" || employee.checkin == null) {
                            doc = { ...doc, ...X };
                        }
                        else if (!employee.timesheet || !employee.timesheet.code) {
                            doc = { ...doc, ...K };
                        }

                        logger.debug("Code", doc.code);
                        if (doc.code) {
                            fAsync.push(function (cb) {
                                let schema = "Timesheet";
                                let query = { _id: _id }
                                let update = { $set: doc, $setOnInsert: { _id: _id, dow: ddd } };

                                JCloud.findOneAndUpsert({ schema: schema, query: query, update: update, isNew: false }, (err, result) => {
                                    if (err) {
                                        logger.error(err);
                                    }
                                    let ts = { d: d, m: m, eId: eId, groupId: groupId, code: doc.code, byId: "Bot", byName: "[auto]" }

                                    if (result && result.code != doc.code) {
                                        logger.debug("LOG SHEET", JSON.stringify(query), JSON.stringify(update));
                                        Log.logSheet(ts);
                                    }

                                    return cb(result);
                                });
                            })
                        }
                    }
                    else {
                        logger.debug("OFF");
                    }
                }

                if (fAsync.length > 0) {
                    async.parallel(fAsync, function (err, results) {
                        logger.debug("DONE");
                    });
                }
                else {
                    logger.debug("NONE");
                }
            }
        })
    },
    autoCalculateLateTime: (date) => {
        let schema = "Timesheet";
        let query = { d: Util.now("YYYY-MM-DD"), code: { $in: ["4X,4K", "4X,4P"] } };

        let update = { $set: { lateIn: 0, earlyOut: 0 } };

        JCloud.findOneAndUpdate({ schema: schema, query: query, update: update, isNew: true }, (err, result) => {
            if (err) {
                logger.error(err);
            }

            logger.debug(JSON.stringify(result));
        });
    },
    //v2
    autoGetLOASheet: (fromDate, toDate, groupId, email) => {
        var args = { schema: "Group", query: [] }
        args.query.push({ $match: { _id: groupId } })

        args.query.push({
            $lookup: {
                from: "department",
                let: { groupId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$groupId", "$$groupId"] }] } } },
                    { $group: { _id: null, name: { $push: "$name" } } }
                ],
                as: "department"
            }
        });
        args.query.push({ $unwind: { path: "$department", preserveNullAndEmptyArrays: true } });

        args.query.push({
            $project: {
                _id: 1, name: 1,
                resetDate: { $ifNull: ["$resetDate", "01/04"] },
                pcDate: { $ifNull: ["$pcDate", 1] },
                holidays: { $ifNull: ["$holidays", []] },
                positions: { $ifNull: ["$positions", []] },
                departments: { $ifNull: ["$department.name", []] },
                webhook: { $ifNull: ["$webhook", { PD: {}, OT: {} }] },
            }
        });

        if (email) {
            args.query.push({
                $lookup: {
                    from: "employee",
                    let: { groupId: "$_id" },
                    pipeline: [
                        { $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } },
                    ], as: "employee"
                }
            });

            args.query.push({ $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } });
            args.query.push({ $match: { "employee.email": email } });
        }

        JCloud.aggregate(args, (err, groupList) => {
            if (err) {
                logger.error(err);
                return;
            }

            if (groupList) {
                logger.debug("Have", groupList.length, "group matched");
                for (i = 0; i < groupList.length; i++) {
                    let group = JSON.parse(JSON.stringify(groupList[i]));
                    let pId = group._id;
                    let sName = group.name;
                    let groupId = group._id;
                    let pcDate = group.pcDate;

                    if (typeof pcDate != "undefined" && group.webhook.PD.url) {
                        let startDate = fromDate || moment().add(-10, "days").format("YYYY-MM-DD");
                        let endDate = toDate || moment().add(5, "days").format("YYYY-MM-DD");
                        let url = group.webhook.PD.url;

                        if (url) {
                            var headers = {};
                            let H = group.webhook.PD.header.split('\n');
                            for (j = 0; j < H.length; j++) {
                                let item = H[j].split(":");
                                headers[item[0]] = item[1];
                            }

                            if (group.webhook.PD.method == "post" || group.webhook.PD.method == "POST") {
                                var data = { startDate: startDate, endDate: endDate };

                                logger.debug(url, group.webhook.PD.method);
                                axios.post(url, data, { headers: headers }).then(function (result) {
                                    var data = result.data;
                                    Bot.processLOASheet({ groupId, email, data });
                                }).catch(
                                    function (error) {
                                        logger.error("ERROR", error);
                                    }
                                )
                            }
                            else {
                                url += "?startDate=" + startDate + "&endDate=" + endDate + "&fromDate=" + startDate + "&toDate=" + endDate;

                                logger.debug(url, group.webhook.PD.method);
                                axios.get(url, { headers: headers }).then(function (result) {
                                    var data = result.data;
                                    Bot.processLOASheet({ groupId, email, data });
                                }).catch(
                                    function (error) {
                                        logger.error("ERROR", error.message);
                                    }
                                )
                            }
                        }
                    }
                    else {
                        logger.debug("Otherwise")
                    }
                }
            }
        })
    },
    processLOASheet: ({ groupId, email, data }) => {
        if (data.length > 0) {
            logger.debug("DATA LOA", JSON.stringify(data));
            for (i = 0; i < data.length; i++) {
                let item = data[i];
                let _email = item.email;
                let sheet = item.sheet;
                let staffId = item.staffId;

                if (email && email != _email) {
                    continue;
                }

                if ((staffId || _email) && sheet.length > 0) {
                    // logger.debug("Email Matched", email);
                    // logger.debug("sheet", JSON.stringify(sheet))

                    let fAsync = [];

                    for (k = 0; k < sheet.length; k++) {
                        let d = sheet[k].d;
                        let m = moment(d, "YYYY-MM-DD").format("YYYY-MM");
                        let code = sheet[k].code;
                        let data = sheet[k].workflowData;

                        fAsync.push(function (cb) {
                            var args = { schema: "Employee", query: [] }
                            args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });

                            args.query.push({ $project: { pw: 0, salt: 0, password: 0, initPassword: 0, resetPassword: 0 } });

                            if (Util.isEmail(_email)) {
                                args.query.push({ $match: { email: _email } });
                            }
                            else {
                                args.query.push({ $match: { no: staffId } });
                            }

                            args.query.push({
                                $lookup: {
                                    from: "policy",
                                    let: { pId: "$pId" },
                                    pipeline: [
                                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
                                        { $addFields: { pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] } } },
                                        { $project: { pType: 1, office: 1 } }
                                    ],
                                    as: "policy"
                                }
                            });

                            args.query.push({ $unwind: "$policy" });

                            JCloud.aggregateOne(args, (err, result) => {
                                if (err) {
                                    logger.error(err);
                                    return cb(null);
                                }

                                if (result) {
                                    let eId = result._id;
                                    let policy = result.policy;

                                    // logger.debug(JSON.stringify(result));
                                    if (code && ["MO", "CO", "TS", "P", "CT", "R", "4X,4P", "4P,4K", "CC", "NL", "4X,4K", "K"].indexOf(code) != -1) {
                                        // logger.debug("MATCHED");
                                        let newData = {
                                            eId: eId,
                                            d: d,
                                            m: m,
                                            groupId: groupId,
                                            code: code,
                                            comment: data.lyDoNghi,
                                            l: "webhook"
                                        }

                                        if (policy.type == "Fixed" || policy.pType == "Shift") {
                                            newData.pType = policy.pType || "Shift";
                                            newData.sId = "0";
                                            newData.sName = "Nghỉ phép";
                                            newData.sIn = "00:00:00";
                                            newData.wd = data.tongSoNgayNghi;
                                            newData.sType = "P";
                                            newData._v = 2;
                                        }

                                        data.eId = newData.eId;
                                        data.groupId = newData.groupId;
                                        data.matched = "Yes";
                                        Log.logLOA(data);

                                        return Task.updateCodeAndPaidLeaveDay({ newData, data, policy }, cb);
                                    }
                                }
                                else {
                                    return cb();
                                }
                            });
                        })
                    }

                    if (fAsync.length > 0) {
                        async.series(fAsync, function (err, results) {
                            logger.debug("DONE");
                        });
                    }
                }
            }
        }
        else {
            logger.debug("NO DATA");
        }
    },

    autoGetOTSheet: (fromDate, toDate, groupId, no) => {
        var args = { schema: "Group", query: [] }
        args.query.push({ $match: { _id: groupId } })

        args.query.push({
            $lookup: {
                from: "department",
                let: { groupId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$groupId", "$$groupId"] }] } } },
                    { $group: { _id: null, name: { $push: "$name" } } }
                ],
                as: "department"
            }
        });
        args.query.push({ $unwind: { path: "$department", preserveNullAndEmptyArrays: true } });

        args.query.push({
            $project: {
                _id: 1, name: 1,
                resetDate: { $ifNull: ["$resetDate", "01/04"] },
                pcDate: { $ifNull: ["$pcDate", 1] },
                holidays: { $ifNull: ["$holidays", []] },
                positions: { $ifNull: ["$positions", []] },
                departments: { $ifNull: ["$department.name", []] },
                webhook: { $ifNull: ["$webhook", { PD: {}, OT: {} }] },
            }
        });

        if (email) {
            args.query.push({
                $lookup: {
                    from: "employee",
                    let: { groupId: "$_id" },
                    pipeline: [
                        { $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } },
                    ], as: "employee"
                }
            });

            args.query.push({ $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } });
            args.query.push({ $match: { "employee.email": email } });
        }

        JCloud.aggregate(args, (err, groupList) => {
            if (err) {
                logger.error(err);
                return;
            }

            if (groupList) {
                for (i = 0; i < groupList.length; i++) {
                    let group = JSON.parse(JSON.stringify(groupList[i]));
                    let pId = group._id;
                    let groupId = group._id;

                    if (group.webhook.OT && group.webhook.OT.url) {
                        let startDate = fromDate || moment().add(-3, "days").format("YYYY-MM-DD");
                        let endDate = toDate || moment().add(5, "days").format("YYYY-MM-DD");
                        let url = group.webhook.OT.url;
                        logger.debug(group.name, group.webhook.OT.method, url);

                        if (url) {
                            var headers = {};
                            let H = group.webhook.OT.headersplit('\n');
                            for (j = 0; j < H.length; j++) {
                                let item = H[j].split(":");
                                headers[item[0]] = item[1];
                            }

                            if (group.webhook.OT.method == "post" || group.webhook.OT.method == "POST") {
                                var data = { startDate: startDate, endDate: endDate };

                                axios.post(url, data, { headers: headers }).then(function (result) {
                                    var data = result.data;
                                    Bot.processOTSheet({ groupId, no, data });
                                }).catch(
                                    function (error) {
                                        logger.error("ERROR", error.message);
                                    }
                                )
                            }
                            else {
                                url += "?startDate=" + startDate + "&endDate=" + endDate + "&fromDate=" + startDate + "&toDate=" + endDate;

                                axios.get(url, { headers: headers }).then(function (result) {
                                    var data = result.data;
                                    Bot.processOTSheet({ groupId, no, data });
                                }).catch(
                                    function (error) {
                                        logger.error("ERROR", error.message);
                                    }
                                )
                            }
                        }
                    }
                }
            }
        })
    },
    processOTSheet: ({ groupId, no, data }) => {
        if (data.length > 0) {
            try {
                let fAsync = [];
                for (i = 0; i < data.length; i++) {
                    let dataItem = data[i];
                    var dangkilamthemgio = dataItem.dangkilamthemgio || dataItem.Dangkilamthemgio;
                    logger.debug(JSON.stringify(dangkilamthemgio))
                    let items = (typeof dangkilamthemgio == "object") ? dangkilamthemgio : JSON.parse(dangkilamthemgio);

                    dataItem.workflowCode = dataItem.workflowCode || dataItem.WorkflowCode;
                    let content = dataItem.noiDung || dataItem.NoiDung;
                    let status = dataItem.status || dataItem.Status;

                    if (status == "Đã phê duyệt") {
                        for (k = 0; k < items.length; k++) {
                            let item = items[k];
                            let staffId = item.msnv || item.MSNV;

                            if (no && no != staffId) {
                                continue;
                            }

                            if (staffId) {
                                let d = item.d = item.ngay.substr(0, 10);

                                let m = moment(item.d, "YYYY-MM-DD").format("YYYY-MM");
                                let tongGio = item.tongGio || item.Tonggio;
                                let wtOT = Number(tongGio);

                                logger.debug("TONG GIO", wtOT);

                                if (wtOT > 0) {
                                    fAsync.push(function (cb) {
                                        var args = { schema: "Employee", query: [] }
                                        args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });

                                        args.query.push({ $project: { pw: 0, salt: 0, password: 0, initPassword: 0, resetPassword: 0 } });

                                        args.query.push({ $match: { no: staffId } });

                                        args.query.push({ $unwind: "$policy" });

                                        JCloud.aggregateOne(args, (err, result) => {
                                            if (err) {
                                                logger.error(err);
                                                return cb(null);
                                            }

                                            if (result) {
                                                let eId = result._id;

                                                let newData = { d: d, m: m, eId: eId, groupId: groupId, wtOT: wtOT, workflowCode: dataItem.workflowCode };
                                                logger.debug(JSON.stringify(newData));

                                                Task.updateCodeOT({ newData }, cb);

                                                let data = { content, status, staffId, eId: eId, groupId: groupId, d, raw: dataItem, ...item, workflowCode: dataItem.workflowCode };
                                                Log.logOT(data, cb);
                                            }
                                        });
                                    })
                                }
                            }
                        }
                    }
                }

                if (fAsync.length > 0) {
                    async.parallel(fAsync, function (err, results) {
                        logger.debug("DONE");
                    });
                }
            }
            catch (err) {
                logger.error("ERROR", err);
                return;
            }
        }
        else {
            logger.debug("NO DATA");
        }
    },
    autoIncreaseOrResetNewLeaveDay: (d) => {
        logger.debug("AUTO INCREMENT OR RESET LEAVE DAY");
        var mm = Util.now("MM");
        var dd = d || Util.now("DD");

        if (dd == "01") {
            var resetNewAt = Util.now("YYYY");
            if (mm == "01") {//Reset New Year
                var newData = [{
                    $set: {
                        newLeaveDay: { $add: [1, "$seniorityLeaveDay"] },
                        oldLeaveDay: "$newLeaveDay",
                        paidLeaveDay: 0,
                        paidNewLeaveDay: 0,
                        resetNewAt: resetNewAt
                    }
                }]

                JCloud.findAndUpdate({ schema: "Employee", query: { resetNewAt: { $ne: resetNewAt } }, update: newData }, (err, result) => {
                    if (err) {
                        logger.error(err);
                    }

                    logger.debug(JSON.stringify(result));
                })
            }
            else { //Increment 1 Monthly
                var newData = { $set: { incrNewAt: mm }, $inc: { newLeaveDay: 1 } };
                var query = { $or: [{ incrNewAt: { $ne: mm } }, { incrNewAt: { $eq: null } }] };

                logger.debug(JSON.stringify(query));

                JCloud.findAndUpdate({ schema: "Employee", query: query, update: newData }, (err, result) => {
                    if (err) {
                        logger.error(err);
                    }

                    logger.debug(JSON.stringify(result));
                })
            }
        }
    },
    autoResetOldLeaveDay: (_dd) => {
        logger.debug("RESET LEAVE DAY");
        var dd = _dd || Util.now("DD-MM");
        var args = { schema: "Policy", query: [] };
        args.query.push({ $match: { resetDate: dd } });

        JCloud.aggregate(args, (err, policyList) => {
            if (err) {
                logger.error(err);
                return cb(null);
            }

            if (policyList && policyList.length > 0) {
                logger.debug("FOUND", policyList.length, "GROUP");
                var fAsync = [];
                for (i = 0; i < policyList.length; i++) {
                    let pId = policyList[i]._id;
                    var resetOldAt = Util.now("YYYY");
                    logger.debug("Reset all to 0", pId);
                    fAsync.push(function (cb) {
                        var newData = [{ $set: { oldLeaveDay: 0, resetOldAt: resetOldAt } }];

                        JCloud.findAndUpdate({ schema: "Employee", query: { pId: pId, resetOldAt: { $ne: resetOldAt } }, update: newData }, (err, result) => {
                            if (err) {
                                logger.error(err);
                            }
                            return cb(result);
                        })
                    })
                }

                if (fAsync.length > 0) {
                    async.parallel(fAsync, function () {
                        logger.debug("DONE");
                    });
                }
            }
        })
    },
    autoIncreaseSeniorityLeaveDay: () => {
        logger.debug("AUTO INCREMENT Seniority Leave Day");
        var fiveYear = moment().subtract(5, "years").format("YYYY-MM-DD");
        var sAt = Util.now("YYYY");

        var newData = { $set: { sAt: sAt }, $inc: { seniorityLeaveDay: 1 } };
        var args = { schema: "Employee", query: { $expr: { $and: [{ $ne: ["$sAt", sAt] }, { $eq: ["$startAt", fiveYear] }, { $eq: [{ $in: ["$endAt", [null, "", "null"]] }, false] }] } }, update: newData };

        JCloud.findAndUpdate(args, (err, result) => {
            if (err) {
                logger.error(err);
            }

            logger.debug(JSON.stringify(result));
        })
    },
    checkLateAndNotify: () => {
        logger.debug("CHECK POLICY NOTIFY LATE");
        var H = Util.now("HH:mm:00")
        var args = { schema: "Policy", query: { $or: [{ "notifyLate.at": H }, { "notifyCheckoutLate.at": H }] } };

        JCloud.find(args, (err, policyList) => {
            if (err) {
                logger.error(err);
                return cb(null);
            }

            if (policyList) {
                for (i = 0; i < policyList.length; i++) {
                    let policy = JSON.parse(JSON.stringify(policyList[i]));
                    var w = []

                    if (policy.office && (policy.office.Sun || (policy.week.Sun && policy.week.Sun.length > 0))) w.push(0);
                    if (policy.office && (policy.office.Mon || (policy.week.Mon && policy.week.Mon.length > 0))) w.push(1);
                    if (policy.office && (policy.office.Tue || (policy.week.Tue && policy.week.Tue.length > 0))) w.push(2);
                    if (policy.office && (policy.office.Wed || (policy.week.Wed && policy.week.Wed.length > 0))) w.push(3);
                    if (policy.office && (policy.office.Thu || (policy.week.Thu && policy.week.Thu.length > 0))) w.push(4);
                    if (policy.office && (policy.office.Fri || (policy.week.Fri && policy.week.Fri.length > 0))) w.push(5);
                    if (policy.office && (policy.office.Sat || (policy.week.Sat && policy.week.Sat.length > 0))) w.push(6);

                    if (policy.notifyLate && policy.notifyLate.at == H) {
                        logger.debug("[Notify Checkin Late Running]", policy.name, policy.notifyLate.at);
                        Notify.fcmCheckinLate(policy._id);
                        // Notify.emailCheckinLate(policy._id);
                    }

                    if (policy.notifyCheckoutLate && policy.notifyCheckoutLate.at == H) {
                        logger.debug("[Notify Checkout Late Running]", policy.name, policy.notifyCheckoutLate.at);
                        Notify.fcmCheckoutLate(policy._id);
                        // Notify.emailCheckoutLate(policy._id);
                    }
                }
            }
        })
    },
    exportMonthly: () => {
        var args = { schema: "Group", query: [] };


        args.query.push({ $match: { reportDates: Util.now("D") } });
        args.query.push({ $match: { $expr: { $gt: [{ $size: "$reportReceivers" }, 0] } } });

        JCloud.aggregate(args, (err, groups) => {
            if (err) {
                logger.error(err);
                return callback(err, groups);
            }

            if (groups && groups.length > 0) {
                logger.debug("[CRON MONTHLY EXPORT]");

                var fAsync = [];
                for (i = 0; i < groups.length; i++) {
                    let group = groups[i];
                    let email = group.user.email;
                    let name = group.user.name;
                    if (Util.isEmail(email)) {
                        fAsync.push(function (cb) {
                            let query = {};
                            query.toDate = moment(Util.now("YYYY-MM-" + group.pcDate)).subtract(1, "days").format("YYYY-MM-DD");
                            query.fromDate = moment(Util.now("YYYY-MM-" + group.pcDate)).subtract(1, "months").format("YYYY-MM-DD");
                            query.groupId = group._id;
                            query.noCount = true;

                            Checkin.getTimeSheet(query, (err, result) => {
                                if (err) {
                                    logger.error(err);
                                    return cb();
                                }

                                if (result) {
                                    result.groupId = query.groupId;
                                    result.fromDate = query.fromDate
                                    result.toDate = query.toDate;
                                    result.detail = true;

                                    Export.excelTimesheet(result, (filename, _filename) => {
                                        if (filename) {
                                            let mailData = {
                                                sender: "No-reply <noreply@becawifi.vn>",
                                                email: email,
                                                subject: "Báo Cáo Chấm Công Tháng " + Util.now("MM/YYYY"),
                                                html: "<p><b>Dear " + name + ",</b></p><p>We sent you a timesheet in attachment!<p>Thank you!</p><p>BecaWifi</p><p>------------------------</p><p>Power by VNTT Solutions</p>",
                                                attachments: [{ filename: _filename, path: filename }]
                                            }

                                            Util.sendMail(mailData, (err, debug) => {
                                                if (err) {
                                                    logger.error(err);
                                                }
                                                logger.debug(JSON.stringify(debug))
                                                return cb();
                                            });
                                        }
                                        else {
                                            return cb();
                                        }
                                    });
                                }
                                else {
                                    return cb();
                                }
                            })
                        })
                    }
                    else {
                        logger.debug("Email invalid!");
                    }
                }

                if (fAsync.length > 0) {
                    async.parallel(fAsync, function (err, results) {
                        logger.debug("DONE");
                    });
                }
            }
        })
    },
    autoRemovePersonList: (endAt) => {
        var args = { schema: "Employee", query: [] };
        args.query.push({ $match: { endAt: endAt || Util.now("YYYY-MM-DD") } });
        args.query.push({ $group: { _id: null, list: { $addToSet: "$_id" } } })

        JCloud.aggregateOne(args, (err, result) => {
            if (err) {
                logger.error(err);
            }

            result = JSON.parse(JSON.stringify(result));
            logger.debug(JSON.stringify(result));
            if (result && result.list.length > 0) {
                HIK.removePersonList({ list: result.list });
            }
        });
    },
    autoBackupEmployee: () => {
        var args = { schema: "Employee", query: [] };

        var d = Util.now("YYYY-MM-DD");
        args.query.push({ $match: { $expr: { $and: [{ $gte: [d, { $ifNull: ["$startAt", d] }] }, { $gte: [{ $ifNull: ["$endAt", d] }, d] }] } } });

        JCloud.aggregate(args, (err, list) => {
            if (err) {
                logger.error(err);
                return callback(err, null);
            }

            if (list) {
                list = JSON.parse(JSON.stringify(list))
                var fAsync = [];
                for (let i = 0; i < list.length; i++) {
                    let employee = list[i];

                    fAsync.push(function (callback) {
                        if (employee.endAt && moment().diff(moment(employee.endAt, "YYYY-MM-DD"), "days") > 360) {
                            logger.debug("REMOVE BACKUPDATA", employee._id);

                            var args = { schema: "BackupEmployee", query: { _id: employee._id } }
                            JCloud.findOneAndUpdate(args, (err, result) => {
                                if (err) {
                                    logger.error(err);
                                }

                                return callback(err, employee._id);
                            })
                        }
                        else {
                            var newData = { $set: { groupId: employee.groupId, updatedAt: Util.now(), "data.$.d": d, "data.$.employee": employee } }
                            var args = { schema: "BackupEmployee", query: { _id: employee._id, "data.d": d }, update: newData };

                            JCloud.findOneAndUpdate(args, (err, result) => {
                                if (err) {
                                    logger.error(err);

                                    return callback(err, employee._id);
                                }

                                if (!result) {
                                    logger.debug("NOT FOUND BACKUPDATA", employee._id, d);
                                    var args = { schema: "BackupEmployee", query: { _id: employee._id }, update: { $setOnInsert: { _id: employee._id, groupId: employee.groupId } } };
                                    JCloud.findOneAndUpsert(args, (err, result) => {
                                        if (err) {
                                            logger.error(err);

                                            return callback(err, employee._id);
                                        }

                                        logger.debug("INSERT BACKUPDATA IF NOT EXISTS", employee._id, d);
                                        var data = { d: d, employee: employee };
                                        var newData = { $set: { groupId: employee.groupId, updatedAt: Util.now() }, $push: { data: { $each: [data], $sort: { d: -1 }, $position: 0, $slice: 60 } } };

                                        var args = { schema: "BackupEmployee", query: { _id: employee._id, "data.d": { $ne: d } }, update: newData };
                                        JCloud.findOneAndUpdate(args, (err, result) => {
                                            if (err) {
                                                logger.error(err);
                                            }

                                            logger.debug("PUSHED BACKUPDATA", employee._id, d);

                                            return callback(err, employee._id);
                                        });
                                    });
                                }
                                else {
                                    logger.debug("UPDATED BACKUPDATA", employee._id, d);
                                    return callback(err, employee._id);
                                }
                            })
                        }
                    })
                }

                if (fAsync.length > 0) {
                    async.series(fAsync, function (err, results) {
                        logger.debug("[autoBackupEmployee] DONE");
                    });
                }
            }
        })
    }
}
