const { IncomingMessage } = require('http');

global.HIK = module.exports = {
   getAccessLevel(body, callback) {
      var url = CONF.HIK_API.url + "/api/hik/singleHik/getAccessLevel";
      var option = { headers: { 'content-type': 'application/json', "authorization": "Bearer " + CONF.HIK_API.token }, url: url, body: JSON.stringify(body) }

      request.post(option, function (err, response, data) {
         if (err) {
            if (callback) return callback(err, null);
         }

         if (data && (data = JSON.parse(data))) {
            logger.debug("data", JSON.stringify(data));
            if (callback) return callback(null, data);
         }

         if (callback) return callback({ msgCode: data.msgCode, message: data.message }, null);
      });
   },
   getAccessLevelList(body, callback) {
      var url = CONF.HIK_API.url + "/api/hik/getAccessLevel";
      var option = { headers: { 'content-type': 'application/json', "authorization": "Bearer " + CONF.HIK_API.token }, url: url, body: JSON.stringify(body) }

      request.post(option, function (err, response, data) {
         if (err) {
            if (callback) return callback(err, null);
         }

         if (data && (data = JSON.parse(data))) {
            logger.debug("data", JSON.stringify(data));
            if (callback) return callback(null, data);
         }

         if (callback) return callback({ msgCode: data.msgCode, message: data.message }, null);
      });
   },
   getAccessPointList(body, callback) {
      var url = CONF.HIK_API.url + "/api/hik/getAccessPointList";
      var option = { headers: { 'content-type': 'application/json', "authorization": "Bearer " + CONF.HIK_API.token }, url: url, body: JSON.stringify(body) }

      request.post(option, function (err, response, data) {
         if (err) {
            if (callback) return callback(err, null);
         }

         if (data && (data = JSON.parse(data))) {
            logger.debug("data", JSON.stringify(data));
            if (callback) return callback(null, data);
         }

         if (callback) return callback({ msgCode: data.msgCode, message: data.message }, null);
      });
   },
   getStatus(body, callback) {
      var url = CONF.HIK_API.url + "/api/hik/getStatus";
      var option = { headers: { 'content-type': 'application/json', "authorization": "Bearer " + CONF.HIK_API.token }, url: url, body: JSON.stringify(body) }

      request.post(option, function (err, response, data) {
         if (err) {
            if (callback) return callback(err, null);
         }

         if (data && (data = JSON.parse(data))) {
            // logger.debug("data", JSON.stringify(data));
            if (callback) return callback(null, data);
         }

         if (callback) return callback({ msgCode: data.msgCode, message: data.message }, null);
      });
   },
   connect(body, callback) {
      var url = CONF.HIK_API.url + "/api/hik/connect";
      var option = { headers: { 'content-type': 'application/json', "authorization": "Bearer " + CONF.HIK_API.token }, url: url, body: JSON.stringify(body) }

      request.post(option, function (err, response, data) {
         if (err) {
            if (callback) return callback(err, null);
         }

         if (data && (data = JSON.parse(data)) && data.code == 200) {
            logger.debug("data", JSON.stringify(data));
            if (callback) return callback(null, data);
         }

         if (callback) return callback({ msgCode: data.msgCode, message: data.message }, null);
      });
   },
   disconnect(body, callback) {
      var url = CONF.HIK_API.url + "/api/hik/disconnect";
      var option = { headers: { 'content-type': 'application/json', "authorization": "Bearer " + CONF.HIK_API.token }, url: url, body: JSON.stringify(body) }

      request.post(option, function (err, response, data) {
         if (err) {
            if (callback) return callback(err, null);
         }

         if (data && (data = JSON.parse(data)) && data.code == 200) {
            logger.debug("data", JSON.stringify(data));
            if (callback) return callback(null, data);
         }

         if (callback) return callback({ msgCode: data.msgCode, message: data.message }, null);
      });
   },
   getPerson(eId, callback) {
      var args = { schema: "Employee", query: [] };
      args.query.push({ $match: { _id: eId } });

      args.query.push({
         $lookup: {
            from: "policy",
            let: { pId: "$pId" },
            pipeline: [
               { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
               { $unwind: "$mapAccessLevel" },
               { $group: { _id: "$mapAccessLevel.hikId", accessLevelId: { $addToSet: "$mapAccessLevel.accessLevelId" } } },
               {
                  $lookup: {
                     from: "hikcentral",
                     let: { hikId: "$_id" },
                     pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ["$_id", "$$hikId"] }] } } },
                     ],
                     as: "hikcentral"
                  },
               },
               { $unwind: "$hikcentral" },
               { $addFields: { hikId: "$_id", baseUrl: "$hikcentral.baseUrl", appKey: "$hikcentral.appKey", appSecret: "$hikcentral.appSecret" } },
               { $project: { _id: 0, hikId: 1, baseUrl: 1, appKey: 1, appSecret: 1, accessLevelId: 1 } }
            ],
            as: "policy"
         }
      });

      args.query.push({
         $addFields: {
            groupId: { $ifNull: ["$groupId", "$group"] },
            person: { _id: "$_id", name: "$name", phone: "$phone", email: "$email", endAt: { $ifNull: ["$endAt", moment().add(10, "year").format("YYYY-MM-DD")] } },
            hikGroups: "$policy"
         }
      });

      args.query.push({ $project: { _id: 1, groupId: 1, person: 1, hikGroups: 1, portrait: 1, portraitType: 1, portraitStatus: 1, portrait2: 1, portrait2Type: 1, portrait2Status: 1 } });
      JCloud.aggregateOne(args, (err, result) => {
         if (err) {
            logger.error(err);
         }

         if (result) {
            if (callback) return callback(null, result);
         }
         else {
            if (callback) return callback(null, null);
         }
      });
   },
   addPerson(_id, callback) {
      HIK.getPerson(_id, function (err, result) {
         if (err) {
            logger.error(err);
            if (callback) return callback(err, null);
         }

         if (result) {
            if (result.portrait2Status == "pending" && result.portrait2) {
               var image = PATH.join(CONF.PORTRAIT2 + result.groupId + "/" + result._id);

               if (fs.existsSync(image)) {
                  var imageBase64 = fs.readFileSync(image, 'base64');
                  result.person.faceData = "data:" + result.portrait2Type + ";base64," + imageBase64;
               }
            }
            else if (result.portrait) {
               var image = PATH.join(CONF.PORTRAIT + result.groupId + "/" + result._id);

               if (fs.existsSync(image)) {
                  var imageBase64 = fs.readFileSync(image, 'base64');
                  result.person.faceData = "data:" + result.portraitType + ";base64," + imageBase64;
               }
            }

            delete result.portraitType;
            delete result.portrait2Type;
            delete result.portrait;
            delete result.portrait2;
            delete result._id;
            delete result.groupId;

            logger.debug(JSON.stringify(result))
            var url = CONF.HIK_API.url + "/api/hik/person/add";
            var option = { headers: { 'content-type': 'application/json', "authorization": "Bearer " + CONF.HIK_API.token }, url: url, body: JSON.stringify(result) }

            logger.debug(url);
            request.post(option, function (err, response, data) {
               if (err) {
                  logger.error(err);
                  if (callback) return callback(err, null);
               }

               if (data && (data = JSON.parse(data))) {
                  if (data.error) {
                     logger.error(err || data.error);
                     if (callback) return callback(data.error, null);
                  }

                  logger.debug("data", JSON.stringify(data));


                  if (callback) return callback(null, data);
               }

               if (callback) return callback(null, null);
            });
         }
         else {
            if (callback) return callback(null, null);
         }
      })
   },
   getGuest(guestId, callback) {
      var args = { schema: "Guest", query: [] };
      args.query.push({ $match: { _id: guestId } });

      args.query.push({ $addFields: { person: { _id: "$_id", name: "$name", phone: "$phone", email: "$email", endAt: { $ifNull: ["$endAt", moment().add(10, "year").format("YYYY-MM-DD")] } } } })
      args.query.push({ $unwind: "$mapAccessLevel" })

      args.query.push({
         $lookup: {
            from: "hikcentral",
            let: { hikId: "$mapAccessLevel.hikId" },
            pipeline: [
               { $match: { $expr: { $and: [{ $eq: ["$_id", "$$hikId"] }] } } },
            ],
            as: "hikcentral"
         },
      })
      args.query.push({ $unwind: "$hikcentral" })

      args.query.push({ $addFields: { hikGroups: { hikId: "$mapAccessLevel.hikId", baseUrl: "$hikcentral.baseUrl", appKey: "$hikcentral.appKey", appSecret: "$hikcentral.appSecret", accessLevelId: "$mapAccessLevel.accessLevelId" } } })


      args.query.push({
         $group: {
            _id: "$mapAccessLevel.hikId",
            groupId: { $first: "$groupId" },
            accessLevelId: { $addToSet: "$mapAccessLevel.accessLevelId" },
            hikGroups: { $addToSet: "$hikGroups" },
            person: { $first: "$person" },
            portrait: { $first: "$portrait" },
            portraitType: { $first: "$portraitType" },
            portraitStatus: { $first: "$portraitStatus" }

         }
      })

      args.query.push({ $project: { _id: 1, groupId: 1, person: 1, hikGroups: 1, portrait: 1, portraitType: 1, portraitStatus: 1, portrait2: 1, portrait2Type: 1, portrait2Status: 1 } });

      JCloud.aggregateOne(args, (err, result) => {
         if (err) {
            logger.error(err);
         }

         if (result) {
            if (callback) return callback(null, result);
         }
         else {
            if (callback) return callback(null, null);
         }
      });
   },
   addGuest(_id, callback) {
      HIK.getGuest(_id, function (err, result) {
         if (err) {
            logger.error(err);
            if (callback) return callback(err, null);
         }

         logger.debug("Get GUEST", JSON.stringify(result));
         if (result) {
            if (result.portraitStatus == "pending" && result.portrait) {
               var image = PATH.join(CONF.PORTRAIT + result.groupId + "/" + result._id);

               if (fs.existsSync(image)) {
                  var imageBase64 = fs.readFileSync(image, 'base64');
                  result.person.faceData = "data:" + result.portraitType + ";base64," + imageBase64;
               }
            }

            delete result.portraitType;
            delete result.portrait;
            delete result._id;
            delete result.groupId;

            logger.debug(JSON.stringify(result))
            var url = CONF.HIK_API.url + "/api/hik/person/add";
            var option = { headers: { 'content-type': 'application/json', "authorization": "Bearer " + CONF.HIK_API.token }, url: url, body: JSON.stringify(result) }

            logger.debug(url);
            request.post(option, function (err, response, data) {
               if (err) {
                  logger.error(err);
                  if (callback) return callback(err, null);
               }

               if (data && (data = JSON.parse(data))) {
                  if (data.error) {
                     logger.error(err || data.error);
                     if (callback) return callback(data.error, null);
                  }

                  logger.debug("data", JSON.stringify(data));

                  if (callback) return callback(null, data);
               }

               if (callback) return callback(null, null);
            });
         }
         else {
            if (callback) return callback(null, null);
         }
      })
   },
   getHIKList(groupId, callback) {
      var args = { schema: "HIKCentral", query: [] };
      args.query.push({ $match: { groupId: groupId } });
      args.query.push({ $addFields: { k: "$_id", v: { hikId: "$_id", hikName: "$name", baseUrl: "$baseUrl", appKey: "$appKey", appSecret: "$appSecret" } } });
      args.query.push({ $group: { _id: null, hik: { $addToSet: { k: "$k", v: "$v" } } } });
      args.query.push({ $addFields: { hik: { $arrayToObject: "$hik" } } });
      args.query.push({ $replaceRoot: { newRoot: "$hik" } });

      JCloud.aggregateOne(args, (err, result) => {
         if (err) {
            logger.error(err);
         }

         if (callback) return callback(err, result);
      });
   },
   getRemovedMapAccessLevel(pId, _new, callback) {
      var args = { schema: "Policy", query: [] };
      args.query.push({ $match: { _id: pId } });
      args.query.push({ $addFields: { method: { $ifNull: ["$method", { wifi: { $ifNull: ["$wifi", false] }, bssid: { $ifNull: ["$bssid", false] }, qr: { $ifNull: ["$qr", false] }, qrAccess: { $ifNull: ["$qrAccess", false] }, gps: { $ifNull: ["$gps", false] }, gpsselfie: { $ifNull: ["$gpsselfie", false] }, gpsselfie: { $ifNull: ["$gpsselfie", false] }, hik: { $ifNull: ["$hik", false] }, faceId: { $ifNull: ["$faceId", false] } }] } } });
      args.query.push({ $match: { "method.hik": true } });

      args.query.push({ $project: { _id: 0, mapAccessLevel: 1 } });

      JCloud.aggregateOne(args, (err, result) => {
         if (err) {
            logger.error(err);
         }

         var _old = (result && result.mapAccessLevel) ? result.mapAccessLevel : [];
         var removed = [];

         if (_old && _old.length > 0) {
            if (_new.length > 0) {
               removed = _old.filter(x1 => !_new.some(x2 => (x1.hikId === x2.hikId && x1.accessLevelId === x2.accessLevelId)));
            }
            else {
               removed = _old;
            }
         }

         if (callback) return callback(err, removed);
      })
   },
   getPersonList(pId, callback) {
      var args = { schema: "Employee", query: [] };      

      args.query.push({ $match: { pId: pId } });
      args.query.push({ $match: { $expr: { $and: [{ $eq: ["$endAt", null] }, { $lt: ["$endAt", Util.now("YYYY-MM-DD")] }] } } });
      args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
      args.query.push({ $addFields: { endAt: { $ifNull: ["$endAt", moment().add(10, "year").format("YYYY-MM-DD")] } } });
      args.query.push({ $project: { _id: 1, name: 1, phone: 1, email: 1, groupId: 1, endAt: 1, portrait: 1, portraitType: 1 } });

      JCloud.aggregate(args, (err, result) => {
         if (err) {
            logger.error(err);
         }

         if (result) {
            if (callback) return callback(null, result);
         }
         else {
            if (callback) return callback(null, null);
         }
      });
   },
   getPersonIdList(pId, callback) { //Get All Employee Id in this Policy
      var args = { schema: "Employee", query: [] };      
      args.query.push({ $match: { pId: pId } });
      args.query.push({ $group: { _id: null, list: { $addToSet: "$_id" } } });

      JCloud.aggregateOne(args, (err, result) => {
         if (err) {
            logger.error(err);
         }

         if (result) {
            if (callback) return callback(null, (result) ? result.list : []);
         }
         else {
            if (callback) return callback(null, null);
         }
      });
   },
   addPersonList(pId, callback) {
      var url = CONF.HIK_API.url + "/api/hik/person/add";
      HIK.getHikGroupsBySID(pId, function (err, hikGroups) {
         if (hikGroups && hikGroups.length > 0) {
            HIK.getPersonList(pId, function (err, persons) {
               if (persons && persons.length > 0) {
                  var fAsync = [];
                  for (i = 0, n = persons.length; i < n; i++) {
                     let person = persons[i];
                     if (person.portrait) {
                        var image = PATH.join(CONF.PORTRAIT + person.groupId + "/" + person._id);
                        logger.debug(image);
                        if (fs.existsSync(image)) {
                           var imageBase64 = fs.readFileSync(image, 'base64');
                           person.faceData = "data:" + person.portraitType + ";base64," + imageBase64;
                        }
                     }

                     let body = { hikGroups: hikGroups, person: person };
                     let option = { headers: { 'content-type': 'application/json', "authorization": "Bearer " + CONF.HIK_API.token }, url: url, body: JSON.stringify(body) }

                     logger.debug("[addPersonList]body", person.name, (person.faceData) ? person.faceData.length : 0);
                     fAsync.push(function (callback) {
                        logger.debug("[addPersonList]option", body.person.name, (body.person.faceData) ? body.person.faceData.length : 0);
                        request.post(option, function (err, response, data) {
                           if (err) {
                              logger.error(err);
                              if (callback) return callback(err, null);
                           }

                           if (data && (data = JSON.parse(data))) {
                              if (data.error) {
                                 logger.error(err || data.error);
                                 if (callback) return callback(data.error, null);
                              }

                              let _id = body.person._id;

                              if (data.result) {
                                 if (data.result.code == 200) {
                                    var args = { schema: "Employee", query: { _id: _id, portraitStatus: { $in: ["pending", "", null] } }, update: { $set: { portraitStatus: "approved", approvedDate: Util.now() }, $unset: { msgCode: "" } }, select: "-pw -password" };
                                    JCloud.findOneAndUpdate(args, (err, employee) => {
                                       if (err) {
                                          logger.error(err);
                                       }
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
                                       var args = { schema: "Employee", query: { _id: _id, portraitStatus: { $in: ["pending", "", null] } }, update: { $set: { portraitStatus: "rejected", rejectedDate: Util.now(), msgCode: msgCode } }, select: "-pw -password" };
                                       JCloud.findOneAndUpdate(args, (err, employee) => {
                                          if (err) {
                                             logger.error(err);
                                          }
                                       })
                                    }
                                    else {
                                       var args = { schema: "Employee", query: { _id: _id, portraitStatus: { $in: ["pending", "", null] } }, update: { $set: { portraitStatus: "pending", msgCode: msgCode } }, select: "-pw -password" };
                                       JCloud.findOneAndUpdate(args, (err, employee) => {
                                          if (err) {
                                             logger.error(err);
                                          }
                                       })
                                    }
                                 }

                                 if (callback) return callback(null, data.result);
                              }
                           }

                           if (callback) return callback(null, null);
                        });
                     })
                  }

                  if (fAsync.length > 0) {
                     async.parallel(fAsync, function (err, results) {
                        logger.debug("DONE", JSON.stringify(results));
                        if (callback) return callback(err, results);
                     });
                  }
               }
            })
         }
      })
   },
   getHikGroupsBySID(pId, callback) {
      var args = { schema: "Policy", query: [] };
      args.query.push({ $match: { _id: pId } });
      args.query.push({ $addFields: { method: { $ifNull: ["$method", { wifi: { $ifNull: ["$wifi", false] }, bssid: { $ifNull: ["$bssid", false] }, qr: { $ifNull: ["$qr", false] }, qrAccess: { $ifNull: ["$qrAccess", false] }, gps: { $ifNull: ["$gps", false] }, gpsselfie: { $ifNull: ["$gpsselfie", false] }, hik: { $ifNull: ["$hik", false] }, faceId: { $ifNull: ["$faceId", false] } }] } } });
      args.query.push({ $match: { "method.hik": true } });
      args.query.push({ $unwind: "$mapAccessLevel" });
      args.query.push({ $group: { _id: "$mapAccessLevel.hikId", accessLevelId: { $addToSet: "$mapAccessLevel.accessLevelId" } } });
      args.query.push({
         $lookup: {
            from: "hikcentral",
            let: { hikId: "$_id" },
            pipeline: [
               { $match: { $expr: { $and: [{ $eq: ["$_id", "$$hikId"] }] } } },
            ],
            as: "hikcentral"
         },
      });
      args.query.push({ $unwind: "$hikcentral" });
      args.query.push({ $addFields: { hikId: "$_id", baseUrl: "$hikcentral.baseUrl", appKey: "$hikcentral.appKey", appSecret: "$hikcentral.appSecret" } });
      args.query.push({ $project: { _id: 0, hikId: 1, baseUrl: 1, appKey: 1, appSecret: 1, accessLevelId: 1 } });

      JCloud.aggregate(args, (err, result) => {
         if (err) {
            logger.error(err);
         }

         if (result) {
            logger.debug("[getHikGroupsBySID]", JSON.stringify(result));
            if (callback) return callback(null, result);
         }
         else {
            if (callback) return callback(null, null);
         }
      })
   },
   removePersonList({ persons, hikGroups, list }, callback) {
      if (hikGroups) {
         HIK.removePerson([{ hikGroups, persons }], callback)
      }
      else {
         var args = { schema: "Employee", query: [] };
         args.query.push({ $match: { _id: { $in: list } } });

         args.query.push({
            $lookup: {
               from: "policy",
               let: { pId: "$pId" },
               pipeline: [
                  { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
                  { $addFields: { method: { $ifNull: ["$method", { hik: { $ifNull: ["$hik", false] } }] } } },
                  { $match: { "method.hik": true } },
                  { $unwind: "$mapAccessLevel" },
                  { $group: { _id: "$mapAccessLevel.hikId", accessLevelId: { $addToSet: "$mapAccessLevel.accessLevelId" } } },
                  {
                     $lookup: {
                        from: "hikcentral",
                        let: { hikId: "$_id" },
                        pipeline: [
                           { $match: { $expr: { $and: [{ $eq: ["$_id", "$$hikId"] }] } } },
                        ],
                        as: "hikcentral"
                     },
                  },
                  { $unwind: "$hikcentral" },
                  { $addFields: { hikGroups: { hikId: "$_id", baseUrl: "$hikcentral.baseUrl", appKey: "$hikcentral.appKey", appSecret: "$hikcentral.appSecret", accessLevelId: "$mapAccessLevel" } } },
                  { $project: { _id: 1, hikGroups: 1 } }
               ],
               as: "policy"
            }
         });

         args.query.push({ $group: { _id: "$policy._id", hikGroups: { $first: "$policy.hikGroups" }, persons: { $addToSet: "$_id" } } });

         JCloud.aggregate(args, (err, result) => {
            if (err) {
               logger.error(err);
            }

            if (result) {
               HIK.removePerson(result, callback)
            }
         });
      }
   },
   removePerson(list, callback) {

      logger.debug("[removePersonList]list", JSON.stringify(list));
      var url = CONF.HIK_API.url + "/api/hik/person/delete";

      var fAsync = [];
      for (i = 0, n = list.length; i < n; i++) {
         let body = { hikGroups: list[i].hikGroups, persons: list[i].persons };
         logger.debug("[removePersonList]body", JSON.stringify(body));
         let option = { headers: { 'content-type': 'application/json', "authorization": "Bearer " + CONF.HIK_API.token }, url: url, body: JSON.stringify(body) }
         fAsync.push(function (callback) {

            request.post(option, function (err, response, data) {
               if (err) {
                  logger.error(err);
                  if (callback) return callback(err, null);
               }

               if (data && (data = JSON.parse(data))) {
                  if (data.error) {
                     logger.error(err || data.error);
                     if (callback) return callback(data.error, null);
                  }

                  logger.debug("[removePerson]data", JSON.stringify(data));
                  if (callback) return callback(null, data.result);
               }

               if (callback) return callback(null, null);
            });
         })
      }

      if (fAsync.length > 0) {
         async.parallel(fAsync, function (err, results) {
            logger.debug("DONE", JSON.stringify(results));
            if (callback) return callback(err, results);
         });
      }
   },
   unlinkPersonList({ groupId, pId, removed, mapAccessLevel }, callback) {
      HIK.getHIKList(groupId, function (err, hikInfo) {
         //Unlink person from AccessLevel
         logger.debug("[unlinkPersonList]removed", JSON.stringify(removed));
         logger.debug("[unlinkPersonList]hikInfo", JSON.stringify(hikInfo));

         if (removed && removed.length > 0 && hikInfo) {
            HIK.getPersonIdList(pId, function (err, list) {
               var r = {};
               for (i = 0, n = removed.length; i < n; i++) {
                  var hikId = removed[i].hikId;
                  var accessLevelId = removed[i].accessLevelId;

                  if (r[hikId]) {
                     r[hikId].accessLevelId.push(accessLevelId)
                  }
                  else {
                     r[hikId] = { ...hikInfo[hikId], accessLevelId: [accessLevelId] }
                  }
               }

               var hikGroups = Object.keys(r).map((key) => r[key]);

               logger.debug("[unlinkPersonList]hikGroups", JSON.stringify(hikGroups));
               logger.debug("[unlinkPersonList]personIdList", JSON.stringify(list));

               //If mapAccessLevel has least 1 item
               if (mapAccessLevel.length > 0) {
                  logger.debug("Unlink")
                  HIK.unlinkPerson(hikGroups, list, callback);
               }
               else { //If no item then remove all person.
                  logger.debug("Remove All Person")
                  HIK.removePersonList({ hikGroups: hikGroups, persons: list }, callback);
               }
            })
         }
         else {
            if (callback) return callback(null, null);
         }
      })
   },
   unlinkPerson(hikGroups, eId, callback) {
      logger.debug("[unlinkPerson]hikGroups", JSON.stringify(hikGroups));
      logger.debug("[unlinkPerson]eId", JSON.stringify(eId));

      if (hikGroups && eId && hikGroups.length > 0 && eId.length > 0) {
         var body = { hikGroups: hikGroups, persons: (Util.isArray(eId)) ? eId : [eId] };
         logger.debug(JSON.stringify(body));

         var url = CONF.HIK_API.url + "/api/hik/person/unlink";
         var option = { headers: { 'content-type': 'application/json', "authorization": "Bearer " + CONF.HIK_API.token }, url: url, body: JSON.stringify(body) }

         request.post(option, function (err, response, data) {
            if (err) {
               logger.error(err);
               if (callback) return callback(err, null);
            }

            if (data && (data = JSON.parse(data))) {
               if (data.error) {
                  logger.error(err || data.error);
                  if (callback) return callback(data.error, null);
               }

               logger.debug("[unlinkPerson]data", JSON.stringify(data));
               if (callback) return callback(null, data.result);
            }

            if (callback) return callback(null, null);
         });
      }
      else {
         if (callback) return callback(null, null);
      }
   }
}
