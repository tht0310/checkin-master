var express = require("express");
var router = Express.Router();

var multer = require('multer')({
    dest: '/tmp/',
    limits: {
        fileSize: 20000000
    }
}).any();

var fs = require('fs');
var shell = require('shelljs');

router.get("/", (req, res, next) => {
    var query = req.query || {};
    var groupId = req.userSession.groupId;
    var inheritedId = (req.userSession.groupType == "C") ? "0" : groupId;

    var search = (query.search) ? JSON.parse(query.search) : {};
    var keys = Object.keys(search);
    var sort = ((query.sort) ? JSON.parse(query.sort) : { createdAt: -1 });
    var args = { schema: "Media", query: [] };

    args.query.push({ $match: { $or: [{ groupId: groupId }, { inherited: { $elemMatch: { $eq: inheritedId } } }] } })

    if (keys.length > 0) {
        keys.forEach((key) => {
            args.query.push({ $match: { [key]: { $regex: search[key], $options: "i" } } });
        });
    }

    if (sort) {
        args.query.push({ $sort: sort });
    }

    JCloud.aggregate(args, (err, result) => {
        if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
        }

        return res.json({ status: true, code: 200, message: "Success", result: { doc: result } });
    })
})

//Upload media of banner
router.post("/", (req, res, next) => {
    var groupId = req.userSession.groupId;
    logger.info(JSON.stringify(req.body))
    multer(req, res, function (err) {
        if (err) {
            logger.error(err);
            return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
        }

        try {
            var doc = req.body || {};

            logger.info(JSON.stringify(req.body))
            doc.groupId = groupId;
            doc.createdBy = req.userSession.username;
            doc.createdAt = Util.now();


            //Declare path store 
            var fullPath = PATH.join(CONF.MEDIA + "/campaign/" + groupId + "/");
            var fullPath2 = PATH.join(CONF.MEDIA_REMOTE + "/campaign/" + groupId + "/");
            var shortPath = "/public/campaign/" + groupId + "/";

            var files = req.files;

            var objFile = {};

            var file = files[0];

            //Get file temp uploaded
            var source = file.path;

            //Get filename
            var fileName = file.fieldname;

            // Declare File Path Storage
            var destination = fullPath + fileName;
            var destination2 = fullPath + fileName; //Thu muc tam de copy qua con chinh

            //Add to objFile to response
            objFile[fileName] = shortPath + fileName;

            // destination += "." + file.mimetype.split('/')[1];
            // objFile[fileName] += "." + file.mimetype.split('/')[1];

            logger.info(source, destination);
            if (process.env.SERVER_MODE == "primary") {
                shell.mkdir('-p', fullPath);
                fs.copyFile(source, destination, (err) => {
                    if (err) {
                        logger.error(err);
                        return res.json({ status: true, code: 200, message: "Failed", })
                    }
                    else {
                        doc.mimetype = file.mimetype;
                        doc.filename = fileName;
                        doc.filesize = file.size;
                        doc.url = objFile[fileName];

                        var args = { schema: "Media", update: doc };

                        JCloud.save(args, (err, result) => {
                            if (err) {
                                logger.error(err);
                                return res.json({ status: true, code: 200, message: "Failed", })
                            }
                            else {
                                return res.json({ status: true, code: 200, message: "Success", result: objFile })
                            }
                        })
                    }
                });
            }
            else {
                shell.mkdir('-p', fullPath2);
                fs.copyFile(source, destination2, (err) => {
                    if (err) {
                        logger.error(err);
                        return res.json({ status: true, code: 200, message: "Failed", })
                    }
                    else {
                        doc.mimetype = file.mimetype;
                        doc.filename = fileName;
                        doc.filesize = file.size;
                        doc.url = objFile[fileName];

                        var args = { schema: "Media", update: doc };

                        JCloud.save(args, (err, result) => {
                            if (err) {
                                logger.error(err);
                                return res.json({ status: true, code: 200, message: "Failed", })
                            }
                            else {
                                return res.json({ status: true, code: 200, message: "Success", result: objFile })
                            }
                        })
                    }
                });

                shell.mkdir('-p', fullPath);
                fs.copyFile(source, destination, (err) => {
                    if (err) {
                        logger.error(err);
                    }
                })
            }
        } catch (err) {
            logger.error(err);
            return res.json({
                status: false,
                message: err.message
            });
        }
    });
});

//Remove media of banner
router.delete("/:filename", (req, res, next) => {
    try {
        var groupId = req.userSession.groupId;
        var filename = req.params.filename;


        var path = "/public/campaign/" + groupId + "/" + filename;

        var args = {
            schema: "Banner", query: {
                $or: [
                    { elements: { $elemMatch: { path: path } } },
                    { elements: { $elemMatch: { "image.path": path } } },
                    { elements: { $elemMatch: { "poster.path": path } } },
                    { elements: { $elemMatch: { "video.path": path } } },
                    { elements: { $elemMatch: { "mobile.path": path } } },
                    { elements: { $elemMatch: { "desktop.path": path } } }
                ]
            }
        }

        logger.debug(JSON.stringify(args.query));

        JCloud.count(args, (err, count) => {
            if (count > 0) {
                return res.status(406).json({ status: false, code: 406, msgCode: "not-acceptable", message: "Can not remove. Media is used to in Campaign." });
            }

            var args = { schema: "Media", query: { groupId: groupId, filename: filename } };

            JCloud.findOneAndRemove(args, (err, result) => {
                if (err) {
                    logger.error(err);
                    return res.json({ status: true, code: 200, message: "Failed", })
                }

                var file = PATH.join(CONF.MEDIA + "/campaign/" + groupId + "/" + filename);
                fs.unlink(file, (err) => {
                    if (err) {
                        logger.error(err);
                        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message});
                    }

                    return res.json({ status: true, code: 200, message: "Success" });
                })
            })
        })
    } catch (err) {
        logger.error(err);
        return res.status(503).json({ status: false, code: 503, msgCode: "error", message: err.message });
    }
});

module.exports = router;