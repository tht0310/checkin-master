const { getEmployee } = require("../../modules/Checkin");

var router = Express.Router();

//Get a
router.get("/:pId/pages", (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var query = req.query;
      query.groupId = groupId;
      query.pId = req.params.pId;

      Checkin.getPlan(query, (err, response) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message || err });
         }
         return res.json({ status: true, code: 200, message: "Success", result: response });
      })
   } catch (err) {
      logger.error(err);
      return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});


//Edit shift
router.put("/", (req, res, next) => {
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
               let plan = body[eId].plan;

               if (plan) {
                  var listD = Object.keys(plan);
                  for (let k = 0; k < listD.length; k++) {
                     let d = listD[k];
                     let startAt = result[eId].startAt;

                     //check startAt vs date.
                     let diff = moment(d, "YYYY-MM-DD").diff(moment(startAt, "YYYY-MM-DD"), "days");

                     if (diff >= 0) {
                        let ddd = moment(d, "YYYY-MM-DD").format("ddd");
                        // logger.debug(ddd, d);

                        var listS = Object.keys(plan[d]);

                        for (let s = 0; s < listS.length; s++) {
                           let sId = listS[s];
                           let checked = plan[d][sId].checked || false;
                           let sCode = plan[d][sId].sCode || "";
                           if (!checked) sCode = "";

                           let m = moment(d, "YYYY-MM-DD").format("YYYY-MM");

                           let newData = { d: d, ddd, m: m, eId: eId, groupId: groupId, sId: sId, sCode: sCode, checked: checked, editAt: Util.now("YYYY-MM-DD HH:mm:ss") };

                           fAsync.push(function (cb) {
                              var editor = { byId: req.userSession._id, byName: req.userSession.name };
                              Task.updatePlan({ newData, editor }, cb);
                           })
                        }
                     }
                     else {
                        countInvalidFields++;
                        logger.debug("Can't update date before startAt");
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

         //  Import.getData(groupId, file, (err, result) => {
         return res.json({ status: true, code: 200, message: "Done" });
         //  });
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
