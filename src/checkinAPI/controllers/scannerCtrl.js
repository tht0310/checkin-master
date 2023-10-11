var router = Express.Router();

router.get("/pages", (req, res, next) => {
  try {
    var query = req.query || {};
    var groupId = req.userSession.groupId;
    var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
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

    var args = { schema: "Scanner", query: [] }
    args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
    args.query.push({ $match: { $or: [{ groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] } });

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
        from: "location",
        let: { location_id: "$location" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$_id", "$$location_id"] }] } } },
          { $project: { _id: 1, name: 1, keyword: 1, fullname: 1 } },
        ],
        as: "location"
      }
    });

    args.query.push({ $unwind: { path: "$location", preserveNullAndEmptyArrays: true } });

    if (keys.length > 0) {
      keys.forEach((key) => {
        if (typeof search[key] != "object") {
          if (key == "group") {
            args.query.push({ $match: { $or: [{ "group.keyword": { $regex: Util.removeDMV(search[key]), $options: "i" } }, { "group._id": search[key] }] } });
          }
          else if (key == "location") {
            args.query.push({ $match: { $or: [{ "location.keyword": { $regex: Util.removeDMV(search[key]), $options: "i" } }, { "location._id": search[key] }] } });
          }
          else if (key == "serial") {
            args.query.push({ $match: { [key]: { $regex: search[key], $options: "i" } } });
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

    logger.debug(JSON.stringify(args.query));
    //Add $group to count.
    args.query.push({ $group: { _id: null, count: { $sum: 1 } } });

    Assistant.getPages(args, { skip, pageSize, sort }, (response) => {
      return res.json(response);
    })
  }
  catch (err) {
    logger.error(err);
    return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
  }
});

//Get list
router.get("/list/", (req, res, next) => {
  try {
    var groupId = req.userSession.groupId;
    var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;

    var args = { schema: "Scanner", query: { $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }, select: "name" }

    JCloud.find(args, (err, result) => {
      if (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
      }
      if (!result) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Scanner Not Found." });
      return res.json({ status: true, code: 200, message: "Success", result: { doc: result } });
    });
  }
  catch (err) {
    logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
  }
});

//Get
router.get("/:_id", (req, res, next) => {
  try {
    var groupId = req.userSession.groupId;
    var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
    var _id = req.params._id;
    var populate = { path: 'group location city category', select: 'name city' }

    var args = { schema: "Scanner", query: { _id: _id, $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }, populate: populate }

    JCloud.populateOne(args, (err, result) => {
      if (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
      }
      if (!result) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Scanner Not Found." });

      result = result[0] || result;
      result = JSON.parse(JSON.stringify(result));
      result.city = result.location.city || result.city;

      return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
    });
  } catch (err) {
    logger.error(err);
    return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
  }
});

//Add
router.post("/", (req, res, next) => {
  try {
    var groupId = req.userSession.groupId;
    var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
    var body = req.body || {};
    body.groupId = body.group = body.group || body.groupId || groupId;


    var args = { schema: "Group", query: { _id: body.group }, select: 'inherited -_id ap_limit' };
    if (body.group != groupId) {
      args = { schema: "Group", query: { _id: body.group, $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }, select: 'inherited -_id ap_limit' }
    }

    logger.debug(JSON.stringify(args.query));
    JCloud.findOne(args, (err, group) => {
      if (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
      }

      if (!group) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Group Not Found" });

      if (group.ap_limit) {
        var args = { schema: "Scanner", query: { group: body.group } }

        JCloud.count(args, (err, count) => {
          if (count < group.ap_limit) {
            var args = { schema: "Scanner", query: { serial: body.serial } }

            JCloud.findOne(args, (err, result) => {
             if (result) {
                return res.status(409).json({ status: false, code: 409, msgCode: "serial-exists", message: "SERIAL already exists" });
              }
              else {
                var doc = JSON.parse(JSON.stringify(body));
                doc.status = body.status || "Active";
                doc.keyword = Util.removeDMV(doc.name);
                doc.inherited = group.inherited;
                doc.createdAt = Util.now();
                doc.updatedAt = Util.now();
                doc.createdBy = req.userSession.username;
                doc.updatedBy = req.userSession.username;

                var args = { schema: "Scanner", update: doc };
                JCloud.save(args, (err, _id) => {
                  if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });

                  return res.json({ status: true, code: 200, message: "Success", result: _id });
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
        var args = { schema: "Scanner", query: { serial: body.serial } }

        JCloud.findOne(args, (err, result) => {
         if (result) {
                return res.status(409).json({ status: false, code: 409, msgCode: "serial-exists", message: "SERIAL already exists" });
          }
          else {
            var doc = JSON.parse(JSON.stringify(body));
            doc.status = body.status || "Active";
            doc.keyword = Util.removeDMV(doc.name);
            doc.inherited = group.inherited;
            doc.createdAt = Util.now();
            doc.updatedAt = Util.now();
            doc.createdBy = req.userSession.username;
            doc.updatedBy = req.userSession.username;

            var args = { schema: "Scanner", update: doc };
            JCloud.save(args, (err, _id) => {
              if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });

              return res.json({ status: true, code: 200, message: "Success", result: _id });
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

//Edit
router.put("/:_id", (req, res, next) => {
  try {
    var groupId = req.userSession.groupId;
    var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
    var _id = req.params._id;
    var body = req.body || {};
   body.group = body.groupId = body.group._id || body.group || groupId;

    var args = { schema: "Group", query: { _id: body.group }, select: 'inherited -_id' };
    if (body.group != groupId) {
      args = { schema: "Group", query: { _id: body.group, $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }, select: 'inherited -_id' }
    }

    JCloud.findOne(args, (err, group) => {
      if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
      if (!group) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Group Not Found.", result: err });


      var args = { schema: "Scanner", query: { serial: body.serial, _id: { $ne: _id } } }
      JCloud.findOne(args, (err, result) => {
        if (err) {
          logger.error(err);
          return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
        }

       if (result) {
                return res.status(409).json({ status: false, code: 409, msgCode: "serial-exists", message: "SERIAL already exists" });
        }
        else {
          var doc = JSON.parse(JSON.stringify(body));
          delete doc._id;
          doc.inherited = group.inherited;
          doc.keyword = Util.removeDMV(body.name);
          doc.inherited = group.inherited;
          doc.updatedAt = Util.now();
          doc.updatedBy = req.userSession.username;

          var args = { schema: "Scanner", query: { _id: _id, $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }, update: { $set: doc } };

          JCloud.findOneAndUpdate(args, (err, result) => {
            if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });

            if (!result) {
              return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: 'Scanner Not Found' });
            }

            return res.json({ status: true, code: 200, message: "Success" });
          })
        }
      })
    })
  } catch (err) {
    logger.error(err);
    return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
  }
});

//Remove
router.delete("/:_id", (req, res, next) => {
  try {
    var groupId = req.userSession.groupId;
    var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
    var _id = req.params._id;

    var args = { schema: 'Scanner', query: { _id: _id, $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] } };

    JCloud.findOneAndRemove(args, (err, result) => {
      if (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
      }
      if (!result) {
        return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Scanner Not Found" });
      }

      var result = JSON.parse(JSON.stringify(result));
      return res.json({ status: true, code: 200, message: "Success" });
    });
  } catch (err) {
    logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
  }
});

module.exports = router;