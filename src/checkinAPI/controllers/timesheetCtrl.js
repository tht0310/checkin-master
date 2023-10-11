
var router = Express.Router();

//Get a
router.get("/:_id", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var _id = req.params._id;
      var args = { schema: "Timesheet", query: { _id: _id, groupId: groupId } };

      JCloud.findOne(args, (err, result) => {
         if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         if (!result) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Timesheet Not Found." });
         return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
      });
   } catch (err) {
      logger.error(err);
      return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//v1.1
//Edit
router.put("/", (req, res, next) => {
   try {
      var body = req.body || {};
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;

         var args = { schema: "Employee", query: [] };
         args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
         
         args.query.push({ $match: { groupId: groupId } });

         args.query.push({
            $lookup: {
               from: "policy",
               let: { pId: "$pId" },
               pipeline: [
                  { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
                  { $project: { _id: 0, office: 1 } }
               ],
               as: "policy"
            }
         });
         args.query.push({ $unwind: "$policy" });

         args.query.push({ $project: { _id: 1, k: "$_id", v: { startAt: "$startAt", policy: "$policy" } } });

         args.query.push({ $group: { _id: null, a: { $addToSet: { k: "$k", v: "$v" } } } });
         args.query.push({ $project: { _id: 0, a: 1 } });
         args.query.push({ $replaceRoot: { newRoot: { $arrayToObject: "$a" } } });

         JCloud.aggregate(args, (err, result) => {
            if (err) {
               logger.error(err);
            }

            result = result[0];

            var list = Object.keys(body);

            let countInvalidFields = 0;
            var fAsync = [];

            for (let i = 0; i < list.length; i++) {
               let eId = list[i];
               let timesheet = body[eId].timesheet;
               let policy = result[eId].policy;

               if (timesheet) {
                  logger.debug(JSON.stringify(timesheet));
                  var listD = Object.keys(timesheet);
                  for (let k = 0; k < listD.length; k++) {
                     let d = listD[k];
                     let startAt = result[eId].startAt;

                     let diffToday = moment(Util.now("YYYY-MM-DD"), "YYYY-MM-DD").diff(moment(d, "YYYY-MM-DD"), "days");
                     if (diffToday >= 0) {
                        //check startAt vs date.
                        let diff = moment(d, "YYYY-MM-DD").diff(moment(startAt, "YYYY-MM-DD"), "days");
                        logger.debug(JSON.stringify(diff));

                        if (diff >= 0) {
                           let ddd = moment(d, "YYYY-MM-DD").format("ddd");
                           logger.debug(ddd, d);
                           let code = timesheet[d];
                           if (policy.office[ddd] && (policy.office[ddd].inAM || policy.office[ddd].inPM)) {
                              logger.debug(code);
                              if (["MO", "CO", "NL", "TS", "X", "P", "CT", "R", "4X,4P", "4P,4K", "4X,4K", "K"].indexOf(code) != -1 || code == "") {

                                 logger.debug(code);
                                 let m = moment(d, "YYYY-MM-DD").format("YYYY-MM");
                                 let newData = { d: d, m: m, eId: eId, groupId: groupId, code: code }
                                 logger.debug(JSON.stringify(newData));

                                 fAsync.push(function (cb) {
                                    var editor = { byId: req.userSession._id, byName: req.userSession.name };
                                    Task.updateCodeAndPaidLeaveDay({ newData, editor, policy }, cb);
                                 })
                              }
                              else {
                                 countInvalidFields++;
                                 logger.debug("Code Invalid!");
                              }
                           }
                           else {
                              if (code == "CC" || code == "") {
                                 let m = moment(d, "YYYY-MM-DD").format("YYYY-MM");
                                 let newData = { d: d, m: m, eId: eId, groupId: groupId, code: code }
                                 logger.debug(JSON.stringify(newData));

                                 fAsync.push(function (cb) {
                                    var editor = { byId: req.userSession._id, byName: req.userSession.name };
                                    Task.updateCodeAndPaidLeaveDay({ newData, editor, policy }, cb);
                                 })
                              }
                              else {
                                 countInvalidFields++;
                                 logger.debug("Code Invalid!");
                              }
                           }
                        }
                        else {
                           countInvalidFields++;
                           logger.debug("Can't update date before startAt");
                        }
                     }
                     else {
                        countInvalidFields++;
                        logger.debug("Can't update date in future");
                     }
                  }
               }
            }

            if (countInvalidFields > 0) {
               return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid Code or Date before startAt or Date in future" });
            }
            else if (fAsync.length > 0) {
               async.parallel(fAsync, function (err, results) {
                  logger.debug("DONE", JSON.stringify(results));

                  return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: results });
               })
            }
            else {
               return res.status(204).json({ status: true, code: 200, msgCode: "nothing-changed", message: "Nothing's Changed" });
            }
         })
   }
   catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//v1.1
//Edit
router.put("/OT", (req, res, next) => {
   try {
      var body = req.body || {};
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;

      var args = { schema: "Employee", query: [] };
      args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
      
      args.query.push({ $match: { groupId: groupId } });

      args.query.push({
         $lookup: {
            from: "policy",
            let: { pId: "$pId" },
            pipeline: [
               { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
               { $project: { _id: 0, office: 1, radius: 1 } }
            ],
            as: "policy"
         }
      });
      args.query.push({ $unwind: "$policy" });


      args.query.push({ $project: { _id: 1, k: "$_id", v: { startAt: "$startAt", policy: "$policy" } } });

      args.query.push({ $group: { _id: null, a: { $addToSet: { k: "$k", v: "$v" } } } });
      args.query.push({ $project: { _id: 0, a: 1 } });
      args.query.push({ $replaceRoot: { newRoot: { $arrayToObject: "$a" } } });

      JCloud.aggregate(args, (err, result) => {
         if (err) {
            logger.error(err);
         }

         result = result[0];
         var list = Object.keys(body);

         let countInvalidFields = 0;
         var fAsync = [];

         for (let i = 0; i < list.length; i++) {
            let eId = list[i];
            let timesheet = body[eId].timesheet;
            let policy = result[eId].policy;

            if (timesheet) {
               logger.debug(JSON.stringify(timesheet));
               var listD = Object.keys(timesheet);
               for (let k = 0; k < listD.length; k++) {
                  let d = listD[k];
                  let startAt = result[eId].startAt;

                  let diffToday = moment(Util.now("YYYY-MM-DD"), "YYYY-MM-DD").diff(moment(d, "YYYY-MM-DD"), "days");
                  if (diffToday >= 0) {
                     //check startAt vs date.
                     let diff = moment(d, "YYYY-MM-DD").diff(moment(startAt, "YYYY-MM-DD"), "days");

                     if (diff >= 0) {
                        let ddd = moment(d, "YYYY-MM-DD").format("ddd");
                        // logger.debug(ddd, d);

                        let wtOT = timesheet[d];

                        logger.debug(wtOT)
                        if (!wtOT) wtOT = 0;

                        if (/^\d+$/.test(wtOT) == true) {
                           wtOT = Number(wtOT)
                           let m = moment(d, "YYYY-MM-DD").format("YYYY-MM");
                           let newData = { d: d, m: m, eId: eId, groupId: groupId, wtOT: wtOT }
                           logger.debug(JSON.stringify(newData));

                           fAsync.push(function (cb) {
                              var editor = { byId: req.userSession._id, byName: req.userSession.name };
                              Task.updateCodeOT({ newData, editor }, cb);
                           })
                        }
                        else {
                           countInvalidFields++;
                           logger.debug("Code Invalid!");
                        }
                     }
                     else {
                        countInvalidFields++;
                        logger.debug("Can't update date before startAt");
                     }
                  }
                  else {
                     countInvalidFields++;
                     logger.debug("Can't update date in future");
                  }
               }
            }
         }

         if (countInvalidFields > 0) {
            return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid Code or Date before startAt or Date in future" });
         }
         else if (fAsync.length > 0) {
            async.parallel(fAsync, function (err, results) {
               logger.debug("DONE", JSON.stringify(results));

               return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: results });
            })
         }
         else {
            return res.status(204).json({ status: true, code: 200, msgCode: "nothing-changed", message: "Nothing's Changed" });
         }
      })
   }
   catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Edit shift
router.put("/shift", (req, res, next) => {
   try {
      var body = req.body || {};
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;

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

         var args = { schema: "Employee", query: [] };
         args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
         
         args.query.push({ $match: { groupId: groupId } });

         args.query.push({
            $lookup: {
               from: "policy",
               let: { pId: "$pId" },
               pipeline: [
                  { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
                  { $project: { _id: 0, office: 1 } }
               ],
               as: "policy"
            }
         });
         args.query.push({ $unwind: "$policy" });

         args.query.push({ $project: { _id: 1, k: "$_id", v: { startAt: "$startAt" } } });

         args.query.push({ $group: { _id: null, a: { $addToSet: { k: "$k", v: "$v" } } } });
         args.query.push({ $project: { _id: 0, a: 1 } });
         args.query.push({ $replaceRoot: { newRoot: { $arrayToObject: "$a" } } });

         JCloud.aggregate(args, (err, result) => {
            if (err) {
               logger.error(err);
            }

            result = result[0];
            var list = Object.keys(body);

            let countInvalidFields = 0;
            var fAsync = [];

            for (let i = 0; i < list.length; i++) {
               let eId = list[i];
               let timesheet = body[eId].timesheet;

               if (timesheet) {
                  var listD = Object.keys(timesheet);
                  for (let k = 0; k < listD.length; k++) {
                     let d = listD[k];
                     let startAt = result[eId].startAt;

                     let diffToday = moment(Util.now("YYYY-MM-DD"), "YYYY-MM-DD").diff(moment(d, "YYYY-MM-DD"), "days");
                     if (diffToday >= 0) {
                        //check startAt vs date.
                        let diff = moment(d, "YYYY-MM-DD").diff(moment(startAt, "YYYY-MM-DD"), "days");

                        if (diff >= 0) {
                           let ddd = moment(d, "YYYY-MM-DD").format("ddd");
                           // logger.debug(ddd, d);

                           var listS = Object.keys(timesheet[d]);

                           for (let s = 0; s < listS.length; s++) {
                              let sId = listS[s];
                              let wd = timesheet[d][sId];

                              if (!wd) wd = 0;

                              if (Util.isNumber(wd) && wd >= 0 && sId) {
                                 wd = Number(wd);
                                 let m = moment(d, "YYYY-MM-DD").format("YYYY-MM");

                                 let newData = { d: d, ddd, m: m, eId: eId, groupId: groupId, sId: sId, wd: wd, editAt: Util.now("YYYY-MM-DD HH:mm:ss") };
                                 logger.debug(JSON.stringify(newData));

                                 fAsync.push(function (cb) {
                                    var editor = { byId: req.userSession._id, byName: req.userSession.name };
                                    // Task.updateCodeShift({ newData, editor, policy }, cb);
                                    Task.updateCodeShift({ newData, editor }, cb);
                                 })
                              }
                              else {
                                 countInvalidFields++;
                                 logger.debug("Code Invalid!");
                              }
                           }
                        }
                        else {
                           countInvalidFields++;
                           logger.debug("Can't update date before startAt");
                        }
                     }
                     else {
                        countInvalidFields++;
                        logger.debug("Can't update date in future");
                     }
                  }
               }
            }

            if (countInvalidFields > 0) {
               return res.status(400).json({ status: false, code: 400, msgCode: "bad-request", message: "Invalid Code or Date before startAt or Date in future" });
            }
            else if (fAsync.length > 0) {
               async.parallel(fAsync, function (err, results) {
                  logger.debug("DONE", JSON.stringify(results));

                  return res.json({ status: true, code: 200, message: "Done", result: results });
               })
            }
            else {
               return res.status(204).json({ status: true, code: 200, msgCode: "nothing-changed", message: "Nothing's Changed" });
            }
         })
      })
   }
   catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//import
router.post("/import", (req, res, next) => {
   var groupId = req.userSession.groupId;
   multer(req, res, function (err) {
      if (err) {
         logger.error(err);
         return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
      }

      try {
         var files = req.files;
         var file = files[0].path;

         Import.getData(groupId, file, (err, result) => {
            return res.json({ status: true, code: 200, message: "Done" });
         });
      } catch (err) {
         logger.error(err);
         return res.json({
            status: false,
            message: err.message
         });
      }

   })
})

module.exports = router;
