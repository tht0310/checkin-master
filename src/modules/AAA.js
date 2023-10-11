//AAA: Authentication - Authorization - Acccounting
const router = Express.Router();
const METHOD = { "POST": "CREATE", "GET": "READ", "PUT": "UPDATE", "DELETE": "DELETE" };

router.use((req, res, next) => {
    var token = req.headers.token;

    if (!token) {
        return res.status(403).json({ status: false, code: 403, msgCode: "token-missed", message: "Token missed", code: 190 });
    }

    let decodeToken = Util.decryptToken(token);
    let secret = CONF.SECRET

    if (decodeToken && decodeToken.s) {
        secret += decodeToken.s
    }

    Util.verifyToken(token, secret, (err, result) => {
        if (err) {
            logger.error(err.message);
            return res.status(403).json({ status: false, code: 403, msgCode: "token-invalid", message: "Token invalid", code: 190 });
        }

        var schema = "User";
        if (result.role == "Employee") {
            schema = "Employee";
        }

        var args = { schema: schema, query: [] }
        args.query.push({ $addFields: { groupId: { $ifNull: ["$groupId", "$group"] } } });
        args.query.push({ $match: { _id: result._id } });

        args.query.push({
            $lookup: {
                from: "group",
                let: { groupId: "$groupId" },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ["$_id", "$$groupId"] }] } } },
                    { $project: { _id: 1, name: 1, keyword: 1, type: 1, adminId: 1, permission: 1, inherited: 1 } }
                ],
                as: "group"
            }
        });

        args.query.push({ $unwind: "$group" });
        args.query.push({ $project: { _id: 1, name: 1, username: 1, role: 1, group: 1, groupId: 1, inherited: 1, adminId: 1 } });


        if (result.role == "Employee") {
            //check owner policy
            args.query.push({
                $lookup: {
                    from: "policy",
                    let: { eId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $in: ["$$eId", { $ifNull: ["$owner", []] }] } } },
                        { $group: { _id: null, list: { $addToSet: "$_id" } } }
                    ],
                    as: "owner"
                }
            })

            args.query.push({ $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } });

            //check owner policy
            args.query.push({
                $lookup: {
                    from: "department",
                    let: { eId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $in: ["$$eId", { $ifNull: ["$managers", []] }] } } },
                        { $group: { _id: null, list: { $addToSet: "$_id" } } }
                    ],
                    as: "department"
                }
            })

            args.query.push({ $unwind: { path: "$department", preserveNullAndEmptyArrays: true } });
        }

        JCloud.aggregateOne(args, (err, result) => {
            if (err) {
                logger.error(err);
                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }

            req.userSession = result;
            req.userSession.groupId = req.userSession.group._id;
            req.userSession.adminId = req.userSession.group.adminId || req.userSession.group._id;
            req.userSession.idAdminGroup = (result._id == req.userSession.adminId);
            req.userSession.owner = result.owner;
            req.userSession.listDepartment = req.userSession.listDepartment || [];

            try {
                if (checkPermission(req)) {
                    next();
                }
                else {
                    return res.status(404).json({ status: false, code: 404, msgCode: "not-found", message: "Page Not Found." })
                }
            } catch (err) {
                logger.error(err);
                return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
            }
        })
    })
});

//role v2
const checkPermission = (req) => { //Check permission group of user
    var arrURL = req.originalUrl.split('/');
    var resrc = arrURL[2].toUpperCase();
    var method = METHOD[req.method];
    var permision = resrc + "_" + method;

    var permissionList = JSON.parse(JSON.stringify(CONF.ROLE[req.userSession.role]));

    if (req.userSession.owner && req.userSession.owner.list && req.userSession.owner.list.length > 0) {
        permissionList = JSON.parse(JSON.stringify(CONF.ROLE["Owner"]));
    }

    if (permissionList && permissionList.indexOf(permision) != -1) {
        return true;
    }

    if (arrURL.length > 3 && (req.originalUrl.split("/")[3].toUpperCase() == "CHANGEPASSWORD")) {
        return true;
    }

    if (arrURL[3]) {
        arrURL[3] = arrURL[3].split("?")[0];
        if (method == "READ" && (arrURL[3] == "pages" || arrURL[3] == "list")) {
            return true;
        }
    }

    return false;
}

module.exports = router;
