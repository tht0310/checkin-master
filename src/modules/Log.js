const moment = require('moment');

module.exports = {
   processOffice: (employee, tsData) => {
      var ddd = Util.now("ddd");
      var d = Util.now("YYYY-MM-DD");

      if (employee.time) {
         ddd = employee.time.ddd;
         d = employee.time.d;
      }

      var policy = employee.policy;
      var office = policy.office;
      var setToday = office[ddd];

      var full = office.full || 8;
      var half = office.half || 4;
      var lateAlert = office.lateAlert || 0;
      var earlyAlert = office.earlyAlert || 0;
      var injuryTime = office.injuryTime || 30;

      var _inAM = (setToday && setToday.inAM) ? setToday.inAM : null;
      var _outAM = (setToday && setToday.outAM) ? setToday.outAM : null;
      var _inPM = (setToday && setToday.inPM) ? setToday.inPM : null;
      var _outPM = (setToday && setToday.outPM) ? setToday.outPM : null;

      //Get policy time in campainy
      var inAM = (_inAM) ? new moment(_inAM, 'HH:mm:ss') : null; //Thoi gian bat dau buoi sang
      var outAM = (_outAM) ? new moment(_outAM, 'HH:mm:ss') : null;//Thoi gian ket thuc buoi sang
      var inPM = (_inPM) ? new moment(_inPM, 'HH:mm:ss') : null; //Thoi gian bat dau buoi chieu
      var outPM = (_outPM) ? new moment(_outPM, 'HH:mm:ss') : null;//Thoi gian ket thuc buoi chieu

      let result = JSON.parse(JSON.stringify(tsData));
      var check = "checkout";
      if (!result.log || result.log.length == 1) {
         check = "checkin";
      }

      if (result.log && result.log.length > 0) result.inAt = result.inAt || result.log[0].t;

      var inAt = new moment(result.inAt, 'HH:mm:ss'); //get firsttime checkin
      var outAt = new moment(result.outAt, 'HH:mm:ss');//get lastime checkout

      var wt = 0; // working time. Gio lam viec.
      var lateIn = result.lateIn || 0;
      var lateOut = result.lateOut || 0;
      var earlyIn = result.earlyIn || 0;
      var earlyOut = result.earlyOut || 0;
      var code = result.code; //Ma Hoa Ngay Cong
      var newData = {};

      //Cham cong thuong
      //Neu nhan binh thuong thi tinh gio giac theo cty qui dinh
      if (typeof employee.checkin != "undefined" || employee.checkin != null) {
         if (inAM && outAM) {
            //Du lieu duoc tinh theo gia tri cuoi cung duoc ghi nhan.
            //Moi lan checkin thi du lieu duoc cap nhat tiep
            if (inAt.diff(inAM, "minutes") < 0) { //Neu vao som buoi sang
               logger.debug("[" + employee._id + "]", "Vao Som Buoi Sang");
               earlyIn = inAM.diff(inAt, "minutes"); //Tinh so phut vao som buoi sang

               inAt = inAM;//Chi ghi nhan dung gio vao theo qui dinh

               //Neu cho phep di som ve som
               if (injuryTime > 0 && earlyIn > 0) {
                  let m = (earlyIn > injuryTime) ? injuryTime : earlyIn;//Cho phep tinh som injuryTime phut
                  inAt = inAM.add(-1 * m, 'minutes')
               }
            }
            else { //Neu di tre
               //Di tre buoi sang 
               if (inAt.diff(inAM, "minutes") > 0 && inAt.diff(outAM, "minutes") < 0) {
                  lateIn = inAt.diff(inAM, "minutes"); //Tinh so phut di tre buoi sang
                  logger.debug("[" + employee._id + "]", "Di tre buoi sang:", lateIn);
               }
               //Nghi buoi sang
               else if (inAt.diff(outAM, "minutes") > 0) {
                  // Nghi buoi sang va di tre buoi chieu
                  if (inAt.diff(inPM, "minutes") > 0) {
                     lateIn = inAt.diff(inPM, "minutes"); //Tinh so phut di tre buoi chieu
                     logger.debug("[" + employee._id + "]", "Nghi buoi sang va di tre buoi chieu:", lateIn);
                  }
                  //Nghi buoi sang va di som buoi chieu
                  else if (inAt.diff(inPM, "minutes") < 0) {
                     earlyIn = inPM.diff(inAt, "minutes"); //Tinh so phut vao som buoi chieu

                     inAt = inPM;//Ghi nhan gio vao lam la dau gio chieu.

                     //Neu cho phep đi som ve som
                     if (injuryTime > 0 && earlyIn > 0) {
                        let m = (earlyIn > injuryTime) ? injuryTime : earlyIn;//Cho phep tinh som m phut
                        inAt = inPM.add(-1 * m, 'minutes')
                     }

                     logger.debug("[" + employee._id + "]", "Nghi buoi sang va di som buoi chieu:", earlyIn);
                  }
               }
            }
         }

         if (inPM && outPM) {
            if (!inAM && !outAM) {
               //Du lieu duoc tinh theo gia tri cuoi cung duoc ghi nhan.
               //Moi lan checkin thi du lieu duoc cap nhat tiep
               if (inAt.diff(inPM, "minutes") <= 0) { //Neu vao som
                  earlyIn = inPM.diff(inAt, "minutes"); //Tinh so phut vao som
                  inAt = inPM;//Chi ghi nhan dung gio vao theo qui dinh

                  //Neu cho phep di som ve som
                  if (injuryTime > 0 && earlyIn > 0) {
                     let m = (earlyIn > injuryTime) ? injuryTime : earlyIn;//Cho phep tinh som injuryTime phut
                     inAt = inPM.add(-1 * m, 'minutes')
                  }
               }
               else if (inAt.diff(inPM, "minutes") > 0) { //Neu di tre
                  lateIn = inAt.diff(inPM, "minutes"); //Tinh so phut di tre
                  logger.debug("Di tre:", lateIn);
               }

               if (outAt.diff(outPM, "minutes") < 0) { //Neu ve som
                  earlyOut = outPM.diff(outAt, "minutes"); //Tinh so phut ve som
                  logger.debug("Di lam buoi chieu ve som:", earlyOut);
               }
               else {//Tre buoi chieu
                  lateOut = outAt.diff(outPM, "minutes");
                  logger.debug("Tre buoi chieu: ", lateOut);
                  outAt = outPM;

                  //Neu cho phep ve tre de bu gio di tre
                  if (injuryTime > 0 && lateOut > 0) {
                     m = (lateOut > injuryTime) ? injuryTime : lateOut;
                     outAt = outPM.add(m, 'minutes')
                  }

                  earlyOut = 0;
               }
            }
            else {
               if (outAt.diff(outPM, "minutes") < 0) { //Neu ve som
                  //Ve som buoi sang.
                  if (outAt.diff(outAM, "minutes") < 0) {
                     earlyOut = outAM.diff(outAt, "minutes"); //Tinh so phut ve som
                     logger.debug("Ve som buoi sang:", earlyOut);
                  }
                  //Lam het buoi sang nhung gio nghi trua ve
                  else if (outAt.diff(outAM, "minutes") > 0 && outAt.diff(inPM, "minutes") < 0) {
                     logger.debug("Lam het buoi sang nhung gio nghi trua ve");
                     outAt = outAM;
                     earlyOut = 0;
                  }
                  //Nghi buoi sang va di lam buoi chieu ve som
                  else if (inAt.diff(outAM, "minutes") > 0 && outAt.diff(outPM, "minutes") < 0) {
                     earlyOut = outPM.diff(outAt, "minutes"); //Tinh so phut ve som
                     logger.debug("Nghi buoi sang va di lam buoi chieu ve som:", earlyOut);
                  }
                  //Lam tu sang toi chieu ve som
                  else if (inAt.diff(outAM, "minutes") < 0 && outAt.diff(outPM, "minutes") < 0) {
                     earlyOut = outPM.diff(outAt, "minutes"); //Tinh so phut ve som
                     logger.debug("Lam tu sang toi chieu ve som:", earlyOut);
                  }
               }
               else { //Neu ve tre
                  //Ve tre buoi sang. Buoi chieu chua biet
                  if (outAt.diff(outAM, "minutes") > 0 && outAt.diff(inPM, "minutes") < 0) {
                     lateOut = outAt.diff(outAM, "minutes"); //Tinh so phut ve tre
                     logger.debug("Ve tre buoi sang. Buoi chieu chua biet:", lateOut);
                  }
                  //Tre buoi chieu
                  else if (outAt.diff(outPM, "minutes") > 0) {
                     lateOut = outAt.diff(outPM, "minutes");
                     logger.debug("Tre buoi chieu: ", lateOut);
                     outAt = outPM;

                     //Neu cho phep ve tre de bu gio di tre
                     if (injuryTime > 0 && lateOut > 0) {
                        m = (lateOut > injuryTime) ? injuryTime : lateOut;
                        outAt = outPM.add(m, 'minutes')
                     }
                  }

                  earlyOut = 0;
               }
            }
         }
         else {//Buoi chieu khong co gio lam
            //Ve som buoi sang.
            if (outAt.diff(outAM, "minutes") < 0) {
               earlyOut = outAM.diff(outAt, "minutes"); //Tinh so phut ve som
               logger.debug("[" + employee._id + "]", "Ve som buoi sang:", earlyOut);
            }
            //Lam het buoi sang
            else if (outAt.diff(outAM, "minutes") > 0) {
               logger.debug("[" + employee._id + "]", "Lam het buoi sang");
               outAt = outAM;
               earlyOut = 0;

               lateOut = outAt.diff(outAM, "minutes"); //Tinh so phut ve tre

               //Neu cho phep ve tre de bu gio di tre
               if (injuryTime > 0 && lateOut > 0) {
                  m = (lateOut > injuryTime) ? injuryTime : lateOut;
                  outAt = outPM.add(m, 'minutes');
               }
            }
         }

         if (inAM && outAM && inPM && outPM) {
            if ((inAt.diff(outAM, "minutes") < 0 && outAt.diff(inPM, "minutes") < 0) || (inAt.diff(outAM, "minutes") > 0 && outAt.diff(inPM, "minutes") > 0)) {
               //Vao buoi sang - Ve buoi sang
               //hoac Vao buoi chieu - Ve buoi chieu
               wt += outAt.diff(inAt, "minutes");
               logger.debug("[" + employee._id + "]", "Lam 1 buoi", wt);
            }

            if (inAt.diff(outAM, "minutes") < 0 && outAt.diff(inPM, "minutes") > 0) {
               //Vao buoi sang - Ve buoi chieu
               wt += outAM.diff(inAt, "minutes");
               wt += outAt.diff(inPM, "minutes");
               logger.debug("[" + employee._id + "]", "Lam 2 buoi", wt);
            }
         }

         if (inAM && outAM && !inPM && !outPM) {
            logger.debug(outAt.format("HH:mm:ss"), inAM.format("HH:mm:ss"));
            wt = outAt.diff(inAt, "minutes");
            logger.debug("[" + employee._id + "]", "Lich lam nua buoi sang va gio lam:", wt);
         }

         if (!inAM && !outAM && inPM && outPM) {
            logger.debug(outAt.format("HH:mm:ss"), inAM.format("HH:mm:ss"));
            wt = outAt.diff(inAt, "minutes");
            logger.debug("[" + employee._id + "]", "Lich lam nua buoi chieu va gio lam:", wt);
         }
      }

      //Cham du ngay cong cho doi tuong khong can cham cong hoac duoc phep di tre
      if ((!employee.checkin || (employee.checkin && employee.checkin.lateAllow == true)) || (typeof employee.checkin == "undefined" || employee.checkin == null)) {
         code = "X";
         lateIn = 0;
         lateOut = 0;
         earlyIn = 0;
         earlyOut = 0;
      }
      else {
         if (wt >= full * 60) {
            code = "X";// Danh dau la X: 1 ngay cong
         }
         else if (wt < half * 60) {
            code = "K";//Tam thoi danh dau la K: Khong Phep. Du lieu se duoc admin cap nhat sau
            if (result.code == "4X,4P" || result.code == "P") {
               code = result.code;
            }
         }
         else {//if (wt < full * 60)
            code = "4X,4K";//Tam thoi danh dau la 4X,4K: Nua ngay cong, Nua ngay khong phep. Du lieu se duoc admin cap nhat sau 
            if (result.code == "4X,4P") {
               code = result.code;
            }
         }
      }

      if (wt < 0) wt = 0;

      newData.lateIn = (lateIn > lateAlert) ? lateIn : 0;
      newData.lateOut = lateOut;
      newData.earlyIn = earlyIn;
      newData.earlyOut = (earlyOut > earlyAlert) ? earlyOut : 0;
      if (newData.earlyIn > 0) newData.lateIn = 0;

      newData.wt = wt;
      newData.code = code;
      newData.inAt = result.inAt;
      newData.outAt = result.outAt;
      newData.check = check;

      newData.hInAt = moment(d + " " + result.inAt, "YYYY-MM-DD HH:mm:ss");
      newData.hOutAt = moment(d + " " + result.outAt, "YYYY-MM-DD HH:mm:ss");

      return newData;
   },
   logTimeOffice: (employee, callback) => {
      // //Log Timesheet
      employee = JSON.parse(JSON.stringify(employee));
      var HH = Util.now("HH:mm:ss");
      var DD = Util.now("YYYY-MM-DD");
      var MM = Util.now("YYYY-MM");
      var ddd = Util.now("ddd");
      var YYYY = Util.now("YYYY");

      if (employee.time) {
         HH = employee.time.HH;
         DD = employee.time.DD;
         MM = employee.time.MM;
         ddd = employee.time.ddd;
         YYYY = employee.time.YYYY;
      }

      var policy = employee.policy;
      var office = policy.office;
      var setToday = office[ddd];
      employee.group = employee.group || {}
      var holidays = employee.group.holidays || employee.policy.holidays || [];

      var full = office.full || 8;
      var half = office.half || 4;
      var lateAlert = office.lateAlert || 0;
      var earlyAlert = office.earlyAlert || 0;

      //Neu roi vao ngay le
      if (holidays.indexOf(DD) != -1) {
         if (employee.checkin && employee.checkin.isOTOff) { //Cho phep OT vao ngay nghi
            return Log.logTimeSheetOnDayOff(employee, callback);
         }
         else {
            if (typeof callback == "function") return callback(null, { wt: 0, message: "Happy holidays!", check: "" });
         }
      }
      //Neu hom nay la ngay nghi
      else if (Object.keys(setToday).length == 0) {
         if (employee.checkin && employee.checkin.isOTOff) { //Cho phep OT vao ngay nghi
            return Log.logTimeSheetOnDayOff(employee, callback);
         }
         else {
            if (typeof callback == "function") return callback(null, { wt: 0, message: "Have a nice day!", check: "" });
         }
      }
      else {
         if (employee.time) {
            var schema = "Timesheet";
            var _id = Util.hashKey(employee._id + employee.groupId + DD);
            // var query = { _id: _id, l: { $nin: ["webhook", "api"] } }
            var query = { _id: _id }

            var doc = { eId: employee._id, groupId: employee.groupId, policy: policy };//remove outAt: HH,
            if (employee.lId) doc.lId = employee.lId;

            var log = { t: HH, l: employee.l, lat: employee.lat || 0, long: employee.long || 0, lId: employee.lId, radius: employee.radius }
            var updateData = { $set: doc, $setOnInsert: { _id: _id, d: DD, m: MM, dow: ddd, inAt: HH, log: [log] } }

            JCloud.findOneAndUpsert({ schema: schema, query: query, update: updateData, prefix: YYYY + "_" }, (err, tsData) => {
               if (err) {
                  logger.error(err);
                  if (typeof callback == "function") return callback(null, { wt: 0, lateIn: 0, earlyOut: 0, check: "" });
               }

               if (tsData) {
                  //Add log unique
                  var newData = { $set: { "log.$.t": HH, "log.$.l": employee.l, "log.$.lat": employee.lat || 0, "log.$.long": employee.long || 0, "log.$.lId": employee.lId, "log.$.radius": employee.radius } }
                  var args = { schema: schema, query: { _id: _id, "log.t": HH, "log.l": employee.l }, update: newData, prefix: YYYY + "_" };
                  logger.debug("[" + employee._id + "]", "CHECKIN LOG UNIQUE", JSON.stringify(args.query))
                  JCloud.findOneAndUpdate(args, (err, result) => {
                     if (err) {
                        logger.error(err);
                     }

                     if (!result) {
                        logger.debug("[" + employee._id + "]", "INSERT NEW LOG", JSON.stringify(log))
                        var newData = { $push: { log: { $each: [log], $sort: { t: 1 } } } };

                        var args = { schema: schema, query: { _id: _id, "log.t": { $ne: HH } }, update: newData, prefix: YYYY + "_" };
                        JCloud.findOneAndUpdate(args, (err, result) => {
                           if (err) {
                              logger.error(err);
                           }
                        })
                     }
                  })

                  // var query = { _id: _id, l: { $nin: ["webhook", "api"] } }
                  var query = { _id: _id }
                  var doc = {
                     inAt: { $cond: { if: { $lt: ["$inAt", HH] }, then: "$inAt", else: HH } },
                     outAt: { $cond: { if: { $gt: ["$outAt", HH] }, then: "$outAt", else: HH } }
                  };//remove outAt: HH,

                  var updateData = [{ $set: doc }]
                  JCloud.findOneAndUpdate({ schema: schema, query: query, update: updateData, prefix: YYYY + "_" }, (err, tsData) => {
                     if (err) {
                        logger.error(err);
                        if (typeof callback == "function") return callback(null, { wt: 0, lateIn: 0, earlyOut: 0, check: "" });
                     }

                     if (tsData) {
                        logger.debug("[" + employee._id + "]", "tsData", JSON.stringify(tsData))
                        if (tsData.l == "webhook" && (tsData.code == "P" || tsData.code == "4P,4K")) {
                           if (typeof callback == "function") return callback(null, { wt: 0, message: "Paid Leave Day", check: "" });
                        }

                        var newData = Log.processOffice(employee, tsData);
                        var wt = newData.wt;
                        var lateIn = newData.lateIn;
                        var lateOut = newData.lateOut;
                        var earlyIn = newData.earlyIn;
                        var earlyOut = newData.earlyOut;
                        var inAt = newData.inAt;
                        var outAt = newData.outAt;
                        var check = newData.check;


                        var schema = "Timesheet";
                        var query = { _id: _id };
                        var update = { $set: newData };

                        JCloud.findOneAndUpdate({ schema: schema, query: query, update: update, isNew: false, prefix: YYYY + "_" }, (err, result) => {
                           if (err) {
                              logger.error(err);
                           }

                           if (!result || result.code != newData.code) {
                              let ts = { d: DD, m: MM, eId: employee._id, groupId: employee.groupId, code: newData.code, byId: employee._id, byName: employee.name, data: newData }
                              Log.logSheet(ts);
                           }
                        })

                        if (check == "checkin") {
                           earlyOut = 0;
                           if (lateIn <= lateAlert) {
                              lateIn = 0;
                           }

                           // if (DD == Util.now("YYYY-MM-DD")) Notify.fcmCheckinSuccess(employee);
                        }
                        else if (check == "checkout") {
                           lateIn = 0;
                           if (earlyOut <= earlyAlert) {
                              earlyOut = 0;
                           }

                           if (wt < full * 60) {
                              earlyOut = 0;
                           }

                           // if (DD == Util.now("YYYY-MM-DD")) Notify.fcmCheckoutSuccess(employee);
                        }


                        if (typeof callback == "function") return callback(null, { wt: wt, check: check, lateIn: lateIn, earlyOut: earlyOut, earlyIn: earlyIn, lateOut: lateOut, check: check, inAt: inAt, outAt: outAt, data: newData });
                     }
                     else {
                        if (typeof callback == "function") return callback(null, { wt: 0, lateIn: 0, earlyOut: 0, check: "" });
                     }
                  })
               }
               else {
                  if (typeof callback == "function") return callback(null, { wt: 0, lateIn: 0, earlyOut: 0, check: "" });
               }
            })
         }
         else {
            var schema = "Timesheet";
            var _id = Util.hashKey(employee._id + employee.groupId + DD);
            // var query = { _id: _id, l: { $nin: ["webhook", "api"] } }
            var query = { _id: _id }

            var doc = { outAt: HH, eId: employee._id, groupId: employee.groupId };
            if (employee.lId) doc.lId = employee.lId;

            var log = { t: HH, l: employee.l, lat: employee.lat || 0, long: employee.long || 0, lId: employee.lId, radius: employee.radius }
            var updateData = { $set: doc, $addToSet: { log }, $setOnInsert: { _id: _id, d: DD, m: MM, dow: ddd, inAt: HH } }

            JCloud.findOneAndUpsert({ schema: schema, query: query, update: updateData, prefix: YYYY + "_" }, (err, tsData) => {
               if (err) {
                  logger.error(err);
                  if (typeof callback == "function") return callback(null, { wt: 0, lateIn: 0, earlyOut: 0, check: "" });
               }

               if (tsData) {
                  if (tsData.l == "webhook" && (tsData.code == "P" || tsData.code == "4P,4K")) {
                     if (typeof callback == "function") return callback(null, { wt: 0, message: "Paid Leave Day", check: "" });
                  }

                  var newData = Log.processOffice(employee, tsData);
                  var wt = newData.wt;
                  var lateIn = newData.lateIn;
                  var lateOut = newData.lateOut;
                  var earlyIn = newData.earlyIn;
                  var earlyOut = newData.earlyOut;
                  var inAt = newData.inAt;
                  var outAt = newData.outAt;
                  var check = newData.check;

                  var schema = "Timesheet";
                  var query = { _id: _id }; // l: { $nin: ["webhook", "api"] }
                  var update = { $set: newData };

                  JCloud.findOneAndUpdate({ schema: schema, query: query, update: update, isNew: false, prefix: YYYY + "_" }, (err, result) => {
                     if (err) {
                        logger.error(err);
                     }

                     if (!result || result.code != newData.code) {
                        let ts = { d: DD, m: MM, eId: employee._id, groupId: employee.groupId, code: newData.code, byId: employee._id, byName: employee.name, data: newData }
                        Log.logSheet(ts);
                     }
                  })

                  if (check == "checkin") {
                     earlyOut = 0;
                     if (lateIn <= lateAlert) {
                        lateIn = 0;
                     }

                     if (employee.l.indexOf("acct") == -1 && employee.l.indexOf("mac_authen") == -1) {
                        Notify.fcmCheckinSuccess(employee);
                     }
                  }
                  else if (check == "checkout") {
                     lateIn = 0;
                     if (earlyOut <= earlyAlert) {
                        earlyOut = 0;
                     }

                     if (wt < full * 60) {
                        earlyOut = 0;
                     }

                     if (employee.l.indexOf("acct") == -1 && employee.l.indexOf("mac_authen") == -1) {
                        Notify.fcmCheckinSuccess(employee);
                     }
                  }

                  if (typeof callback == "function") return callback(null, { wt: wt, check: check, lateIn: lateIn, earlyOut: earlyOut, earlyIn: earlyIn, lateOut: lateOut, check: check, inAt: inAt, outAt: outAt, data: newData });
               }
               else {
                  if (typeof callback == "function") return callback(null, { wt: 0, lateIn: 0, earlyOut: 0, check: "" });
               }
            })
         }
      }
   },
   processShift: ({ employee, objShift, tsData, shift, policy }) => {
      var wt = 0; // so phut lam viec.
      var lateIn;
      var lateOut;
      var earlyIn;
      var earlyOut;
      var code = ""; //Ma Hoa Ngay Cong
      var wd = 0; //So block (đơn vị tính công theo giờ)
      var newData = {};

      var shift = objShift.shift;
      var inAt = objShift.inAt;
      var outAt = objShift.outAt;
      var sId = shift.sId;
      var sName = shift.name;
      var inShift = objShift.inShift;

      tsData = JSON.parse(JSON.stringify(tsData));
      var d = tsData.dInAt || moment().format("YYYY-MM-DD");
      var m = tsData.mInAt || moment().format("YYYY-MM");
      var h = tsData.hInAt || moment().format("YYYY-MM-DD HH:mm:ss");
      var HH = tsData.inAt || moment().format("HH:mm:ss");
      var dowInAt = tsData.dowInAt || moment(d, "YYYY-MM-DD").format("ddd");
      var ddd = tsData.dowInAt || moment(d, "YYYY-MM-DD").format("ddd");

      var dInS = inAt.format("YYYY-MM-DD");
      var mInS = inAt.format("YYYY-MM");
      var hInS = inAt.format("YYYY-MM-DD HH:mm:ss");

      var dowOutS = outAt.format("ddd")
      var dOutS = outAt.format("YYYY-MM-DD");
      var mOutS = outAt.format("YYYY-MM");
      var hOutS = outAt.format("YYYY-MM-DD HH:mm:ss");
      var begin;

      if (shift.breakTime && shift.breakTime.begin && shift.breakTime.end) {
         begin = new moment(inAt.format("YYYY-MM-DD") + " " + shift.breakTime.begin, 'YYYY-MM-DD HH:mm:ss').utcOffset(420);
         if (begin < inAt) {
            begin = new moment(outAt.format("YYYY-MM-DD") + " " + shift.breakTime.begin, 'YYYY-MM-DD HH:mm:ss').utcOffset(420);
         }

         end = new moment(inAt.format("YYYY-MM-DD") + " " + shift.breakTime.end, 'YYYY-MM-DD HH:mm:ss').utcOffset(420);
         if (end < inAt) {
            end = new moment(outAt.format("YYYY-MM-DD") + " " + shift.breakTime.end, 'YYYY-MM-DD HH:mm:ss').utcOffset(420);
         }

         if (begin > outAt || end > outAt) {
            begin == null;
            end == null;
         }
      }

      let lateLabel = "";
      let earlyLabel = "";

      //Get inAt & outAt of shift
      var ts = {};
      ts.inAt = tsData.hInAt || tsData.inAt || h;
      ts.outAt = tsData.hOutAt || tsData.outAt;

      var check = "checkout";
      if (ts.inAt == ts.outAt) {
         check = "checkin";
         newData = {
            dow: dowInAt, // Thu ddd
            dowInAt: ddd, // Thu vao thuc te
            dInS,   //Ngay vao ca YYYY-MM-DD
            mInS,   //Thang vao ca YYYY-MM
            hInS,   //Gio vao ca YYYY-MM-DD HH:mm:ss
            dOutS,  //Ngay vao ca YYYY-MM-DD
            mOutS,  //Ngay vao ca YYYY-MM-DD
            hOutS,  //Gio ra ca YYYY-MM-DD HH:mm:ss
            dInAt: d,   //Gio vao thuc te YYYY-MM-DD
            mInAt: m,   //Gio vao thuc te YYYY-MM
            hInAt: h,   //Gio vao thuc te YYYY-MM-DD HH:mm:ss

            pId: policy._id, //Policy Id
            pType: policy.pType,//Policy Type
            pName: policy.name,//Policy Name
            pFull: policy.full,//Policy Name

            sId: shift.sId, //Shift Id
            sOT: shift.overtime,
            sName: shift.name, //Shift Name
            sIn: shift.in, //Gio vao ca HH:mm:ss
            sOut: shift.out, //Gio ra ca HH:mm:ss
            sDuration: shift.duration, //So phut lam viec
            sType: policy.shiftType || "wd",

            shift, //to Recheck
            policy, //to Recheck

            //for v1
            inAt: HH, //Gio vao HH:mm:ss 
            d: d, m: m,
            _v: _v
         }
      }

      if (ts.inAt.length == 8) {
         ts.inAt = tsData.d + " " + ts.inAt;
         ts.outAt = tsData.d + " " + ts.outAt;
      }

      ts.inAt = new moment(ts.inAt, 'YYYY-MM-DD HH:mm:ss').utcOffset(420); //get firsttime checkin
      ts.outAt = new moment(ts.outAt, 'YYYY-MM-DD HH:mm:ss').utcOffset(420);//get lastime checkout

      if (ts.outAt < ts.inAt) ts.outAt = ts.outAt.add(1, "days");

      logger.debug("[" + employee._id + "]", "Check =", check);
      if (check == "checkin" || employee.time) {
         if (ts.inAt < inAt) { //Di som
            earlyIn = inAt.diff(ts.inAt, "minutes"); //Tinh so phut vao som

            if (!shift.earlyInEarlyOut) {// Neu khong duoc bu gio (di som ve som)
               ts.inAt = inAt;//Ghi nhan theo gio qui dinh
            }

            logger.debug("[" + employee._id + "]", "Vao som ca", sName + 1);
         }
         else { //Di tre
            if (inAt < ts.inAt < outAt) {
               lateIn = ts.inAt.diff(inAt, "minutes"); //Tinh so phut di tre

               logger.debug("[" + employee._id + "]", "Gio vao ca", sName, "(shiftId =", sId, ")", inAt);
               logger.debug("[" + employee._id + "]", "Di tre ca", sName, "(shiftId =", sId, ")", lateIn);
            }
         }

         if (shift.lateIn < lateIn < shift.lateNo) {
            lateLabel = "LateIn";
            logger.debug("[" + employee._id + "]", "Ghi nhan ca", sName, "(shiftId =", sId, ")", "la:", lateLabel);
         }
         else if (lateIn > shift.lateNo) {
            lateLabel = "NoRecord";
            logger.debug("[" + employee._id + "]", "Ghi nhan ca", sName, "(shiftId =", sId, ")", "la:", lateLabel);
         }
      }

      if (ts.outAt < outAt) { // Ve som
         earlyOut = outAt.diff(ts.outAt, "minutes"); //Tinh so phut ve som
         logger.debug("[" + employee._id + "]", "Ve som ca", sName, "(shiftId =", sId, ")", earlyOut);
      }
      else if (ts.outAt > outAt) { // Ve tre
         if (!shift.lateInLateOut) {// Neu khong duoc bu gio (di tre ve tre)
            ts.outAt = outAt;//Ghi nhan theo gio qui dinh
         }

         earlyOut = 0;
         logger.debug("[" + employee._id + "]", "Ve muon ca", sName, "(shiftId =", sId, ")", earlyOut);
      }

      earlyLabel = "";
      if (shift.earlyOut < earlyOut < shift.earlyNo) {
         earlyLabel = "EarlyOut";
         logger.debug("[" + employee._id + "]", "Ghi nhan ca:", sName, "(shiftId =", sId, ")", earlyLabel);
      }
      else if (earlyOut > shift.earlyNo) {
         earlyLabel = "NoRecord";
         logger.debug("[" + employee._id + "]", "Ghi nhan ca:", sName, "(shiftId =", sId, ")", earlyLabel);
      }

      logger.debug("[" + employee._id + "]", "Thoi gian checkin: ", ts.inAt.format("YYYY-MM-DD HH:mm:ss"));
      logger.debug("[" + employee._id + "]", "Thoi gian checkout: ", ts.outAt.format("YYYY-MM-DD HH:mm:ss"));
      if (begin && end) {
         logger.debug("[" + employee._id + "]", "Breaktime begin", begin.format("YYYY-MM-DD HH:mm:ss"));
         logger.debug("[" + employee._id + "]", "Breaktime end", end.format("YYYY-MM-DD HH:mm:ss"));

         if (begin < ts.inAt && ts.inAt < end) {
            logger.debug("[" + employee._id + "]", "Checkin luc breaktime");
            ts.inAt = begin;
         }

         if (begin < ts.outAt && ts.outAt < end) {
            logger.debug("[" + employee._id + "]", "Checkout luc breaktime");
            ts.outAt = end;
         }

         wt += ts.outAt.diff(ts.inAt, "minutes");
         logger.debug("[" + employee._id + "]", "Chua bao gom breakTime", wt);
         if (ts.inAt <= begin && ts.outAt >= end) {
            wt -= end.diff(begin, "minutes");
            logger.debug("[" + employee._id + "]", "Da bao gom breakTime", wt);
         }
      }
      else {
         wt += ts.outAt.diff(ts.inAt, "minutes");
      }

      logger.debug("[" + employee._id + "]", "Ghi nhan ca", sName, "(shiftId =", sId, ")", "lam duoc:", wt, "phut");

      if (wt < 0) wt = 0;

      newData.wt = wt;

      if (code) newData.code = code;
      if (lateIn) newData.lateIn = lateIn;
      if (lateOut) newData.lateOut = lateOut;
      if (earlyIn) newData.earlyIn = earlyIn;
      if (earlyOut || earlyOut == 0) newData.earlyOut = earlyOut;
      if (lateLabel || lateLabel == "") newData.lateLabel = lateLabel;
      if (earlyLabel || earlyLabel == "") newData.earlyLabel = earlyLabel;
      if (wd) newData.wd = wd;
      if (check) newData.check = check;

      newData.hInAt = tsData.hInAt;
      newData.hOutAt = tsData.hOutAt;

      if (employee.time && newData.earlyIn && newData.earlyIn > 0) {
         newData.lateIn = 0
      }

      return newData;
   },
   logTimeSheetShift: (employee, callback) => {
      var DD = Util.now("YYYY-MM-DD");
      var MM = Util.now("YYYY-MM");
      var HH = Util.now("HH:mm:ss");
      var ddd = Util.now("ddd");

      var d = Util.now("YYYY-MM-DD");
      var m = Util.now("YYYY-MM");
      var h = Util.now("YYYY-MM-DD HH:mm:ss");
      var YYYY = Util.now("YYYY");

      if (employee.time) {
         HH = employee.time.HH;
         DD = employee.time.DD;
         MM = employee.time.MM;
         ddd = employee.time.ddd;

         d = employee.time.d;
         m = employee.time.m;
         h = employee.time.h;
      }

      var policy = employee.policy;
      var objShift = employee.objShift;

      var shift = objShift.shift;
      var inAt = objShift.inAt;
      var outAt = objShift.outAt;
      var dowInAt = inAt.format("ddd")
      var dInS = inAt.format("YYYY-MM-DD");
      var mInS = inAt.format("YYYY-MM");
      var hInS = inAt.format("YYYY-MM-DD HH:mm:ss");

      var dowOutS = outAt.format("ddd")
      var dOutS = outAt.format("YYYY-MM-DD");
      var mOutS = outAt.format("YYYY-MM");
      var hOutS = outAt.format("YYYY-MM-DD HH:mm:ss");


      if (employee.lId && shift.lId && shift.lId != employee.lId) {
         logger.debug("[" + employee._id + "]", "Invalid Location", employee.lId);
         return { status: false, wt: 0, message: "Invalid Location", check: "", code: 406 }
      }

      var _id = Util.hashKey(employee._id + employee.groupId + dInS + shift.sId);

      if (employee.time) {
         var schema = "Timesheet";
         // var query = { _id: _id };
         var query = { $or: [{ _id: _id }, { eId: employee._id, groupId: employee.groupId, dInS: dInS, sId: shift.sId }] }
         var doc = { eId: employee._id, groupId: employee.groupId };//remove ,outAt: HH, dOutAt: d, mOutAt: m, hOutAt: h, dowOutAt: ddd 

         // delete employee.lId;

         var log = {};
         log.t = HH;
         log.h = h;
         log.l = employee.l;
         log.lId = employee.lId || 0;
         log.lat = employee.lat || 0;
         log.long = employee.long || 0;
         log.radius = employee.radius;

         let newdata = {
            $set: doc,
            $addToSet: { location }, //remove log,
            $setOnInsert: {
               _id,
               dow: dowInAt, // Thu ddd
               dowInAt: ddd, // Thu vao thu te
               dInS,   //Ngay vao ca YYYY-MM-DD
               mInS,   //Thang vao ca YYYY-MM
               hInS,   //Gio vao ca YYYY-MM-DD HH:mm:ss
               dOutS,  //Ngay vao ca YYYY-MM-DD
               mOutS,  //Ngay vao ca YYYY-MM-DD
               hOutS,  //Gio ra ca YYYY-MM-DD HH:mm:ss

               dInAt: d,   //Gio vao thuc te YYYY-MM-DD
               mInAt: m,   //Gio vao thuc te YYYY-MM
               hInAt: h,   //Gio vao thuc te YYYY-MM-DD HH:mm:ss

               pId: policy._id, //Policy Id
               sId: shift.sId, //Shift Id

               pType: policy.pType,//Policy Type
               pName: policy.name,//Policy Name
               pFull: policy.full,//Policy Name
               sOT: shift.overtime,
               sName: shift.name, //Shift Name
               sIn: shift.in, //Gio vao ca HH:mm:ss
               sOut: shift.out, //Gio ra ca HH:mm:ss
               sDuration: shift.duration, //So phut lam viec
               sType: policy.shiftType || "wd",

               shift, //to Recheck
               policy, //to Recheck

               //for v1
               inAt: HH, //Gio vao HH:mm:ss 
               d: d, m: m,
               log: [log],
               _v: _v
            }
         }

         logger.debug("[" + employee._id + "]", "Insert Timesheet if not exists")
         JCloud.findOneAndUpsert({ schema: schema, query: query, update: newdata, prefix: YYYY + "_" }, (err, tsData) => {
            if (err) {
               logger.error(err);
               return callback(err, null);
            }

            if (tsData) {
               var schema = "Timesheet"
               //Add log unique
               var newData = { $set: { "log.$.t": HH, "log.$.l": employee.l, "log.$.lat": employee.lat || 0, "log.$.long": employee.long || 0, "log.$.lId": employee.lId, "log.$.radius": employee.radius } }

               JCloud.findOneAndUpdate({ schema: schema, query: { _id: _id, "log.t": HH, "log.l": employee.l }, update: newData, prefix: YYYY + "_" }, (err, result) => {
                  if (err) {
                     logger.error(err);
                  }

                  if (!result) {
                     var newData = { $push: { log: { $each: [log], $sort: { t: 1 } } } };

                     JCloud.findOneAndUpdate({ schema: schema, query: { _id: _id, "log.t": { $ne: HH }, "log.l": { $ne: employee.l } }, update: newData, prefix: YYYY + "_" }, (err, result) => {
                        if (err) {
                           logger.error(err);
                        }
                     })
                  }
               })

               var schema = "Timesheet";
               // var query = { _id: _id };
               var query = { $or: [{ _id: _id }, { eId: employee._id, groupId: employee.groupId, dInS: dInS, sId: shift.sId }] }

               var doc = {
                  dInAt: { $cond: { if: { $or: [{ $gt: ["$dInAt", d] }, { $eq: ["$dInAt", null] }] }, then: d, else: "$dInAt" } },   //Gio vao thuc te YYYY-MM-DD
                  mInAt: { $cond: { if: { $or: [{ $gt: ["$mInAt", m] }, { $eq: ["$mInAt", null] }] }, then: m, else: "$mInAt" } },  //Gio vao thuc te YYYY-MM
                  hInAt: { $cond: { if: { $or: [{ $gt: ["$hInAt", h] }, { $eq: ["$hInAt", null] }] }, then: h, else: "$hInAt" } },   //Gio vao thuc te YYYY-MM-DD HH:mm:ss
                  inAt: { $cond: { if: { $or: [{ $gt: ["$inAt", HH] }, { $eq: ["$inAt", null] }] }, then: HH, else: "$inAt" } }, // Gio vao thuc te HH:mm:ss
                  dowInAt: { $cond: { if: { $or: [{ $gt: ["$d", d] }, { $eq: ["$dowInAt", null] }] }, then: ddd, else: "$dowInAt" } }, // Gio vao thuc te HH:mm:ss

                  dOutAt: { $cond: { if: { $or: [{ $lt: ["$dOutAt", d] }, { $eq: ["$dOutAt", null] }] }, then: d, else: "$dOutAt" } },// Gio ra thuc te YYYY-MM-DD
                  mOutAt: { $cond: { if: { $or: [{ $lt: ["$mOutAt", m] }, { $eq: ["$mOutAt", null] }] }, then: m, else: "$mOutAt" } },// Gio ra thuc te YYYY-MM
                  hOutAt: { $cond: { if: { $or: [{ $lt: ["$hOutAt", h] }, { $eq: ["$hOutAt", null] }] }, then: h, else: "$hOutAt" } },// Gio ra thuc te YYYY-MM-DD HH:mm:ss
                  outAt: { $cond: { if: { $or: [{ $lt: ["$outAt", HH] }, { $eq: ["$outAt", null] }] }, then: HH, else: "$outAt" } }, // Gio ra thuc te HH:mm:ss
                  dowOutAt: { $cond: { if: { $or: [{ $lt: ["$d", d] }, { $eq: ["$dowOutAt", null] }] }, then: ddd, else: "$dowOutAt" } },

                  d: dInS, m: mInS,

                  pId: policy._id, //Policy Id
                  sId: shift.sId, //Shift Id

                  pType: policy.pType,//Policy Type
                  pName: policy.name,//Policy Name
                  pFull: policy.full,//Policy Name
                  sOT: shift.overtime,
                  sName: shift.name, //Shift Name
                  sIn: shift.in, //Gio vao ca HH:mm:ss
                  sOut: shift.out, //Gio ra ca HH:mm:ss
                  sDuration: shift.duration, //So phut lam viec
                  sType: policy.shiftType || "wd",

                  shift, //to Recheck
                  policy, //to Recheck
               };//remove outAt: HH,
               var updateData = [{ $set: doc }]

               JCloud.findOneAndUpdate({ schema: schema, query: query, update: updateData, prefix: YYYY + "_" }, (err, tsData) => {
                  if (err) {
                     logger.error(err);
                     return callback(err, null);
                  }

                  if (tsData) {
                     var newData = Log.processShift({ employee, objShift, tsData, shift, policy });

                     var schema = "Timesheet";
                     var query = { $or: [{ _id: _id }, { eId: employee._id, groupId: employee.groupId, dInS: dInS, sId: shift.sId }] }

                     var update = { $set: newData };

                     JCloud.findOneAndUpdate({ schema: schema, query: query, update: update, isNew: false, prefix: YYYY + "_" }, (err, result) => {
                        if (err) {
                           logger.error(err);
                           return callback(err, null);
                        }

                        if (result.code != newData.code) {
                           let ts = { d: DD, m: MM, eId: employee._id, groupId: employee.groupId, code: newData.code, byId: employee._id, byName: employee.name, data: newData };
                           Log.logSheet(ts);
                        }

                        var wt = newData.wt;
                        var lateIn = newData.lateIn;
                        var lateOut = newData.lateOut;
                        var earlyIn = newData.earlyIn;
                        var earlyOut = newData.earlyOut;
                        var inAt = newData.inAt;
                        var outAt = newData.outAt;
                        var check = newData.check;

                        if (check == "checkin") {
                           earlyOut = 0;
                           if (lateIn <= shift.lateIn) {
                              lateIn = 0;
                           }

                           if (DD == Util.now("YYY-MM-DD")) Notify.fcmCheckinSuccess(employee);
                        }
                        else if (check == "checkout") {
                           lateIn = 0;
                           if (earlyOut <= shift.earlyOut || wt >= policy.full * 60) {
                              earlyOut = 0;
                           }

                           if (DD == Util.now("YYY-MM-DD")) Notify.fcmCheckinSuccess(employee);
                        }

                        return callback(null, { wt: wt, check: check, lateIn: lateIn, earlyOut: earlyOut, earlyIn: earlyIn, lateOut: lateOut, check: check, inAt: inAt, outAt: outAt, data: newData });//, objShift
                     })
                  }
               })
            }
         })
      }
      else {
         var schema = "Timesheet";
         // var query = { _id: _id };
         var query = { $or: [{ _id: _id }, { eId: employee._id, groupId: employee.groupId, dInS: dInS, sId: shift.sId }] }

         var doc = {
            eId: employee._id,
            groupId: employee.groupId,
            outAt: HH, dOutAt: d, mOutAt: m, hOutAt: h, dowOutAt: ddd,

            pType: policy.pType,//Policy Type
            pName: policy.name,//Policy Name
            pFull: policy.full,//Policy Name

            sOT: shift.overtime,
            sName: shift.name, //Shift Name
            sIn: shift.in, //Gio vao ca HH:mm:ss
            sOut: shift.out, //Gio ra ca HH:mm:ss
            sDuration: shift.duration, //So phut lam viec
            sType: policy.shiftType || "wd",

            shift, //to Recheck
            policy, //to Recheck
         };

         if (employee.lId) doc.lId = employee.lId;

         var log = { t: HH, h: h, l: employee.l, lat: employee.lat || 0, long: employee.long || 0, lId: employee.lId, radius: employee.radius }

         var location = (employee.lId) ? (employee.lId) : (log.lat.toString() + "," + log.long.toString());

         // delete employee.lId;

         let newdata = {
            $set: doc,
            $addToSet: { log, location },
            $setOnInsert: {
               _id,
               dow: dowInAt, // Thu ddd
               dowInAt: ddd, // Thu vao thu te
               dInS,   //Ngay vao ca YYYY-MM-DD
               mInS,   //Thang vao ca YYYY-MM
               hInS,   //Gio vao ca YYYY-MM-DD HH:mm:ss
               dOutS,  //Ngay vao ca YYYY-MM-DD
               mOutS,  //Ngay vao ca YYYY-MM-DD
               hOutS,  //Gio ra ca YYYY-MM-DD HH:mm:ss
               dInAt: d,   //Gio vao thuc te YYYY-MM-DD
               mInAt: m,   //Gio vao thuc te YYYY-MM
               hInAt: h,   //Gio vao thuc te YYYY-MM-DD HH:mm:ss

               pId: policy._id, //Policy Id
               sId: shift.sId, //Shift Id

               //for v1
               inAt: HH, //Gio vao HH:mm:ss 
               d: d, m: m,
               _v: _v
            }
         }

         JCloud.findOneAndUpsert({ schema: schema, query: query, update: newdata, prefix: YYYY + "_" }, (err, tsData) => {
            if (err) {
               logger.error(err);
               return callback(err, null);
            }

            if (tsData) {
               var newData = Log.processShift({ employee, objShift, tsData, shift, policy });

               var schema = "Timesheet";
               var query = { _id: _id }//, l: { $nin: ["webhook", "api"] }
               var update = { $set: newData };

               JCloud.findOneAndUpdate({ schema: schema, query: query, update: update, isNew: false, prefix: YYYY + "_" }, (err, result) => {
                  if (err) {
                     logger.error(err);
                     return callback(err, null);
                  }

                  if (result.code != newData.code) {
                     let ts = { d: DD, m: MM, eId: employee._id, groupId: employee.groupId, code: newData.code, byId: employee._id, byName: employee.name, data: newData };
                     Log.logSheet(ts);
                  }

                  var wt = newData.wt;
                  var lateIn = newData.lateIn;
                  var lateOut = newData.lateOut;
                  var earlyIn = newData.earlyIn;
                  var earlyOut = newData.earlyOut;
                  var inAt = newData.inAt;
                  var outAt = newData.outAt;
                  var check = newData.check;

                  if (check == "checkin") {
                     earlyOut = 0;
                     if (lateIn <= shift.lateIn) {
                        lateIn = 0;
                     }

                     Notify.fcmCheckinSuccess(employee);
                  }
                  else if (check == "checkout") {
                     lateIn = 0;
                     if (earlyOut <= shift.earlyOut || wt >= policy.full * 60) {
                        earlyOut = 0;
                     }

                     Notify.fcmCheckinSuccess(employee);
                  }

                  return callback(null, { wt: wt, check: check, lateIn: lateIn, earlyOut: earlyOut, earlyIn: earlyIn, lateOut: lateOut, check: check, inAt: inAt, outAt: outAt, data: newData });//, objShift
               })
            }
         })
      }
   },
   logTimeSheet: (employee, callback) => {
      if (employee.policy.type == "Fixed" || employee.policy.pType == "Shift") {
         Checkin.getSchedule(employee, (err, employee) => {
            Checkin.get2Select1Shift(employee, (err, objShift) => {
               if (!objShift) { //Nếu ngoài giờ làm việc
                  employee.group = employee.group || {}
                  var holidays = employee.group.holidays || employee.policy.holidays || [];

                  var DD = Util.now("YYYY-MM-DD");

                  if (employee.time) {
                     DD = employee.time.DD;
                  }

                  if (holidays.indexOf(DD) != -1) {
                     return callback(null, { wt: 0, message: "Happy holidays!", check: "" });
                  }
                  //Neu hom nay la ngay nghi
                  else {
                     return callback(null, { wt: 0, message: "Have a nice day!", check: "" });
                  }
               }

               employee.objShift = objShift;
               Log.logTimeSheetShift(employee, callback);
            })
         })
      }
      else {
         Log.logTimeOffice(employee, callback);
      }
   },
   logTimeSheetOnDayOff: (employee, callback) => {
      // //Log Timesheet
      employee = JSON.parse(JSON.stringify(employee));
      var HH = Util.now("HH:mm:ss");
      var DD = Util.now("YYYY-MM-DD");
      var MM = Util.now("YYYY-MM");
      var ddd = Util.now("ddd");
      var YYYY = Util.now("YYYY");

      if (employee.time) {
         HH = employee.time.HH;
         DD = employee.time.DD;
         MM = employee.time.MM;
         ddd = employee.time.ddd;

         d = employee.time.d;
         m = employee.time.m;
         h = employee.time.h;
      }

      var schema = "Timesheet";

      var _id = Util.hashKey(employee._id + employee.groupId + DD);
      var doc = { outAt: HH, eId: employee._id, groupId: employee.groupId };
      if (employee.lId) doc.lId = employee.lId;

      var query = { _id: _id }
      var newData = { $set: doc, $addToSet: { log: { t: HH, l: employee.l, lat: employee.lat || 0, long: employee.long || 0, lId: employee.lId, radius: employee.radius } }, $setOnInsert: { _id: _id, d: DD, m: MM, dow: ddd, inAt: HH } }

      JCloud.findOneAndUpsert({ schema: schema, query: query, update: newData, prefix: YYYY + "_" }, (err, _result) => {
         if (err) {
            logger.error(err);
            if (typeof callback == "function") return callback(null, { wt: 0, lateIn: 0, earlyOut: 0, check: "" });
         }

         var doc = {
            inAt: { $cond: { if: { $or: [{ $gt: ["$inAt", HH] }, { $eq: ["$inAt", null] }] }, then: HH, else: "$inAt" } },
            outAt: { $cond: { if: { $or: [{ $lt: ["$outAt", HH] }, { $eq: ["$outAt", null] }] }, then: HH, else: "$outAt" } }
         };//remove outAt: HH,

         var updateData = [{ $set: doc }]

         JCloud.findOneAndUpsert({ schema: schema, query: query, update: updateData, prefix: YYYY + "_" }, (err, _result) => {
            if (err) {
               logger.error(err);
               if (typeof callback == "function") return callback(null, { wt: 0, lateIn: 0, earlyOut: 0, check: "" });
            }

            if (_result) {
               let result = JSON.parse(JSON.stringify(_result));
               var check = "checkout";
               if (result.log.length == 1) {
                  check = "checkin";
               }

               if (result.log.length > 0) result.inAt = result.inAt || result.log[0].t;

               var inAt = new moment(result.inAt, 'HH:mm:ss'); //get firsttime checkin
               var outAt = new moment(result.outAt, 'HH:mm:ss');//get lastime checkout

               var wt = outAt.diff(inAt, "minutes");

               if (wt > 240) {
                  var newData = { code: "CC" };
                  var schema = "Timesheet";
                  var query = { _id: _id, l: { $nin: ["webhook", "api"] } }
                  var update = { $set: newData };

                  JCloud.findOneAndUpdate({ schema: schema, query: query, update: update, isNew: false, prefix: YYYY + "_" }, (err, result) => {
                     if (err) {
                        logger.error(err);
                     }

                     if (result.code != newData.code) {
                        let ts = { d: DD, m: MM, eId: employee._id, groupId: employee.groupId, code: newData.code, byId: employee._id, byName: employee.name, data: newData }
                        Log.logSheet(ts);
                     }
                  })
               }

               if (typeof callback == "function") return callback(null, { wt: wt, check: check, outAt: outAt, data: newData });
            }
         });
      });
   },

   logTimeSheetOfficeByExcel: (employee, callback) => {
      // //Log Timesheet
      employee = JSON.parse(JSON.stringify(employee));
      var timesheet = employee.timesheet;

      var HH = timesheet.inAt;
      var inAt = timesheet.inAt;
      var outAt = timesheet.outAt;

      var DD = timesheet.d;
      var MM = timesheet.m
      var ddd = timesheet.ddd;
      var YYYY = Util.now("YYYY");

      var policy = employee.policy;
      employee.group = employee.group || {}
      var holidays = employee.group.holidays || employee.policy.holidays || [];

      var office = policy.office;
      var setToday = office[ddd];

      var full = office.full || 8;
      var half = office.half || 4;
      var lateAlert = office.lateAlert || 0;
      var earlyAlert = office.earlyAlert || 0;

      //Neu roi vao ngay le
      if (holidays.indexOf(DD) != -1) {
         if (employee.checkin && employee.checkin.isOTOff) { //Cho phep OT vao ngay nghi
            return Log.logTimeSheetOnDayOff(employee, callback);
         }
         else {
            if (typeof callback == "function") return callback(null, { wt: 0, message: "Happy holidays!", check: "" });
         }
      }
      //Neu hom nay la ngay nghi
      else if (Object.keys(setToday).length == 0) {
         if (employee.checkin && employee.checkin.isOTOff) { //Cho phep OT vao ngay nghi
            return Log.logTimeSheetOnDayOff(employee, callback);
         }
         else {
            if (typeof callback == "function") return callback(null, { wt: 0, message: "Have a nice day!", check: "" });
         }
      }
      else {
         var _inAM = (setToday && setToday.inAM) ? setToday.inAM : null;
         var _outAM = (setToday && setToday.outAM) ? setToday.outAM : null;
         var _inPM = (setToday && setToday.inPM) ? setToday.inPM : null;
         var _outPM = (setToday && setToday.outPM) ? setToday.outPM : null;

         //Get policy time in campainy
         var inAM = (_inAM) ? new moment(_inAM, 'HH:mm:ss') : null; //Thoi gian bat dau buoi sang
         var outAM = (_outAM) ? new moment(_outAM, 'HH:mm:ss') : null;//Thoi gian ket thuc buoi sang
         var inPM = (_inPM) ? new moment(_inPM, 'HH:mm:ss') : null; //Thoi gian bat dau buoi chieu
         var outPM = (_outPM) ? new moment(_outPM, 'HH:mm:ss') : null;//Thoi gian ket thuc buoi chieu

         var now = moment().utcOffset(420);

         var _id = Util.hashKey(employee._id + employee.groupId + DD);
         var doc = { inAt: inAt, outAt: outAt, eId: employee._id, groupId: employee.groupId, method: timesheet.method, l: employee.timesheet.l };
         if (employee.lId) doc.lId = employee.lId;

         var schema = "Timesheet";
         // var query = { _id: _id, l: { $nin: ["webhook", "api"] } }
         var query = { _id: _id }
         var newData = { $set: doc, $addToSet: { log: { t: HH, l: employee.timesheet.l, lat: employee.lat || 0, long: employee.long || 0, lId: employee.lId, radius: employee.radius } }, $setOnInsert: { _id: _id, d: DD, m: MM, dow: ddd } }

         JCloud.findOneAndUpsert({ schema: schema, query: query, update: newData, prefix: YYYY + "_" }, (err, tsData) => {
            if (err) {
               logger.error(err);
               if (typeof callback == "function") return callback(null, { wt: 0, lateIn: 0, earlyOut: 0, check: "" });
            }

            if (tsData) {
               var newData = Log.processOffice(employee, tsData);
               var wt = newData.wt;
               var lateIn = newData.lateIn;
               var lateOut = newData.lateOut;
               var earlyIn = newData.earlyIn;
               var earlyOut = newData.earlyOut;
               var inAt = newData.inAt;
               var outAt = newData.outAt;
               var check = newData.check;

               var schema = "Timesheet";
               var query = { _id: _id }
               var update = { $set: newData };

               JCloud.findOneAndUpdate({ schema: schema, query: query, update: update, isNew: false, prefix: YYYY + "_" }, (err, result) => {
                  if (err) {
                     logger.error(err);
                  }

                  if (result.code != newData.code) {
                     let ts = { d: DD, m: MM, eId: employee._id, groupId: employee.groupId, code: newData.code, byId: employee._id, byName: employee.name, data: newData };
                     Log.logSheet(ts);
                  }
               })

               if (check == "checkin") {
                  earlyOut = 0;
                  if (lateIn <= lateAlert) {
                     lateIn = 0;
                  }
               }
               else if (check == "checkout") {
                  lateIn = 0;
                  if (earlyOut <= earlyAlert) {
                     earlyOut = 0;
                  }

                  if (wt < full * 60) {
                     earlyOut = 0;
                  }
               }

               if (typeof callback == "function") return callback(null, { wt: wt, check: check, lateIn: lateIn, earlyOut: earlyOut, earlyIn: earlyIn, lateOut: lateOut, check: check, inAt: inAt, outAt: outAt, data: newData });
            }
            else {
               if (typeof callback == "function") return callback(null, { wt: 0, lateIn: 0, earlyOut: 0, check: "" });
            }
         })
      }
   },
   logTimeSheetShiftByExcel: (employee, callback) => {
      var timesheet = employee.timesheet;
      var YYYY = timesheet.YYYY;
      var DD = timesheet.d;
      var MM = timesheet.m
      var HH = timesheet.inAt;

      var d = timesheet.d
      var m = timesheet.m;
      var h = d + " " + timesheet.inAt;
      var YYYY = Util.now("YYYY");

      var dInAt = timesheet.d;
      var dOutAt = timesheet.d;
      var mInAt = timesheet.m;
      var mOutAt = timesheet.m;
      var hInAt = d + " " + timesheet.inAt;
      var hOutAt = d + " " + timesheet.outAt;

      var ddd = timesheet.ddd;

      var policy = employee.policy;
      employee.group = employee.group || {}
      var holidays = employee.group.holidays || employee.policy.holidays || [];

      Checkin.get2Select1Shift(employee, (err, objShift) => {
         if (!objShift) { //Nếu ngoài giờ làm việc            
            if (holidays.indexOf(DD) != -1) {
               return callback(null, { wt: 0, message: "Happy holidays!", check: "" });
            }
            //Neu hom nay la ngay nghi
            else {
               return callback(null, { wt: 0, message: "Have a nice day!", check: "" });
            }
         }

         var begin = null;
         var end = null;

         var shift = objShift.shift;
         var inAt = objShift.inAt;
         var outAt = objShift.outAt;
         var sName = shift.name;
         var sId = shift.sId;
         var inShift = objShift.inShift;

         var dowInAt = inAt.format("ddd");
         var dInS = inAt.format("YYYY-MM-DD");
         var mInS = inAt.format("YYYY-MM");
         var hInS = inAt.format("YYYY-MM-DD HH:mm:ss");

         var dowOutS = outAt.format("ddd");
         var dOutS = outAt.format("YYYY-MM-DD");
         var mOutS = outAt.format("YYYY-MM");
         var hOutS = outAt.format("YYYY-MM-DD HH:mm:ss");

         if (employee.lId && shift.lId && shift.lId != employee.lId) {
            logger.debug("Invalid Location", employee.lId);
            return { status: false, wt: 0, message: "Invalid Location", check: "", code: 406 };
         }

         var check = "checkout";
         var _id = Util.hashKey(employee._id + employee.groupId + dInS + shift._id);

         var doc = { eId: employee._id, groupId: employee.groupId, outAt: timesheet.outAt, dOutAt: dOutAt, mOutAt: mOutAt, hOutAt: hOutAt, dowOutAt: ddd };

         if (employee.lId) doc.lId = employee.lId;

         var schema = "Timesheet";
         var query = { _id: _id, l: { $nin: ["webhook", "api"] } };

         var log = {};
         log.t = HH;
         log.h = h;
         log.l = employee.l;
         log.lId = employee.lId || 0;
         log.lat = employee.lat || 0;
         log.long = employee.long || 0;
         log.radius = employee.radius;

         var location = (employee.lId) ? (employee.lId) : (log.lat.toString() + "," + log.long.toString());

         // delete employee.lId;

         let newdata = {
            $set: doc, $addToSet: { log, location },
            $setOnInsert: {
               _id,
               dow: dowInAt, // Thu ddd
               dowInAt: ddd, // Thu vao thu te
               dInS,   //Ngay vao ca YYYY-MM-DD
               mInS,   //Thang vao ca YYYY-MM
               hInS,   //Gio vao ca YYYY-MM-DD HH:mm:ss
               dOutS,  //Ngay vao ca YYYY-MM-DD
               mOutS,  //Ngay vao ca YYYY-MM-DD
               hOutS,  //Gio ra ca YYYY-MM-DD HH:mm:ss
               dInAt: dInAt,   //Gio vao thuc te YYYY-MM-DD
               mInAt: mInAt,   //Gio vao thuc te YYYY-MM
               hInAt: hInAt,   //Gio vao thuc te YYYY-MM-DD HH:mm:ss

               pId: policy._id, //Policy Id
               pType: policy.pType,//Policy Type
               pName: policy.name,//Policy Name
               pFull: policy.full,//Policy Name

               sId: shift.sId, //Shift Id
               sOT: shift.overtime,
               sName: shift.name, //Shift Name
               sIn: shift.in, //Gio vao ca HH:mm:ss
               sOut: shift.out, //Gio ra ca HH:mm:ss
               sDuration: shift.duration, //So phut lam viec
               sType: policy.shiftType || "wd",

               shift, //to Recheck
               policy, //to Recheck

               //for v1
               inAt: HH, //Gio vao HH:mm:ss 
               d: d, m: m,
               _v: _v
            }
         }

         JCloud.findOneAndUpsert({ schema: schema, query: query, update: newdata, prefix: YYYY + "_" }, (err, tsData) => {
            if (err) {
               logger.error(err);
               return callback(err, null);
            }

            if (tsData) {
               var newData = Log.processShift({ employee, objShift, tsData, shift, policy });
               var wt = newData.wt;
               var lateIn = newData.lateIn;
               var lateOut = newData.lateOut;
               var earlyIn = newData.earlyIn;
               var earlyOut = newData.earlyOut;
               var inAt = newData.inAt;
               var outAt = newData.outAt;


               var schema = "Timesheet";
               var query = { _id: _id }//, l: { $nin: ["webhook", "api"] }
               var update = { $set: newData };

               JCloud.findOneAndUpdate({ schema: schema, query: query, update: update, isNew: false, prefix: YYYY + "_" }, (err, result) => {
                  if (err) {
                     logger.error(err);
                     return callback(err, null);
                  }

                  if (result.code != newData.code) {
                     let ts = { d: DD, m: MM, eId: employee._id, groupId: employee.groupId, code: newData.code, byId: employee._id, byName: employee.name, data: newData };
                     Log.logSheet(ts);
                  }

                  if (check == "checkin") {
                     earlyOut = 0;
                     if (lateIn <= shift.lateIn) {
                        lateIn = 0;
                     }
                  }
                  else if (check == "checkout") {
                     lateIn = 0;
                     if (earlyOut <= shift.earlyOut || wt >= policy.full * 60) {
                        earlyOut = 0;
                     }
                  }

                  return callback(null, { wt: wt, check: check, lateIn: lateIn, earlyOut: earlyOut, earlyIn: earlyIn, lateOut: lateOut, check: check, inAt: inAt, outAt: outAt, data: newData });//, objShift
               })
            }
         })
      });
   },
   logTimeSheetByExcel: (employee, callback) => {
      if (employee.policy.type == "Fixed" || employee.policy.pType == "Shift") {
         Checkin.getSchedule(employee, (err, result) => {
            let employee = JSON.parse(JSON.stringify(result));
            Log.logTimeSheetShiftByExcel(employee, callback);
         })
      }
      else {
         Log.logTimeSheetOfficeByExcel(employee, callback);
      }
   },
   logTimeSheetOnDayOffByExcel: (employee, callback) => {
      // //Log Timesheet
      employee = JSON.parse(JSON.stringify(employee));
      var timesheet = employee.timesheet

      var DD = timesheet.d;
      var MM = timesheet.m
      var HH = timesheet.inAt;
      var ddd = timesheet.ddd;
      var inAt = timesheet.inAt;
      var outAt = timesheet.outAt;
      var YYYY = Util.now("YYYY");

      var schema = "Timesheet";
      var _id = Util.hashKey(employee._id + employee.groupId + DD);
      var doc = { outAt: outAt, eId: employee._id, groupId: employee.groupId };
      if (employee.lId) doc.lId = employee.lId;
      // var query = { _id: _id, l: { $nin: ["webhook", "api"] } }
      var query = { _id: _id }
      var newData = { $set: doc, $addToSet: { log: { t: HH, l: employee.l, lat: employee.lat || 0, long: employee.long || 0, lId: employee.lId, radius: employee.radius } }, $setOnInsert: { _id: _id, d: DD, m: MM, dow: ddd, inAt: HH } }

      JCloud.findOneAndUpsert({ schema: schema, query: query, update: newData, prefix: YYYY + "_" }, (err, _result) => {
         if (err) {
            logger.error(err);
            if (typeof callback == "function") return callback(null, { wt: 0, lateIn: 0, earlyOut: 0, check: "" });
         }

         if (_result) {
            _result = JSON.parse(JSON.stringify(_result));


            let result = JSON.parse(JSON.stringify(_result));
            var check = "checkout";
            if (result.log.length == 1) {
               check = "checkin";
            }

            if (result.log.length > 0) result.inAt = result.inAt || result.log[0].t;

            var inAt = new moment(result.inAt, 'HH:mm:ss'); //get firsttime checkin
            var outAt = new moment(result.outAt, 'HH:mm:ss');//get lastime checkout


            var wt = outAt.diff(inAt, "minutes");

            if (wt > 240) {
               var newData = { code: "CC" };
               var schema = "Timesheet";
               var query = { _id: _id, l: { $nin: ["webhook", "api"] } }
               var update = { $set: newData };

               JCloud.findOneAndUpdate({ schema: schema, query: query, update: update, isNew: false, prefix: YYYY + "_" }, (err, result) => {
                  if (err) {
                     logger.error(err);
                  }

                  if (result.code != newData.code) {
                     let ts = { d: DD, m: MM, eId: employee._id, groupId: employee.groupId, code: newData.code, byId: employee._id, byName: employee.name, data: newData }
                     Log.logSheet(ts);
                  }
               })
            }

            if (typeof callback == "function") return callback(null, { wt: wt, check: check, inAt: inAt, outAt: outAt, data: newData });
         }
      });
   },

   checkTimeSheet: (employee, callback) => {
      // //Log Timesheet
      employee = JSON.parse(JSON.stringify(employee));
      var HH = Util.now("HH:mm:ss");
      var DD = Util.now("YYYY-MM-DD");
      var MM = Util.now("YYYY-MM");
      var ddd = Util.now("ddd");

      // var HH = "17:45:04";
      // var DD = "2023-02-20";
      // var MM = "2023-02";
      // var ddd = "Mon";

      var policy = employee.policy;
      employee.group = employee.group || {}
      var holidays = employee.group.holidays || employee.policy.holidays || [];

      var office = policy.office;
      var setToday = office[ddd];

      var full = office.full || 8;
      var half = office.half || 4;
      var lateAlert = office.lateAlert || 0;
      var earlyAlert = office.earlyAlert || 0;

      //Neu roi vao ngay le
      if (holidays.indexOf(DD) != -1) {
         if (employee.checkin && employee.checkin.isOTOff) { //Cho phep OT vao ngay nghi
            return Log.logTimeSheetOnDayOff(employee, callback);
         }
         else {
            if (typeof callback == "function") return callback(null, { wt: 0, message: "Happy holidays!", check: "" });
         }
      }
      //Neu hom nay la ngay nghi
      else if (Object.keys(setToday).length == 0) {
         if (employee.checkin && employee.checkin.isOTOff) { //Cho phep OT vao ngay nghi
            return Log.logTimeSheetOnDayOff(employee, callback);
         }
         else {
            if (typeof callback == "function") return callback(null, { wt: 0, message: "Have a nice day!", check: "" });
         }
      }
      else {
         var _inAM = (setToday && setToday.inAM) ? setToday.inAM : null;
         var _outAM = (setToday && setToday.outAM) ? setToday.outAM : null;
         var _inPM = (setToday && setToday.inPM) ? setToday.inPM : null;
         var _outPM = (setToday && setToday.outPM) ? setToday.outPM : null;

         //Get policy time in campainy
         var inAM = (_inAM) ? new moment(_inAM, 'HH:mm:ss') : null; //Thoi gian bat dau buoi sang
         var outAM = (_outAM) ? new moment(_outAM, 'HH:mm:ss') : null;//Thoi gian ket thuc buoi sang
         var inPM = (_inPM) ? new moment(_inPM, 'HH:mm:ss') : null; //Thoi gian bat dau buoi chieu
         var outPM = (_outPM) ? new moment(_outPM, 'HH:mm:ss') : null;//Thoi gian ket thuc buoi chieu

         var now = moment().utcOffset(420);

         var _id = Util.hashKey(employee._id + employee.groupId + DD);
         var doc = { outAt: HH, eId: employee._id, groupId: employee.groupId };
         if (employee.lId) doc.lId = employee.lId;

         var schema = "Timesheet";
         var query = { _id: _id }//, l: { $nin: ["webhook", "api"] }

         JCloud.findOne({ schema: schema, query: query }, (err, tsData) => {
            if (err) {
               logger.error(err);
               if (typeof callback == "function") return callback(null, { wt: 0, lateIn: 0, earlyOut: 0, check: "" });
            }

            if (tsData) {
               tsData = JSON.parse(JSON.stringify(tsData));
               tsData.outAt = HH;
            }
            else {
               tsData = { inAt: HH, outAt: HH, code: "", log: [] };
            }

            var newData = Log.processOffice(employee, tsData);
            var wt = newData.wt;
            var lateIn = newData.lateIn;
            var lateOut = newData.lateOut;
            var earlyIn = newData.earlyIn;
            var earlyOut = newData.earlyOut;
            var inAt = newData.inAt;
            var outAt = newData.outAt;
            var check = newData.check;

            if (check == "checkin") {
               earlyOut = 0;
               if (lateIn <= lateAlert) {
                  lateIn = 0;
               }
            }
            else if (check == "checkout") {
               lateIn = 0;
               if (earlyOut <= earlyAlert) {
                  earlyOut = 0;
               }

               if (wt < full * 60) {
                  earlyOut = 0;
               }
            }

            if (typeof callback == "function") return callback(null, { wt: wt, check: check, lateIn: lateIn, earlyOut: earlyOut, earlyIn: earlyIn, lateOut: lateOut, check: check, inAt: inAt, outAt: outAt, data: newData });
         })
      }
   },
   checkTimeSheetOnDayOff: (employee, callback) => {
      // //Log Timesheet
      employee = JSON.parse(JSON.stringify(employee));
      var HH = Util.now("HH:mm:ss");
      var DD = Util.now("YYYY-MM-DD");
      var MM = Util.now("YYYY-MM");
      var ddd = Util.now("ddd");

      var schema = "Timesheet";
      // var query = { _id: _id, l: { $nin: ["webhook", "api"] } }
      var query = { _id: _id }

      JCloud.findOne({ schema: schema, query: query }, (err, _result) => {
         if (err) {
            logger.error(err);
            if (typeof callback == "function") return callback(null, { wt: 0, lateIn: 0, earlyOut: 0, check: "" });
         }

         if (_result) {
            _result = JSON.parse(JSON.stringify(_result));
            _result.outAt = HH;
         }
         else {
            _result = { inAt: HH, outAt: HH, code: "", log: [] };
         }

         _result = JSON.parse(JSON.stringify(_result));


         let result = JSON.parse(JSON.stringify(_result));
         var check = "checkout";
         if (result.log.length == 1) {
            check = "checkin";
         }

         if (result.log.length > 0) result.inAt = result.inAt || result.log[0].t;

         var inAt = new moment(result.inAt, 'HH:mm:ss'); //get firsttime checkin
         var outAt = new moment(result.outAt, 'HH:mm:ss');//get lastime checkout


         var wt = outAt.diff(inAt, "hour");
         if (typeof callback == "function") return callback(null, { wt: wt, check: check, inAt: inAt, outAt: outAt, data: newData });
      });
   },

   logUser: (userlog, callback) => {
      userlog.at = userlog.at || Util.now();
      userlog.d = userlog.d || Util.now("YYYY-MM-DD");

      var schema = "UserLog";
      var _id = Util.hashKey(userlog.eId + userlog.at);
      var query = { _id: _id }
      var newData = { $set: userlog, $setOnInsert: { _id: _id } }

      JCloud.findOneAndUpsert({ schema: schema, query: query, update: newData, prefix: Util.now("YYYY_") }, (err, result) => {
         if (err) {
            logger.error(err)
         }
      })
   },
   sendLogUser(userlog) {
      try {

         // {
         //     userId: String, 
         //     method: Enum[1, 2, 3, 4, 5],
         //     check: Enum["checkin", "checkout"], 

         //     earlyIn: Uint, //So phut vao som
         //     lateIn: UInt, //So phut vao tre

         //     earlyOut: Uint, //So phut ra som
         //     lateOut: UInt, //So phut ra tre

         //     inAt: String<YYYY-MM-DD HH:mm:ss>, //Thoi diem cham cong vao
         //     outAt: String<YYYY-MM-DD HH:mm:ss>, //Thoi diem cham cong ra

         //     at: String<YYYY-MM-DD HH:mm:ss>, //Thoi diem cham cong duoc ghi nhan thuc te (TH may cham cong ghi nhan nhung khong co Internet)
         //     wt: UInt //So phut cham cong ghi nhan duoc tu luc inAt den luc outAt
         // }                

         // var sample = [
         //    { "name": "userId", "value": "duydd1@vntt.com.vn" },
         //    { "name": "method", "value": 1 },
         //    { "name": "check", "value": 1 },
         //    { "name": "earlyIn", "value": 2 },
         //    { "name": "lateIn", "value": 0 },
         //    { "name": "earlyOut", "value": 10 },
         //    { "name": "lateOut", "value": 1 },
         //    { "name": "wt", "value": 10 },
         //    { "name": "inAt", "value": "2023-09-04T03:08:41.434Z" },
         //    { "name": "outAt", "value": "2023-09-04T03:08:43.520Z" },
         //    { "name": "at", "value": "2023-09-04T03:08:45.127Z" }
         // ]

         // format("YYYY-MM-DDTHH:mm:ss.SSSZ")

         // userlog.inAt =  moment.parseZone(userlog.inAt).utc(true).format()

         userlog.inAt = moment.parseZone(userlog.hInAt).utc(true).format()
         userlog.outAt = moment.parseZone(userlog.hOutAt).utc(true).format()

         logger.debug(JSON.stringify(userlog))

         var data = [
            { "name": "userId", "value": userlog.userId },
            { "name": "method", "value": userlog.method },
            { "name": "check", "value": userlog.check },
            { "name": "earlyIn", "value": userlog.earlyIn },
            { "name": "lateIn", "value": userlog.lateIn },
            { "name": "earlyOut", "value": userlog.earlyOut },
            { "name": "lateOut", "value": userlog.lateOut },
            { "name": "wt", "value": userlog.wt },

            { "name": "inAt", "value": userlog.inAt },
            { "name": "outAt", "value": userlog.outAt },
            { "name": "at", "value": userlog.at }
         ]

         var url = "https://workflow.becawork.vn/api/timesheets/apiCheckin";
         var option = { headers: { 'content-type': 'application/json', "ApiKey": "VI8nzd8bhDDgdVGv55OH9rjC73RE1rvW", "ClientId": "duydd1@vntt.com.vn" }, url: url, body: JSON.stringify({ data }) }

         logger.debug("POST", url);
         logger.debug(JSON.stringify(option.headers));
         logger.debug(JSON.stringify({ data }))

         request.post(option, function (err, response, data) {
            if (err) {
               logger.error(err);
            }

            if (data && (data = JSON.parse(data))) {
               if (data.error) {
                  logger.error(err || data.error);
               }

               logger.debug("DATA FROM BECAWORK", JSON.stringify(data));
            }
         });
      }
      catch (err) {
         logger.error(err)
      }
   },
   sendNote({ userId, note, d }) {
      try {
         var data = [
            { name: "userId", value: userId },
            { name: "note", value: note },
            { name: "d", value: d }
         ]

         logger.debug("NOTE SEND TO BECAWORK", JSON.stringify({ data }))

         var url = "https://workflow.becawork.vn/api/timesheets/apiNote";
         var option = { headers: { 'content-type': 'application/json', "ApiKey": "VI8nzd8bhDDgdVGv55OH9rjC73RE1rvW", "ClientId": "duydd1@vntt.com.vn" }, url: url, body: JSON.stringify({ data }) }

         logger.debug(url);
         request.post(option, function (err, response, data) {
            if (err) {
               logger.error(err);
            }

            if (data && (data = JSON.parse(data))) {
               if (data.error) {
                  logger.error(err || data.error);
               }

               logger.debug("DATA FROM BECAWORK", JSON.stringify(data));
            }
         });
      }
      catch (err) {
         logger.error(err)
      }
   },
   logCheat: (userlog, callback) => {
      userlog.at = Util.now();
      userlog.d = Util.now("YYYY-MM-DD");

      // logger.debug(JSON.stringify(userlog));

      var schema = "CheatLog";
      var _id = Util.hashKey(userlog.eId + userlog.at);
      var query = { _id: _id }
      var newData = { $set: userlog, $setOnInsert: { _id: _id } }

      JCloud.findOneAndUpsert({ schema: schema, query: query, update: newData, prefix: Util.now("YYYY_") }, (err, result) => {
         if (err) {
            logger.error(err)
         }
      })
   },
   logSheet: (sheet, cb) => {
      sheet.at = Util.now();
      delete sheet._id;

      var schema = "SheetLog";
      var _id = Util.randomId();
      var query = { _id: _id }
      var newData = { $set: sheet, $setOnInsert: { _id: _id } };

      JCloud.findOneAndUpsert({ schema: schema, query: query, update: newData, prefix: Util.now("YYYY_") }, (err, result) => {
         if (err) {
            logger.error(err);
         }
      })
   },
   logLOA: (loa) => {
      var loa = JSON.parse(JSON.stringify(loa));
      loa.at = Util.now();

      let schema = "LOA";
      var _id = loa._id.toString();
      var query = { _id: _id }
      var newData = { $set: loa, $setOnInsert: { _id: _id } }
      delete loa._id;

      JCloud.findOneAndUpsert({ schema: schema, query: query, update: newData, prefix: Util.now("YYYY_") }, (err, result) => {
         if (err) {
            logger.error(err);
         }
      });
   },
   logOT: (OT) => {
      var OT = JSON.parse(JSON.stringify(OT));
      OT.at = Util.now();
      logger.debug(JSON.stringify(OT));
      let schema = "OT";

      OT.id = OT.id || OT.index;
      OT.tugio = OT.Tugio = OT.tuGio || OT.TuGio;
      OT.dengio = OT.Dengio = OT.denGio || OT.DenGio;
      OT.tonggio = OT.Tonggio = OT.tongGio || OT.TongGio;
      OT.loaigiolamthem = OT.Loaigiolamthem = OT.Loaigiolamthem || OT.loaiGioLamThem || OT.LoaiGioLamThem;
      OT.msnv = OT.MSNV = OT.msnv || OT.MSNV;
      OT.workflowcode = OT.workflowCode || OT.workflowcode;

      var _id = Util.hashKey(OT.workflowCode + OT.msnv + OT.d);
      var query = { $or: [{ _id: _id }, { workflowCode: OT.workflowCode, mssv: OT.msnv, d: OT.d }] }
      var newData = { $set: OT, $setOnInsert: { _id: _id } }
      delete OT._id;

      JCloud.findOneAndUpsert({ schema: schema, query: query, update: newData, prefix: Util.now("YYYY_") }, (err, result) => {
         if (err) {
            logger.error(err);
         }
      });
   },
}
