var router = Express.Router();
var Geo = require(__ + "/modules/Geo");

//Get a location
router.get("/latlong", (req, res, next) => {
    try {
        var query = req.query || {};
        Geo.getLatLong(query.address, (result) => {
            return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
        });
    } catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
});

//Get list location by pagination.
router.get("/pages", (req, res, next) => {
    try {
        var groupId = req.userSession.groupId;
        var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
        var query = req.query || {};
        var search = (query.search) ? JSON.parse(query.search) : {};
        if (search.name) {
            search.keyword = Util.removeDMV(search.name);
            delete search.name;
        }
        var keys = Object.keys(search);
        var page = parseInt(query.page || 1);
        var pageSize = parseInt(query.pageSize || 2147483647);
        var skip = (page - 1) * pageSize;
        var sort = ((query.sort) ? JSON.parse(query.sort) : { updatedAt: -1 });

        var args = { schema: "Location", query: [] }

        args.query.push({ $match: { $and: [{ $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }] } });

        if (req.userSession.username != "admin") {
            args.query.push({ $match: { _id: { $ne: "1" } } });
        }

        args.query.push({
            $lookup: {
                from: "group",
                let: { groupId: "$group" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$groupId"] }] } } },
                    { $project: { _id: 1, name: 1, keyword: 1 } },
                ],
                as: "group"
            }
        });
        args.query.push({ $unwind: "$group" });

        args.query.push({
            $lookup: {
                from: "accesspoint",
                let: { lId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$location", "$$lId"] }] } } },
                    { $group: { _id: null, sum: { $sum: 1 } } },
                ],
                as: "ap"
            }
        });

        args.query.push({ $unwind: { path: "$ap", "preserveNullAndEmptyArrays": true } });
        args.query.push({ $addFields: { n_ap: "$ap.sum" } });
        args.query.push({ $project: { ap: 0 } });

        args.query.push({
            $lookup: {
                from: "category",
                let: { category_id: "$category" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$category_id"] }] } } },
                    { $project: { _id: 1, name: 1, keyword: 1 } },
                ],
                as: "category"
            }
        });

        args.query.push({ $unwind: { path: "$category", "preserveNullAndEmptyArrays": true } });

        args.query.push({
            $lookup: {
                from: "city",
                let: { city_id: "$city" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$city_id"] }] } } },
                    { $project: { _id: 1, name: 1, keyword: 1 } },
                ],
                as: "city"
            }
        });

        args.query.push({ $unwind: { path: "$city", "preserveNullAndEmptyArrays": true } });

        if (keys) {
            keys.forEach((key) => {
                if (typeof search[key] != "object") {
                    if (key == "group") {
                        args.query.push({ $match: { $or: [{ "group.keyword": { $regex: Util.removeDMV(search[key]), $options: "i" } }, { "group._id": search[key] }] } });
                    }
                    else if (key == "city") {
                        args.query.push({ $match: { $or: [{ "city.keyword": { $regex: Util.removeDMV(search[key]), $options: "i" } }, { "city._id": search[key] }] } });
                    }
                    else if (key == "category") {
                        args.query.push({ $match: { $or: [{ "category.keyword": { $regex: Util.removeDMV(search[key]), $options: "i" } }, { "category._id": search[key] }] } });
                    }

                    else if (key == "status") {
                        args.query.push({ $match: { [key]: search[key] } });
                    }
                    else {
                        args.query.push({ $match: { [key]: { $regex: Util.removeDMV(search[key]), $options: "i" } } });
                    }
                }
            });
        }

        // logger.debug(JSON.stringify(args.query));

        args.query.push({ $group: { _id: null, count: { $sum: 1 } } });

        Assistant.getPages(args, { skip, pageSize, sort }, (response) => {
            return res.json(response);
        })
    } catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
});

//Get list location.
router.get("/l", (req, res, next) => {
    try {
        var groupId = req.userSession.groupId;
        var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
        var query = req.query || {};
        var search = (query.search) ? JSON.parse(query.search) : {};
        if (search.name) {
            search.keyword = Util.removeDMV(search.name);
            delete search.name;
        }
        var keys = Object.keys(search);
        var page = parseInt(query.page || 1);
        var pageSize = parseInt(query.pageSize || 2147483647);
        var skip = (page - 1) * pageSize;
        var sort = ((query.sort) ? JSON.parse(query.sort) : { updatedAt: -1 });

        var args = { schema: "Location", query: [] }
        args.query.push({ $match: { $and: [{ $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }] } });

        args.query.push({
            $lookup: {
                from: "category",
                let: { category_id: "$category" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$category_id"] }] } } },
                    { $project: { _id: 1, name: 1, keyword: 1 } },
                ],
                as: "category"
            }
        });

        args.query.push({ $unwind: "$category" });

        args.query.push({
            $lookup: {
                from: "city",
                let: { city_id: "$city" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$city_id"] }] } } },
                    { $project: { _id: 1, name: 1, keyword: 1 } },
                ],
                as: "city"
            }
        });

        args.query.push({ $unwind: { path: "$city", "preserveNullAndEmptyArrays": true } });

        args.query.push({
            $lookup: {
                from: "accesspoint",
                let: { lId: "$_id" },
                pipeline: [
                    { $match: { $and: [{ $expr: { $eq: ["$$lId", "$location",] } }] } },
                    { $project: { _id: "$_id", name: "$name" } }
                ],
                as: "ap"
            }
        });

        if (keys) {
            keys.forEach((key) => {
                if (typeof search[key] != "object") {
                    if (key == "group") {
                        args.query.push({ $match: { $or: [{ "group.keyword": { $regex: Util.removeDMV(search[key]), $options: "i" } }, { "group._id": search[key] }] } });
                    }
                    else if (key == "city") {
                        args.query.push({ $match: { $or: [{ "city.keyword": { $regex: Util.removeDMV(search[key]), $options: "i" } }, { "city._id": search[key] }] } });
                    }
                    else if (key == "category") {
                        args.query.push({ $match: { $or: [{ "category.keyword": { $regex: Util.removeDMV(search[key]), $options: "i" } }, { "category._id": search[key] }] } });
                    }
                    else if (key == "status") {
                        args.query.push({ $match: { [key]: search[key] } });
                    }
                    else {
                        args.query.push({ $match: { [key]: { $regex: Util.removeDMV(search[key]), $options: "i" } } });
                    }
                }
            })
        }

        args.query.push({ $group: { _id: null, count: { $sum: 1 } } });
        JCloud.aggregate(args, (err, result) => {
            if (err) {
                logger.error(err);
                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }
            if (!result || result.length <= 0) {
                var response = { doc: [], total: 0, pages: 0 };
                return res.json({ status: true, code: 200, message: "Success", result: response });
            }

            var count = result[0].count;
            if (count == 0) {
                var response = { doc: [], total: count, pages: 0 };
                return res.json({ status: true, code: 200, message: "Success", result: response });
            }

            args.query.pop();

            if (sort) {
                args.query.push({ $sort: sort });
            }

            args.query.push({ $addFields: { totalAp: { $size: "$ap" }, lng: "$long" } });
            args.query.push({ $unset: "ap" });

            args.query.push({ $skip: skip });

            if (pageSize) {
                args.query.push({ $limit: pageSize });
            }

            JCloud.aggregate(args, (err, result) => {
                if (err) {
                    logger.error(err);
                    return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                }

                var args = { schema: "Location", query: { _id: search.mId }, select: "_id name keyword" }
                JCloud.findOne(args, (err, location) => {
                    if (err) {
                        logger.error(err);
                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                    }

                    if (location) {
                        result.unshift(location);
                    }
                    var response = { doc: result, total: count, pages: Math.ceil(count / pageSize) };
                    return res.json({ status: true, code: 200, message: "Success", result: response });
                });
            });
        });
    } catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
});

//Get list location.
router.get("/list", (req, res, next) => {
    try {
        var groupId = req.userSession.groupId;
        var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
        var query = req.query || {};
        var search = (query.search) ? JSON.parse(query.search) : {};
        if (search.name) {
            search.keyword = Util.removeDMV(search.name);
            delete search.name;
        }
        var keys = Object.keys(search);
        var page = parseInt(query.page || 1);
        var pageSize = parseInt(query.pageSize || 2147483647);
        var skip = (page - 1) * pageSize;
        var sort = ((query.sort) ? JSON.parse(query.sort) : { updatedAt: -1 });
        if (search.name) search.keyword = Util.removeDMV(search.name);

        var args = { schema: "Location", query: [] }
        args.query.push({ $match: { $and: [{ $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }] } });

        if (keys) {
            keys.forEach((key) => {
                if (typeof search[key] != "object") {
                    if (key == "pId") {
                        args.query.push({ $match: { category: search[key] } });
                    }
                    else if (key != "mId") {
                        args.query.push({ $match: { [key]: { $regex: Util.removeDMV(search[key]), $options: "i" } } });
                    }
                }
            });
        }

        args.query.push({ $group: { _id: null, count: { $sum: 1 } } });
        JCloud.aggregate(args, (err, result) => {
            if (err) {
                logger.error(err);
                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }
            if (!result || result.length <= 0) {
                var response = { doc: [], total: 0, pages: 0 };
                return res.json({ status: true, code: 200, message: "Success", result: response });
            }

            var count = result[0].count;
            if (count == 0) {
                var response = { doc: [], total: count, pages: 0 };
                return res.json({ status: true, code: 200, message: "Success", result: response });
            }

            args.query.pop();

            if (sort) {
                args.query.push({ $sort: sort });
            }

            args.query.push({ $match: { _id: { $ne: search.mId } } });

            args.query.push({ $project: { _id: 1, name: 1, keyword: 1 } });

            args.query.push({ $skip: skip });

            if (pageSize) {
                if (search.mId && page == 1) {
                    args.query.push({ $limit: pageSize - 1 });
                }
                else {
                    args.query.push({ $limit: pageSize });
                }
            }

            JCloud.aggregate(args, (err, result) => {
                if (err) {
                    logger.error(err);
                    return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                }

                var args = { schema: "Location", query: { _id: search.mId }, select: "_id name keyword" }
                JCloud.findOne(args, (err, location) => {
                    if (err) {
                        logger.error(err);
                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                    }

                    if (location) {
                        result.unshift(location);
                    }
                    var response = { doc: result, total: count, pages: Math.ceil(count / pageSize) };
                    return res.json({ status: true, code: 200, message: "Success", result: response });
                });
            });
        });
    } catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
});

//Get a location
router.get("/:_id", (req, res, next) => {
    try {
        var groupId = req.userSession.groupId;
        var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
        var _id = req.params._id;
        var args = { schema: "Location", query: { _id: _id, $or: [{ "group": groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] } };

        JCloud.findOne(args, (err, result) => {
            if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            if (!result) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Location Not Found." });
            return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
        });
    } catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
});

//Add new location
router.post("/", (req, res, next) => {
    try {
        var groupId = req.userSession.groupId;
        var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
        var body = req.body || {};
        body.groupId = body.group = body.group || body.groupId || groupId;

        var args = { schema: "Group", query: { _id: body.group }, select: 'inherited -_id' };
        if (body.group != groupId) {
            args = { schema: "Group", query: { _id: body.group, $or: [{ group: groupId }, { groupId: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }, select: 'inherited -_id location_limit' }
        }

        JCloud.findOne(args, (err, group) => {
            if (err) {
                logger.error(err);
                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }

            if (!group) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Group Not Found" });

            if (group.location_limit) {
                var args = { schema: "Location", query: { group: body.group } }

                JCloud.count(args, (err, count) => {
                    if (count < group.location_limit) {
                        var args = { schema: "Location", query: { group: body.group, name: body.name } };

                        JCloud.findOne(args, (err, result) => {
                            if (err) {
                                logger.error(err);
                                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                            }

                            if (result) {
                                return res.status(409).json({ status: false, code: 409, msgCode: "name-exists", message: "Location already exists" });
                            }
                            else {
                                var doc = req.body || {}
                                doc._id = Util.randomId();
                                doc.createdBy = req.userSession.username;
                                doc.updatedBy = req.userSession.username;
                                doc.updatedAt = Util.now();
                                doc.createdAt = Util.now();
                                if (doc.name) {
                                    doc.keyword = Util.removeDMV(doc.name);
                                }
                                doc.inherited = group.inherited;
                                if (doc.lat && doc.long) {
                                    doc.location = { type: "Point", coordinates: [doc.long, doc.lat] };
                                }

                                var args = { schema: "Location", query: { _id: doc._id }, update: doc };

                                JCloud.findOneAndUpsert(args, (err, result) => {
                                    if (err) {
                                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                                    }

                                    return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
                                });
                            }
                        });
                    }
                    else {
                        return res.status(406).json({ status: false, code: 406, msgCode: "not-acceptable", message: "License Limited!" });
                    }
                })
            }
            else {
                var args = { schema: "Location", query: { group: body.group, name: body.name } };

                JCloud.findOne(args, (err, result) => {
                    if (err) {
                        logger.error(err);
                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                    }

                    if (result) {
                        return res.status(409).json({ status: false, code: 409, msgCode: "name-exists", message: "Location already exists" });
                    }
                    else {
                        var doc = req.body || {}
                        doc._id = Util.randomId();
                        doc.createdBy = req.userSession.username;
                        doc.updatedBy = req.userSession.username;
                        doc.updatedAt = Util.now();
                        doc.createdAt = Util.now();
                        if (doc.name) {
                            doc.keyword = Util.removeDMV(doc.name);
                        }
                        doc.inherited = group.inherited;
                        if (doc.lat && doc.long) {
                            doc.location = { type: "Point", coordinates: [doc.long, doc.lat] };
                        }

                        var args = { schema: "Location", query: { _id: doc._id }, update: doc };

                        JCloud.findOneAndUpsert(args, (err, result) => {
                            if (err) {
                                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                            }

                            return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
                        });
                    }
                });
            }
        });
    } catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
});

//switch status
router.put("/switch", (req, res, next) => {
    try {
        var groupId = req.userSession.groupId;
        var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
        var body = req.body || {};

        var doc = {}

        doc.status = body.status;
        if (doc.status != "Active" && doc.status != "Inactive") {
            doc.status = "Inactive";
        }

        doc.updatedAt = Util.now();
        doc.updatedBy = req.userSession.username;
        var ids = body.ids;

        var args = { schema: "Location", query: { _id: { $in: ids }, $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }, update: { $set: doc } };

        JCloud.findAndUpdate(args, (err, result) => {
            if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });

            return res.json({ status: true, code: 200, message: "Success" });
        })
    } catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
});

//Edit location
router.put("/:_id", (req, res, next) => {
    try {
        var groupId = req.userSession.groupId;
        var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
        var _id = req.params._id;
        var body = req.body || {};
        body.groupId = body.group = body.group || body.groupId || groupId;

        var args = { schema: "Group", query: { _id: body.group }, select: 'inherited -_id' };
        if (body.group != groupId) {
            args = { schema: "Group", query: { _id: body.group, $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }, select: 'inherited -_id' }
        }

        JCloud.findOne(args, (err, group) => {
            if (err) {
                logger.error(err);
                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }

            if (!group) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Group Not Found" });

            var args = { schema: "Location", query: { _id: { $ne: _id }, group: body.group, name: body.name } };

            JCloud.findOne(args, (err, result) => {
                if (err) {
                    logger.error(err);
                    return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                }

                if (result) {
                    return res.status(409).json({ status: false, code: 409, msgCode: "name-exists", message: "Location already exists" });
                }
                else {
                    var doc = JSON.parse(JSON.stringify(body));
                    doc.groupId = doc.group = body.groupId;
                    doc.lat = body.lat;
                    doc.long = body.long || body.lng;
                    doc.lng = body.long || body.lng;
                    doc.keyword = Util.removeDMV(doc.name);
                    doc.inherited = group.inherited;
                    doc.updatedBy = req.userSession.username;
                    doc.updatedAt = Util.now();
                    if (doc.lat && doc.long) {
                        doc.location = { type: "Point", coordinates: [doc.long, doc.lat] };
                    }

                    var args = { schema: "Location", query: { _id: _id }, update: { $set: doc } };
                    JCloud.findOneAndUpdate(args, (err, result) => {
                        if (err) {
                            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                        }

                        if (!result) {
                            return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: 'Location Not Found' });
                        }

                        //Move AccessPoint with Location
                        var args = { schema: "AccessPoint", query: { location: _id }, update: { $set: { group: body.group, inherited: group.inherited } } };
                        JCloud.findAndUpdate(args, (err, result) => {
                            if (err) {
                                logger.error(err);
                            }
                        })

                        return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
                    });
                }
            });
        });
    } catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
});

//Remove locaiton
router.delete("/:_id", (req, res, next) => {
    try {
        var groupId = req.userSession.groupId;
        var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
        var _id = req.params._id;

        var args = { schema: "AccessPoint", query: { location: _id } };

        JCloud.count(args, (err, num) => {
            if (num > 0) {
                return res.status(406).json({ status: false, code: 406, msgCode: "not-acceptable", message: "Location has dependent object" });
            }

            var args = { schema: "Location", query: { _id: _id, $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] } };
            JCloud.findOneAndRemove(args, (err, result) => {
                if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                if (!result) {
                    return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Location Not Found" });
                }

                return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
            });
        });
    } catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
});

module.exports = router;