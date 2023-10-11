

module.exports = {
    emailCheckinLate: (pId) => {
        logger.debug("[CRON AUTO NOTIFY]");
        var d = Util.now("YYYY-MM-DD");
        var ddd = moment(d, "YYYY-MM-DD").format("ddd");

        var args = { schema: "Employee", query: [] };
        args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
        
        if (process.env.SERVER_MODE != "dev") args.query.push({ $match: { department: { $ne: "TEST" } } });
        args.query.push({ $match: { pId: pId } });
        args.query.push({ $match: { $expr: { $and: [{ $gte: [d, { $ifNull: ["$startAt", d] }] }, { $gte: [{ $ifNull: ["$endAt", d] }, d] }] } } });

        args.query.push({
            $lookup: {
                from: "policy",
                let: { pId: "$pId" },
                pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } }],
                as: "policy"
            }
        });
        args.query.push({ $unwind: "$policy" });

        args.query.push({
            $lookup: {
                from: "timesheet",
                let: { "eId": "$_id", groupId: "$groupId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$eId", "$$eId"] }, { $eq: ["$d", d] }] } } },
                    { $addFields: { code: { $ifNull: ["$code", ""] } } }
                ],
                as: "timesheet"
            }
        });

        args.query.push({ $match: { $expr: { $and: [{ $gt: ["$checkin", null] }, { $eq: ["$timesheet", []] }] } } });
        args.query.push({ $group: { _id: null, email: { $addToSet: "$email" }, policy: { $last: "$policy" } } })

        JCloud.aggregateOne(args, (err, employee) => {
            if (err) {
                logger.error(err);
            }

            if (employee) {
                if (Object.keys(employee.policy.notifyChecked).length > 0) {
                    if ((employee.policy.office && (employee.policy.office[ddd].inAM || employee.policy.office[ddd].inPM)) || (employee.policy.week && employee.policy.week[ddd].length > 0)) {
                        let email = employee.email;
                        logger.debug(email);

                        let subject = employee.policy.notifyLate.subject || "Nhắc nhở chấm công";
                        subject = "[NOREPLY][" + Util.now("DD/MM/YYYY") + "]" + subject;

                        let message = employee.policy.notifyLate.message || "<p><b>Hi!</b></p><p>Đã trễ rồi mà chưa thấy bạn chấm công! <br>Vui lòng chấm công nhé! <br>(Bỏ qua nếu bạn đã chấm công rồi)<p>Thank you!</p><p>BecaWifi</p><p>------------------------</p><p>Power by VNTT Solutions</p>";

                        let mailData = {
                            sender: "No-reply <noreply@becawifi.vn>",
                            email: email,
                            subject: subject,
                            html: message
                        }

                        Util.sendMail(mailData, (err, info) => {
                            if (err) {
                                logger.error(err);
                            }
                            logger.debug(JSON.stringify(info))
                        });
                    }
                }
            }
        })
    },
    emailCheckoutLate: (pId) => {
        logger.debug("[CRON AUTO NOTIFY]");
        var d = Util.now("YYYY-MM-DD");
        var ddd = moment(d, "YYYY-MM-DD").format("ddd");

        var args = { schema: "Employee", query: [] };
        args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
        
        if (process.env.SERVER_MODE != "dev") args.query.push({ $match: { department: { $ne: "TEST" } } });
        args.query.push({ $match: { pId: pId } });
        args.query.push({ $match: { $expr: { $and: [{ $gte: [d, { $ifNull: ["$startAt", d] }] }, { $gte: [{ $ifNull: ["$endAt", d] }, d] }] } } });

        args.query.push({
            $lookup: {
                from: "policy",
                let: { pId: "$pId" },
                pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } }],
                as: "policy"
            }
        });
        args.query.push({ $unwind: "$policy" });

        args.query.push({
            $lookup: {
                from: "timesheet",
                let: { "eId": "$_id", groupId: "$groupId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$eId", "$$eId"] }, { $eq: ["$d", d] }] } } },
                    { $match: { inAt: { $ne: [{ $ifNull: ["$inAt", ""] }, ""] }, code: { $ne: [{ $ifNull: ["$code", ""] }, "X"] } } }
                ],
                as: "timesheet"
            }
        });

        args.query.push({ $match: { $expr: { $and: [{ $gt: ["$checkin", null] }, { $eq: ["$timesheet", []] }] } } });
        args.query.push({ $group: { _id: null, email: { $addToSet: "$email" }, policy: { $last: "$policy" } } })

        JCloud.aggregateOne(args, (err, employee) => {
            if (err) {
                logger.error(err);
            }

            if (employee) {
                if (Object.keys(employee.policy.notifyChecked).length > 0) {
                    if ((employee.policy.office && (employee.policy.office[ddd].inAM || employee.policy.office[ddd].inPM)) || (employee.policy.week && employee.policy.week[ddd].length > 0)) {
                        let email = employee.email;
                        logger.debug(email);

                        let subject = employee.policy.notifyCheckoutLate.subject || "Nhắc nhở chấm công";
                        subject = "[NOREPLY][" + Util.now("DD/MM/YYYY") + "]" + subject;

                        let message = employee.policy.notifyCheckoutLate.message || "<p><b>Hi!</b></p><p>Trước khi về bạn nhớ chấm công nhé!<p>Thank you!</p><p>BecaWifi</p><p>------------------------</p><p>Power by VNTT Solutions</p>";

                        let mailData = {
                            sender: "No-reply <noreply@becawifi.vn>",
                            email: email,
                            subject: subject,
                            html: message
                        }

                        Util.sendMail(mailData, (err, info) => {
                            if (err) {
                                logger.error(err);
                            }
                            logger.debug(JSON.stringify(info))
                        });
                    }
                }
            }
        })
    },
    emailCheckinSuccess: (employee) => {
        if (employee.policy.notifyChecked && Object.keys(employee.policy.notifyChecked).length > 0) {
            let email = employee.email;
            if (Util.isEmail(email)) {
                let subject = employee.policy.notifyChecked.subject || "Thông báo bạn đã chấm công.";
                subject = "[NOREPLY][" + Util.now("DD/MM/YYYY") + "]" + subject;

                let message = employee.policy.notifyChecked.message || "<p><b>Hi!</b></p><p>Cám ơn bạn đã chấm công!<p>Thank you!</p><p>BecaWifi</p><p>------------------------</p><p>Power by VNTT Solutions</p>";
                logger.debug(email);

                let mailData = {
                    sender: "No-reply <noreply@becawifi.vn>",
                    email: email,
                    subject: subject,
                    html: message
                }

                Util.sendMail(mailData, (err, info) => {
                    if (err) {
                        logger.error(err);
                    }
                    logger.debug(JSON.stringify(info))
                });
            }
        }
    },
    fcmCheckinLate: (pId) => {
        logger.debug("[CRON AUTO NOTIFY CHECK IN LATE]", pId);
        var d = Util.now("YYYY-MM-DD");
        var ddd = moment(d, "YYYY-MM-DD").format("ddd");

        var args = { schema: "Employee", query: [] };
        args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
        
        if (process.env.SERVER_MODE != "dev") args.query.push({ $match: { department: { $ne: "TEST" } } });
        args.query.push({ $match: { pId: pId } });
        args.query.push({ $match: { $expr: { $and: [{ $gte: [d, { $ifNull: ["$startAt", d] }] }, { $gte: [{ $ifNull: ["$endAt", d] }, d] }] } } });

        args.query.push({
            $lookup: {
                from: "policy",
                let: { pId: "$pId" },
                pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } }],
                as: "policy"
            }
        });

        args.query.push({ $unwind: "$policy" });

        args.query.push({
            $lookup: {
                from: "timesheet",
                let: { "eId": "$_id", groupId: "$groupId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$eId", "$$eId"] }, { $eq: ["$d", d] }] } } },
                    { $addFields: { code: { $ifNull: ["$code", ""] } } }
                ],
                as: "timesheet"
            }
        });

        args.query.push({ $match: { $expr: { $and: [{ $gt: ["$checkin", null] }, { $eq: ["$timesheet", []] }] } } });
        args.query.push({ $match: { fcmToken: { $ne: null } } });
        args.query.push({ $unwind: "$fcmToken" });


        
        args.query.push({
            $lookup: {
                from: "group",
                let: { groupId: "$groupId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$groupId"] }] } } },
                    { $project: { _id: 1, name: 1, keyword: 1, type: 1, positions: 1, holidays: 1, pcDate: 1, resetDate: 1 } }
                ],
                as: "group"
            }
        });

        args.query.push({ $unwind: { path: "$group", preserveNullAndEmptyArrays: true } });

        args.query.push({
            $lookup: {
                from: "department",
                let: { groupId: "$groupId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$groupId", "$$groupId"] }] } } },
                    { $group: { _id: null, name: { $addToSet: "$name" } } }
                ],
                as: "department"
            }
        });
        args.query.push({ $unwind: { path: "$department", preserveNullAndEmptyArrays: true } });
        args.query.push({ $addFields: { "group.departments": "$department.name" } });


        args.query.push({ $group: { _id: null, listId: { $addToSet: "$_id" }, registration_ids: { $addToSet: "$fcmToken" }, policy: { $last: "$policy" }, group: { $last: "$group" } } })

        logger.debug(JSON.stringify(args.query));
        JCloud.aggregateOne(args, (err, employee) => {
            if (err) {
                logger.error(err);
            }

            logger.debug("LIST EMPLOYEE", JSON.stringify(employee));
            if (employee) {
                logger.debug("Policy: ", JSON.stringify(employee.policy));
                if (employee.policy.notifyLate && Object.keys(employee.policy.notifyLate).length > 0) {
                    employee.group = employee.group || {}
                    var holidays = employee.group.holidays || employee.policy.holidays || [];
                    if (holidays.indexOf(Util.now("YYYY-MM-DD")) != -1) {
                        logger.debug("Today is a holiday")
                        return;
                    }

                    if (!((employee.policy.office && (employee.policy.office[ddd].inAM || employee.policy.office[ddd].inPM)) || (employee.policy.week && employee.policy.week[ddd].length > 0))) {
                        logger.debug("Today is a offday")
                        return;
                    }

                    let title = employee.policy.notifyLate.subject || "Nhắc nhở chấm công";
                    let message = employee.policy.notifyLate.message || "Đã trễ rồi mà chưa thấy bạn chấm công! Vui lòng chấm công nhé!";
                    Checkin.postFCM({registration_ids: employee.registration_ids, title, message, listId: employee.listId, policy: employee.policy.name});
                }
            }
        })
    },
    fcmCheckoutLate: (pId) => {
        logger.debug("[CRON AUTO NOTIFY CHECK OUT LATE]", pId);
        var d = Util.now("YYYY-MM-DD");
        var ddd = moment(d, "YYYY-MM-DD").format("ddd");

        var args = { schema: "Employee", query: [] };
        args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
        
        if (process.env.SERVER_MODE != "dev") args.query.push({ $match: { department: { $ne: "TEST" } } });
        args.query.push({ $match: { pId: pId } });
        args.query.push({ $match: { $expr: { $and: [{ $gte: [d, { $ifNull: ["$startAt", d] }] }, { $gte: [{ $ifNull: ["$endAt", d] }, d] }] } } });

        args.query.push({
            $lookup: {
                from: "policy",
                let: { pId: "$pId" },
                pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$pId"] }] } } }],
                as: "policy"
            }
        });

        args.query.push({ $unwind: "$policy" });

        args.query.push({
            $lookup: {
                from: "timesheet",
                let: { "eId": "$_id", groupId: "$groupId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$eId", "$$eId"] }, { $eq: ["$d", d] }] } } },
                    { $match: { inAt: { $ne: [{ $ifNull: ["$inAt", ""] }, ""] }, code: { $ne: [{ $ifNull: ["$code", ""] }, "X"] } } }
                ],
                as: "timesheet"
            }
        });

        args.query.push({ $match: { $expr: { $and: [{ $gt: ["$checkin", null] }] } } });
        args.query.push({ $unwind: "$fcmToken" });
        args.query.push({ $group: { _id: null, listId: { $addToSet: "$_id" }, registration_ids: { $addToSet: "$fcmToken" }, policy: { $last: "$policy" } } })
       

        logger.debug(JSON.stringify(args.query));
        JCloud.aggregateOne(args, (err, employee) => {
            if (err) {
                logger.error(err);
            }

            logger.debug("LIST EMPLOYEE", JSON.stringify(employee));
            if (employee) {
                logger.debug("Policy: ", JSON.stringify(employee.policy));
                if (employee.policy.notifyCheckoutLate && Object.keys(employee.policy.notifyCheckoutLate).length > 0) {
                    employee.group = employee.group || {}
                    var holidays = employee.group.holidays || employee.policy.holidays || [];
                    if (holidays.indexOf(Util.now("YYYY-MM-DD")) != -1) {
                        logger.debug("Today is a holiday")
                        return;
                    }

                    if (!((employee.policy.office && (employee.policy.office[ddd].inAM || employee.policy.office[ddd].inPM)) || (employee.policy.week && employee.policy.week[ddd].length > 0))) {
                        logger.debug("Today is a offday")
                        return;
                    }

                    let title = employee.policy.notifyCheckoutLate.subject || "Nhắc nhở chấm công";
                    let message = employee.policy.notifyCheckoutLate.message || "Trước khi về bạn nhớ hoàn tất chấm công nhé!";
                    Checkin.postFCM({registration_ids: employee.registration_ids, title, message, listId: employee.listId, policy: employee.policy.name});
                }
            }
        })
    },
    fcmCheckinSuccess: (employee) => {
        logger.debug("[fcmCheckinSuccess]", JSON.stringify(employee.policy));
        if (employee.policy.notifyChecked && Object.keys(employee.policy.notifyChecked).length > 0) {
            let title = "Thông Báo [" + Util.now("HH:mm:ss") + "]"
            let message = employee.policy.notifyChecked.message || "Cám ơn bạn đã chấm công.";
            Checkin.postFCM({registration_ids: employee.fcmToken, title, message, listId: [employee._id]});
        }
    },
}
