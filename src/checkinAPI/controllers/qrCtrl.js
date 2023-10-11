var router = Express.Router();
var qr = require('qr-image');

router.get("/:_id", (req, res, next) => {
   var _id = req.params._id;
   var args = { schema: "Group", query: { _id: _id } };

   JCloud.findOne(args, (err, result) => {
      if (err) {
         logger.error(err);
      }

      if (result) {
         var content = result.qrcode || _id;
         var code = qr.imageSync(content, { type: 'png', margin: 0, size: 10 });
         res.header('Cache-Control', 'Cache-Control: max-age=60, must-revalidate');
         res.writeHead(200, { 'Content-Type': 'image/png' });
         return res.end(code);
      }
      else {
         res.header('Cache-Control', 'Cache-Control: max-age=60, must-revalidate');
         return res.sendFile(CONF.IMG_1x1, { headers: { 'Content-Type': 'image/gif' } });
      }
   });
})

router.get("/code/:_id", (req, res, next) => {
   var _id = req.params._id;
   var args = { schema: "Group", query: { _id: _id }, select: "_id" };

   JCloud.findOne(args, (err, result) => {
      if (err) {
         logger.error(err);
      }

      if (result) {
         var token = Util.genToken(result, CONF.SECRET, "15s");
         return res.json({ status: true, code: 200, message: "Success", result: token });
      }
      else {
         res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Group Not Found", result: "" });
      }
   })
})

router.get("/codeByLocation/:_id", (req, res, next) => {
   var _id = req.params._id;
   var args = { schema: "Location", query: { _id: _id }, select: "_id" };

   JCloud.findOne(args, (err, result) => {
      if (err) {
         logger.error(err);
      }

      if (result) {
         var token = Util.genToken({ lId: result._id }, CONF.SECRET, "15s");
         return res.json({ status: true, code: 200, message: "Success", result: token });
      }
      else {
         res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Group Not Found", result: "" });
      }
   })
})

module.exports = router;