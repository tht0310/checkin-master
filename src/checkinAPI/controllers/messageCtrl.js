
var router = Express.Router();

//Get list shift
router.get("/pages", async (req, res, next) => {
   try {
      var query = req.query || {};
      // var groupId = req.userSession.groupId;
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

      var args = { schema: "Message", query: [] }
      args.query.push({ $match: { groupId: groupId } });


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

      //Add $group to count.
      args.query.push({ $group: { _id: null, count: { $sum: 1 } } });


      Assistant.getPages(args, { skip, pageSize, sort }, (response) => {
         return res.json(response);
      })
   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Get a shift
router.get("/:_id", async (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var _id = req.params._id;

      var args = { schema: "Message", query: [] };
      args.query.push({ $match: { _id: _id, groupId: groupId } });

      JCloud.aggregateOne(args, (err, result) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }
         if (!result) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Message Not Found." });

         return res.json({ status: true, code: 200, msgCode: "ok", message: "Success", result: result });
      });


   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Add new shift
router.post("/", async (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;

      var doc = req.body || {};
      doc.createdBy = req.userSession.username;
      doc.keyword = Util.removeDMV(doc.name);
      doc.updatedBy = req.userSession.username;
      doc.updatedAt = Util.now();
      doc.createdAt = Util.now();
      doc.group = groupId;
      doc.groupId = groupId;

      var args = { schema: "Message", update: doc }

      JCloud.save(args, (err, _id) => {
         if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });

         return res.json({ status: true, code: 200, message: "Success", result: _id });
      });
   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Edit shift
router.put("/:_id", async (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;

      var _id = req.params._id;
      var doc = req.body || {};
      doc.keyword = Util.removeDMV(doc.name);
      doc.updatedBy = req.userSession.username;
      doc.updatedAt = Util.now();
      doc.group = groupId;
      doc.groupId = groupId;

      var args = { schema: "Message", query: { _id: _id, groupId: groupId }, update: { $set: doc } }

      JCloud.findOneAndUpdate(args, (err, result) => {
         if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });

         if (!result) {
            return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: 'Message Not Found' });
         }

         return res.json({ status: true, code: 200, message: "Success" });
      })
   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

//Remove shift
router.delete("/:_id", async (req, res, next) => {
   try {
      var groupId = req.userSession.groupId;
      var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
      var _id = req.params._id;
      var args = { schema: "Message", query: { _id: _id, groupId: groupId } };

      JCloud.findOneAndRemove(args, (err, result) => {
         if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
         }
         if (!result) {
            return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Message Not Found" });
         }

         return res.json({ status: true, code: 200, message: "Success" });
      });

   } catch (err) {
      logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
   }
});

module.exports = router;