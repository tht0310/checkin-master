
var router = Express.Router();

//Get list
router.get("/pages/", (req, res, next) => {
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
      var skip = (page - 1) * pageSize;
      var sort = ((query.sort) ? JSON.parse(query.sort) : { name: 1 });

      var args = { schema: "Policy", query: [] }
      args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
      args.query.push({ $match: { groupId: groupId } });
      args.query.push({ $addFields: { type: { $ifNull: ["$type", "v1"] } } });
      args.query.push({ $addFields: { pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] } } });
      args.query.push({ $addFields: { fixedShift: { $ifNull: ["$fixedShift", false] } } });
      args.query.push({ $addFields: { method: { $ifNull: ["$method", { wifi: { $ifNull: ["$wifi", false] }, bssid: { $ifNull: ["$bssid", false] }, qr: { $ifNull: ["$qr", false] }, qrAccess: { $ifNull: ["$qrAccess", false] }, gps: { $ifNull: ["$gps", false] }, hik: { $ifNull: ["$hik", false] }, faceId: { $ifNull: ["$faceId", false] } }] } } });
      args.query.push({ $addFields: { wifi: { $ifNull: ["$method.wifi", false] }, bssid: { $ifNull: ["$method.bssid", false] }, qr: { $ifNull: ["$method.qr", false] }, qrAccess: { $ifNull: ["$method.qrAccess", false] }, gps: { $ifNull: ["$method.gps", false] }, hik: { $ifNull: ["$method.hik", false] }, faceId: { $ifNull: ["$method.faceId", false] } } });

      if (req.userSession.role == "Employee") {
         args.query.push({ $match: { $expr: { $in: [req.userSession._id, { $ifNull: ["$owner", []] }] } } });
      }

      if (keys.length > 0) {
         keys.forEach((key) => {
            if (typeof search[key] != "object") {
               if (key == "status") {
                  args.query.push({ $match: { "status": search[key] } });
               }
               else {
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

         //Assign count.
         var count = result[0].count;
         if (count == 0) {
            var response = { doc: [], total: count, pages: 0 };
            return res.json({ status: true, code: 200, message: "Success", result: response });
         }

         if (!result || result.length <= 0) {
            var response = { doc: [], total: 0, pages: 0 };
            return res.json({ status: true, code: 200, message: "Success", result: response });
         }

         //Assign count.
         var count = result[0].count;
         if (count == 0) {
            var response = { doc: [], total: count, pages: 0 };
            return res.json({ status: true, code: 200, message: "Success", result: response });
         }

         //Remove $group
         args.query.pop();

         args.query.push({
            $lookup: {
               from: "employee",
               let: { pId: "$_id" },
               pipeline: [
                  { $match: { $expr: { $and: [{ $eq: ["$pId", "$$pId"] }] } } },
                  { $group: { _id: null, count: { $sum: 1 } } }
               ], as: "employee"
            }
         });


         args.query.push({ $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } });
         args.query.push({ $addFields: { n_employee: { $ifNull: ["$employee.count", 0] } } });

         args.query.push({ $project: { name: 1, n_employee: 1, fixedShift: 1, updatedAt: 1, updatedBy: 1, default: 1, status: 1, type: 1, pType: 1 } });

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
               return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }

            var response = { doc: result, total: count, pages: Math.ceil(count / pageSize) };
            return res.json({ status: true, code: 200, message: "Success", result: response });
         });
      });
   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Get list
router.get("/list/", (req, res, next) => {
   try {
      var query = req.query || {};
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;

      var args = { schema: "Policy", query: [] }
      args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
      args.query.push({ $match: { groupId: groupId, status: "Active" } });
      args.query.push({ $sort: { default: 1 } });
      args.query.push({ $project: { _id: 1, name: 1, default: 1 } });

      JCloud.aggregate(args, (err, result) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }

         return res.json({ status: true, code: 200, message: "Success", result: { doc: result } });
      });
   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Get
router.get("/getAccessLevel", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var _id = req.params._id;

      var query = req.query || {};
      if (query.groupId) groupId = query.groupId;

      var args = { schema: "HIKCentral", query: [] }
      args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
      args.query.push({ $match: { $or: [{ groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] } });
      args.query.push({ $project: { _id: 1, name: 1, appKey: 1, appSecret: 1, baseUrl: 1 } });

      JCloud.aggregate(args, (err, result) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }

         if (!result || result.length == 0) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "HIK Not Found." });

         HIK.getAccessLevelList({ hikcentral: result }, (err, data) => {
            if (err) {
               logger.error(err);
               return res.status(503).json({ status: false, code: 503, msgCode: err.msgCode || "unknown", message: err.message || "An Unexpected Error Occurred" })
            }

            if (data) {
               if (data.code == 200) {
                  return res.json({ status: true, code: 200, message: "Success", result: data.result });
               }
               else {
                  return res.status(data.code).json({ status: false, msgCode: data.msgCode, message: data.message });
               }
            }
            else {
               return res.status(503).json({ status: false, code: 503, msgCode: "error", message: "An Unexpected Error Occurred" });
            }
         });
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

      var args = { schema: "Policy", query: { _id: { $in: ids }, "default": false, $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }, update: { $set: doc } };

      JCloud.findAndUpdate(args, (err, result) => {
         if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });

         return res.json({ status: true, code: 200, message: "Success" });
      })
   } catch (err) {
      logger.error(err);
      return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

router.put("/setdefault/:_id", (req, res, next) => {
   try {
      var body = req.body || {};
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var _id = req.params._id;

      var args = { schema: "Policy", query: { _id: { $ne: _id }, $or: [{ group: groupId }, { groupId: groupId }] }, update: { $set: { default: false } } }
      logger.debug(JSON.stringify(args.query));
      JCloud.findAndUpdate(args, (err, result) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }

         if (!result) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Policy Not Found." });

         var args = { schema: "Policy", query: { _id: _id, $or: [{ group: groupId }, { groupId: groupId }] }, update: { $set: { default: true, status: "Active" } } }
         JCloud.findAndUpdate(args, (err, result) => {
            if (err) {
               logger.error(err);
               return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }

            return res.json({ status: true, code: 200, message: "Success" });
         });
      });
   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
})

//Get one
router.get("/positions", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? 0 : groupId;

      var args = { schema: "Group", query: [] }

      args.query.push({ $match: { _id: groupId } })

      args.query.push({ $project: { _id: 0, positions: 1 } });

      JCloud.aggregateOne(args, (err, result) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }

         return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result.positions || [] });
      });
   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
})

//Get one
router.get("/departments", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? 0 : groupId;

      var args = { schema: "Department", query: [] }
      args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
      args.query.push({ $match: { $or: [{ groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] } });
      args.query.push({ $group: { _id: null, departments: { $push: "$name" } } });

      JCloud.aggregateOne(args, (err, result) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }

         return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result.departments || [] });
      });
   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
})

//Get one
router.get("/:_id", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var _id = req.params._id;

      var args = { schema: "Policy", query: [] };
      args.query.push({ $match: { _id: _id, $expr: { $or: [{ group: groupId }, { groupId: groupId }] } } });
      args.query.push({ $addFields: { type: { $ifNull: ["$type", "v1"] } } });
      args.query.push({ $addFields: { pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] } } });
      args.query.push({ $addFields: { loaAllow: { $ifNull: ["$loaAllow", false] } } });

      args.query.push({ $addFields: { method: { $ifNull: ["$method", { wifi: { $ifNull: ["$wifi", false] }, bssid: { $ifNull: ["$bssid", false] }, qr: { $ifNull: ["$qr", false] }, qrAccess: { $ifNull: ["$qrAccess", false] }, gps: { $ifNull: ["$gps", false] }, gpsselfie: { $ifNull: ["$gpsselfie", false] }, hik: { $ifNull: ["$hik", false] }, faceId: { $ifNull: ["$faceId", false] } }] } } });
      args.query.push({ $addFields: { wifi: { $ifNull: ["$method.wifi", false] }, bssid: { $ifNull: ["$method.bssid", false] }, qr: { $ifNull: ["$method.qr", false] }, qrAccess: { $ifNull: ["$method.qrAccess", false] }, gps: { $ifNull: ["$method.gps", false] }, hik: { $ifNull: ["$method.hik", false] }, faceId: { $ifNull: ["$method.faceId", false] } } });

      args.query.push({
         $lookup: {
            from: "policy",
            let: { pId: "$_id" },
            pipeline: [
               { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
               { $addFields: { pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] } } },
               { $match: { pType: "Shift" } },
               { $unwind: { path: "$week.Mon", preserveNullAndEmptyArrays: true } },
               { $lookup: { from: "shift", let: { sId: "$week.Mon.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { sId: "$_id" } }, { $addFields: { k: "$$sId", v: "$$ROOT" } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
               { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
               { $group: { _id: "$_id", week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, "arr": { $addToSet: "$dow.v" } } },
               { $addFields: { "weekArr.Mon": { $cond: { if: { $eq: ["$arr", []] }, then: null, else: "$arr" } } } },


               { $unwind: { path: "$week.Tue", preserveNullAndEmptyArrays: true } },
               { $lookup: { from: "shift", let: { sId: "$week.Tue.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { sId: "$_id" } }, { $addFields: { k: "$$sId", v: "$$ROOT" } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
               { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
               { $group: { _id: "$_id", week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, "arr": { $addToSet: "$dow.v" } } },
               { $addFields: { "weekArr.Tue": { $cond: { if: { $eq: ["$arr", []] }, then: null, else: "$arr" } } } },

               { $unwind: { path: "$week.Wed", preserveNullAndEmptyArrays: true } },
               { $lookup: { from: "shift", let: { sId: "$week.Wed.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { sId: "$_id" } }, { $addFields: { k: "$$sId", v: "$$ROOT" } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
               { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
               { $group: { _id: "$_id", week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, "arr": { $addToSet: "$dow.v" } } },
               { $addFields: { "weekArr.Wed": { $cond: { if: { $eq: ["$arr", []] }, then: null, else: "$arr" } } } },

               { $unwind: { path: "$week.Thu", preserveNullAndEmptyArrays: true } },
               { $lookup: { from: "shift", let: { sId: "$week.Thu.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { sId: "$_id" } }, { $addFields: { k: "$$sId", v: "$$ROOT" } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
               { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
               { $group: { _id: "$_id", week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, "arr": { $addToSet: "$dow.v" } } },
               { $addFields: { "weekArr.Thu": { $cond: { if: { $eq: ["$arr", []] }, then: null, else: "$arr" } } } },

               { $unwind: { path: "$week.Fri", preserveNullAndEmptyArrays: true } },
               { $lookup: { from: "shift", let: { sId: "$week.Fri.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { sId: "$_id" } }, { $addFields: { k: "$$sId", v: "$$ROOT" } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
               { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
               { $group: { _id: "$_id", week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, "arr": { $addToSet: "$dow.v" } } },
               { $addFields: { "weekArr.Fri": { $cond: { if: { $eq: ["$arr", []] }, then: null, else: "$arr" } } } },

               { $unwind: { path: "$week.Sat", preserveNullAndEmptyArrays: true } },
               { $lookup: { from: "shift", let: { sId: "$week.Sat.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { sId: "$_id" } }, { $addFields: { k: "$$sId", v: "$$ROOT" } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
               { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
               { $group: { _id: "$_id", week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, "arr": { $addToSet: "$dow.v" } } },
               { $addFields: { "weekArr.Sat": { $cond: { if: { $eq: ["$arr", []] }, then: null, else: "$arr" } } } },

               { $unwind: { path: "$week.Sun", preserveNullAndEmptyArrays: true } },
               { $lookup: { from: "shift", let: { sId: "$week.Sun.sId" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$sId"] } } }, { $addFields: { sId: "$_id" } }, { $addFields: { k: "$$sId", v: "$$ROOT" } }, { $project: { _id: 0, k: 1, v: 1 } }], as: "dow" } },
               { $unwind: { path: "$dow", preserveNullAndEmptyArrays: true } },
               { $group: { _id: "$_id", week: { $first: "$week" }, weekArr: { $first: "$weekArr" }, "arr": { $addToSet: "$dow.v" } } },
               { $addFields: { "weekArr.Sun": { $cond: { if: { $eq: ["$arr", []] }, then: null, else: "$arr" } } } },

               { $replaceRoot: { newRoot: "$weekArr" } }
            ],
            as: "week"
         }
      })

      args.query.push({ $unwind: { path: "$week", preserveNullAndEmptyArrays: true } });

      JCloud.aggregateOne(args, (err, result) => {
         if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });

         return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
      });
   }
   catch (err) {
      logger.error(err);
      return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
})

//Add new
router.post("/", (req, res, next) => {
   try {
      var body = req.body || {};
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;

      if (body.name) {
         var args = { schema: "Group", query: { _id: groupId } };

         JCloud.findOne(args, (err, group) => {
            if (err) {
               logger.error(err);
               return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }

            var doc = body;
            doc.name = doc.name || "Untitled";
            doc.group = doc.groupId = groupId;
            doc.status = "Active";
            doc.createdBy = req.userSession.username;
            doc.keyword = Util.removeDMV(doc.name);
            doc.updatedBy = req.userSession.username;
            doc.updatedAt = Util.now();
            doc.createdAt = Util.now();
            doc.inherited = group.inherited;
            doc.radius = body.radius || 500;
            doc.default = false;
            doc.signD = body.signD || null;
            doc.signH = body.signH || null;
            doc.signO = body.signO || null;
            if (body.full) doc.full = Number(body.full);
            if (body.half) doc.full = Number(body.half);

            if (doc.pType == "Shift") {
               doc.type == "Fixed"
            }

            if (doc.type == "Fixed") {
               doc.pType = "Shift";
            }
            else {
               doc.pType = "Office"
            }


            doc.method = (typeof doc.method == "object") ? doc.method : { wifi: doc.wifi || false, bssid: doc.bssid || false, qr: doc.qr || false, qrAccess: doc.qrAccess || false, gps: doc.gps || false, hik: doc.hik || false, faceId: doc.faceId || false };

            if (doc.method.hik == false) {
               doc.mapAccessLevel = []
            }

            var args = { schema: "Policy", query: { _id: Util.randomId(), $or: [{ group: groupId }, { groupId: groupId }] }, update: doc };

            JCloud.findOneAndUpsert(args, (err, result) => {
               if (err) {
                  logger.error(err);
                  return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
               }
               return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
            });
         });
      }
      else {
         return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid name." });
      }
   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
})

//Edit
router.put("/:_id", (req, res, next) => {
   try {
      var body = req.body || {};
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var _id = req.params._id;

      if (body.name) {
         var args = { schema: "Group", query: { _id: groupId } };

         JCloud.findOne(args, (err, group) => {
            if (err) {
               logger.error(err);
               return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }
            var doc = body;
            doc.group = doc.groupId = groupId;
            if (doc.name) {
               doc.keyword = Util.removeDMV(doc.name);
            }
            doc.updatedBy = req.userSession.username;
            doc.updatedAt = Util.now();
            doc.inherited = group.inherited;
            doc.signD = body.signD || null;
            doc.signH = body.signH || null;
            doc.signO = body.signO || null;
            if (body.full) doc.full = Number(body.full);
            if (body.half) doc.full = Number(body.half);

            doc.method = (typeof doc.method == "object") ? doc.method : { wifi: doc.wifi || false, bssid: doc.bssid || false, qr: doc.qr || false, qrAccess: doc.qrAccess || false, gps: doc.gps || false, hik: doc.hik || false, faceId: doc.faceId || false };

            if (doc.method.hik == false) {
               doc.mapAccessLevel = []
            }

            delete doc.type;
            delete doc.pType;
            delete doc.shiftType;

            HIK.getRemovedMapAccessLevel(_id, doc.mapAccessLevel, (err, removed) => {
               if (err) {
                  logger.error(err);
               }

               var query = { _id: _id, $or: [{ group: groupId }, { groupId: groupId }] }

               if (doc.status == "Inactive") {
                  query = { _id: _id, default: false, $or: [{ group: groupId }, { groupId: groupId }] }
               }

               var args = { schema: "Policy", query: query, update: { $set: doc } }
               JCloud.findOneAndUpdate(args, (err, result) => {
                  if (err) {
                     logger.error(err);
                     return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                  }

                  if (!result) {
                     if (doc.status == "Inactive") {
                        return res.status(404).json({ status: false, code: 400, msgCode: "bad-request", message: "Policy Default Can Not Inactive" });
                     }
                     return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Policy Not Found." });
                  }

                  HIK.unlinkPersonList({ groupId, sId: _id, removed, mapAccessLevel: doc.mapAccessLevel }, function (err, result) {
                     if (doc.mapAccessLevel.length > 0) {
                        HIK.addPersonList(_id);
                     }
                  });

                  return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
               });
            });
         })
      }
      else {
         return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid name." });
      }
   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
})

//Remove
router.delete("/:_id", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var _id = req.params._id;
      var args = { schema: "Employee", query: { pId: _id } };

      JCloud.count(args, (err, num) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }

         if (num != 0) {
            return res.status(406).json({ status: false, code: 406, msgCode: "not-accept", message: "Has dependent object." });
         }

         var args = { schema: "Policy", query: { _id: _id, $or: [{ group: groupId }, { groupId: groupId }], default: false } };

         JCloud.findOneAndRemove(args, (err, result) => {
            if (err) {
               logger.error(err);
               return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }
            if (!result) {
               return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Policy Not Found" });
            }
            return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
         });
      });
   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
})

//Add new group
router.post("/resetQR", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var body = req.body || {};

      var qrcode = Util.randomId();
      var args = { schema: "Group", query: { _id: groupId }, update: { $set: { qrcode: qrcode } } }

      JCloud.findOneAndUpdate(args, (err, result) => {
         if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         if (!result) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Group Not Found" });

         return res.json({ status: true, code: 200, message: "Success", result: qrcode });
      });
   } catch (err) {
      logger.error(err);
      return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

module.exports = router;
