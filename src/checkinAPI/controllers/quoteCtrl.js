var router = Express.Router();
var qr = require('qr-image');

router.get("/", (req, res, next) => {
   var args = { schema: "Quote", query: [{ $sample: { size: 1 } }] };

   JCloud.aggregate(args, (err, result) => {
      if (err) {
         logger.error(err);
      }

      if (result) {
         return res.json({ status: true, code: 200, message: "Success", result: result[0] });
      }
      else {
         return res.json({ status: true, code: 200, message: "Success", result: "" });
      }
   });
})

module.exports = router;