const router = Express.Router();

//Get profile from banner use when banner need show info (like name age) of visited user
// http://{HOST}/profile.js?mac={mac_device}
router.get('/profile.js', (req, res, next) => {
    try {
        //Get agrument from URL query string
        var arg = req.query || {};

        if (arg.mac_device) {
            var query = { _id: Util.hashKey(arg.mac_device) }
            JCloud.findOneInCache({ schema: "Profile", query: query }, (err, profile) => {
                if (err) return res.send("var profile = {};//get error")
                if (!profile) return res.send("var profile = {};//profile null")
                return res.send("var profile = " + JSON.stringify(profile));
            })
        }
        else {
            return res.send("var profile = {};//mac null")
        }
    }
    catch (err) {
        logger.error(err);
        return res.send("var profile = {};//catch error")
    }
})

//Get profile from banner by campaign use when banner need show info (like name age) of visited user
// http://{HOST}/profilecampaign.js?mac={mac_device}&cId={campaignId}
router.get('/profilecampaign.js', (req, res, next) => {
    try {
        //Get agrument from URL query string
        var arg = req.query || {};

        if (arg.mac_device) {
            var query = { _id: Util.hashKey(arg.mac_device + arg.cId) };

            JCloud.findOneInCache({ schema: "ProfileCampaign", query: query }, (err, profile) => {
                if (err) {
                    logger.error(err);
                    return res.send("var profileCampaign = {};//get error")
                }
                if (!profile) return res.send("var profileCampaign = {};//profile null")
                return res.send("var profileCampaign = " + JSON.stringify(profile));
            })
        }
        else {
            return res.send("var profileCampaign = {};//mac null")
        }
    }
    catch (err) {
        logger.error(err);
        return res.send("var profileCampaign = {};//catch error")
    }
})

module.exports = router;