//Module manage employee in checkin wifi.
var router = Express.Router();

var multer = require('multer')({
   dest: '/tmp/',
   limits: {
      fileSize: 300000 //300kb
   }
}).any();

var fs = require('fs');
var shell = require('shelljs');

//v1.1
//Get debug account
router.get("/", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var _id = req.userSession._id;
      var remainMonth = 12 - parseInt(Util.now("MM"));

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
            // webhook: { $ifNull: ["$webhook", { PD: {}, OT: {} }] }, //profile hide webhook
         }
      });

      JCloud.aggregateOne(args, (err, group) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }

         var args = { schema: "User", query: [] }
         args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
         args.query.push({ $project: { pw: 0, salt: 0, password: 0 } });
         args.query.push({ $match: { _id: _id } });

         args.query.push({
            $lookup: {
               from: "policy",
               let: { groupId: "$groupId" }, //get policy default
               pipeline: [
                  { $match: { $and: [{ $or: [{ groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }] } },
                  { $match: { $expr: { $and: [{ $eq: ["$default", true] }] } } },
                  { $project: { method: 1, holidays: 1, } }
               ],
               as: "policy"
            }
         });
         args.query.push({ $unwind: { path: "$policy", preserveNullAndEmptyArrays: true } });

         args.query.push({
            $lookup: {
               from: "group", let: { groupId: "$groupId" },
               pipeline: [
                  { $match: { $expr: { $and: [{ $eq: ["$_id", "$$groupId"] }] } } },
                  { $project: { _id: 1, name: 1, keyword: 1, type: 1, positions: 1, holidays: 1, pcDate: 1, resetDate: 1 } }
               ],
               as: "group"
            }
         });

         args.query.push({ $unwind: "$group" });

         if (process.env.SERVER_MODE != "dev") {
            args.query.push({ $addFields: { setting: "$policy" } });
         }

         JCloud.aggregateOne(args, (err, user) => {
            if (err) {
               logger.error(err);
               return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }

            if (!user) {//If user not found.
               var args = { schema: "Employee", query: [] }
               args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });

               args.query.push({ $project: { pw: 0, salt: 0, password: 0, initPassword: 0, resetPassword: 0 } });
               args.query.push({ $match: { _id: _id } });

               var d = Util.now("YYYY-MM-DD");
               args.query.push({ $match: { $expr: { $and: [{ $gte: [d, { $ifNull: ["$startAt", d] }] }, { $gte: [{ $ifNull: ["$endAt", d] }, d] }] } } });

               args.query.push({ $addFields: { departmentName: "$department" } });

               args.query.push({
                  $lookup: {
                     from: "department",
                     let: { departmentName: "$departmentName", groupId: "$groupId" },
                     pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$name", "$$departmentName"] }, { $eq: ["$groupId", "$$groupId"] }] } } },
                        { $project: { _id: 1, name: 1 } },
                     ],
                     as: "department"
                  }
               });

               args.query.push({ $unwind: "$department" });
               args.query.push({ $addFields: { departmentId: { $ifNull: ["$departmentId", "$department._id"] } } });
               args.query.push({ $addFields: { department: { $ifNull: ["$department.name", "$departmentName"] } } });

               args.query.push({
                  $addFields: {
                     portrait: { $cond: { if: { $eq: [{ $ifNull: ["$portrait2Status", "approved"] }, "approved"] }, then: "$portrait", else: "$portrait2" } },
                     portraitType: { $cond: { if: { $eq: [{ $ifNull: ["$portrait2Status", "approved"] }, "approved"] }, then: "$portraitType", else: "$portrait2Type" } },
                     portraitDate: { $ifNull: ["$portrait2Date", "$updatedAt"] },
                     portraitStatus: { $ifNull: ["$portrait2Status", "$portraitStatus"] },
                  }
               });
               args.query.push({ $project: { portrait2: 0, portrait2Type: 0 } });

               args.query.push({
                  $lookup: {
                     from: "group", let: { groupId: "$groupId" },
                     pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$groupId"] }] } } },
                        { $project: { _id: 1, name: 1, keyword: 1, type: 1 } }
                     ], as: "group"
                  }
               });

               args.query.push({
                  $lookup: {
                     from: "policy",
                     let: { pId: "$pId" },
                     pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
                        { $addFields: { method: { $ifNull: ["$method", { wifi: { $ifNull: ["$wifi", false] }, bssid: { $ifNull: ["$bssid", false] }, qr: { $ifNull: ["$qr", false] }, qrAccess: { $ifNull: ["$qrAccess", false] }, gps: { $ifNull: ["$gps", false] }, gpsselfie: { $ifNull: ["$gpsselfie", false] }, gpsselfie: { $ifNull: ["$gpsselfie", false] }, hik: { $ifNull: ["$hik", false] }, faceId: { $ifNull: ["$faceId", false] } }] } } },
                        { $addFields: { wifi: { $ifNull: ["$method.wifi", false] }, bssid: { $ifNull: ["$method.bssid", false] }, qr: { $ifNull: ["$method.qr", false] }, qrAccess: { $ifNull: ["$method.qrAccess", false] }, gps: { $ifNull: ["$method.gps", false] }, hik: { $ifNull: ["$method.hik", false] }, faceId: { $ifNull: ["$method.faceId", false] } } },
                        { $addFields: { type: { $ifNull: ["$type", "v1"] }, } },
                        // { $project: { _id: 0, office: 1, radius: 1, loaAllow: 1, bssid: 1, wifi: 1, gps: 1, qr: 1, faceId: 1, qrAccess: 1, type: 1, method: 1, owner: 1 } }],
                        { $project: { _id: 0, office: 1, radius: 1, loaAllow: 1, bssid: 1, wifi: 1, gps: 1, qr: 1, faceId: 1, qrAccess: 1, type: 1, method: 1, owner: 1 } }],
                     as: "policy"
                  }
               });

               args.query.push({ $unwind: { path: "$policy", preserveNullAndEmptyArrays: true } });

               // if (process.env.SERVER_MODE != "dev") { 
               args.query.push({ $addFields: { setting: "$policy" } });
               // }

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

               args.query.push({ $unwind: "$group" });


               //check owner policy
               args.query.push({
                  $lookup: {
                     from: "policy",
                     let: { eId: "$_id" },
                     pipeline: [
                        { $match: { $expr: { $in: ["$$eId", { $ifNull: ["$owner", []] }] } } },
                        { $group: { _id: null, count: { $sum: 1 } } },
                     ],
                     as: "owner"
                  }
               })

               args.query.push({ $addFields: { maxLeaveDay: { $add: [{ $ifNull: ["$newLeaveDay", 0] }, { $ifNull: ["$oldLeaveDay", 0] }, remainMonth] } } });
               args.query.push({ $addFields: { availableLeaveDay: { $add: ["$oldLeaveDay", "$newLeaveDay"] } } });

               args.query.push({
                  $lookup: {
                     from: "location",
                     let: { lId: "$lId" },
                     pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$lId"] }] } } },
                        { $project: { _id: 1, name: 1, keyword: 1, fullname: 1, lastname: 1, lat: 1, long: 1 } }
                     ],
                     as: "location"
                  }
               });

               args.query.push({ $unwind: { path: "$location", preserveNullAndEmptyArrays: true } });

               // logger.debug(JSON.stringify(args.query))

               JCloud.aggregateOne(args, (err, employee) => {
                  if (err) {
                     logger.error(err);
                     return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                  }

                  if (!employee) {//If employee not found.
                     return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Employee Not Found" });
                  }

                  var result = JSON.parse(JSON.stringify(employee))
                  result.group = group;

                  logger.debug(JSON.stringify(result))
                  if (CONF.ROLE[result.role] && CONF.ROLE[result.role].length > 0) {

                     if (result.owner && result.owner.count > 0) {
                        result.permission = JSON.parse(JSON.stringify(CONF.ROLE["Owner"]));
                        logger.debug("Owner", JSON.stringify(result.permission))
                     }
                     else {
                        result.permission = JSON.parse(JSON.stringify(CONF.ROLE["Employee"]));
                        logger.debug(result.role, JSON.stringify(result.permission))
                     }

                     return res.json({ status: true, code: 200, message: "Success.", result: result });
                  }
                  else {
                     return res.status(406).json({ status: false, code: 406, msgCode: "not-accept", message: "User did not grant permission.", result: {} });
                  }
               })
            }
            else {
               user.group = group;
               if (CONF.ROLE[user.role] && CONF.ROLE[user.role].length > 0) {
                  user.permission = JSON.parse(JSON.stringify(CONF.ROLE[user.role]));
                  return res.json({ status: true, code: 200, message: "Login success.", result: user });
               }
               else {
                  return res.status(406).json({ status: false, code: 406, msgCode: "not-accept", message: "User did not grant permission.", result: {} });
               }
            }
         })
      })
   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Comment
router.put("/timesheet/comment", (req, res, next) => {
   try {
      var body = req.body || {};
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;

      var eId = req.userSession._id;

      const classData = Util.classify({
         d: { type: String, required: true },
      }, body);

      if (Object.keys(classData.bad).length) {
         return res.status(400).json({ status: false, code: 400, msgCode: "bad-query", message: "Bad Query!" });
      }

      let query = { eId: eId, d: body.d };
      let newData = {};

      if (body.note || body.note == "") newData.note = body.note;
      if (body.late_comnent || body.late_comnent == "") newData.note = newData.late_conment = body.late_conment;

      if (Object.keys(newData).length > 0) {
         let update = { $set: newData }

         let schema = "Timesheet";
         JCloud.findOneAndUpdate({ schema: schema, query: query, update: update, isNew: true }, (err, result) => {
            if (err) {
               logger.error(err);
               return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }

            if (body.note || body.note == "") {
               var args = { schema: "Employee", query: { _id: eId }, select: "email" };

               JCloud.findOne(args, (err, employee) => {
                  if (err) {
                     logger.error(err);
                  }

                  if (employee) {
                     Log.sendNote({ userId: employee.email, note: body.note, d: body.d })
                  }
               })
            }

            return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
         })
      }
      else {
         return res.json({ status: true, code: 200, message: "Success" });
      }
   }
   catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Edit account
router.put("/", (req, res, next) => {
   multer(req, res, function (err) {
      if (err) {
         logger.error(err);
         return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
      }
      try {
         var groupId = req.userSession.groupId;
         var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
         var _id = req.userSession._id;

         var args = { schema: "Employee", query: { _id: _id, $or: [{ group: groupId }, { groupId: groupId }] } };
         JCloud.findOne(args, (err, user) => {
            if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            if (!user) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Account Not Found" });

            var body = req.body || {};
            body.groupId = body.group = body.group || body.groupId || groupId;
            logger.debug(JSON.stringify(body));

            var doc = {};
            if (typeof body.nickname == "string") doc.nickname = body.nickname;
            if (typeof body.birthday == "string") doc.birthday = body.birthday;

            var eId = user._id;

            var files = req.files;

            if (files) {
               var fullPath = PATH.join(CONF.MISC + groupId + "/");
               var fullPath_remote = PATH.join(CONF.MISC_REMOTE + groupId + "/");

               for (i = 0; i < files.length; i++) {
                  var file = files[i];

                  if (file && file.mimetype.indexOf("image") != -1) {
                     let stats = fs.statSync(file.path);
                     let fileSize = stats.size;

                     // if (fileSize > 300000) {
                     //    return res.status(503).json({ status: false, code: 503, msgCode: "error", message: "File too large" });
                     // }

                     var source = file.path;//Get file temp uploaded                
                     var fieldname = file.fieldname;//Get filename

                     if (fieldname == "avatar") {
                        fullPath = PATH.join(CONF.AVATAR + groupId + "/");
                        fullPath_remote = PATH.join(CONF.AVATAR_REMOTE + groupId + "/");
                     }
                     else if (fieldname == "portrait") {
                        fieldname = "portrait2";
                        fullPath = PATH.join(CONF.PORTRAIT2 + groupId + "/");
                        fullPath_remote = PATH.join(CONF.PORTRAIT2_REMOTE + groupId + "/");
                        doc.portrait2Status = "pending";
                        doc.portrait2Date = Util.now();

                        var body = { _id: user._id, groupId: groupId, message: user.name + " vừa cập nhật hình Facecheck!", title: "BecaCheckin" };
                        var url = CONF.HIK_API.url + "/api/socket/push-noti/hik";
                        var option = { headers: { 'content-type': 'application/json', "authorization": "Bearer " + CONF.HIK_API.token }, url: url, body: JSON.stringify(body) }

                        setTimeout(function () {
                           logger.debug("POST ", url);
                           logger.debug("content-type: application/json");
                           logger.debug("token", CONF.HIK_API.token);

                           logger.debug(JSON.stringify(body));

                           request.post(option, function (err, response, data) {
                              if (err) {
                                 logger.error(err);
                              }
                              logger.debug(JSON.stringify(data))
                           });
                        }, 10000)
                     }

                     var destination = fullPath + eId;// Declare File Path Storage
                     var destination_remote = fullPath_remote + eId;// Declare File Path Storage
                     var shortPath = "/public/" + fieldname + "/" + groupId + "/";
                     doc[fieldname] = shortPath + eId + "." + file.mimetype.split("/")[1] + "?H=" + process.env.HOSTID + "&" + moment().unix();
                     doc[fieldname + "Type"] = file.mimetype;
                     doc[fieldname + "Size"] = fileSize;

                     logger.debug(source, destination);

                     shell.mkdir('-p', fullPath);
                     fs.copyFile(source, destination, (err) => {
                        if (err) {
                           logger.error(err);
                           return res.json({ status: true, code: 200, message: "Failed", })
                        }
                     })

                     if (process.env.SERVER_MODE != "primary") {
                        shell.mkdir('-p', fullPath_remote);
                        fs.copyFile(source, destination_remote, (err) => {
                           if (err) {
                              logger.error(err);
                              return res.json({ status: true, code: 200, message: "Failed", })
                           }
                        })
                     }
                  }
               }
            }

            if (doc) {
               logger.debug(JSON.stringify(doc));
               doc.updatedBy = req.userSession.username;
               doc.updatedAt = Util.now();
               let update = { $set: doc }

               if (body.fcmToken) {
                  update = { $push: { fcmToken: { $each: [body.fcmToken], $position: 0, $slice: 1 } } }
                  var args = { schema: "Employee", query: { _id: _id, $or: [{ group: groupId }, { groupId: groupId }], fcmToken: { $ne: body.fcmToken } }, update: update }
                  JCloud.findOneAndUpdate(args, (err, result) => {
                     if (err) {
                        logger.error(err);
                     }
                  })
               }

               var args = { schema: "Employee", query: { _id: _id, $or: [{ group: groupId }, { groupId: groupId }] }, update: { $set: doc }, select: "portrait2 portrait2Type portraitStatus portrait2Status portraitDate portrait2Date avatar nickname fcmToken" };
               JCloud.findOneAndUpdate(args, (err, result) => {
                  if (err) {
                     logger.error(err);
                     return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                  }

                  if (!result) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Account Not Found" });

                  result = JSON.parse(JSON.stringify(result));
                  result = { portraitStatus: result.portrait2sStatus, portrait: result.portrait2, portraitType: result.portrait2Type, portraitSize: result.portrait2Size, portraitDate: result.portrait2Date || result.portraitDate, avatar: result.avatar, nickname: result.nickname };

                  return res.json({ status: true, code: 200, message: "Success", result: result });
               });
            }
            else {
               return res.json({ status: true, code: 200, message: "Nothing's change" });
            }
         });
      }
      catch (err) {
         logger.error(err);
         return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
      }
   })
});

router.get("/listMethodAllowed", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var _id = req.userSession._id;

      var args = { schema: "Employee", query: [] }

      args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
      args.query.push({ $match: { _id: _id } });

      args.query.push({
         $lookup: {
            from: "policy",
            let: { pId: "$pId" }, //get policy default
            pipeline: [
               { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
               { $project: { _id: 0, method: 1, radius: 1 } }
            ],
            as: "policy"
         }
      });
      args.query.push({ $unwind: { path: "$policy", preserveNullAndEmptyArrays: true } });

      args.query.push({
         $lookup: {
            from: "location",
            let: { groupId: "$groupId", policy: "$policy" },
            pipeline: [
               { $match: { $expr: { $and: [{ $eq: ["$groupId", "$$groupId"] }] } } },
               { $addFields: { method: { $cond: { if: { $eq: [{ $ifNull: ["$priority", false] }, true] }, then: "$method", else: "$$policy.method" } } } },
               { $addFields: { radius: { $cond: { if: { $eq: [{ $ifNull: ["$priority", false] }, true] }, then: "$radius", else: "$$policy.radius" } } } },
               { $addFields: { k: "$_id", v: { method: "$method", radius: "$radius", lat: "$lat", long: "$long" } } },
               { $group: { _id: null, a: { $addToSet: { k: "$k", v: "$v" } } } },
               { $project: { _id: 0, a: 1 } },
               { $replaceRoot: { newRoot: { $arrayToObject: "$a" } } }
            ],
            as: "location"
         }
      });

      args.query.push({ $unwind: { path: "$location", preserveNullAndEmptyArrays: false } });
      args.query.push({ $project: { _id: 0, location: 1, policy: 1 } });

      JCloud.aggregateOne(args, (err, result) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }

         return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
      })
   } catch (err) {
      logger.error(err);
      return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

module.exports = router;
