var router = Express.Router();

//Enabled or Disabled debug mode when runtime.
//Note: Need to request manytime because we have many process.
router.get("/:mode", (req, res, next) => {
    var mode = req.params.mode;
    if (mode == "debug" || mode == "info") {
        logger.info("[CHANGE MODE]:", mode);
        logger.level = mode;
        logger.debug("ONLY SEE WHEN DEBUG");
        return res.send(mode);
    }

    next();
});

module.exports = router;