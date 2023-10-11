const readXlsxFile = require('read-excel-file/node')

global.Import = module.exports = {
   start: (groupId, file, callback) => {
      if (fs.existsSync(file)) {
         // File path.
         readXlsxFile(file).then((rows) => {
            var titleRow = 0;
            var indexCol = 0;//STT
            var fromDate = Util.now("DD//MM/YYYY");
            var toDate = Util.now("DD//MM/YYYY");
            noCol = 0;
            firstCol = 0;
            firstRow = 0;

            for (i = 0, n = rows.length; i < n; i++) {
               var row = rows[i];
               if (!row) continue;

               if (typeof row == "object" && typeof row[0] == 'string' && row[0].indexOf("BẢNG CHẤM CÔNG CHI TIẾT TỪ NGÀY ") != -1) {
                  var sDate = row[0].substring(row[0].indexOf("01", 1));
                  sDate = sDate.replace(" ĐẾN NGÀY ", "-")
                  var aDate = sDate.split("-");
                  fromDate = aDate[0];
                  toDate = aDate[1];
                  continue;
               }


               if (row[indexCol] && row[indexCol] == "STT") {
                  titleRow = i;
                  firstRow = titleRow + 3;

                  for (j = 0, n = row.length; j < n; j++) {
                     if (typeof row == "object" && typeof row[j] == 'string' && row[j].indexOf("MÃ NHÂN VIÊN") != -1) {
                        noCol = j;
                        break;
                     }
                  }

                  row = rows[i + 1];
                  for (j = 0, n = row.length; j < n; j++) {
                     if (typeof row == "object" && row[j] == "1") {//date: 01 of month

                        firstCol = j;
                        break;
                     }

                     continue;
                  }
               }
            }

            fromDate = moment(fromDate, "DD/MM/YYYY");
            toDate = moment(toDate, "DD/MM/YYYY");

            Import.getAllEmployee({ groupId, fromDate, toDate }, (err, result) => {
               logger.debug(JSON.stringify(result));

               nDay = toDate.diff(fromDate, "days");
               logger.debug(titleRow, noCol, fromDate, toDate, firstCol, firstRow, nDay);
               let fAsync = [];

               for (i = firstRow, n = rows.length; i < n; i += 2) { //, n = firstRow + 2
                  let row = rows[i];
                  let staffId = row[noCol];
                  if (staffId) {

                     let employee = result[staffId];

                     if (employee) {

                        for (j = firstCol, nD = (nDay + 2) * 2 + 1; j <= nD; j += 2) {
                           let d = moment(fromDate.format("YYYY-MM") + rows[titleRow + 1][j], "YYYY-MM-DD");

                           let inAt = moment(row[j]).utcOffset(420).format("HH:mm:ss");
                           let outAt = moment(row[j + 1]).utcOffset(420).format("HH:mm:ss");

                           if (inAt == "Invalid date") {
                              logger.debug("Chấm vào: 0");
                              inAt = null;
                           }
                           else {
                              logger.debug("Chấm vào:", inAt);
                           }

                           if (outAt == "Invalid date") {
                              logger.debug("Chấm ra: 0");
                              outAt = inAt;
                           }
                           else {
                              logger.debug("Chấm ra:", outAt);
                           }

                           logger.debug("DATE:", d.format("YYYY-MM-DD"), "IN:", inAt, "OUT:", outAt);

                           if (inAt) {
                              fAsync.push(function (cb) {
                                 let timesheet = {}
                                 timesheet.inAt = inAt;
                                 timesheet.outAt = outAt;
                                 timesheet.YYYY = d.format("YYYY");
                                 timesheet.d = d.format("YYYY-MM-DD");
                                 timesheet.m = d.format("YYYY-MM");
                                 timesheet.ddd = d.format("ddd");
                                 timesheet.method = "FingerprintScanner"
                                 timesheet.l = "FingerprintScanner";
                                 let employee = JSON.parse(JSON.stringify(result[staffId]));
                                 employee.timesheet = timesheet;
                                 return Log.logTimeSheetByExcel(employee, cb);
                              })
                           }
                        }
                     }
                  }
               }

               if (fAsync.length > 0) {
                  async.parallel(fAsync, function (err, results) {
                     logger.debug("DONE");
                     callback(err, "done");
                  });
               }
            })
         })
      }
      else {
         logger.debug("File Not Found!");
      }
   },
   getAllEmployee: (obj, callback) => {
      var groupId = obj.groupId;
      var fromDate = obj.fromDate;
      var toDate = obj.toDate;

      var args = { schema: "Employee", query: [] };
      args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
      
      args.query.push({ $project: { pw: 0, password: 0 } });

      args.query.push({ $match: { $expr: { $and: [{ $lte: [{ $ifNull: ["$startAt", fromDate] }, toDate] }, { $gt: [{ $ifNull: ["$endAt", toDate] }, fromDate] }] } } })

      args.query.push({ $match: { groupId: groupId } });

      args.query.push({
         $lookup: {
            from: "policy",
            let: { pId: "$pId" },
            pipeline: [
               { $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } },
               { $project: { department: 0, position: 0, token: 0, webhook: 0, inherited: 0, status: 0, updatedBy: 0, default: 0, keyword: 0 } }
            ],
            as: "policy"
         }
      });

      args.query.push({ $unwind: "$policy" });
      args.query.push({ $addFields: { employee: { k: "$no", v: "$$ROOT" } } });
      args.query.push({ $group: { _id: null, employee: { $addToSet: "$employee" } } })
      args.query.push({ $replaceRoot: { newRoot: { $arrayToObject: "$employee" } } })

      JCloud.aggregateOne(args, (err, result) => {
         if (err) {
            logger.error(err);
            return callback(err, result);
         }

         if (result) {
            return callback(err, result)
         }
      })
   }
}
