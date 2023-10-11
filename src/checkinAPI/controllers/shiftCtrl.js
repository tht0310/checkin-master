
var router = Express.Router();

//Get list shift
router.get("/pages", async (req, res, next) => {
	try {
		var query = req.query || {};
		var groupId = req.userSession.groupId;
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

		var args = { schema: "Shift", query: [] }
		args.query.push({ $match: { groupId: groupId } });

		args.query.push({
			$lookup: {
				from: "policy",
				let: { "sId": "$_id" },
				pipeline: [
					{ $addFields: { list: { $concatArrays: ["$week.Mon", "$week.Tue", "$week.Wed", "$week.Thu", "$week.Fri", "$week.Sat", "$week.Sun"] } } },
					{ $unwind: "$list" },
					{ $match: { $expr: { $eq: ["$list.sId", "$$sId"] } } },
					{ $group: { _id: null, listId: { $addToSet: "$_id" } } }
				],
				as: "policy"
			}
		});
		args.query.push({ $unwind: { path: "$policy", preserveNullAndEmptyArrays: true } });

		args.query.push({ $addFields: { isUsed: { $cond: { if: { $gt: [{ $size: { $ifNull: [$policy.listId, []] } }, 0] }, then: true, else: false } } } });
		args.query.push({ $project: { policy: 0 } });

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

//Get list ap by groupId V2
router.get("/list/", (req, res, next) => {
	try {
		var groupId = req.userSession.groupId;
		var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;
		var pId = req.params.pId;

		var args = { schema: "Shift", query: [] }
		args.query.push({ $match: { groupId: groupId } });

		// args.query.push({
		// 	$lookup: {
		// 		from: "policy",
		// 		let: { "sId": "$_id" },
		// 		pipeline: [
		// 			{ $addFields: { list: { $concatArrays: ["$week.Mon", "$week.Tue", "$week.Wed", "$week.Thu", "$week.Fri", "$week.Sat", "$week.Sun"] } } },
		// 			{ $unwind: "$list" },
		// 			{ $match: { $expr: { $eq: ["$list.sId", "$$sId"] } } },
		// 			{ $group: { _id: null, listId: { $addToSet: "$_id" } } }
		// 		],
		// 		as: "policy"
		// 	}
		// });
		// args.query.push({ $unwind: { path: "$policy", preserveNullAndEmptyArrays: true } });

		// args.query.push({ $addFields: { isUsed: { $cond: { if: { $gt: [{ $size: { $ifNull: ["$policy.listId", []] } }, 0] }, then: true, else: false } } } });
		// args.query.push({ $project: { policy: 0 } });

		JCloud.aggregate(args, (err, result) => {
			if (err) {
				logger.error(err);
				return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
			}
			if (!result) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Shift Not Found." });

			return res.json({ status: true, code: 200, message: "Success", result: { doc: result } });
		});

	}
	catch (err) {
		logger.error(err); return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
	}
});

//Get a shift
router.get("/:_id", async (req, res, next) => {
	try {
		var _id = req.params._id;
		var groupId = req.userSession.groupId;

		var args = { schema: "Shift", query: [] };
		args.query.push({ $match: { _id: _id, groupId: groupId } });

		// args.query.push({
		// 	$lookup: {
		// 		from: "policy",
		// 		let: { "sId": "$_id" },
		// 		pipeline: [
		// 			{ $addFields: { list: { $concatArrays: ["$week.Mon", "$week.Tue", "$week.Wed", "$week.Thu", "$week.Fri", "$week.Sat", "$week.Sun"] } } },
		// 			{ $unwind: "$list" },
		// 			{ $match: { $expr: { $eq: ["$list.sId", "$$sId"] } } },
		// 			{ $group: { _id: null, listId: { $addToSet: "$_id" } } }
		// 		],
		// 		as: "policy"
		// 	}
		// });
		// args.query.push({ $unwind: { path: "$policy", preserveNullAndEmptyArrays: true } });
		// args.query.push({
		// 	$lookup: {
		// 		from: "schedule",
		// 		let: { "sId": "$_id" },
		// 		pipeline: [
		// 			{ $unwind: "$shift" },
		// 			{ $match: { $expr: { $eq: ["$shift.sId", "$$sId"] } } },
		// 			{ $group: { _id: null, listId: { $addToSet: "$pId" } } }
		// 		],
		// 		as: "schedule"
		// 	}
		// });
		// args.query.push({ $unwind: { path: "$schedule", preserveNullAndEmptyArrays: true } });

		// args.query.push({ $addFields: { isUsed: { $cond: { if: { $gt: [{ $size: { $ifNull: [{ $concatArrays: ["$policy.listId", "$schedule.listId"] }, []] } }, 0] }, then: true, else: false } } } });

		// args.query.push({ $project: { policy: 0, schedule: 0 } });

		JCloud.aggregateOne(args, (err, result) => {
			if (err) {
				logger.error(err);
				return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
			}
			if (!result) return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Shift Not Found." });

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
		if (typeof doc.overtime == "undefined") doc.overtime = true;

		var args = { schema: "Shift", query: { name: doc.name, groupId: groupId } };

		JCloud.count(args, (err, result) => {
			if (err) {
				logger.error(err);
				return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
			}

			if (result != 0) { return res.status(409).json({ status: false, code: 409, msgCode: "name-exists", message: 'Shift Name duplicated!' }) }

			var inAt = moment(Util.now("YYYY-MM-DD") + " " + doc.in, "YYYY-MM-DD HH:mm:ss");
			var outAt = moment(Util.now("YYYY-MM-DD") + " " + doc.out, "YYYY-MM-DD HH:mm:ss");
			if (outAt <= inAt) {
				outAt = outAt.add(1, "days");
			}
			doc.duration = outAt.diff(inAt, "minutes");

			if (doc.type = "Fixed" && doc.breakTime && doc.breakTime.begin && doc.breakTime.end) {
				var begin = moment(Util.now("YYYY-MM-DD") + " " + doc.breakTime.begin, "YYYY-MM-DD HH:mm:ss");
				var end = moment(Util.now("YYYY-MM-DD") + " " + doc.breakTime.end, "YYYY-MM-DD HH:mm:ss");

				if (end < begin) {
					end = end.add(1, "days");
				}

				doc.duration = doc.duration - end.diff(begin, "minutes");
			}

			doc.duration = Number((doc.duration / 60).toFixed(1));

			var args = { schema: "Shift", update: doc }

			JCloud.save(args, (err, _id) => {
				if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });

				return res.json({ status: true, code: 200, message: "Success", result: _id });
			});
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

		var args = { schema: "Shift", query: { _id: { $ne: _id }, name: doc.name } };

		JCloud.count(args, (err, result) => {
			if (err) {
				logger.error(err);
				return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
			}

			if (result != 0) { return res.status(409).json({ status: false, code: 409, msgCode: "name-exists", message: 'Shift Name duplicated!' }) }

			var inAt = moment(Util.now("YYYY-MM-DD") + " " + doc.in, "YYYY-MM-DD HH:mm:ss");
			var outAt = moment(Util.now("YYYY-MM-DD") + " " + doc.out, "YYYY-MM-DD HH:mm:ss");
			if (outAt <= inAt) {
				outAt.add(1, "days");
			}
			doc.duration = outAt.diff(inAt, "minutes");

			if (doc.type = "Fixed" && doc.breakTime && doc.breakTime.begin && doc.breakTime.end) {
				var begin = moment(Util.now("YYYY-MM-DD") + " " + doc.breakTime.begin, "YYYY-MM-DD HH:mm:ss");
				var end = moment(Util.now("YYYY-MM-DD") + " " + doc.breakTime.end, "YYYY-MM-DD HH:mm:ss");

				if (end < begin) {
					end = end.add(1, "days");
				}

				doc.duration = doc.duration - end.diff(begin, "minutes");
			}

			doc.duration = Number((doc.duration / 60).toFixed(1));
			var args = { schema: "Shift", query: { _id: _id }, update: { $set: doc } }

			JCloud.findOneAndUpdate(args, (err, result) => {
				if (err) return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });

				if (!result) {
					return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: 'Shift Not Found' });
				}

				return res.json({ status: true, code: 200, message: "Success" });
			})
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

		var args = { schema: "Policy", query: [] };
		args.query.push({ $addFields: { pType: { $ifNull: ["$pType", { $cond: { if: { $eq: ["$type", "Fixed"] }, then: "Shift", else: "Office" } }] } } });
		args.query.push({ $match: { pType: "Shift" } });

		args.query.push({ $addFields: { list: { $concatArrays: ["$week.Mon", "$week.Tue", "$week.Wed", "$week.Thu", "$week.Fri", "$week.Sat", "$week.Sun"] } } });
		args.query.push({ $project: { list: 1 } });
		args.query.push({ $match: { "list.sId": _id } });

		JCloud.aggregateOne(args, (err, result) => {
			if (err) {
				logger.error(err);
				return res.status(503).json({ status: false, code: 503, msgCode: "error", message: error.message });
			}

			if (result) {
				return res.json({ status: false, msgCode: "used", message: "This shift is used!" });
			}

			var args = { schema: "Shift", query: { _id: _id, groupId: groupId } };

			JCloud.findOneAndRemove(args, (err, result) => {
				if (err) {
					logger.error(err);
					return res.status(503).json({ status: false, code: 503, message: err.message });
				}

				if (result && result.value) {
					return res.json({ status: true, code: 200, message: "Success" });
				}

				return res.json({ status: false, msgCode: "not-found", message: "Shift Not Found" });
			});
		})
	} catch (err) {
		logger.error(err);
		return res.status(503).json({ status: false, code: 503, msgCode: "error", message: error.message });
	}
});

module.exports = router;
