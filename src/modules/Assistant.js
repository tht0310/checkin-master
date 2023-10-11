const JCloud = require('../models/JCloud');

global.Assistant = module.exports = {
   getPages: (args, obj, callback) => {
      var skip = obj.skip;
      var pageSize = obj.pageSize;
      var sort = obj.sort;

      logger.trace(JSON.stringify(obj));
      logger.trace(JSON.stringify(args));

      JCloud.aggregate(args, (err, result) => {
         if (err) {
            logger.error(err);
            return callback({ status: false, message: err.message });
         }

         if (!result || result.length <= 0) {
            var response = { doc: [], total: 0, pages: 0 };
            return callback({ status: true, code: 200, message: "Success", result: response });
         }

         //Assign count.
         var count = result[0].count || 0;
         if (count == 0) {
            var response = { doc: [], total: count, pages: 0 };
            return callback({ status: true, code: 200, message: "Success", result: response });
         }

         //Remove $group
         args.query.pop();

         if (sort) {
            args.query.push({ $sort: sort });
         }

         if (skip) {
            args.query.push({ $skip: skip });
         }

         if (pageSize) {
            args.query.push({ $limit: pageSize });
         }

         JCloud.aggregate(args, (err, result) => {
            if (err) {
               logger.error(err);
               return callback({ status: false, message: err.message });
            }

            var response = {
               doc: result,
               total: count,
               pages: Math.ceil(count / pageSize)
            };

            return callback({ status: true, code: 200, message: "Success", result: response });
         });
      });
   },
   setUserCookie: (userCookie, userId, userAgent, callback) => {
      userCookie = userCookie || '{}';
      userCookie = JSON.parse(userCookie);
      if (!userCookie._id) userCookie._id = Util.randomId();
      userCookie.ua = userAgent;

      var args = { schema: "UserCookie", query: { _id: userCookie._id }, update: { $set: { ua: userCookie.ua }, $addToSet: { ul: userId }, $setOnInsert: { _id: userCookie._id } } }

      JCloud.findOneAndUpsert(args, (err, userCookie) => {
         if (err) {
            logger.error(err);
         }
         userCookie = JSON.parse(JSON.stringify(userCookie));
         return callback(err, userCookie);
      })
   },
   // setUserDevice: ({ uniqueId, groupId, eId, deviceInfo }) => {
   //    var _id = Util.hashKey(groupId + uniqueId);
   //    var args = { schema: "UserDevice", query: { _id: _id }, update: { $set: { deviceInfo: deviceInfo, uniqueId: uniqueId, groupId: groupId } }, $setOnInsert: { _id: _id } }

   //    JCloud.findOneAndUpsert(args, (err, userDevice) => {
   //       if (err) {
   //          logger.error(err);
   //       }

   //       var newData = { $set: { "list.$.eId": eId, "list.$.d": Util.now("YYYY-MM-DD"), "list.$.at": Util.now() } }
   //       var args = { schema: "UserDevice", query: { _id: _id, "list.eId": eId }, update: newData };
   //       JCloud.findOneAndUpdate(args, (err, result) => {
   //          if (err) {
   //             logger.error(err);
   //          }

   //          var newData = { $push: { list: { $each: [{ eId: eId, d: Util.now("YYYY-MM-DD"), at: Util.now() }], $sort: { at: -1 } } } };
   //          var args = { schema: "UserDevice", query: { _id: _id, "list.eId": { $ne: eId } }, update: newData };
   //          JCloud.findOneAndUpdate(args, (err, result) => {
   //             if (err) {
   //                logger.error(err);
   //             }

   //             logger.debug("INSERTED EID");
   //             return;
   //          });
   //       });
   //    });
   // },
   setUserDevice: ({ uniqueId, groupId, eId, deviceInfo }) => {
      var YYYY = Util.now("YYYY");
      var d = Util.now("YYYY-MM-DD");
      var at = Util.now();

      var _id = Util.hashKey(groupId + eId + uniqueId + d);
      var args = { schema: "UserDevice", prefix: YYYY + "_", query: { _id: _id }, update: { $set: { eId: eId, uniqueId: uniqueId, groupId: groupId, deviceInfo: deviceInfo, d: d }, $addToSet: { log: at } }, $setOnInsert: { _id: _id } }
      logger.debug("UserDevice", uniqueId, groupId, eId, deviceInfo);
      JCloud.findOneAndUpsert(args, (err, userDevice) => {
         if (err) {
            logger.error(err);
         }
      });
   },
   loginEOffice: (username, password, callback) => {
      var url = "https://sso.becawork.vn/account/VerfificationClient";
      var data = { username: username, password: password };
      var option = { headers: { 'content-type': 'application/json' }, url: url, body: JSON.stringify(data) }

      logger.debug("Option", JSON.stringify(option));
      request.post(option, function (error, response, data) {
         if (error) {
            if (callback) return callback(error, null);
         }

         if (data && (data = JSON.parse(data))) {
            logger.debug("data", JSON.stringify(data));
            if (callback) return callback(null, data.isValid);
         }

         if (callback) return callback(error, null);
      });
   },
   loginSSO: (token, callback) => {
      var url = "https://service.becawork.vn/identity";
      var option = { headers: { "Authorization": token }, url: url }

      logger.debug("Option", JSON.stringify(option));
      request.get(option, function (error, response, data) {
         if (error) {
            if (callback) return callback(error, null);
         }

         if (response.statusCode == 200) {
            if (callback) return callback(null, true);
         }

         if (callback) return callback(error, null);
      });
   },
   formatFieldName: (oldObj) => {
      var newObj = {}
      var keys = Object.keys(oldObj);

      for (i = 0, n = keys.length; i < n; i++) {
         var key = keys[i];
         var k = key.toLowerCase();
         newObj[k] = oldObj[key]
      }

      return newObj;
   }
}