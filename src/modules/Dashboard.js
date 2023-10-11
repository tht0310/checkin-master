

module.exports = {
    getLogCheckin: (obj, callback) => {
        var d = Util.now("YYYY-MM-DD");

        var args = { schema: "Employee", query: [] };
        args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
        
        args.query.push({ $project: { pw: 0, password: 0 } });
        args.query.push({ $match: { groupId: obj.groupId, $or: [{ dmac: obj.mac_device }, { mmac: obj.mac_device }, { mac_device: obj.mac_device }] } });

        args.query.push({
            $lookup: {
                from: "policy",
                let: { pId: "$pId" },
                pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } }],
                as: "policy"
            }
        });

        args.query.push({ $unwind: "$policy" });

        args.query.push({
            $lookup: {
                from: "timesheet",
                let: { "eId": "$_id", groupId: "$groupId" },
                pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$eId", "$$eId"] }, { $eq: ["$d", d] }] } } }],
                as: "timesheet"
            }
        })

        args.query.push({ $unwind: { path: "$timesheet", preserveNullAndEmptyArrays: true } })

        args.query.push({ $addFields: { isChecked: { $cond: { if: { $gt: ["$timesheet.inAt", null] }, then: true, else: false } } } })

        JCloud.aggregate(args, (err, result) => {
            if (err) {
                logger.error(err);
                return callback(err, false);
            }

            result = result[0] || result;
            if (result) {
                return callback(null, result);
            }

            return callback(null, false);
        })
    },
    getLogInvalidCheckin: (obj, callback) => {
        var d = Util.now("YYYY-MM-DD");
        var query = obj.query;
        var search = (query.search) ? JSON.parse(query.search) : {};
        var keys = Object.keys(search);

        var fromDate = query.fromDate ? query.fromDate.substr(0, 10) : Util.now("YYYY-MM-DD");
        var toDate = query.toDate ? query.toDate.substr(0, 10) : Util.now("YYYY-MM-DD");

        var args = { schema: "Employee", query: [] };
        args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
        
        args.query.push({ $match: { groupId: obj.groupId } });

        args.query.push({
            $lookup: {
                from: "policy",
                let: { pId: "$pId" },
                pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } }],
                as: "policy"
            }
        });

        args.query.push({ $unwind: "$policy" });

        args.query.push({
            $lookup: {
                from: "timesheet",
                let: { "eId": "$_id", groupId: "$groupId" },
                pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$eId", "$$eId"] }, { $gte: ["$d", fromDate] }, { $lte: ["$d", toDate] }] } } }],
                as: "timesheet"
            }
        })

        args.query.push({ $unwind: { path: "$timesheet", preserveNullAndEmptyArrays: true } })
        args.query.push({ $unwind: "$timesheet.log" });
        args.query.push({ $addFields: { diff: { $subtract: ["$timesheet.log.radius", "$policy.radius"] }, lat: "$timesheet.log.lat", long: "$timesheet.log.long", at: { $concat: ["$timesheet.d", " ", "$timesheet.log.t"] } } });
        args.query.push({ $match: { diff: { $gt: 0 } } });
        args.query.push({ $project: { timesheet: 0, checkin: 0, group: 0, inherited: 0, pw: 0, password: 0 } });

        args.query.push({ $sort: { at: -1 } });

        JCloud.aggregate(args, (err, result) => {
            if (err) {
                logger.error(err);
            }

            return callback(err, result);
        })
    },
    getTimeSheet1: (query, callback) => {
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

        JCloud.aggregateOne(args, (err, group) => {
            if (err) {
                logger.error(err);
                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }

            var fromDate = query.fromDate ? query.fromDate.substr(0, 10) : Util.now("YYYY-MM-DD");
            var toDate = query.toDate ? query.toDate.substr(0, 10) : Util.now("YYYY-MM-DD");
            var _fromDate = moment(fromDate);
            var _toDate = moment(toDate);
            var today = moment();
            var m = _toDate.format("YYYY-MM").toString();
            var d = Util.now("YYYY-MM-DD");

            var dom = [];
            var sQuery = [];

            while (_toDate.diff(_fromDate, 'days', true) >= 0 && today.diff(_fromDate, 'days', true) >= 0) {
                var ddd = _fromDate.format("ddd").toString();
                dom.push({ e: ddd, d: _fromDate.format("YYYY-MM-DD") })
                _fromDate.add(1, 'days');
            }

            var args = { schema: "Employee", query: [] };
            args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
            
            args.query.push({ $match: { groupId: groupId } });
            if (process.env.SERVER_MODE != "dev") args.query.push({ $match: { department: { $ne: "TEST" } } });
            args.query.push({ $match: { $expr: { $and: [{ $lte: [{ $ifNull: ["$startAt", fromDate] }, toDate] }, { $gt: [{ $ifNull: ["$endAt", toDate] }, fromDate] }] } } })
            args.query.push({ $addFields: { availableLeaveDay: { $add: ["$oldLeaveDay", "$newLeaveDay"] } } });

            if (search._id) {
                args.query.push({ $addFields: { avatar: { $ifNull: ["$portrait", "$avatar"] } } })
            }
            else {
                args.query.push({ $addFields: { avatar: { $ifNull: ["$portrait", ""] } } })
            }

            if (!search._id && query.listOwner && query.listOwner.length > 0) {
                args.query.push({ $match: { pId: { $in: query.listOwner } } });
            }

            //Filter Department by listDepartment    
            if (!search._id && query.listDepartment && query.listDepartment.length > 0) {
                args.query.push({ $match: { department: { $in: query.listDepartment } } })
            }

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

            args.query.push({ $project: { _id: 1, name: 1, no: 1, gender: 1, email: 1, phone: 1, birthday: 1, groupId: 1, department: 1, position: 1, startAt: 1, type: 1, pId: 1, avatar: 1, portrait: 1 } });

            args.query.push({
                $lookup: {
                    from: "policy",
                    let: { pId: "$pId" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
                        { $addFields: { pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] } } },
                        { $addFields: { O: { $filter: { input: { $objectToArray: "$office" }, as: "obj", cond: { $in: ["$$obj.k", ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]] } } } } },
                        {
                            $addFields: {
                                OH: {
                                    $reduce: {
                                        input: "$O",
                                        initialValue: [],
                                        in: {
                                            $concatArrays: ["$$value", [{
                                                k: "$$this.k",
                                                v: {
                                                    $arrayToObject: {
                                                        $reduce: {
                                                            input: { $objectToArray: "$$this.v" },
                                                            initialValue: [],
                                                            in: { $concatArrays: ["$$value", [{ k: "$$this.k", v: { $dateFromString: { dateString: { $concat: [d, { $ifNull: ["$$this.v", "00:00:00"] }] }, format: { $concat: ['%Y-%m-%', 'd%H:%M:%S'] } } } }]] }
                                                        }
                                                    }
                                                }
                                            }]]
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $addFields: {
                                H: {
                                    $arrayToObject: {
                                        $reduce: {
                                            input: "$OH",
                                            initialValue: [],
                                            in: { $concatArrays: ["$$value", [{ k: "$$this.k", v: { $divide: [{ $add: [{ $subtract: [{ $ifNull: ["$$this.v.outAM", 0] }, { $ifNull: ["$$this.v.inAM", 0] }] }, { $subtract: [{ $ifNull: ["$$this.v.outPM", 0] }, { $ifNull: ["$$this.v.inPM", 0] }] }] }, 3600000] } }]] }
                                        }
                                    }
                                },
                                D: {
                                    $arrayToObject: {
                                        $reduce: {
                                            input: "$O",
                                            initialValue: [],
                                            in: { $concatArrays: ["$$value", [{ k: "$$this.k", v: { $cond: { if: { $gt: ["$$this.v.inAM", null] }, then: { $cond: { if: { $gt: ["$$this.v.inPM", null] }, then: 1, else: 0.5 } }, else: 0 } } }]] }
                                        }
                                    }
                                }
                            }
                        }
                    ],
                    as: "policy"
                }
            });

            args.query.push({ $unwind: "$policy" });

            args.query.push({ $addFields: { pType: "$policy.pType" } });
            args.query.push({ $match: { pType: "Office" } });

            sQuery.push({ $skip: skip });

            if (pageSize) {
                sQuery.push({ $limit: pageSize });
            }

            sQuery.push({ $addFields: { dom: dom } });

            sQuery.push({
                $addFields: {
                    offDate: {
                        $reduce: {
                            input: "$dom", initialValue: [], in: {
                                $concatArrays: ["$$value",
                                    {
                                        $switch: {
                                            branches: [
                                                { case: { $eq: ["$$this.e", "Mon"] }, then: { $cond: { if: { $eq: ["$policy.D.Mon", 0] }, then: ["$$this.d"], else: [] } } },
                                                { case: { $eq: ["$$this.e", "Tue"] }, then: { $cond: { if: { $eq: ["$policy.D.Tue", 0] }, then: ["$$this.d"], else: [] } } },
                                                { case: { $eq: ["$$this.e", "Wed"] }, then: { $cond: { if: { $eq: ["$policy.D.Wed", 0] }, then: ["$$this.d"], else: [] } } },
                                                { case: { $eq: ["$$this.e", "Thu"] }, then: { $cond: { if: { $eq: ["$policy.D.Thu", 0] }, then: ["$$this.d"], else: [] } } },
                                                { case: { $eq: ["$$this.e", "Fri"] }, then: { $cond: { if: { $eq: ["$policy.D.Fri", 0] }, then: ["$$this.d"], else: [] } } },
                                                { case: { $eq: ["$$this.e", "Sat"] }, then: { $cond: { if: { $eq: ["$policy.D.Sat", 0] }, then: ["$$this.d"], else: [] } } },
                                                { case: { $eq: ["$$this.e", "Sun"] }, then: { $cond: { if: { $eq: ["$policy.D.Sun", 0] }, then: ["$$this.d"], else: [] } } }
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

            sQuery.push({
                $addFields: {
                    timesheetOFF: {
                        $reduce: {
                            input: "$dom", initialValue: [], in: {
                                $concatArrays: ["$$value",
                                    {
                                        $switch: {
                                            branches: [
                                                { case: { $eq: ["$$this.e", "Mon"] }, then: { $cond: { if: { $and: [{ $ne: ["$policy.D.Mon", 0] }, { $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }] }, then: { $cond: { if: { $in: ["$$this.d", group.holidays] }, then: [{ k: "$$this.d", v: { code: { value: "NL" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }], else: [{ k: "$$this.d", v: { code: { value: "K" }, codeOT: { value: "" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }] } }, else: [] } } },
                                                { case: { $eq: ["$$this.e", "Tue"] }, then: { $cond: { if: { $and: [{ $ne: ["$policy.D.Tue", 0] }, { $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }] }, then: { $cond: { if: { $in: ["$$this.d", group.holidays] }, then: [{ k: "$$this.d", v: { code: { value: "NL" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }], else: [{ k: "$$this.d", v: { code: { value: "K" }, codeOT: { value: "" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }] } }, else: [] } } },
                                                { case: { $eq: ["$$this.e", "Wed"] }, then: { $cond: { if: { $and: [{ $ne: ["$policy.D.Wed", 0] }, { $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }] }, then: { $cond: { if: { $in: ["$$this.d", group.holidays] }, then: [{ k: "$$this.d", v: { code: { value: "NL" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }], else: [{ k: "$$this.d", v: { code: { value: "K" }, codeOT: { value: "" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }] } }, else: [] } } },
                                                { case: { $eq: ["$$this.e", "Thu"] }, then: { $cond: { if: { $and: [{ $ne: ["$policy.D.Thu", 0] }, { $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }] }, then: { $cond: { if: { $in: ["$$this.d", group.holidays] }, then: [{ k: "$$this.d", v: { code: { value: "NL" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }], else: [{ k: "$$this.d", v: { code: { value: "K" }, codeOT: { value: "" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }] } }, else: [] } } },
                                                { case: { $eq: ["$$this.e", "Fri"] }, then: { $cond: { if: { $and: [{ $ne: ["$policy.D.Fri", 0] }, { $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }] }, then: { $cond: { if: { $in: ["$$this.d", group.holidays] }, then: [{ k: "$$this.d", v: { code: { value: "NL" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }], else: [{ k: "$$this.d", v: { code: { value: "K" }, codeOT: { value: "" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }] } }, else: [] } } },
                                                { case: { $eq: ["$$this.e", "Sat"] }, then: { $cond: { if: { $and: [{ $ne: ["$policy.D.Sat", 0] }, { $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }] }, then: { $cond: { if: { $in: ["$$this.d", group.holidays] }, then: [{ k: "$$this.d", v: { code: { value: "NL" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }], else: [{ k: "$$this.d", v: { code: { value: "K" }, codeOT: { value: "" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }] } }, else: [] } } },
                                                { case: { $eq: ["$$this.e", "Sun"] }, then: { $cond: { if: { $and: [{ $ne: ["$policy.D.Sun", 0] }, { $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }] }, then: { $cond: { if: { $in: ["$$this.d", group.holidays] }, then: [{ k: "$$this.d", v: { code: { value: "NL" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }], else: [{ k: "$$this.d", v: { code: { value: "K" }, codeOT: { value: "" }, wd: { value: 0 }, wt: { value: 0 }, log: { value: [] }, dow: "$$this.e" } }] } }, else: [] } } }
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

            sQuery.push({
                $lookup: {
                    from: "timesheet",
                    let: { "eId": "$_id", groupId: "$groupId", policy: "$policy", "offDate": "$offDate" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$eId", "$$eId"] },
                                        { $gte: ["$d", fromDate] },
                                        { $lte: ["$d", toDate] },
                                    ]
                                }
                            }
                        },
                        { $unwind: { path: "$log", preserveNullAndEmptyArrays: true } },
                        { $sort: { 'log.t': 1 } },
                        { $group: { _id: '$_id', root: { "$first": "$$ROOT" }, 'log': { $push: '$log' } } },
                        {
                            $replaceRoot: { newRoot: { $mergeObjects: ["$root", { log: "$log" }] } }
                        },

                        {//Neu P thi = 0
                            $addFields: {
                                lateIn: { $cond: { if: { $eq: ["$code", "P"] }, then: 0, else: { $ifNull: ["$lateIn", 0] } } },
                                earlyOut: { $cond: { if: { $eq: ["$code", "P"] }, then: 0, else: { $ifNull: ["$earlyOut", 0] } } }
                            }
                        },
                        {
                            $addFields: {
                                signD: { $ifNull: ["$$policy.signD", "NT"] }
                            }
                        },
                        {
                            $addFields: {
                                signO: { $ifNull: ["$$policy.signO", "$signD"] }
                            }
                        },
                        {
                            $addFields: {
                                signH: { $ifNull: ["$$policy.signH", "$signO"] }
                            }
                        },
                        {
                            $addFields: {
                                labelOT: { $cond: { if: { $in: ["$d", group.holidays] }, then: "$signH", else: { $cond: { if: { $in: ["$dow", { $ifNull: ["$$policy.offDay", []] }] }, then: "$signO", else: "$signD" } } } },
                                cc: { $cond: { if: { $eq: ["$code", "CC"] }, then: 1, else: 0 } },
                                ccOT: { $cond: { if: { $and: [{ $gte: [{ $ifNull: ["$wtOT", 0] }, 4] }, { $ne: ["$code", "X"] }] }, then: 1, else: 0 } },
                                codeCCOT: { $cond: { if: { $and: [{ $gte: [{ $ifNull: ["$wtOT", 0] }, 4] }, { $ne: ["$code", "X"] }] }, then: ",CC", else: "" } },
                                code: { $cond: { if: { $in: ["$d", group.holidays] }, then: "NL", else: "$code" } }
                            }
                        },
                        {
                            $addFields: {
                                k: "$d", v: {
                                    wd: { label: "So ngay cong", value: { $cond: { if: { $eq: ["$d", d] }, then: null, else: { $cond: { if: { $eq: ["$code", "X"] }, then: 1, else: { $cond: { if: { $eq: [{ $regexMatch: { input: "$code", regex: "4X", options: "i" } }, true] }, then: 0.5, else: 0 } } } } } } },
                                    wt: { label: "So gio cong", value: { $ifNull: ["$wt", 0] } },
                                    lateIn: { label: "So gio di muon", value: { $cond: { if: { $gt: [{ $subtract: [{ $ifNull: ["$lateIn", 0] }, 0] }, 0] }, then: { $ifNull: ["$lateIn", 0] }, else: 0 } } },
                                    lateOut: { label: "So gio ve muon", value: { $ifNull: ["$lateOut", 0] } },
                                    earlyIn: { label: "So gio di som", value: { $ifNull: ["$earlyIn", 0] } },
                                    earlyOut: { label: "So gio ve som", value: { $cond: { if: { $gt: [{ $subtract: [{ $ifNull: ["$earlyOut", 0] }, 0] }, 0] }, then: { $ifNull: ["$earlyOut", 0] }, else: 0 } } },
                                    code: { label: "Ma Hoa Ngay Cong", value: { $cond: { if: { $and: [{ $eq: ["$d", d] }, { $in: [{ $ifNull: ["$code", "K"] }, ["X", "4X,4P", "4X,4K", "K"]] }] }, then: null, else: "$code" } } },
                                    wtD: { $cond: { if: { $eq: ["$labelOT", "$signD"] }, then: "$wtOT", else: 0 } },
                                    wtO: { $cond: { if: { $and: [{ $eq: ["$labelOT", "$signO"] }, { $ne: ["$signD", "$signO"] }] }, then: "$wtOT", else: 0 } },
                                    wtH: { $cond: { if: { $and: [{ $eq: ["$labelOT", "$signH"] }, { $ne: ["$signD", "$signH"] }, { $ne: ["$signO", "$signH"] }] }, then: "$wtOT", else: 0 } },
                                    wtOT: { label: "So gio cong lam them", value: { $ifNull: ["$wtOT", 0] } },
                                    cc: { label: "So gio cong com", value: "$cc" },
                                    ccOT: { label: "So gio cong com luc OT", value: "$ccOT" },
                                    sumCC: { label: "So gio cong com thuc te", value: { $cond: { if: { $gt: ["$cc", 0] }, then: "$cc", else: "$ccOT" } } },
                                    codeOT: { label: "Ma Hoa Tang Ca", value: { $cond: { if: { $eq: [{ $ifNull: ["$wtOT", ""] }, ""] }, then: "", else: { $concat: [{ $toString: "$wtOT" }, "$labelOT", "$codeCCOT"] } } } },
                                    inAt: { label: "Thoi gian check-in", value: { $ifNull: ["$inAt", { $arrayElemAt: ["$log.t", 0] }] } },
                                    outAt: { label: "Thoi gian check-out", value: { $ifNull: ["$outAt", { $ifNull: ["$inAt", "..."] }] } },
                                    log: { label: "Du lieu chi tiet", value: { $ifNull: ["$log", []] } },
                                    note: { $ifNull: ["$note", ""] },
                                    late_comment: "$note",
                                    comment: { $ifNull: ["$comment", ""] },
                                }
                            }
                        },
                        { $project: { _id: 0, k: 1, v: 1 } },
                        { $sort: { k: 1 } }
                    ],
                    as: "timesheet"
                }
            });
            sQuery.push({ $addFields: { timesheet: { $mergeObjects: [{ $arrayToObject: "$timesheetOFF" }, { $arrayToObject: "$timesheet" }] } } });
            sQuery.push({ $addFields: { atimesheet: { $objectToArray: "$timesheet" } } });

            sQuery.push({
                $addFields: {
                    wd: { label: "Tong Ngay Cong", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.wd.value", 0] }] } } } },
                    wt: { label: "Tong Gio Cong", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.wt.value", 0] }] } } } },
                    wtD: { label: "Tong So Gio Tang Ca Ngay Thuong", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.wtD", 0] }] } } } },
                    wtO: { label: "Tong So Gio Tang Ca Ngay Nghi", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.wtO", 0] }] } } } },
                    wtH: { label: "Tong So Gio Tang Ca Ngay Le", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.wtH", 0] }] } } } },

                    wtTT: { label: "Tong So Gio Tang Ca Ngay Thuong", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.wtD", 0] }] } } } },
                    wtSD: { label: "Tong So Gio Tang Ca Ngay Nghi", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.wtO", 0] }] } } } },
                    wtLD: { label: "Tong So Gio Tang Ca Ngay Le", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.wtH", 0] }] } } } },
                    CC: { label: "Tong Gio Cong Com", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.sumCC.value", 0] }] } } } },
                    lateIn: { label: "So phut di muon", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.lateIn.value", 0] }] } } } },
                    earlyOut: { label: "So phut ve som", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $cond: { if: { $eq: ["$$this.k", d] }, then: 0, else: { $ifNull: ["$$this.v.earlyOut.value", 0] } } }] } } } },
                    n_lateIn: { label: "So lan di muon", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $cond: { if: { $gt: [{ $ifNull: ["$$this.v.lateIn.value", 0] }, 0] }, then: 1, else: 0 } }] } } } },
                    n_earlyOut: { label: "So phut ve som", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $cond: { if: { $gt: [{ $cond: { if: { $eq: ["$$this.k", d] }, then: 0, else: { $ifNull: ["$$this.v.earlyOut.value", 0] } } }, 0] }, then: 1, else: 0 } }] } } } },
                    n_codeP: { label: "So ngay nghi phep", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $cond: { if: { $eq: ["$$this.v.code.value", "P"] }, then: 1, else: { $cond: { if: { $eq: [{ $regexMatch: { input: "$$this.v.code.value", regex: "4P", options: "i" } }, true] }, then: 0.5, else: 0 } } } }] } } } },
                    n_codeK: { label: "So ngay nghi khac", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $cond: { if: { $and: [{ $ne: [{ $in: ["$$this.v.code.value", ["X", "P", "K", "4X,4P", "4X,4K", "4P,4K", "CC", ""]] }, true] }, { $gt: ["$$this.v.code.value", null] }, { $ne: [{ $in: ["$d", "$offDate"] }, true] }] }, then: 1, else: 0 } }] } } } },
                    n_noOut: { label: "So ngay khong cham cong ra", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $cond: { if: { $and: [{ $ne: ["$$this.k", d] }, { $eq: [{ $ifNull: ["$$this.v.wt.value", 0] }, 0] }, { $gt: [{ $size: { $ifNull: ["$$this.v.log.value", []] } }, 0] }] }, then: 1, else: 0 } }] } } } },
                    n_noIn: { label: "So ngay khong cham cong", value: { $reduce: { input: "$atimesheet", initialValue: 0, in: { $add: ["$$value", { $cond: { if: { $eq: ["$$this.v.code.value", "K"] }, then: 1, else: { $cond: { if: { $eq: [{ $regexMatch: { input: "$$this.v.code.value", regex: '4K' } }, true] }, then: 0.5, else: 0 } } } }] } } } },
                }
            });

            sQuery.push({
                $addFields: {
                    totalWD: {
                        label: "Tong ngay cong trong thang",
                        value: {
                            $reduce: {
                                input: "$dom", initialValue: 0, in: {
                                    $add: ["$$value",
                                        {
                                            $switch: {
                                                branches: [
                                                    { case: { $eq: ["$$this.e", "Mon"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.D.Mon", else: 0 } } },
                                                    { case: { $eq: ["$$this.e", "Tue"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.D.Tue", else: 0 } } },
                                                    { case: { $eq: ["$$this.e", "Wed"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.D.Wed", else: 0 } } },
                                                    { case: { $eq: ["$$this.e", "Thu"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.D.Thu", else: 0 } } },
                                                    { case: { $eq: ["$$this.e", "Fri"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.D.Fri", else: 0 } } },
                                                    { case: { $eq: ["$$this.e", "Sat"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.D.Sat", else: 0 } } },
                                                    { case: { $eq: ["$$this.e", "Sun"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.D.Sun", else: 0 } } }
                                                ],
                                                default: 0
                                            }
                                        }]
                                }
                            }
                        }
                    }
                }
            });

            sQuery.push({
                $addFields: {
                    totalWT: {
                        label: "Tong gio cong trong thang",
                        value: {
                            $reduce: {
                                input: "$dom", initialValue: 0, in: {
                                    $add: ["$$value",
                                        {
                                            $switch: {
                                                branches: [
                                                    { case: { $eq: ["$$this.e", "Mon"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.H.Mon", else: 0 } } },
                                                    { case: { $eq: ["$$this.e", "Tue"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.H.Tue", else: 0 } } },
                                                    { case: { $eq: ["$$this.e", "Wed"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.H.Wed", else: 0 } } },
                                                    { case: { $eq: ["$$this.e", "Thu"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.H.Thu", else: 0 } } },
                                                    { case: { $eq: ["$$this.e", "Fri"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.H.Fri", else: 0 } } },
                                                    { case: { $eq: ["$$this.e", "Sat"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.H.Sat", else: 0 } } },
                                                    { case: { $eq: ["$$this.e", "Sun"] }, then: { $cond: { if: { $and: [{ $gte: ["$$this.d", "$startAt"] }, { $lt: ["$$this.d", d] }, { $ne: [{ $in: ["$$this.d", group.holidays] }, true] }] }, then: "$policy.H.Sun", else: 0 } } }
                                                ],
                                                default: 0
                                            }
                                        }]
                                }
                            }
                        }
                    }
                }
            });

            sQuery.push({
                $lookup: {
                    from: "group", let: { groupId: "$groupId" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$groupId"] }] } } },
                        { $project: { _id: 1, name: 1, keyword: 1, type: 1, positions: 1, holidays: 1, pcDate: 1, resetDate: 1 } }
                    ],
                    as: "group"
                }
            });

            sQuery.push({ $unwind: "$group" });

            sQuery.push({ $addFields: { holidays: { $ifNull: ["$group.holidays", group.holidays] } } })

            sQuery.push({ $project: { dom: 0, policy: 0, timesheetOFF: 0, atimesheet: 0 } });

            if (sort) {
                sQuery.push({ $sort: sort });
            }

            if (query.noCount == true) {
                args.query.push(...sQuery)

                JCloud.aggregate(args, (err, result) => {
                    if (err) {
                        logger.error(err);
                        return callback(err, result);
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
                        return callback(err, result);
                    }

                    if (!result || result.length == 0) {
                        var response = { doc: [], total: 0, pages: 0 };
                        return callback(err, response);
                    }

                    //Assign count.
                    var count = result[0].count;
                    if (count == 0) {
                        var response = { doc: [], total: count, pages: 0 };
                        return callback(err, response);
                    }

                    //Remove $group
                    args.query.pop();

                    args.query.push(...sQuery);

                    // logger.debug(JSON.stringify(args.query));

                    JCloud.aggregate(args, (err, result) => {
                        if (err) {
                            logger.error(err);
                            var response = { doc: [], total: count, pages: 0 };
                            return callback(err, response);
                        }

                        var response = { doc: result, total: count, pages: Math.ceil(count / pageSize) };
                        return callback(err, response);
                    })
                })
            }
        });
    },
    getTimeSheet2: (query, callback) => {
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

        JCloud.aggregateOne(args, (err, group) => {
            if (err) {
                logger.error(err);
                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }

            if (!group) {
                return null;
            }

            var fromDate = query.fromDate ? query.fromDate.substr(0, 10) : Util.now("YYYY-MM-DD");
            var toDate = query.toDate ? query.toDate.substr(0, 10) : Util.now("YYYY-MM-DD");
            var _fromDate = moment(fromDate);
            var _toDate = moment(toDate);
            var today = moment();
            var m = _toDate.format("YYYY-MM").toString();
            var d = Util.now("YYYY-MM-DD");

            isPast = false;
            if (today.diff(_toDate, "days") > 0) {
                isPast = true;
            }

            var dom = [];
            var sQuery = [];

            while (_toDate.diff(_fromDate, 'days', true) >= 0 && today.diff(_fromDate, 'days', true) >= 0) {
                var ddd = _fromDate.format("ddd").toString();
                dom.push({ e: ddd, d: _fromDate.format("YYYY-MM-DD") })
                _fromDate.add(1, 'days');
            }

            var args = { schema: "Employee", query: [] };
            args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
            
            args.query.push({ $match: { groupId: groupId } });
            if (process.env.SERVER_MODE != "dev" && !search._id) args.query.push({ $match: { department: { $ne: "TEST" } } });
            args.query.push({ $match: { $expr: { $and: [{ $gte: [toDate, { $ifNull: ["$startAt", toDate] }] }, { $gt: [{ $ifNull: ["$endAt", toDate] }, fromDate] }] } } })
            args.query.push({ $addFields: { availableLeaveDay: { $add: ["$oldLeaveDay", "$newLeaveDay"] } } });

            if (search._id) {
                args.query.push({ $addFields: { avatar: { $ifNull: ["$portrait", "$avatar"] } } })
            }
            else {
                args.query.push({ $addFields: { avatar: { $ifNull: ["$portrait", ""] } } })
            }

            if (query.listOwner && query.listOwner.length > 0) {
                args.query.push({ $match: { pId: { $in: query.listOwner } } });
            }

            //Filter Department by listDepartment    
            if (!search._id && query.listDepartment && query.listDepartment.length > 0) {
                args.query.push({ $match: { department: { $in: query.listDepartment } } })
            }

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

            //Use other policy in past if exists
            if (isPast) {
                args.query.push({
                    $lookup: {
                        from: "timesheet",
                        let: { eId: "$_id" },
                        pipeline: [
                            { $match: { $expr: { $and: [{ $eq: ["$_v", 2] }, { $eq: ["$eId", "$$eId"] }] } } },
                            { $group: { _id: null, pId: { $first: "$pId" } } }
                        ],
                        as: "oldPolicy"
                    }
                })

                args.query.push({ $unwind: "$oldPolicy" });

                args.query.push({ $addFields: { pId: { $ifNull: ["$oldPolicy.pId", "$pId"] } } });
            }

            args.query.push({ $project: { _id: 1, name: 1, no: 1, gender: 1, email: 1, phone: 1, birthday: 1, groupId: 1, department: 1, position: 1, startAt: 1, type: 1, pId: 1, avatar: 1, portrait: 1 } });

            args.query.push({
                $lookup: {
                    from: "policy",
                    let: { pId: "$pId" },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
                        { $addFields: { pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] }, "fixedShift": { $ifNull: ["$fixedShift", false] } } },
                        { $match: { pType: "Shift" } },

                        { $unwind: { path: "$week.Mon", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Mon.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
                        { $addFields: { "weekArr.Mon": "$arr", "weekObj.Mon": { $arrayToObject: "$obj" } } },

                        { $unwind: { path: "$week.Tue", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Tue.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
                        { $addFields: { "weekArr.Tue": "$arr", "weekObj.Tue": { $arrayToObject: "$obj" } } },

                        { $unwind: { path: "$week.Wed", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Wed.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
                        { $addFields: { "weekArr.Wed": "$arr", "weekObj.Wed": { $arrayToObject: "$obj" } } },

                        { $unwind: { path: "$week.Thu", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Thu.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
                        { $addFields: { "weekArr.Thu": "$arr", "weekObj.Thu": { $arrayToObject: "$obj" } } },

                        { $unwind: { path: "$week.Fri", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Fri.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
                        { $addFields: { "weekArr.Fri": "$arr", "weekObj.Fri": { $arrayToObject: "$obj" } } },

                        { $unwind: { path: "$week.Sat", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Sat.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
                        { $addFields: { "weekArr.Sat": "$arr", "weekObj.Sat": { $arrayToObject: "$obj" } } },

                        { $unwind: { path: "$week.Sun", preserveNullAndEmptyArrays: true } },
                        { $lookup: { from: "shift", let: { sId: "$week.Sun.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
                        { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
                        { $group: { _id: "$_id", pType: { $first: "$pType" }, fixedShift: { $first: "$fixedShift" }, week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, weekObj: { $first: "$weekObj" }, "arr": { $addToSet: "$dow.v" }, "obj": { $addToSet: "$dow" } } },
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

            var pFull = 8;

            //Start Timesheet Total by date
            sQuery.push({ $addFields: { dom: dom } });

            //Get List Shift in Policy
            sQuery.push({
                $addFields: {
                    inPolicy: {
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

            sQuery.push({ $unwind: "$inPolicy" });

            //Check Shift in Policy exists in Plan
            sQuery.push({
                $lookup: {
                    from: "plan",
                    let: {
                        eId: "$_id",
                        groupId: "$groupId",
                        pId: "$pId",
                        inPolicy: "$inPolicy"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$d", "$$inPolicy.k"] },
                                        { $eq: ["$eId", "$$eId"] },
                                        { $eq: ["$pId", "$$pId"] },
                                        { $eq: ["$checked", true] },
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "shift",
                                let: { sId: "$sId" },
                                pipeline: [
                                    { $match: { $expr: { $eq: ["$_id", "$$sId"] } } },
                                    { $addFields: { k: "$$sId", v: { sId: "$_id", sName: "$name", sCode: "$sCode", sColor: { $ifNull: ["$color", "default"] }, sIn: "$in", sOut: "$out" } } },
                                    { $project: { _id: 0, k: 1, v: 1 } }
                                ],
                                as: "shift"
                            }
                        },
                        { $unwind: "$shift" },
                        { $group: { _id: "$d", k: { $first: "$d" }, v: { $addToSet: "$shift" } } },
                        { $addFields: { v: { $arrayToObject: "$v" } } },
                        { $project: { _id: 0 } }
                    ],
                    as: "inPlan"
                }
            })
            sQuery.push({ $unwind: { path: "$inPlan", preserveNullAndEmptyArrays: true } })

            sQuery.push({ $addFields: { schedule: { $cond: { if: { $eq: ["$policy.fixedShift", true] }, then: { $ifNull: ["$inPlan", { k: "$inPolicy.k", v: { color: "$inPolicy.sColor" } }] }, else: "$inPolicy" } } } })
            sQuery.push({ $unwind: { path: "$schedule", preserveNullAndEmptyArrays: true } })

            //Look up timesheet as timesheetD
            sQuery.push({
                $lookup: {
                    from: "timesheet",
                    let: { eId: "$_id", groupId: "$groupId", policy: "$policy", pId: "$pId", schedule: "$schedule" },
                    pipeline: [
                        // { $match: { $expr: { $and: [{ $eq: ["$_v", 2] }, { $eq: ["$pId", "$$pId"] }, { $eq: ["$eId", "$$eId"] }, { $eq: ["$d", "$$schedule.k"] }] } } },

                        { $match: { $expr: { $and: [{ $eq: [{ $ifNull: ["$pId", "$$pId"] }, "$$pId"] }, { $eq: ["$eId", "$$eId"] }, { $eq: ["$d", "$$schedule.k"] }] } } },

                        //Filter sIn not in plan
                        {
                            $lookup: {
                                from: "plan",
                                let: {
                                    eId: "$eId",
                                    d: "$d",
                                    pId: "$policy._id",
                                    sId: "$sId"
                                },
                                pipeline: [{
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$checked", true] },
                                                { $eq: ["$eId", "$$eId"] },
                                                { $eq: ["$pId", "$$pId"] },
                                                { $eq: ["$sId", "$$sId"] },
                                                { $eq: ["$d", "$$d"] }
                                            ]
                                        }
                                    }
                                }],
                                as: "plan"
                            }
                        },
                        { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
                        { $match: { $expr: { $or: [{ $eq: ["$$policy.fixedShift", false] }, { $gte: ["$plan", null] }] } } },
                        //End Filter

                        {
                            $lookup: {
                                from: "shift",
                                let: { sId: "$sId" },
                                pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$sId"] }] } } }],
                                as: "shiftEx"
                            }
                        },
                        { $unwind: { path: "$shiftEx", preserveNullAndEmptyArrays: true } },
                        {
                            $addFields: {
                                shift: { $ifNull: ["$shift", "$shiftEx"] },
                                pFull: { $toInt: { $ifNull: ["$pFull", { $ifNull: ["$$policy.full", pFull] }] } }
                            }
                        },
                        {
                            $addFields: {
                                sId: { $ifNull: ["$sId", "$shift._id"] },
                                wt: { $divide: [{ $ifNull: ["$wt", 0] }, 60] },
                                sDuarion: { $ifNull: ["$sDuration", { $ifNull: ["$shift.duration", "$$policy.duration"] }] },
                                sType: { $ifNull: ["$sType", { $ifNull: ["$$policy.shiftType", "wd"] }] },
                                code: {
                                    $cond: {
                                        if: { $or: [{ $eq: ["$code", "4X,4P"] }, { $eq: ["$code", "4P,4K"] }] },
                                        then: "P",
                                        else: { $ifNull: ["$code", "X"] }
                                    }
                                },
                                lateIn: {
                                    $cond: { if: { $gt: [{ $ifNull: ["$earlyIn", 0] }, 0] }, then: 0, else: { $ifNull: ["$lateIn", 0] } },
                                },
                                earlyOut: {
                                    $cond: { if: { $gt: [{ $ifNull: ["$lateOut", 0] }, 0] }, then: 0, else: { $ifNull: ["$earlyOut", 0] } },
                                }
                            }
                        },
                        {
                            $addFields: {
                                sAjust: { $cond: { if: { $gt: ["$pFull", 0] }, then: { $trunc: [{ $divide: [{ $add: [{ $ifNull: ["$shift.lateIn", 0] }, { $ifNull: ["$shift.earlyOut", 0] }] }, { $multiply: ["$pFull", 60] }] }, 1] }, else: "$sDuarion" } },
                            }
                        },
                        { $match: { sId: { $ne: null } } },
                        {
                            $addFields: {
                                k: "$d",
                                v: {
                                    k: "$sId",
                                    v: {
                                        sId: "$sId",
                                        sIn: { $ifNull: ["$sIn", "$shift.in"] },
                                        sOut: { $ifNull: ["$sOut", "$shift.out"] },
                                        sName: { $ifNull: ["$sName", { $ifNull: ["$shift.name", "-"] }] },
                                        sCode: { $ifNull: ["$sCode", { $ifNull: ["$shift.sCode", ""] }] },
                                        sColor: { $ifNull: ["$shiftEx.color", "default"] },
                                        inAt: { label: "Thoi gian check-in", value: "$hInAt" },
                                        outAt: { label: "Thoi gian check-out", value: { $ifNull: ["$hOutAt", "..."] } },
                                        log: { label: "Du lieu chi tiet", value: { $ifNull: ["$log", []] } },
                                        lateIn: {
                                            label: "So phut di muon",
                                            value: { $cond: { if: { $gt: [{ $subtract: [{ $ifNull: ["$lateIn", 0] }, { $ifNull: ["$$policy.lateIn", 0] }] }, 0] }, then: { $ifNull: ["$lateIn", 0] }, else: 0 } },
                                            unit: "minute(s)"
                                        },
                                        lateOut: {
                                            label: "So phut ve muon",
                                            value: { $ifNull: ["$lateOut", 0] },
                                            unit: "minute(s)"
                                        },
                                        earlyIn: {
                                            label: "So phut di som",
                                            value: { $ifNull: ["$earlyIn", 0] },
                                            unit: "minute(s)"
                                        },
                                        earlyOut: {
                                            label: "So phut ve muon",
                                            value: { $cond: { if: { $gt: [{ $subtract: [{ $ifNull: ["$earlyOut", 0] }, { $ifNull: ["$$policy.earlyOut", 0] }] }, 0] }, then: { $ifNull: ["$earlyOut", 0] }, else: 0 } },
                                            unit: "minute(s)"
                                        },
                                        wt: {
                                            $cond: {
                                                if: { $eq: ["$sId", "0"] },
                                                then: { label: "So nghi phep", unit: "P", value: "$wd" },
                                                else: {
                                                    $cond: {
                                                        if: { $eq: ["$sType", "hour"] },
                                                        then: { label: "h=", unit: "h", raw: { $ifNull: ["$wd", "$wt"] }, value: { $ifNull: ["$wd", { $cond: { if: { $gt: [{ $add: ["$wt", "$sAjust"] }, "$sDuarion"] }, then: "$sDuarion", else: { $floor: "$wt" } } }] } },
                                                        else: {
                                                            $cond: {
                                                                if: { $eq: ["$sType", "shift"] },
                                                                then: {
                                                                    label: "shift=",
                                                                    unit: "ca",
                                                                    raw: { $ifNull: ["$wd", "$wt"] },
                                                                    value: { $ifNull: ["$wd", { $cond: { if: { $gt: [{ $add: ["$wt", "$sAjust"] }, "$sDuarion"] }, then: 1, else: { $divide: [{ $floor: { $divide: ["$wt", { $divide: ["$sDuration", 2] }] } }, 2] } } }] }
                                                                },
                                                                else: {
                                                                    label: "x=",
                                                                    unit: "X",
                                                                    raw: { $ifNull: ["$wd", "$wt"] },
                                                                    value: {
                                                                        $ifNull: ["$wd", {
                                                                            $cond: {
                                                                                if: { $gt: [{ $add: ["$wt", "$sAjust"] }, "$sDuarion"] },
                                                                                then: { $round: [{ $divide: ["$sDuarion", "$pFull"] }, 1] },
                                                                                else: { $round: [{ $divide: ["$wt", "$pFull"] }, 1] }
                                                                            }
                                                                        }]
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $addFields: {
                                "v.v.wt": { $cond: { if: { $eq: ["$v.v.wt.value", 0] }, then: null, else: "$v.v.wt" } },
                                // "v.v.inAt": { $cond: { if: { $eq: ["$v.v.wt.value", 0] }, then: { label: "Thoi gian check-in", value: null }, else: "$v.v.inAt" } },
                                // "v.v.outAt": { $cond: { if: { $eq: ["$v.v.wt.value", 0] }, then: { label: "Thoi gian check-out", value: null }, else: "$v.v.outAt" } },
                                "v.v.lateIn": { $cond: { if: { $eq: ["$v.v.wt.value", 0] }, then: { label: "So phut di muon", value: 0, unit: "minute(s)" }, else: "$v.v.lateIn" } },
                                "v.v.lateOut": { $cond: { if: { $eq: ["$v.v.wt.value", 0] }, then: { label: "So phut ve muon", value: 0, unit: "minute(s)" }, else: "$v.v.lateOut" } },
                                "v.v.earlyIn": { $cond: { if: { $eq: ["$v.v.wt.value", 0] }, then: { label: "So phut di som", value: 0, unit: "minute(s)" }, else: "$v.v.earlyIn" } },
                                "v.v.earlyOut": { $cond: { if: { $eq: ["$v.v.wt.value", 0] }, then: { label: "So phut ve som", value: 0, unit: "minute(s)" }, else: "$v.v.earlyOut" } },
                                // "v.v.log": { $cond: { if: { $eq: ["$v.v.wt.value", 0] }, then: { label: "Du lieu chi tiet", value: [] }, else: "$v.v.log" } }
                            }
                        },
                        {
                            $group: {
                                _id: "$k",
                                k: { $first: "$k" },
                                v: { $addToSet: "$v" }
                            }
                        },
                        { $addFields: { v: { $cond: { if: { $gte: [{ $size: { $ifNull: ["$v", []] } }, 0] }, then: { $arrayToObject: "$v" }, else: {} } } } },
                        { $project: { _id: 0, k: 1, v: 1 } },
                        { $sort: { k: 1 } }
                    ],
                    as: "timesheetD"
                }
            });

            sQuery.push({ $unwind: { path: "$timesheetD", preserveNullAndEmptyArrays: true } });

            sQuery.push({
                $addFields: {
                    timesheet: {
                        k: "$schedule.k",
                        v: {
                            $mergeObjects: [
                                "$schedule.v",
                                "$timesheetD.v"
                            ]
                        }
                    }
                }
            });

            // sQuery.push({ $match: { "timesheet.k": { $ne: null } } })

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
                    timesheet: { $addToSet: "$timesheet" }
                }
            });

            sQuery.push({
                $addFields: {
                    timesheet: { $arrayToObject: "$timesheet" }
                }
            });
            //End

            sQuery.push({ $addFields: { shiftP: { sId: "0", sName: "Nghỉ phép", sIn: "00:00:00", sType: "P", sUnit: "P" } } })
            sQuery.push({ $addFields: { shiftE: { sId: null, sName: null, sIn: null, sType: null, sUnit: null } } })

            // Start Timesheet Total by shift
            if (isPast) {
                sQuery.push({
                    $lookup: {
                        from: "timesheet",
                        let: {
                            eId: "$_id",
                            policy: "$policy",
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$eId", "$$eId"] },
                                            { $eq: ["$pType", "$$policy.pType"] },
                                            { $gte: ["$d", fromDate] },
                                            { $lte: ["$d", toDate] }
                                        ]
                                    }
                                }
                            },
                            { $addFields: { sColor: { $ifNull: ["$shift.color", "default"] } } },
                            { $group: { _id: { _id: "$sId", name: "$sName" }, sId: { $first: "$sId" }, sName: { $first: "$sName" }, sColor: { $first: "$sColor" }, sIn: { $first: "$sIn" } } },
                            { $project: { _id: 0 } }
                        ],
                        as: "shift"
                    }
                });

                sQuery.push({ $addFields: { shift: { $ifNull: ["$shift", []] } } })

                sQuery.push({
                    $addFields: {
                        checkShiftP: {
                            $reduce: {
                                input: "$shift",
                                initialValue: 0,
                                in: { $add: ["$$value", { $cond: { if: { $eq: ["$$this.sId", "0"] }, then: 1, else: 0 } }] }
                            }
                        }
                    }
                })

                sQuery.push({ $addFields: { shift: { $cond: { if: { $gte: ["$checkShiftP", 1] }, then: "$shift", else: { $cond: { if: { $eq: ["$shift", []] }, then: ["$shiftE"], else: { $concatArrays: [["$shiftP"], "$shift"] } } } } } } })
                sQuery.push({ $unwind: { path: "$shift", preserveNullAndEmptyArrays: true } });
            }
            else {
                sQuery.push({
                    $addFields: {
                        shift: {
                            $reduce: {
                                input: { $objectToArray: "$policy.weekArr" },//"$policy.weekArr",
                                initialValue: ["$shiftP"],
                                in: { $concatArrays: ["$$value", { $cond: { if: { $setIsSubset: ["$$this.v", "$$value"] }, then: [], else: "$$this.v" } }] }
                            }
                        }
                    }
                });

                sQuery.push({ $addFields: { shift: { $filter: { input: "$shift", as: "x", cond: { $ne: ["$$x", null] } } } } });

                sQuery.push({ $unwind: { path: "$shift", preserveNullAndEmptyArrays: true } });
                sQuery.push({ $unwind: { path: "$shift.v", preserveNullAndEmptyArrays: true } });
                sQuery.push({ $sort: { no: 1, "shift.sIn": 1, "shift.sName": 1 } });
            }
            //End

            //Total
            //look up timesheet as timesheetShift (total by shift)
            sQuery.push({
                $lookup: {
                    from: "timesheet",
                    let: { eId: "$eId", policy: "$policy", sId: "$shift.sId", pId: "$policy._id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$eId", "$$eId"] },
                                        { $eq: [{ $ifNull: ["$sId", 0] }, "$$sId"] },
                                        { $eq: [{ $ifNull: ["$pId", "$$pId"] }, "$$pId"] },
                                        { $gte: ["$d", fromDate] },
                                        { $lte: ["$d", toDate] }
                                    ]
                                }
                            }
                        },

                        {
                            $addFields: { sId: { $ifNull: ["$sId", "0"] } }
                        },
                        {
                            $addFields: { pId: { $cond: { if: { $eq: ["$sId", "0"] }, then: "$$pId", else: "$pId" } } }
                        },
                        //Filter sIn not in plan
                        {
                            $lookup: {
                                from: "plan",
                                let: { d: "$d", eId: "$eId", pId: "$policy._id", sId: "$sId" },
                                pipeline: [{
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$checked", true] },
                                                { $eq: ["$eId", "$$eId"] },
                                                { $eq: ["$pId", "$$pId"] },
                                                { $eq: ["$sId", "$$sId"] },
                                                { $eq: ["$d", "$$d"] }
                                            ]
                                        }
                                    }
                                }],
                                as: "plan"
                            }
                        },
                        { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
                        { $match: { $expr: { $or: [{ $eq: ["$$policy.fixedShift", false] }, { $gte: ["$plan", null] }] } } },
                        //End Filter

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
                            $addFields: {
                                pFull: { $toInt: { $ifNull: ["$pFull", { $ifNull: ["$$policy.full", pFull] }] } },
                                wt: { $divide: [{ $ifNull: ["$wt", 0] }, 60] },
                                sDuarion: { $ifNull: ["$sDuration", { $ifNull: ["$shift.duration", "$$policy.duration"] }] },
                            }
                        },
                        {
                            $addFields: {
                                sAjust: { $cond: { if: { $gt: ["$pFull", 0] }, then: { $trunc: [{ $divide: [{ $add: [{ $ifNull: ["$shift.lateIn", 0] }, { $ifNull: ["$shift.earlyOut", 0] }] }, { $multiply: ["$pFull", 60] }] }, 1] }, else: "$sDuarion" } },
                            }
                        },
                        {
                            $addFields: {
                                sName: { $ifNull: ["$sName", { $ifNull: ["$shift.name", "-"] }] },
                                sColor: { $ifNull: ["$shift.color", "default"] },
                                wt: {
                                    $cond: {
                                        if: { $eq: ["$sId", "0"] },
                                        then: { $ifNull: ["$wd", 0] },
                                        else: {
                                            $cond: {
                                                if: { $eq: ["$sType", "hour"] },
                                                then: { $ifNull: ["$wd", { $cond: { if: { $gt: [{ $add: ["$wt", "$sAjust"] }, "$sDuarion"] }, then: "$sDuarion", else: { $floor: "$wt" } } }] },
                                                else: {
                                                    $cond: {
                                                        if: { $eq: ["$sType", "shift"] },
                                                        then: {
                                                            $ifNull: ["$wd", {
                                                                $cond: {
                                                                    if: { $gt: [{ $add: ["$wt", "$sAjust"] }, "$sDuarion"] },
                                                                    then: 1,
                                                                    else: { $divide: [{ $floor: { $divide: ["$wt", { $divide: ["$sDuration", 2] }] } }, 2] }
                                                                }
                                                            }]
                                                        },
                                                        else: {
                                                            $ifNull: ["$wd", {
                                                                $cond: {
                                                                    if: { $gt: [{ $add: ["$wt", "$sAjust"] }, "$sDuarion"] },
                                                                    then: { $round: [{ $divide: ["$sDuarion", "$pFull"] }, 1] },
                                                                    else: { $round: [{ $divide: ["$wt", "$pFull"] }, 1] }
                                                                }
                                                            }]
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                lateIn: {
                                    $cond: {
                                        if: { $gt: [{ $subtract: [{ $ifNull: ["$lateIn", 0] }, { $ifNull: ["$$policy.lateIn", 0] }] }, 0] },
                                        then: { $ifNull: ["$lateIn", 0] },
                                        else: 0
                                    }
                                },
                                lateOut: { $ifNull: ["$lateOut", 0] },
                                earlyIn: { $ifNull: ["$earlyIn", 0] },
                                earlyOut: {
                                    $cond: {
                                        if: { $gt: [{ $subtract: [{ $ifNull: ["$earlyOut", 0] }, { $ifNull: ["$$policy.earlyOut", 0] }] }, 0] },
                                        then: { $ifNull: ["$earlyOut", 0] },
                                        else: 0
                                    }
                                },
                                sIn: { $ifNull: ["$sIn", "$shift.in"] },
                                sOut: { $ifNull: ["$sOut", "$shift.out"] }
                            }
                        },
                        {
                            $group: {
                                _id: "$sId",
                                sId: { $first: "$sId" },
                                sName: { $first: "$sName" },
                                sColor: { $first: "$sColor" },
                                sType: { $first: "$sType" },
                                wt: { $sum: "$wt" },
                                lateIn: { $sum: "$lateIn" },
                                lateOut: { $sum: "$lateOut" },
                                earlyIn: { $sum: "$earlyIn" },
                                earlyOut: { $sum: "$earlyOut" },
                                sIn: { $first: "$sIn" },
                                sOut: { $first: "$sOut" }
                            }
                        },
                        {
                            $addFields: {
                                wt: {
                                    $cond: {
                                        if: { $eq: ["$sId", "0"] },
                                        then: { label: "Tong ngay phep", unit: "P", value: "$wt" },
                                        else: {
                                            $cond: {
                                                if: { $eq: ["$sType", "hour"] },
                                                then: { label: "Sum h", unit: { $cond: { if: { $gt: ["$wt", 0] }, then: "h", else: "" } }, value: "$wt" },
                                                else: {
                                                    $cond: {
                                                        if: { $eq: ["$sType", "shift"] },
                                                        then: { label: "Sum shift", unit: { $cond: { if: { $gt: ["$wt", 0] }, then: "ca", else: "" } }, value: "$wt" },
                                                        else: { label: "Sum x", unit: "X", value: { $round: ["$wt", 1] } }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                lateIn: { label: "Tong so phut di muon theo ca", value: { $sum: "$lateIn" }, unit: "minute(s)" },
                                lateOut: { label: "Tong so phut di som theo ca", value: { $sum: "$lateOut" }, unit: "minute(s)" },
                                earlyIn: { label: "Tong so phut ve muon theo ca", value: { $sum: "$earlyIn" }, unit: "minute(s)" },
                                earlyOut: { label: "Tong so phut ve som theo ca", value: { $sum: "$earlyOut" }, unit: "minute(s)" }
                            }
                        },
                        {
                            $project: {
                                _id: 0
                            }
                        },
                    ],
                    as: "timesheetShift"
                }
            });

            sQuery.push({ $unwind: { path: "$timesheetShift", preserveNullAndEmptyArrays: true } });

            sQuery.push({ $addFields: { timesheetTotal: { $ifNull: ["$timesheetShift", "$shift"] } } });

            sQuery.push({ $sort: { "timesheetTotal.sIn": 1 } });

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
                    timesheet: { $first: "$timesheet" },
                    timesheetTotal: { $push: "$timesheetTotal" }
                }
            });

            sQuery.push({
                $addFields: {
                    "timesheet.total": "$timesheetTotal"
                }
            })
            //End

            sQuery.push({ $addFields: { timesheetTotal: { $filter: { input: "$timesheetTotal", as: "x", cond: { $ne: ["$$x.wt.unit", "P"] } } } } });

            sQuery.push({
                $addFields: {
                    wt: { label: "Tong So Cong", value: { $reduce: { input: "$timesheetTotal", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.wt.value", 0] }] } } }, unit: { $arrayElemAt: ["$timesheetTotal.wt.unit", 0] }, sColor: { $arrayElemAt: ["$timesheetTotal.sColor", 0] } },
                    lateIn: { label: "Tong So phut di muon", value: { $reduce: { input: "$timesheetTotal", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.wt.value", 0] }] } } } },
                    lateOut: { label: "Tong So phut di som", value: { $reduce: { input: "$timesheetTotal", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.wt.value", 0] }] } } } },
                    earlyIn: { label: "Tong So phut ve muon", value: { $reduce: { input: "$timesheetTotal", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.wt.value", 0] }] } } } },
                    earlyOut: { label: "Tong So phut ve som", value: { $reduce: { input: "$timesheetTotal", initialValue: 0, in: { $add: ["$$value", { $ifNull: ["$$this.v.wt.value", 0] }] } } } },
                }
            });

            sQuery.push({ $project: { timesheetTotal: 0 } })

            if (sort) {
                sQuery.push({ $sort: sort });
            }

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

                    //Remove $group
                    args.query.pop();

                    args.query.push(...sQuery);
                    // logger.debug(JSON.stringify(args.query));
                    JCloud.aggregate(args, (err, result) => {
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
    getTimeSheetLog: (query, callback) => {
        var groupId = query.groupId;
        var search = (query.search) ? JSON.parse(query.search) : {};
        if (search.name) {
            search.keyword = Util.removeDMV(search.name);
            delete search.name;
        }
        var keys = Object.keys(search);
        var page = parseInt(query.page || 1);
        var pageSize = parseInt(query.pageSize || 2147483647);
        // var sort = ((query.sort) ? JSON.parse(query.sort) : {});
        var sort = { d: -1, outAt: -1 }
        var skip = (page - 1) * pageSize;

        var fromDate = query.fromDate ? query.fromDate.substr(0, 10) : Util.now("YYYY-MM-DD");
        var toDate = query.toDate ? query.toDate.substr(0, 10) : Util.now("YYYY-MM-DD");

        var args = { schema: "Timesheet", query: [] };
        args.query.push({ $match: { groupId: groupId, d: { $gte: fromDate, $lte: toDate }, inAt: { $exists: true }, inAt: { $ne: "" }, inAt: { $ne: null } } });//$or: [{ code: "X" }, { code: { $regex: "4X", $options: "i" } }]

        // args.query.push({ $addFields: { pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] } } });
        // args.query.push({ $match: { pType: "Shift" } });

        args.query.push({
            $lookup: {
                from: "employee",
                let: { "eId": "$eId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$eId"] }, { $ne: ["$checkin", null] }] } } },
                    { $match: { $expr: { $and: [{ $lte: [{ $ifNull: ["$startAt", fromDate] }, toDate] }, { $gt: [{ $ifNull: ["$endAt", toDate] }, fromDate] }] } } },
                    { $addFields: { avatar: { $ifNull: ["$portrait", ""] } } },
                    { $project: { _id: 1, no: 1, keyword: 1, name: 1, department: 1, position: 1, startAt: 1, type: 1, pId: 1, avatar: 1, portrait: 1 } }
                ],
                as: "employee"
            }
        });
        args.query.push({ $unwind: "$employee" });

        if (query.listOwner && query.listOwner.length > 0) {
            args.query.push({ $match: { "employee.pId": { $in: query.listOwner } } });
        }

        //Filter Department by listDepartment
        if (!search._id && query.listDepartment && query.listDepartment.length > 0) {
            args.query.push({ $match: { department: { $in: query.listDepartment } } })
        }

        args.query.push({
            $lookup: {
                from: "policy",
                let: { pId: "$employee.pId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
                ],
                as: "policy"
            }
        });

        args.query.push({ $unwind: "$policy" });

        args.query.push({ $addFields: { log: { $arrayElemAt: ["$log", -1] } } })
        args.query.push({ $addFields: { outAt: "$log.t" } });

        args.query.push({ $addFields: { checkout: { $cond: { if: { $gte: ["$wt", 1] }, then: { $cond: { if: { $gte: ["$wt", "$policy.office.full"] }, then: "full", else: { $cond: { if: { $gte: ["$wt", "$policy.office.half"] }, then: "half", else: "miss" } } } }, else: "no" } } } });


        args.query.push({ $replaceRoot: { newRoot: { $mergeObjects: ["$employee", "$$ROOT"] } } });
        args.query.push({ $project: { no: 1, name: 1, keyword: 1, department: 1, position: 1, startAt: 1, d: 1, inAt: 1, outAt: 1, wt: 1, type: "$log.l", checkout: 1, full: 1, half: 1, note: 1, comment: 1, late_conment: 1 } })

        if (keys.length > 0) {
            keys.forEach((key) => {
                if (typeof search[key] != "object") {
                    if (key == "department" || key == "position" || key == "pId" || key == "checkout") {
                        args.query.push({ $match: { [key]: search[key] } });
                    }
                    else if (key == "keyword" || key == "name" || key == "no") {
                        args.query.push({ $match: { [key]: { $regex: Util.removeDMV(search[key]), $options: "i" } } });
                    }
                    else {
                        args.query.push({ $match: { [key]: { $regex: Util.removeDMV(search[key]), $options: "i" } } });
                    }
                }
            });
        }

        if (query.noCount == true) {
            if (sort) {
                args.query.push({ $sort: sort });
            }

            args.query.push({ $skip: skip });

            if (pageSize) {
                args.query.push({ $limit: pageSize });
            }

            JCloud.aggregate(args, (err, result) => {
                if (err) {
                    logger.error(err);
                }

                return callback(err, result);
            })
        }
        else {
            args.query.push({ $group: { _id: null, count: { $sum: 1 } } });

            JCloud.aggregate(args, (err, result) => {
                if (err) {
                    logger.error(err);
                    var response = { doc: [], total: 0, pages: 0 };
                    return callback(err, response);
                }

                if (!result || result.length == 0) {
                    var response = { doc: [], total: 0, pages: 0 };
                    return callback(err, response);
                }

                //Assign count.
                var count = result[0].count;
                if (count == 0) {
                    var response = { doc: [], total: count, pages: 0 };
                    return callback(err, response);
                }

                //Remove $group
                args.query.pop();
                if (sort) {
                    args.query.push({ $sort: sort });
                }

                args.query.push({ $skip: skip });

                if (pageSize) {
                    args.query.push({ $limit: pageSize });
                }

                JCloud.aggregate(args, (err, result) => {
                    if (err) {
                        logger.error(err);
                        var response = { doc: [], total: 0, pages: 0 };
                        return callback(err, response);
                    }

                    var response = { doc: result, total: count, pages: Math.ceil(count / pageSize) };

                    return callback(err, response);
                })
            });
        }
    },
    getActivityStat: (query, callback) => {
        var groupId = query.groupId;
        var fromDate = query.fromDate ? query.fromDate.substr(0, 10) : Util.now("YYYY-MM-DD");
        var toDate = query.toDate ? query.toDate.substr(0, 10) : Util.now("YYYY-MM-DD");

        var args = { schema: "Timesheet", query: [] };
        args.query.push({ $match: { groupId: groupId, d: { $gte: fromDate, $lte: toDate } } });

        args.query.push({
            $lookup: {
                from: "employee",
                pipeline: [
                    { $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } },
                    { $match: { groupId: groupId } },
                    { $match: { $expr: { $and: [{ $lte: [{ $ifNull: ["$startAt", fromDate] }, toDate] }, { $gt: [{ $ifNull: ["$endAt", toDate] }, fromDate] }] } } },
                    { $group: { _id: null, count: { $sum: 1 } } }
                ],
                as: "employee"
            }
        });
        args.query.push({ $unwind: "$employee" });

        args.query.push({
            $addFields: {
                all: "$employee.count"
            }
        })

        args.query.push({
            $group: {
                _id: "$d",
                all: { $first: "$all" },
                on: { $sum: { $cond: { if: { $gte: ["$lateIn", 0] }, then: 1, else: 0 } } },
                late: { $sum: { $cond: { if: { $gt: ["$lateIn", 0] }, then: 1, else: 0 } } }
            }
        });

        args.query.push({ $project: { _id: 0, d: "$_id", on: 1, off: { $subtract: ["$all", "$on"] }, late: { $cond: { if: { $eq: ["$on", 0] }, then: 0, else: { $multiply: [{ $divide: ["$late", "$on"] }, 100] } } } } });
        args.query.push({ $sort: { d: 1 } });

        JCloud.aggregate(args, (err, result) => {
            if (err) {
                logger.error(err);
            }

            return callback(err, result);
        })
    },
    getLOA: (query, callback) => {
        var groupId = query.groupId;
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

        var args = { schema: "Employee", query: [] };
        args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
        args.query.push({ $match: { groupId: groupId } });
        if (process.env.SERVER_MODE != "dev") args.query.push({ $match: { department: { $ne: "TEST" } } });
        
        if (query.listOwner && query.listOwner.length > 0) {
            args.query.push({ $match: { pId: { $in: query.listOwner } } });
        }

        var d = Util.now("YYYY-MM-DD");
        args.query.push({ $match: { $expr: { $and: [{ $gte: [d, { $ifNull: ["$startAt", d] }] }, { $gte: [{ $ifNull: ["$endAt", d] }, d] }] } } })

        var fromDate = query.fromDate ? query.fromDate.substr(0, 10) : Util.now("YYYY-MM-DD");
        var toDate = query.toDate ? query.toDate.substr(0, 10) : Util.now("YYYY-MM-DD");

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

        var remainMonth = 12 - parseInt(Util.now("MM"));
        args.query.push({ $project: { _id: 1, name: 1, no: 1, phone: 1, email: 1, gender: 1, position: 1, department: 1, oldLeaveDay: 1, newLeaveDay: 1, seniorityLeaveDay: 1, paidLeaveDay: 1, paidNewLeaveDay: 1, startAt: 1 } });
        args.query.push({ $addFields: { maxLeaveDay: { $add: [{ $ifNull: ["$newLeaveDay", 0] }, { $ifNull: ["$oldLeaveDay", 0] }, remainMonth] } } });
        args.query.push({ $addFields: { availableLeaveDay: { $add: ["$oldLeaveDay", "$newLeaveDay"] } } });

        args.query.push({
            $lookup: {
                from: "loa",
                let: { no: "$no", email: "$email" },
                pipeline: [
                    { $addFields: { no: "$$no", d: { $substr: ["$tuNgay", 0, 10] }, m: { $substr: ["$tuNgay", 0, 7] } } },
                    { $match: { $expr: { $and: [{ $or: [{ $eq: ["$maNhanVien", "$$no"] }, { $eq: ["$maNhanVien", "$$email"] }] }, { $gte: ["$d", fromDate] }, { $lte: ["$d", toDate] }] } } },
                    { $addFields: { workflowcode: { k: "$workflowCode", v: "$tongSoNgayNghi" } } },
                    { $addFields: { leave: { $concat: ["$workflowCode", ":", { $toString: "$tongSoNgayNghi" }, "d"] } } },
                    {
                        $group: {
                            _id: { no: "$no", m: "$m" },
                            k: { $first: "$m" },
                            sum: { $sum: "$tongSoNgayNghi" },
                            listId: { $addToSet: "$workflowCode" },
                            listArrId: { $addToSet: "$leave" },
                            listObjId: { $addToSet: "$workflowcode" }
                        }
                    },
                    { $addFields: { v: { sum: "$sum", listId: "$listId", listArrId: "$listArrId", listObjId: { $arrayToObject: "$listObjId" } } } },
                    { $project: { _id: 0, k: 1, v: 1 } }
                ],
                as: "loa"
            }
        });

        args.query.push({ $addFields: { loa: { $arrayToObject: "$loa" } } });

        if (query.noCount == true) {
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

                //Remove $group
                args.query.pop();

                if (sort) {
                    args.query.push({ $sort: { _id: -1 } })
                    args.query.push({ $sort: sort });
                }

                args.query.push({ $skip: skip });

                if (pageSize) {
                    args.query.push({ $limit: pageSize });
                }

                // logger.debug(JSON.stringify(args.query));
                JCloud.aggregate(args, (err, result) => {
                    if (err) {
                        logger.error(err);
                    }

                    var response = { doc: result, total: count, pages: Math.ceil(count / pageSize) };

                    return callback(err, response);
                })
            })
        }
    },
}
