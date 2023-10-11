var router = Express.Router();
var Cache = require(__ + "/modules/Cache");

//Get list user by pagination
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

      var args = { schema: "User", query: [] }
      args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
      args.query.push({ $match: { _id: { $ne: req.userSession._id } } })

      // if (req.userSession.idAdminGroup) {
      args.query.push({ $match: { $or: [{ groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] } });
      // }
      // else {
      //    // var response = { doc: [], total: count, pages: 0 };
      //    // return res.json({ status: true, code: 200, message: "Success", result: response });
      //    args.query.push({ $match: { $or: [{ inherited: { $elemMatch: { $eq: inheritedId } } }] } });
      // }

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
            from: "group",
            let: { inherited: "$inherited" },
            pipeline: [
               { $match: { $expr: { $and: [{ $in: ["$_id", "$$inherited"] }] } } },
               { $project: { _id: 1, name: 1, keyword: 1 } },
            ],
            as: "inherited"
         }
      });

      if (keys.length > 0) {
         keys.forEach((key) => {
            if (typeof search[key] != "object") {
               if (key == "group") {
                  args.query.push({ $match: { $or: [{ "group.keyword": { $regex: Util.removeDMV(search[key]), $options: "i" } }, { "group._id": search[key] }] } });
               }
               else if (key == "status") {
                  args.query.push({ $match: { "status": search[key] } });
               }
               else {
                  args.query.push({ $match: { [key]: { $regex: Util.removeDMV(search[key]), $options: "i" } } });
               }
            }
         });
      }

      args.query.push({ $group: { _id: null, count: { $sum: 1 } } });

      Assistant.getPages(args, { skip, pageSize, sort }, (response) => {
         return res.json(response);
      })
   } catch (err) {
      logger.error(err);
      return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Get a user
router.get("/:_id", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var _id = req.params._id;

      var args = { schema: "User", query: { _id: _id, $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }, populate: { path: 'group', select: 'name permission' }, select: "-pw -password -salt" };

      JCloud.populateOne(args, (err, result) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }
         if (!result) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "User Not Found." });

         //add role v2
         logger.info(CONF.ROLE[result.role])
         result.permission = JSON.parse(JSON.stringify(CONF.ROLE[result.role]));

         //role v2
         // result.group.permission =  CONF.ROLE;

         return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
      });
   } catch (err) {
      logger.error(err); 
      return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Add new user
router.post("/", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var body = req.body || {};
      body.groupId = body.group = body.group || body.groupId || groupId;
      if (body.username) body.username = body.username.toLowerCase();
      if (body.email) body.email = body.email.toLowerCase();

      var args = { schema: "User", query: { $or: [{ username: body.username }, { email: body.email }] } }

      JCloud.count(args, (err, result) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }
         if (result != 0) { return res.status(409).json({ status: false, code: 409, msgCode: "username-or-email-exists", message: 'Username or Email already exists' }) }

         var args = { schema: "Employee", query: { $or: [{ username: body.username }, { email: body.email }] } }

         JCloud.count(args, (err, result) => {
            if (err) {
               logger.error(err);
               return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }
            if (result != 0) { return res.status(409).json({ status: false, code: 409, msgCode: "username-or-email-exists", message: 'Username or Email already exists' }) }

            var args = { schema: "Group", query: { _id: body.group }, select: 'inherited -_id' };

            JCloud.findOne(args, (err, group) => {
               if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
               if (!group) { return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Group Not Found" }) };

               var adminId = group.adminId || group._id
               var args = { schema: "User", query: { _id: adminId } }

               JCloud.count(args, (err, result) => {
                  if (err) {
                     logger.error(err);
                     return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                  }

                  var doc = JSON.parse(JSON.stringify(body));

                  doc.email = doc.email || '';
                  doc.username = doc.username || '';
                  doc.password = doc.password || '';
                  doc.createdBy = req.userSession.username;
                  doc.keyword = Util.removeDMV(doc.name);
                  doc.updatedBy = req.userSession.username;
                  doc.updatedAt = Util.now();
                  doc.createdAt = Util.now();
                  doc.inherited = group.inherited;
                  
                  if (doc.password) {
                     doc.salt = Util.genSalt();
                     doc.password = Util.hashPassword(doc.password, doc.salt);
                  }

                  if (doc.role == "Manager") {
                     if (result == 0) {
                        doc._id = adminId;
                     }
                  }

                  var args = { schema: "User", update: doc };
                  JCloud.save(args, (err, result) => {
                     if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                     return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
                  });
               })
            })
         })
      })
   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Change Password for user
router.put("/changePassword/", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var body = req.body || {};
      var _id = req.userSession._id;

      if (_id == "1" || _id == "2") {
         return res.status(403).json({ status: false, code: 403, msgCode: "access-denied", message: "Access Deined" });
      }


      var args = { schema: "User", query: { _id: _id, $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] } };
      JCloud.findOne(args, (err, user) => {
         if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         if (!user) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "User Not Found" });

         var oldpass = Util.hashPassword(body.oldpass, user.salt);

         var args = { schema: "User", query: { _id: _id, password: oldpass } };
         JCloud.findOne(args, (err, user) => {
            if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            if (!user) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Old password incorrect." });
            var salt = Util.genSalt();
            var password = Util.hashPassword(body.password, salt);

            var args = { schema: "User", query: { _id: _id, $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] }, update: { $set: { password: password, salt: salt } }, select: "-pw -password -salt" };
            JCloud.findOneAndUpdate(args, (err, result) => {
               if (err) {
                  logger.error(err);
                  return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
               }

               return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
            });
         });
      })
   } catch (err) {
      logger.error(err);
      return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Edit user
router.put("/:_id", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var body = req.body || {};
      body.groupId = body.group = body.group || body.groupId || groupId;
      var _id = req.params._id;
      if (body.username) body.username = body.username.toLowerCase();
      if (body.email) body.email = body.email.toLowerCase();

      if (_id == "1" || _id == "2") {
         return res.status(403).json({ status: false, code: 403, msgCode: "access-denied", message: "Access Deined" });
      }

      //Check Unique Username/Email
      var args = { schema: "User", query: { $and: [{ _id: { $ne: _id } }, { $or: [{ username: body.username }, { email: body.email }] }] } }

      JCloud.count(args, (err, result) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }
         if (result != 0) { return res.status(409).json({ status: false, code: 409, msgCode: "username-or-email-exists", message: 'Username or Email already exists' }) }

         var args = { schema: "Employee", query: { $or: [{ username: body.username }, { email: body.email }] } }

         JCloud.count(args, (err, result) => {
            if (err) {
               logger.error(err);
               return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }
            if (result != 0) { return res.status(409).json({ status: false, code: 409, msgCode: "username-or-email-exists", message: 'Username or Email already exists' }) }

            var args = { schema: "Group", query: { _id: body.group }, select: 'inherited -_id' };

            JCloud.findOne(args, (err, group) => {
               if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
               if (!group) { return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Group Not Found" }) };

               var args = { schema: "User", query: { _id: _id } };
               JCloud.findOne(args, (err, user) => {
                  if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                  if (!user) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "User Not Found" });

                  var doc = JSON.parse(JSON.stringify(body));
                  if (typeof doc.name != "undefined") {
                     doc.keyword = Util.removeDMV(doc.name);
                  }
                  doc.inherited = group.inherited;

                  if (doc.password) {
                     doc.salt = Util.genSalt();
                     doc.password = Util.hashPassword(doc.password, doc.salt);
                  } else {
                     doc.salt = user.salt;
                     doc.password = user.password;
                  }

                  logger.info(doc.salt, doc.password);
                  doc.updatedAt = Util.now();

                  var args = { schema: "User", query: { _id: _id }, update: { $set: doc }, select: "-pw -password -salt" };
                  JCloud.findOneAndUpdate(args, (err, result) => {
                     if (err) {
                        logger.error(err);
                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
                     }

                     if (!result) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "User Not Found" });

                     return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
                  });
               });
            });
         });
      });
   } catch (err) {
      logger.error(err);
      return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Remove user
router.delete("/:_id", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var _id = req.params._id;

      if (_id == "1" || _id == "2") {
         return res.status(403).json({ status: false, code: 403, msgCode: "access-denied", message: "Access Deined" });
      }


      if (req.userSession._id == _id) {
         return res.status(406).json({ status: false, code: 406, msgCode: "not-acceptable", message: "You can not remove yourself" });
      }

      var args = { schema: "User", query: { _id: _id, $or: [{ group: groupId }, { groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] } };

      JCloud.findOneAndRemove(args, (err, result) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }

         if (!result) {
            return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "User Not Found" });
         }

         return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
      });
   } catch (err) {
      logger.error(err);
      return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

module.exports = router;