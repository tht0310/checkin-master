module.exports = {
    updateCodeAndPaidLeaveDay: (obj, cb) => {
        var newData = obj.newData;
        var data = obj.data;
        var office = obj.policy.office;
        var editor = obj.editor || { byId: "Unknown", byName: "Unknown" };
        var ddd = moment(newData.d, "YYYY-MM-DD").format("ddd");
        var YYYY = moment(newData.d, "YYYY-MM-DD").format("YYYY");

        let paid = 0;

        if (newData.code == "P") {
            paid = 1;
            if (newData.wd == 0.5) {
                newData.code = "4X,4P"
            }
        }

        if (["4X,4P", "4P,4K"].indexOf(newData.code) != -1) {
            paid = 0.5;
        }

        let _id = Util.hashKey(newData.eId + newData.groupId + newData.d);
        let query = { _id: _id };

        var modified = { [newData.eId]: { message: "failed" } };

        if (newData.code == "4X,4P") {
            let _newData = {
                ...newData,
            };


            if (office && office[ddd]) {
                var inAM = office[ddd].inAM;
                var outAM = office[ddd].outAM;

                var inPM = office[ddd].inPM;
                var outPM = office[ddd].outPM;

                var lateAlert = office.lateAlert || 0;
                var earlyAlert = office.earlyAlert || 0;

                earlyOut = 0;

                if (inAM && outAM) {
                    var duration = moment(outAM, "HH:mm:ss").diff(moment(inAM, "HH:mm:ss"), "minutes")

                    if (duration > 0) {
                        _newData = {
                            ..._newData,
                            earlyOut: { $cond: { if: { $gt: [duration, { $add: ["$wt", earlyAlert] }] }, then: { $subtract: [duration, "$wt"] }, else: 0 } },
                            lateOut: { $cond: { if: { $gt: ["$wt", duration] }, then: { $subtract: ["$wt", duration] }, else: 0 } },
                        }
                    }
                }
            }

            let update = [{ $set: _newData }];
            if (data) {
                _newData.code = { $cond: { if: { $or: [{ $and: [{ code: "4X,4K" }, { $gte: ["$wt", office.half * 60] }] }, { $gt: ["$d", Util.now("YYYY-MM-DD")] }] }, then: "4X,4P", else: "4P,4K" } };
                update = [{ $set: _newData }];
            }
            let schema = "Timesheet";
            JCloud.findOneAndUpdate({ schema: schema, query: query, update: update, isNew: false, prefix: YYYY + "_" }, (err, result) => {
                if (err) {
                    logger.debug(newData.eId, err.errmsg);
                    return;
                }

                JCloud.findOneAndUpdate({ schema: schema, query: query, update: { $addToSet: { r: data.workflowCode } }, isNew: false, prefix: YYYY + "_" }, (err, result) => { })

                if (result) { // If Exists
                    result = JSON.parse(JSON.stringify(result));

                    if (!result.code || result.code != newData.code) {
                        if (result.code == "P") {
                            paid = paid - 1;
                        }

                        if (result.code == "4P,4K" || result.code == "4X,4P") {
                            paid = paid - 0.5;
                        }
                    }

                    logger.debug(newData.eId, "update Paid Leave Day", paid);
                    Task.updatePaidLeaveDay({ d: newData.d, p: 0.5, r: (data) ? data.workflowCode : editor.byId, eId: result.eId, groupId: result.groupId, paid: paid });

                    modified = { [newData.eId]: { [newData.d]: newData.code, message: "success" } }

                    let ts = { d: newData.d, m: newData.m, eId: newData.eId, groupId: newData.groupId, code: result.code, newCode: newData.code, loaId: (data) ? data._id : null, byId: (data) ? "webhook" : editor.byId, byName: (data) ? "webhook" : editor.byName }
                    if (data) {
                        logger.debug(newData.eId, "result.code", result.code);
                        if (result.code && (result.code == "4P,4K" || result.code == "4X,4P")) {
                            paid = paid - 0.5;

                            if (result.r && result.r.indexOf(data.workflowCode) == -1) {
                                logger.debug(newData.eId, "Change Code to P", data.workflowCode);
                                let schema = "Timesheet";
                                let query = { _id: _id, code: { $in: ["4X,4P", "4P,4K"] }, r: { $ne: data.workflowCode } }
                                let update = { $set: { code: "P", comment: result.comment + "," + data.lyDoNghi }, $addToSet: { r: data.workflowCode } }

                                JCloud.findOneAndUpdate({ schema: schema, query: query, update: update, prefix: YYYY + "_" }, (err, result) => {
                                    if (err) {
                                        logger.debug(newData.eId, err.errmsg);
                                        return;
                                    }
                                })
                            }
                        }

                        ts.loaId = data._id;
                        ts.byId = "webhook";
                        ts.byName = "[webhook]";

                        logger.debug(newData.eId, "LOG LOA YES");
                        data.eId = newData.eId;
                        data.groupId = newData.groupId;
                        data.matched = "Yes";
                        Log.logLOA(data);
                    }
                    else {
                        ts.byId = editor.byId;
                        ts.byName = editor.byName;
                    }

                    logger.debug(newData.eId, "LOG SHEET");
                    Log.logSheet(ts);

                    if (cb) cb(null, modified);
                    return;
                }
                else {// Otherwise: Not Exists. Insert code without checking worktime. Util user checkin. Code is updated.
                    let update = { $set: newData, $setOnInsert: { _id: _id, dow: ddd, r: [(data) ? data.workflowCode : editor.byId] } };
                    let schema = "Timesheet";
                    JCloud.findOneAndUpsert({ schema: schema, query: query, update: update, isNew: false, prefix: YYYY + "_" }, (err, result) => {
                        if (err) {
                            logger.debug(newData.eId, err.errmsg);

                            if (cb) cb(null, modified);
                            return;
                        }

                        if (result) {
                            result = JSON.parse(JSON.stringify(result));

                            if (!result.code || result.code != newData.code) {
                                if (result.code == "P") {
                                    paid = paid - 1;
                                }

                                if (result.code == "4P,4K" || result.code == "4X,4P") {
                                    paid = paid - 0.5;
                                }
                            }
                        }
                        else {
                            result = { code: "" };
                        }

                        logger.debug(newData.eId, "update Paid Leave Day", paid);
                        Task.updatePaidLeaveDay({ d: newData.d, p: 0.5, r: (data) ? data.workflowCode : editor.byId, eId: newData.eId, groupId: result.groupId, paid: paid });

                        modified = { [newData.eId]: { [newData.d]: newData.code, message: "success" } }

                        let ts = { d: newData.d, m: newData.m, eId: newData.eId, groupId: newData.groupId, code: result.code, newCode: newData.code, loaId: (data) ? data._id : null, byId: (data) ? "webhook" : editor.byId, byName: (data) ? "webhook" : editor.byName }
                        logger.debug(newData.eId, "LOG SHEET");
                        Log.logSheet(ts);

                        if (cb) cb(null, modified);
                        return;
                    })
                }
            });
        }
        else {
            let update = { $set: newData, $setOnInsert: { _id: _id, dow: ddd } };
            let schema = "Timesheet";
            JCloud.findOneAndUpsert({ schema: schema, query: query, update: update, isNew: false, prefix: YYYY + "_" }, (err, result) => {
                if (err) {
                    logger.debug(newData.eId, err.errmsg);
                    if (cb) cb(err, modified);
                    return;
                }

                let p = 0;
                if (newData.code == "P") {
                    p = 1;
                }

                if (newData.code == "4P,4K" || newData.code == "4X,4P") {
                    p = 0.5;
                }

                if (result) {
                    result = JSON.parse(JSON.stringify(result));
                    logger.debug(newData.eId, result.code, newData.code)
                    if (result.code != newData.code) {
                        if (result.code == "P") {
                            paid = paid - 1;
                        }

                        if (result.code == "4P,4K" || result.code == "4X,4P") {
                            paid = paid - 0.5;
                        }
                    }
                }
                else {
                    result = { code: "" };
                }

                logger.debug(newData.eId, "update Paid Leave Day", newData.d, paid);
                Task.updatePaidLeaveDay({ d: newData.d, p: p, r: (data) ? data.workflowCode : editor.byId, eId: newData.eId, groupId: newData.groupId, paid: paid });

                let ts = { d: newData.d, m: newData.m, eId: newData.eId, groupId: newData.groupId, code: result.code, newCode: newData.code, loaId: (data) ? data._id : null, byId: (data) ? "webhook" : editor.byId, byName: (data) ? "webhook" : editor.byName }
                logger.debug(newData.eId, "LOG SHEET");
                Log.logSheet(ts);

                modified = { [newData.eId]: { [newData.d]: newData.code, message: "success" } }
                if (cb) cb(null, modified);
                return;
            });
        }
    },
    updateCodeOT: (obj, cb) => {
        let newData = obj.newData;
        let data = obj.data;
        let editor = obj.editor || { byId: "Unknown", byName: "Unknown" };
        let ddd = moment(newData.d, "YYYY-MM-DD").format("ddd");
        let m = moment(newData.d, "YYYY-MM-DD").format("YYYY-MM");
        let YYYY = moment(newData.d, "YYYY-MM-DD").format("YYYY");

        let _id = Util.hashKey(newData.eId + newData.groupId + newData.d);
        let query = { _id: _id };

        let update = { $set: newData, $setOnInsert: { _id: _id, dow: ddd } };
        let schema = "Timesheet";
        JCloud.findOneAndUpsert({ schema: schema, query: query, update: update, isNew: false, prefix: YYYY + "_" }, (err, result) => {
            if (err) {
                logger.debug(err.errmsg);
            }

            var modified = { [newData.eId]: { message: "failed" } };
            result = result || { wtOT: null }

            if (result.wtOT != newData.wtOT) {
                modified = { [newData.eId]: { [newData.d]: newData.wtOT, message: "Success" } };
            }

            logger.debug("LOG SHEET");
            let ts = { d: newData.d, m: newData.m, eId: newData.eId, groupId: newData.groupId, wtOT: result.wtOT, newWtOT: newData.wtOT, loaId: (data) ? data._id : null, byId: (data) ? "webhook" : editor.byId, byName: (data) ? "webhook" : editor.byName }
            Log.logSheet(ts);

            if (cb) cb(null, modified);
        });
    },
    updateCodeShift: (obj, cb) => {
        let newData = obj.newData;
        let data = obj.data;
        let editor = obj.editor || { byId: "Unknown", byName: "Unknown" };
        let d = newData.d;
        let ddd = newData.ddd;
        let m = moment(d, "YYYY-MM-DD").format("YYYY-MM");
        let YYYY = moment(d, "YYYY-MM-DD").format("YYYY");

        if (newData.sId == "0") {
            modified = { [newData.eId]: { message: "Cannot modify leave day" } };
            if (cb) return cb(null, modified);
        }

        Checkin.getEmployee({ eId: newData.eId }, (err, employee) => {
            if (err) {
                logger.error(err);
            }

            var modified = { [newData.eId]: { message: "Failed" } };
            if (!employee) {
                modified = { [newData.eId]: { message: "Employee Not Found" } };
                if (cb) return cb(null, modified);
            }

            logger.debug(newData.eId, "Employee: ", employee.name);

            var args = { schema: "Shift", query: { _id: newData.sId } };

            JCloud.findOne(args, (err, shift) => {
                if (err) {
                    logger.error(err);
                    return callback(err, null);
                }

                if (!shift) {
                    modified = { [newData.eId]: { message: "Shift Not Found" } };
                    if (cb) return cb(null, modified);
                }

                Checkin.checkShiftInPolicy({ pId: employee.policy._id, sId: newData.sId, ddd: ddd }, (err, result) => {
                    if (!result) {
                        modified = { [newData.eId]: { message: "Shift Not In Date: " + newData.d } };
                        if (cb) return cb(null, modified);
                    }

                    Checkin.checkShiftInPlan({ eId: employee._id, pId: employee.policy._id, sId: newData.sId, d: d }, (err, result) => {
                        // if (!result) {
                        //     modified = { [newData.eId]: { message: "Shift Not In Date: " + newData.d } };
                        //     if (cb) return cb(null, modified);
                        // }
                        result = JSON.parse(JSON.stringify(result));
                        // logger.debug(JSON.stringify(result));
                        shift.sCode = (result && result.sCode) ? result.sCode : "";

                        logger.debug(newData.eId, "SHIFT CODE", shift.sCode);

                        var policy = employee.policy;

                        if (policy.shiftType == "hour") {
                            newData.wd = Math.floor(newData.wd);
                        }
                        else if (policy.shiftType == "shift") {
                            var n = Math.floor(newData.wd);
                            var x = ((newData.wd % 1) >= 0.5) ? 0.5 : 0;
                            newData.wd = Number(n) + Number(x);
                        }
                        else {
                            newData.wd = (newData.wd >= 1) ? 1 : ((newData.wd >= 0.5) ? 0.5 : 0);
                        }
                        logger.debug(newData.eId, newData.wd);

                        let _id = Util.hashKey(newData.eId + newData.groupId + newData.d + newData.sId);
                        let query = { _id: _id };
                        // var query = { $or: [{ _id: _id }, { eId: newData.eId, groupId: newData.groupId, dInS: newData.d, sId: newData.sId }] }

                        newData = {
                            ...newData,

                            pId: policy._id, //Policy Id
                            pType: policy.pType,//Policy Type
                            pName: policy.name,//Policy Name
                            pFull: policy.full,//Policy Name

                            sOT: shift.overtime,
                            sName: shift.name, //Shift Name
                            sCode: shift.sCode || "", //Shift Code
                            sIn: shift.in, //Gio vao ca HH:mm:ss
                            sOut: shift.out, //Gio ra ca HH:mm:ss
                            sDuration: shift.duration, //So phut lam viec
                            sType: policy.shiftType || "wd",
                            shift, //to Recheck
                            policy, //to Recheck
                        }

                        let update = {
                            $set: newData,
                            $setOnInsert: {
                                _id,
                                dow: ddd, // Thu ddd
                                _v: _v
                            }
                        }
                        let schema = "Timesheet";
                        JCloud.findOneAndUpsert({ schema: schema, query: query, update: update, isNew: true, prefix: YYYY + "_" }, (err, result) => {
                            if (err) {
                                logger.debug(newData.eId, err.errmsg);
                            }

                            result = JSON.parse(JSON.stringify(result));                            
                            result = result || { wd: null, sCode: "" }
                            modified = { [result.eId]: { [result.d]: result.wd, sCode: result.sCode, message: "Success" } };

                            logger.debug(newData.eId, "LOG SHEET");
                            let ts = { d: newData.d, m: newData.m, eId: newData.eId, groupId: newData.groupId, sId: newData.sId, wd: result.wd, newWD: newData.wd, editAt: newData.editAt, loaId: (data) ? data._id : null, byId: (data) ? "webhook" : editor.byId, byName: (data) ? "webhook" : editor.byName }
                            Log.logSheet(ts);

                            if (cb) return cb(null, modified);
                        });
                    })
                })
            })
        });
    },
    updatePlan: (obj, cb) => {
        let newData = obj.newData;
        let data = obj.data;
        let editor = obj.editor || { byId: "Unknown", byName: "Unknown" };
        let eId = newData.eId;
        let d = newData.d;
        let sId = newData.sId;
        let ddd = newData.ddd;
        let groupId = newData.groupId;
        let checked = newData.checked;
        let m = moment(d, "YYYY-MM-DD").format("YYYY-MM");

        if (sId == "0") {
            modified = { [eId]: { [d]: { [sId]: { message: "Cannot modify leave day" } } } };
            if (cb) return cb(null, modified);
        }

        Checkin.getEmployee({ eId: eId }, (err, employee) => {
            if (err) {
                logger.error(err);
            }

            var modified = { [eId]: { [d]: { [sId]: { message: "Failed" } } } };
            if (!employee) {
                modified = { [eId]: { [d]: { [sId]: { message: "Employee Not Found" } } } };
                if (cb) return cb(null, modified);
            }

            let pId = employee.pId

            logger.debug("Employee: ", employee.name);

            var args = { schema: "Shift", query: { _id: sId } };

            JCloud.findOne(args, (err, shift) => {
                if (err) {
                    logger.error(err);
                    return callback(err, null);
                }

                if (!shift) {
                    modified = { [eId]: { [d]: { [sId]: { message: "Shift Not Found" } } } };
                    if (cb) return cb(null, modified);
                }

                Checkin.checkShiftInPolicy({ pId: employee.policy._id, sId: sId, ddd: ddd }, (err, result) => {
                    if (!result) {
                        modified = { [eId]: { [d]: { [sId]: { message: "Shift Not In Date: " + d } } } };
                        if (cb) return cb(null, modified);
                    }

                    newData.pId = pId;
                    let _id = Util.hashKey(eId + groupId + d + sId + pId);
                    let query = { _id: _id };

                    let update = { $set: newData, $setOnInsert: { _id } }

                    let schema = "Plan";
                    JCloud.findOneAndUpsert({ schema: schema, query: query, update: update, isNew: true }, (err, result) => {
                        if (err) {
                            logger.debug(err.errmsg);
                        }

                        result = JSON.parse(JSON.stringify(result))
                        logger.debug(JSON.stringify(result));
                        if (result.checked == checked) {
                            modified = { [eId]: { [d]: { [sId]: { checked: result.checked, message: "Success" } } } };
                        }

                        logger.debug(result.checked, checked, result.checked == checked)
                        if (cb) return cb(null, modified);
                    });
                })
            })
        });
    },
    updatePaidLeaveDay: (obj, cb) => {
        logger.debug("UPDATE LEAVE DAY", obj.eId, obj.d, obj.paid);
        let groupId = obj.groupId;

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
                // webhook: { $ifNull: ["$webhook", { PD: {}, OT: {} }] }, //not use
            }
        });

        JCloud.aggregateOne(args, (err, group) => {
            if (err) {
                logger.error(err);
                if (cb) return cb();
            }

            if (group) {
                var paidDay = moment(obj.d, "YYYY-MM-DD");
                var resetDate = moment(group.resetDate + "-" + paidDay.format("YYYY"), "DD-MM-YYYY");

                var newData = []
                if (obj.paid == 0) {
                    if (cb) return cb();
                    return;
                }

                logger.debug(paidDay, group.resetDate, resetDate, paidDay.diff(resetDate, "days"))

                if (paidDay.diff(resetDate, "days") > 0) { //paidDay is greater than resetDate;
                    newData = [{
                        $set: {
                            paidLeaveDay: { $add: [obj.paid, "$paidLeaveDay"] },
                            newLeaveDay: { $subtract: ["$newLeaveDay", obj.paid] },
                            oldLeaveDay: 0,
                            paidNewLeaveDay: { $add: [obj.paid, "$paidNewLeaveDay"] },
                        }
                    }];
                }
                else {
                    newData = [{
                        $set: {
                            paidLeaveDay: { $add: [obj.paid, "$paidLeaveDay"] },
                            oldLeaveDay: { $cond: { if: { $gte: ["$oldLeaveDay", obj.paid] }, then: { $subtract: ["$oldLeaveDay", obj.paid] }, else: 0 } }, //Nếu >= thì trừ hết, còn bé hơn thì trừ phần thiếu vào newLeaveDay
                            newLeaveDay: {
                                $cond: {
                                    if: { $gte: ["$oldLeaveDay", obj.paid] },
                                    then: "$newLeaveDay",
                                    else: { $subtract: ["$newLeaveDay", { $subtract: [obj.paid, "$oldLeaveDay"] }] },
                                }
                            },
                            paidNewLeaveDay: {
                                $cond: {
                                    if: { $gte: ["$oldLeaveDay", obj.paid] },
                                    then: "$paidNewLeaveDay",
                                    else: { $add: ["$paidNewLeaveDay", { $subtract: [obj.paid, "$oldLeaveDay"] }] },
                                }
                            }
                        }
                    }];
                }

                var args = {
                    schema: "Employee",
                    query: {
                        _id: obj.eId,
                        $or: [
                            { group: obj.groupId },
                            { groupId: obj.groupId }],
                        $or: [
                            { paidDate: { $exists: false } },
                            { "paidDate.d": { $ne: obj.d } },
                            { "paidDate.d": { $eq: obj.d }, "paidDate.r": { $ne: obj.r } },
                            { "paidDate": { $elemMatch: { d: obj.d, r: obj.r, p: { $ne: obj.p } } } }
                        ]
                    },
                    update: newData,
                    select: "-pw -password"
                };

                logger.debug(JSON.stringify(args.query))
                JCloud.findOneAndUpdate(args, (err, result) => {
                    if (err) {
                        logger.error(err);
                        if (cb) return cb();
                        return;
                    }

                    if (result) {
                        var newData = { $set: { "paidDate.$.d": obj.d, "paidDate.$.p": obj.p, "paidDate.$.r": obj.r } }
                        var args = { schema: "Employee", query: { _id: obj.eId, $or: [{ group: obj.groupId }, { groupId: obj.groupId }], "paidDate.d": obj.d, "paidDate.r": obj.r }, update: newData, select: "-pw -password" };
                        JCloud.findOneAndUpdate(args, (err, result) => {
                            if (err) {
                                logger.error(err);
                                if (cb) return cb();
                                return;
                            }

                            if (!result) {
                                var paidDate = { d: obj.d, p: obj.p, r: obj.r };
                                var newData = { $push: { paidDate: { $each: [paidDate], $sort: { d: -1 }, $position: 0, $slice: 60 } } };

                                var args = { schema: "Employee", query: { _id: obj.eId, $or: [{ group: obj.groupId }, { groupId: obj.groupId }], $or: [{ "paidDate.d": { $ne: obj.d } }, { "paidDate.d": { $eq: obj.d }, "paidDate.r": { $ne: obj.r } }] }, update: newData, select: "-pw -password" };
                                JCloud.findOneAndUpdate(args, (err, result) => {
                                    if (err) {
                                        logger.error(err);
                                    }

                                    logger.debug("INSERTED PAID DATE", obj.d, obj.r, obj.p);
                                    if (cb) return cb();
                                    return;
                                });
                            }
                            else {
                                logger.debug("UPDATED PAID DATE", obj.d, obj.r, obj.p);
                                if (cb) return cb();
                                return;
                            }
                        });
                    }
                    else {

                    }
                });
            }
            else {
                logger.debug("Group Not Found")
            }
        })
    },
}
