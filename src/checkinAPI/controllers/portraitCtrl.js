//Module manage employee in checkin wifi.
var router = Express.Router();

const fs = require('fs');
var shell = require('shelljs');

//Get list city
router.get("/pages", (req, res, next) => {
    try {
        var query = req.query || {};
        var groupId = req.userSession.groupId;
        var search = (query.search) ? JSON.parse(query.search) : {};
        if (search.name) {
            search.keyword = Util.removeDMV(search.name);
            delete search.name;
        }

        var keys = Object.keys(search);
        var page = parseInt(query.page || 1);
        var pageSize = parseInt(query.pageSize || 2147483647);
        var sort = ((query.sort) ? JSON.parse(query.sort) : { updatedAt: -1 });
        var skip = (page - 1) * pageSize;

        var args = { schema: "Employee", query: [] }
        args.query.push({ "$addFields": { "groupId": { "$ifNull": ["$groupId", "$group"] } } });
        args.query.push({ $match: { groupId: groupId } });
        
        args.query.push({ $match: { portrait2Status: "pending" } });

        if (keys.length > 0) {
            keys.forEach((key) => {
                if (typeof search[key] != "object") {
                    if (key == "status") {
                        args.query.push({ $match: { [key]: search[key] } });
                    }
                    else {
                        args.query.push({ $match: { [key]: { $regex: Util.removeDMV(search[key]), $options: "i" } } });
                    }
                }
            });
        }

        args.query.push({ $addFields: { portrait2: { $concat: [{ $ifNull: ["$portrait2", "$portrait"] }, "?&at=", { $ifNull: ["$portrait2Date", "$portraitDate"] }] } } });

        args.query.push({ $addFields: { portraitDate: { $ifNull: ["$portrait2Date", "$portraitDate"] } } });

        args.query.push({ $project: { _id: 1, name: 1, no: 1, email: 1, position: 1, department: 1, portrait2: 1, portraitDate: 1 } });

        //Add $group to count.
        args.query.push({ $group: { _id: null, count: { $sum: 1 } } });

        Assistant.getPages(args, { skip, pageSize, sort }, (response) => {
            return res.json(response);
        })
    } catch (err) {
        logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
});

//approve portrait employee
router.post("/approve/:_id", (req, res, next) => {
    try {
        var groupId = req.userSession.groupId;
        var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
        var _id = req.params._id;
        var source = PATH.join(CONF.PORTRAIT2 + groupId + "/" + _id);
        var destination = PATH.join(CONF.PORTRAIT + groupId + "/" + _id);
        var destination_remote = PATH.join(CONF.PORTRAIT_REMOTE + groupId + "/" + _id);


        var args = { schema: "Employee", query: [] }
        args.query.push({ $match: { _id: _id } });
        args.query.push({ $match: { portrait2Status: "pending" } });
        

        args.query.push({
            $lookup: {
                from: "policy",
                let: { pId: "$pId" },
                pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } }],
                as: "policy"
            }
        });

        args.query.push({ $unwind: "$policy" });
        args.query.push({ $match: { "policy.method.hik": true } });
        args.query.push({ $match: { $expr: { $gte: [{ $size: "$policy.mapAccessLevel" }, 1] } } });

        JCloud.aggregateOne(args, (err, employee) => {
            if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });

            if (!employee) {
                return res.status(405).json({ status: false, code: 405, msgCode: "not-allowed", message: "Policy Not Allowed Checkin By HIK Method!", code: 405 });
            }
            else {
                HIK.addPerson(_id, function (err, result) {
                    if (err) {
                        logger.error(err);
                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                    }

                    if (result) {
                        if (result.code == 200) {
                            shell.mkdir('-p', PATH.join(CONF.PORTRAIT_REMOTE + groupId + "/"));
                            fs.copyFile(source, destination_remote, (err) => {
                                if (err) {
                                    logger.error(err);
                                }

                                shell.mkdir('-p', PATH.join(CONF.PORTRAIT + groupId + "/"));
                                fs.copyFile(source, destination, (err) => {
                                    if (err) {
                                        logger.error(err);
                                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                                    }

                                    var shortPath = "/public/portrait/" + groupId + "/";
                                    var portrait = employee.portrait2.replace("portrait2", "portrait");

                                    var args = { schema: "Employee", query: { _id: _id, group: groupId, portrait2Status: "pending" }, update: [{ $set: { portraitStatus: "approved", portrait2Status: "approved", portrait: portrait, portraitType: "$portrait2Type", approvedDate: Util.now(), msgCode: null } }], select: "-pw -password" };
                                    JCloud.findOneAndUpdate(args, (err, employee) => {
                                        if (err) {
                                            logger.error(err);
                                            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                                        }

                                        employee = JSON.parse(JSON.stringify(employee))
                                        Checkin.postFCM({ registration_ids: employee.fcmToken, title: "Thông báo", message: "Ảnh chấm công của bạn đã được duyệt.", listId: [_id] })

                                        return res.status(result.code).json(result);
                                    })
                                });
                            })
                        }
                        else {
                            var errorList = result.errorList || [];
                            var msgCode = "";
                            logger.info("data", JSON.stringify(result))
                            for (i = 0, n = errorList.length; i < n; i++) {
                                var error = errorList[i];
                                msgCode = error.msgCode;

                                if (msgCode == "bad-request") {
                                    break;
                                }
                            }


                            if (msgCode == "bad-request") {
                                var args = { schema: "Employee", query: { _id: _id, group: groupId, portrait2Status: "pending" }, update: [{ $set: { portrait2Status: "rejected", rejectedDate: Util.now(), msgCode: msgCode } }], select: "-pw -password" };
                                JCloud.findOneAndUpdate(args, (err, employee) => {
                                    if (err) {
                                        logger.error(err);
                                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                                    }

                                    employee = JSON.parse(JSON.stringify(employee))
                                    Checkin.postFCM({ registration_ids: employee.fcmToken, title: "Thông báo", message: "Ảnh chấm công của bạn đã bị từ chối.", listId: [_id] })

                                    return res.status(result.code).json(result);
                                })
                            }
                            else {
                                var args = { schema: "Employee", query: { _id: _id, group: groupId, portrait2Status: "pending" }, update: [{ $set: { msgCode: msgCode } }], select: "-pw -password" };
                                JCloud.findOneAndUpdate(args, (err, employee) => {
                                    if (err) {
                                        logger.error(err);
                                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                                    }

                                    return res.status(result.code).json(result);
                                })
                            }
                        }
                    }
                });
            }
        });

    }
    catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
});

//approve portrait employee
router.post("/reject/:_id", (req, res, next) => {
    try {
        var groupId = req.userSession.groupId;
        var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
        var _id = req.params._id;

        var args = { schema: "Employee", query: { _id: _id, group: groupId, portrait2Status: "pending" }, update: [{ $set: { portrait2Status: "rejected", rejectedDate: Util.now(), msgCode: null } }], select: "-pw -password" };
        JCloud.findOneAndUpdate(args, (err, employee) => {
            if (err) {
                logger.error(err);
                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }

            employee = JSON.parse(JSON.stringify(employee))
            Checkin.postFCM({ registration_ids: employee.fcmToken, title: "Thông báo", message: "Ảnh chấm công của bạn đã bị từ chối.", listId: [_id] })

            return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
        })
    }
    catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
});

module.exports = router;
