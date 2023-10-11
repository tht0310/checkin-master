//Module filter banner by condition.
const JCloud = require(__ + '/models/JCloud');

module.exports = {
    check: (profile, banner, callback) => {
        var OpAnd = true
        var OpOr = false
        var array = []
        banner.targets.forEach(target => {
            if (target) {
                array.push((cb) => {
                    try {
                        var obj = { profile: profile, banner: banner, target: target }
                        logger.debug(JSON.stringify(obj.target));
                        eval("Target." + target.fn + "(obj, cb);")
                    } catch (err) {
                        logger.error("[Target]", err, target.fn)
                        return cb(null, { op: target.op, flag: false })
                    }
                })
            }
        })
        async.parallel(array, (err, listTarget) => {
            if (listTarget.length) listTarget.forEach(item => {
                if (item.op == 'AND') OpAnd = item.flag && OpAnd
                else if (item.op == 'OR') OpOr = item.flag || OpOr
            })
            logger.debug(OpAnd || OpOr)
            return callback(OpAnd || OpOr)
        })
    },
    //Check number impression of Banner: Only run base on number impression of Banner
    bImpression: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var _id = (target.key) ? Util.hashKey(profile.mac_device + target.key) : Util.hashKey(profile.mac_device + banner._id);
            JCloud.findOne({ schema: "BannerBehavior", query: { _id: _id } }, (err, result) => {
                if (err) {
                    logger.error("", err);
                    return cb(null, { op: target.op, flag: false })
                }

                if (!result) result = { imp: 0 };
                switch (target.subOp) {
                    case '=':
                    case '==':
                        return cb(null, { op: target.op, flag: result.imp == target.value })
                        break;
                    case '>=':
                        return cb(null, { op: target.op, flag: result.imp >= target.value })
                        break;
                    case '<=':
                        return cb(null, { op: target.op, flag: result.imp <= target.value })
                        break;
                    case 'mod':
                        if (target.field) {
                            var mod = result.imp % target.field;
                            return cb(null, { op: target.op, flag: mod <= target.value })
                        }
                        else {
                            return cb(null, { op: target.op, flag: false })
                        }
                        break;
                    default:
                        return cb(null, { op: target.op, flag: false })
                }
            })
        } catch (err) {
            logger.error("checkVisitBanner", err);
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check number impression of Campaign: Only run base on number impression of Campaign
    cImpression(obj, cb) {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var _id = (target.key) ? Util.hashKey(profile.mac_device + target.key) : Util.hashKey(profile.mac_device + banner.campaign._id);
            JCloud.findOne({ schema: "CampaignBehavior", query: { _id: _id } }, (err, result) => {
                if (err) {
                    logger.error("", err);
                    return cb(null, { op: target.op, flag: false })
                }

                if (!result) result = { imp: 0 };
                switch (target.subOp) {
                    case '=':
                    case '==':
                        return cb(null, { op: target.op, flag: result.imp == target.value })
                        break
                    case '>=':
                        return cb(null, { op: target.op, flag: result.imp >= target.value })
                        break
                    case '<=':
                        return cb(null, { op: target.op, flag: result.imp <= target.value })
                        break
                    case 'mod':
                        if (target.field) {
                            var mod = result.imp % target.field;
                            return cb(null, { op: target.op, flag: mod <= target.value })
                        }
                        else {
                            return cb(null, { op: target.op, flag: false })
                        }
                        break;
                    default:
                        return cb(null, { op: target.op, flag: false })
                }
            })
        } catch (err) {
            logger.error("checkImpressionCampaign", err);
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check number click Banner: Only run base on number click of Campaign
    bClick: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var _id = (target.key) ? Util.hashKey(profile.mac_device + target.key) : Util.hashKey(profile.mac_device + banner._id);
            JCloud.findOne({ schema: "BannerBehavior", query: { _id: _id } }, (err, result) => {
                if (err) {
                    logger.error("", err);
                    return cb(null, { op: target.op, flag: false })
                }

                if (!result) result = { cli: 0 };
                logger.debug("bClick", result.cli, target.subOp, target.value);
                switch (target.subOp) {
                    case '=':
                    case '==':
                        return cb(null, { op: target.op, flag: result.cli == target.value })
                        break
                    case '>=':
                        return cb(null, { op: target.op, flag: result.cli >= target.value })
                        break
                    case '<=':
                        return cb(null, { op: target.op, flag: result.cli <= target.value })
                        break
                    case 'mod':
                        if (target.field) {
                            var mod = result.cli % target.field;
                            return cb(null, { op: target.op, flag: mod <= target.value })
                        }
                        else {
                            return cb(null, { op: target.op, flag: false })
                        }
                        break;
                    default:
                        return cb(null, { op: target.op, flag: false })
                }
            })
        } catch (err) {
            logger.error("checkClickBanner", err)
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check number click Campaign: Only run base on number click of Campaign
    cClick: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var _id = (target.key) ? Util.hashKey(profile.mac_device + target.key) : Util.hashKey(profile.mac_device + banner.campaign._id);
            JCloud.findOne({ schema: "CampaignBehavior", query: { _id: _id } }, (err, result) => {
                if (err) {
                    logger.error("", err)
                    return cb(null, { op: target.op, flag: false })
                }

                if (!result) result = { cli: 0 };
                switch (target.subOp) {
                    case '=':
                    case '==':
                        return cb(null, { op: target.op, flag: result.cli == target.value })
                        break;
                    case '>=':
                        return cb(null, { op: target.op, flag: result.cli >= target.value })
                        break;
                    case '<=':
                        return cb(null, { op: target.op, flag: result.cli <= target.value })
                        break;
                    case 'mod':
                        if (target.field) {
                            var mod = result.cli % target.field;
                            return cb(null, { op: target.op, flag: mod <= target.value })
                        }
                        else {
                            return cb(null, { op: target.op, flag: false })
                        }
                        break;
                    default:
                        return cb(null, { op: target.op, flag: false })
                }
            })
        } catch (err) {
            logger.error("checkClickCampaign", err)
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check number watch video Banner: Only run base on number watch video of Campaign
    bWatch: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var _id = (target.key) ? Util.hashKey(profile.mac_device + target.key) : Util.hashKey(profile.mac_device + banner._id);
            JCloud.findOne({ schema: "BannerBehavior", query: { _id: _id } }, (err, result) => {
                if (err) {
                    logger.error("", err)
                    return cb(null, { op: target.op, flag: false })
                }

                if (!result) result = { w_0: 0, w_25: 0, w_50: 0, w_75: 0, w_100: 0 };

                switch (target.subOp) {
                    case '=':
                    case '==':
                        return cb(null, { op: target.op, flag: result[target.field] == target.value })
                        break;
                    case '>=':
                        return cb(null, { op: target.op, flag: result[target.field] >= target.value })
                        break;
                    case '<=':
                        return cb(null, { op: target.op, flag: result[target.field] <= target.value })
                        break;
                    default:
                        return cb(null, { op: target.op, flag: false })
                }
            })
        } catch (err) {
            logger.error("checkWatchBanner", err)
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check number watch video Campaign: Only run base on number watch video of Campaign
    cWatch: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var _id = (target.key) ? Util.hashKey(profile.mac_device + target.key) : Util.hashKey(profile.mac_device + banner.campaign._id);

            JCloud.findOne({ schema: "CampaignBehavior", query: { _id: _id } }, (err, result) => {
                if (err) {
                    logger.error("", err)
                    return cb(null, { op: target.op, flag: false })
                }

                if (!result) result = { w_0: 0, w_25: 0, w_50: 0, w_75: 0, w_100: 0 };

                switch (target.subOp) {
                    case '=':
                    case '==':
                        return cb(null, { op: target.op, flag: result[target.field] == target.value })
                        break;
                    case '>=':
                        return cb(null, { op: target.op, flag: result[target.field] >= target.value })
                        break;
                    case '<=':
                        return cb(null, { op: target.op, flag: result[target.field] <= target.value })
                        break;
                    default:
                        return cb(null, { op: target.op, flag: false })
                }
            })
        } catch (err) {
            logger.error("checkWatchCampaign", err)
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check number visit becawifi.
    jVisit: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var _id = Util.hashKey(profile.mac_device);
            var schema = Util.now("YYYY_") + "Visit";
            var key = target.key || 'Y' + Util.now("YYYY") + 'M' + Util.now("MM");

            JCloud.findOne({ schema: schema, query: { _id: _id, [key]: { $ne: null } } }, (err, result) => {
                if (err) {
                    logger.error("", err);
                    return cb(null, { op: target.op, flag: false });
                }

                var visit = 0;
                if (Util.isObject(result)) {
                    visit = result[key].length;
                }

                switch (target.subOp) {
                    case '=':
                    case '==':
                        return cb(null, { op: target.op, flag: visit == target.value });
                        break;
                    case '>=':
                        return cb(null, { op: target.op, flag: visit >= target.value });
                        break;
                    case '<=':
                        return cb(null, { op: target.op, flag: visit <= target.value });
                        break;
                    case 'mod':
                        if (target.field) {
                            var mod = visit % target.field;
                            return cb(null, { op: target.op, flag: mod <= target.value })
                        }
                        else {
                            return cb(null, { op: target.op, flag: false })
                        }
                        break;
                    default:
                        return cb(null, { op: target.op, flag: false });
                }
            })
        } catch (err) {
            logger.error("checkVisit", err);
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check Age: Only run on age specified. Ex: 18
    age: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var age = 0;//Init 0
            //If yob exists. Calculate age by year of birthday (yob)
            if (profile.yob) age = parseInt(Util.now('YYYY')) - parseInt(profile.yob)
            else return cb(null, { op: target.op, flag: false })

            switch (target.subOp) {
                case '=':
                case '==':
                    return cb(null, { op: target.op, flag: age == target.value })
                    break
                case '>=':
                    return cb(null, { op: target.op, flag: age >= target.value })
                    break
                case '<=':
                    return cb(null, { op: target.op, flag: age <= target.value })
                    break
                default:
                    return cb(null, { op: target.op, flag: false })
            }
        } catch (err) {
            logger.error("checkAge", err);
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check Age: Only run on age specified. Ex: 18
    gender: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var gender = 'unknown';//Init unknown

            //If profile exists gender
            if (profile.gender) gender = profile.gender;//Male or Female            
            logger.debug(gender, target.subOp, target.value)

            if (target.subOp == 'is') {
                return cb(null, { op: target.op, flag: gender == target.value })
            }
            else {
                return cb(null, { op: target.op, flag: gender != target.value })
            }

        } catch (err) {
            logger.error("checkGender", err);
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check Device: Only run on device specified. Ex: Android, iOS
    device: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var userAgent = profile.userAgent || {}
            var os = 'UNKNOWN'
            if (typeof userAgent == 'object' && typeof userAgent.os == 'object' && userAgent.os.name) {
                os = userAgent.os.name;
            }

            logger.debug("USERAGENT", userAgent);
            logger.debug("OS", os, "subOp", target.subOp, "VALUE", target.value, "FLAG", target.value.indexOf(os));

            var flag = (target.value.indexOf(os) >= 0)

            if (target.subOp == "is") return cb(null, { op: target.op, flag: flag })
            return cb(null, { op: target.op, flag: !flag })
        } catch (err) {
            logger.error("checkDevice", err)
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check UserAgent: Only run on browser useragent specified
    useragent: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var userAgent = profile.userAgent || {}
            if (typeof userAgent == 'object' && userAgent.ua) var ua = userAgent.ua
            else return cb(null, { op: target.op, flag: false })

            switch (target.subOp) {
                case 'contains':
                    return cb(null, { op: target.op, flag: (ua.search(eval('/' + target.value + '/i')) != -1) })
                    break
                case 'not contains':
                    return cb(null, { op: target.op, flag: (ua.search(eval('/' + target.value + '/i')) == -1) })
                    break
                case 'regex':
                    return cb(null, { op: target.op, flag: (ua.search(eval(target.value)) != -1) })
                    break
                default:
                    return cb(null, { op: target.op, flag: false })
            }
        } catch (err) {
            logger.error("checkUserAgent", err)
            return cb(null, { op: target.op, flag: false })
        }
    },
    //check a field exists in profile
    profile: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;
            target.value = (target.value) ? target.value : undefined;
            var flag = false;

            //If key exists in profile
            if (typeof profile[target.field] !== 'undefined') {
                if (target.subOp == "exists") {
                    flag = true;
                    if (typeof target.value != "undefined") {
                        flag = target.value == profile[target.field];
                    }
                }
                else if (target.subOp == "not") {
                    flag = false;
                }
                else if (target.subOp == "regex" && target.value) {
                    flag = (eval('/' + target.value + '/gi').test(profile[target.field]));
                }

                return cb(null, { op: target.op, flag: flag })
            }
            else {
                var waiting = true;

                if (profile && typeof profile[target.field] != 'undefined') {
                    //If subOp is null -> positive
                    waiting = false;
                    if (target.subOp == "exists") {
                        flag = true;
                    }
                    else if (target.subOp == "not") {
                        flag = false;
                    }
                    else if (target.subOp == "==" && target.value) {
                        flag = target.value == profile[target.field];
                    }
                    else if (target.subOp == "!=" && target.value) {
                        flag = target.value != profile[target.field];
                    }
                    else if (target.subOp == "regex" && target.value) {
                        flag = (eval('/' + target.value + '/gi').test(profile[target.field]));
                    }
                } else {
                    waiting = false;
                    if (target.subOp == "exists") {
                        flag = false;
                    }
                    else if (target.subOp == "not") {
                        flag = true;
                    }
                    else if (target.subOp == "==" && target.value) {
                        flag = false;
                    }
                    else if (target.subOp == "!=" && target.value) {
                        flag = true;
                    }
                }

                return cb(null, { op: target.op, flag: flag });
            }
        } catch (err) {
            logger.error("checkProfile", err);
            return cb(null, { op: target.op, flag: false })
        }
    },
    profilecampaign: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;
            target.value = (target.value) ? target.value : undefined;
            var flag = false;

            //If key exists in profile
            if (typeof profile[target.field] !== 'undefined') {
                if (target.subOp == "exists") {
                    flag = true;
                    if (typeof target.value != "undefined") {
                        flag = target.value == profile[target.field];
                    }
                }
                else if (target.subOp == "not") {
                    flag = false;
                }
                else if (target.subOp == "regex" && target.value) {
                    flag = (eval('/' + target.value + '/gi').test(profile[target.field]));
                }

                return cb(null, { op: target.op, flag: flag })
            }
            else {
                var waiting = true;
                var _id = Util.hashKey(profile.mac_device + banner.campaign._id);

                JCloud.findOne({ schema: "ProfileCampaign", query: { _id: _id } }, (err, profilecampaign) => {
                    profilecampaign = JSON.parse(JSON.stringify(profilecampaign));

                    if (profilecampaign && typeof profilecampaign[target.field] != 'undefined') {
                        //If subOp is null -> positive
                        waiting = false;
                        if (target.subOp == "exists") {
                            flag = true;
                        }
                        else if (target.subOp == "not") {
                            flag = false;
                        }
                        else if (target.subOp == "==" && target.value) {
                            flag = target.value == profilecampaign[target.field];
                        }
                        else if (target.subOp == "!=" && target.value) {
                            flag = target.value != profilecampaign[target.field];
                        }
                        else if (target.subOp == "regex" && target.value) {
                            flag = (eval('/' + target.value + '/gi').test(profilecampaign[target.field]));
                        }
                    } else {
                        waiting = false;
                        if (target.subOp == "exists") {
                            flag = false;
                        }
                        else if (target.subOp == "not") {
                            flag = true;
                        }
                        else if (target.subOp == "==" && target.value) {
                            flag = false;
                        }
                        else if (target.subOp == "!=" && target.value) {
                            flag = true;
                        }
                    }

                    return cb(null, { op: target.op, flag: flag })
                })

                //If after 5s then return false.
                setTimeout(function () {
                    if (waiting) return cb(null, { op: target.op, flag: false })
                }, 5000);
            }
        } catch (err) {
            logger.error("checkProfile", err);
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check datetime: Only run on specified date.
    datetime: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var date = (target.key) ? Util.now(target.key) : Util.now('YYYY-MM-DD');
            logger.debug(date, target.subOp, target.value, date != target.value, !target.value.indexOf(date))
                        
            switch (target.subOp) {
                case '=':
                case '==':
                    return cb(null, { op: target.op, flag: date == target.value })
                    break
                case '!=':
                    return cb(null, { op: target.op, flag: date != target.value })
                    break
                case '>=':
                    return cb(null, { op: target.op, flag: date >= target.value })
                    break
                case '<=':
                    return cb(null, { op: target.op, flag: date <= target.value })
                    break
                default:
                    return cb(null, { op: target.op, flag: false })
            }
        } catch (err) {
            logger.error("checkDate", err);
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check datetime: Only run on specified date.
    hourly: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var hour = Util.now('HH:mm:ss');
            logger.debug(hour, target.subOp, target.value, hour != target.value, !target.value.indexOf(hour))
                        
            switch (target.subOp) {
                case '=':
                case '==':
                    return cb(null, { op: target.op, flag: hour == target.value })
                    break
                case '!=':
                    return cb(null, { op: target.op, flag: hour != target.value })
                    break
                case '>=':
                    return cb(null, { op: target.op, flag: hour >= target.value })
                    break
                case '<=':
                    return cb(null, { op: target.op, flag: hour <= target.value })
                    break
                default:
                    return cb(null, { op: target.op, flag: false })
            }


        } catch (err) {
            logger.error("checkHour", err);
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check datetime: Only run on specified date.
    dateofweek: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var date = (target.key) ? Util.now(target.key) : Util.now('E');
            logger.debug(date, target.subOp, target.value, date != target.value, !target.value.indexOf(date))
            
            var flag = (target.value.indexOf(date) >= 0)

            if (target.subOp == "==") return cb(null, { op: target.op, flag: flag })
            return cb(null, { op: target.op, flag: !flag })
        } catch (err) {
            logger.error("checkDate", err);
            return cb(null, { op: target.op, flag: false })
        }
    },
    //Check Birthday: Only run when today is client's birthday
    happybirthday: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var flag = false;
            //If date of birthday and month of birthday is today.
            if (profile.dob == Util.now('DD') && profile.mob == Util.now('MM')) {
                flag = true
            }

            return cb(null, { op: target.op, flag: flag })
        } catch (err) {
            logger.error("checkHappyBirthday", err);
            return cb(null, { op: target.op, flag: false })
        }
    },
    jMemberUsed: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var _id = Util.removeDMV(profile.mac_device);
            JCloud.findOne({ schema: "jMember", query: { _id: _id } }, (err, result) => {
                if (err) {
                    logger.error("", err);
                    return cb(null, { op: target.op, flag: false })
                }

                var used = 0;
                if (Util.isObject(result)) {
                    used = result.used;
                }

                switch (target.subOp) {
                    case '=':
                    case '==':
                        return cb(null, { op: target.op, flag: used == target.value });
                        break;
                    case '>=':
                        return cb(null, { op: target.op, flag: used >= target.value });
                        break;
                    case '<=':
                        return cb(null, { op: target.op, flag: used <= target.value });
                        break;
                    case 'mod':
                        if (target.field) {
                            var mod = used % target.field;
                            return cb(null, { op: target.op, flag: mod <= target.value })
                        }
                        else {
                            return cb(null, { op: target.op, flag: false })
                        }
                        break;
                    default:
                        return cb(null, { op: target.op, flag: false });
                }
            })
        } catch (err) {
            logger.error("checkjMember", err);
            return cb(null, { op: target.op, flag: false })
        }
    },
    jMemberExpired: (obj, cb) => {
        try {
            var profile = obj.profile;
            var banner = obj.banner;
            var target = obj.target;

            var _id = Util.removeDMV(profile.mac_device);
            JCloud.findOne({ schema: "jMember", query: { _id: _id } }, (err, result) => {
                if (err) {
                    logger.error("", err);
                    return cb(null, { op: target.op, flag: false })
                }

                var expiry_date = Util.now();
                if (Util.isObject(result)) {
                    expiry_date = result.expiry_date;
                }

                var diff = moment(expiry_date).diff(moment(), "seconds");
                return cb(null, { op: target.op, flag: diff <= 0 });
            })
        } catch (err) {
            logger.error("checkjMember", err);
            return cb(null, { op: target.op, flag: false })
        }
    }
}

