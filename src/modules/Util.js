const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const hmacSHA512 = require('crypto-js/hmac-sha512');
const Base64 = require('crypto-js/enc-base64');

const moment = require('moment');
const jwt = require('jsonwebtoken');
const randomstring = require('randomstring');
var short = require('short-uuid');
var execPhp = require('exec-php');
var nodemailer = require('nodemailer');
var mailer = nodemailer.createTransport(CONF.MAIL);
var http = require('http');
var fs = require('fs');
var Excel = require('exceljs');
var workbook = new Excel.Workbook();

var Util = module.exports = {
    now: (format = "YYYY-MM-DD HH:mm:ss") => { return moment().format(format).toString() },
    getDate: (date, format = "YYYY-MM-DD HH:mm:ss",) => { return moment(date).format(format).toString() },
    addTime: (time = "", format = "YYYY-MM-DD HH:mm:ss", hours = 0) => {
        return moment(time).add(hours, 'hours').format(format).toString();
    },
    subtractTime: (time = "", format = "YYYY-MM-DD HH:mm:ss", hours = 0) => {
        return moment(time).subtract(hours, 'hours').format(format).toString();
    },
    convertTime: (time, formatFrist = "YYYY-MM-DD HH:mm:ss", format = "YYYY-MM-DD HH:mm:ss") => {
        return moment(time, formatFrist).format(format)
    },
    lastDayOf: (time = "month") => { return moment().endOf(time).format("YYYY-MM-DD").toString() },
    hashPassword: (password, salt) => crypto.pbkdf2Sync(password, salt, 100, 20, "sha512").toString('hex'),
    hash: (p, s) => Base64.stringify(hmacSHA512(p, s)),
    hashKey: (key) => crypto.createHash('md5').update(key).digest("hex"),
    // randomId: () => randomstring.generate(32),
    // randomId: () => crypto.randomBytes(16).toString("hex"), //Will use in nodejs version 10.0
    randomId: () => short.generate(),//16 letters
    genSalt: () => crypto.pbkdf2Sync(crypto.randomBytes(5), crypto.randomBytes(5), 100, 20, "sha512").toString('hex'),
    randomShortId: () => short.generate(), //log need 32 than 16 letters
    // hashKey: (key) => {return crypto.createHash('md5').update(key).digest("hex")},
    // hashKey: (key) => crypto.createHash('md5').update(key).digest("hex"),//Will use in nodejs version 10.0
    genToken: (data, secret = "jwifi", expiresIn = null) => {
        var expiry = {};
        if (expiresIn) expiry = { expiresIn: expiresIn }; //7d
        return jwt.sign(data, secret, expiry);
    },
    genTokenSpecial: () => {
        var key = { id: Util.idTokenSpecial() };
        var exp = { expiresIn: "24h" };// in seconds
        return jwt.sign(key, "jWiFi37", exp);
    },
    idTokenSpecial: () => {
        return crypto.createHash('md5').update(moment().format('YYYY-MM-DD').toString()).digest("hex")
    },
    verifyToken: (token, keys, callback) => {
        //"jwifi"
        if (callback) {
            jwt.verify(token, keys, (err, decode) => {
                if (err) { return callback(err, null) }
                return callback(null, decode)
            })
        }
        else {
            return jwt.verify(token, keys);
        }
    },
    decryptToken: (token) => { return jwt.decode(token); },
    removeDMV: (str) => { //Remove  Diacritical Marks In Vietnamese
        str = str || "";
        str = str.toLowerCase();
        str = str.replace(/\s/gi, "");
        str = str.replace(/à|á|ạ|ả|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/gi, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/gi, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/gi, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/gi, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/gi, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/gi, "y");
        str = str.replace(/đ/gi, "d");
        str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/gi, "");
        str = str.trim();
        return str;
    },
    removeDMVS: (str) => { //Remove  Diacritical Marks In Vietnamese
        str = str || "";
        str = str.toLowerCase();
        str = str.replace(/à|á|ạ|ả|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/gi, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/gi, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/gi, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/gi, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/gi, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/gi, "y");
        str = str.replace(/đ/gi, "d");
        str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/gi, "");
        str = str.trim();
        return str;
    },
    capitalizeFirstLetter: (charater) => {
        return charater.charAt(0).toUpperCase() + charater.slice(1);
    },
    stringConcatAtPosition: (originCharater, newCharater, position) => {
        var fristCharater = originCharater.substring(0, position);
        var lastCharater = originCharater.substring(position, originCharater.length);
        return fristCharater + newCharater + lastCharater;
    },
    arrayConcatAtPosition: (originArray, position) => {
        var fristArray = originArray.slice(0, position);
        var lastArray = originArray.slice(position, originArray.length);
        return fristArray.concat(lastArray)
    },
    extend: (obj1, obj2) => {
        var attributes = Object.keys(obj2);
        for (var i = 0; i < attributes.length; i++) {
            obj1[attributes[i]] = obj2[attributes[i]]
        }
        return obj1;
    },
    httpRequest: (option, data, callback) => {
        var req = http.request(option, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                (`BODY: ${chunk}`);
            });
            res.on('end', () => {
                callback(null, "Successful");
            });
        });
        req.on('error', (e) => {
            callback(e.message, null);
        });
        // write data to request body
        var dataFinal = JSON.stringify(data);
        req.write(dataFinal);
        req.end();
    },
    readExcelFile: (file, callback) => {
        workbook.xlsx.readFile(file).then(function () {
            var worksheet = workbook.getWorksheet(1);
            return callback(null, worksheet);
        }).catch((err) => {
            return callback(err, null);
        });
    },
    sendMail: (data, callback) => {
        var mailOptions = {
            "from": data.sender,
            "to": data.email, // list of receivers
            "subject": data.subject, // Subject line
            // text: data.subject,
            "html": data.html, // html body
            "attachments": data.attachments
        };
        // send mail with defined transport object
        mailer.sendMail(mailOptions, (err, debug) => {
            mailer.close();
            if (debug) {
                if (data.mailId) {
                    debug["mailId"] = data.mailId;
                }
            }
            return callback(err, debug)
        });
    },
    decodeBase64: (base64str, filename, callback) => {
        mkdir('-p', '/tmp/a/b/c/d', '/tmp/e/f/g');
        var buf = Buffer.from(base64str, 'base64');
        fs.writeFile(path.join(__dirname, '/public/', filename), buf, function (err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, "Decode Base64 successful.")
            }
        });
    },
    mergeObject: (obj1, obj2) => {
        for (var attrname in obj2) {
            obj1[attrname] = obj2[attrname];
        }
        return obj1;
    },
    inArray: (arr, value) => {
        return new Set(arr).has(value);
    },
    isEmail: (email) => {
        var re = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
        return re.test(email)
    },
    isDate: (date) => {
        var p = moment(date, 'YYYY-MM-DD').format("YYYY-MM-DD").toString();
        return p == date;
    },
    isPhone: (phone) => {
        // MobiFone: 070|079|077|076|078|089|090|093
        // Vinaphone:083|084|085|081|082|088|091|094
        // Viettel:032|033|034|035|036|037|038|039|086|096|097|098
        // Vietnamobile:052|056|058|092
        // Gmobile:059|099
        var pattern = /^(070|079|077|076|078|089|090|093|083|084|085|081|082|088|091|094|032|033|034|035|036|037|038|039|086|096|097|098|052|056|058|092|059|099)\d{7}$/
        if (pattern.test(phone)) {
            return true;
        } else {
            return false;
        }
    },
    isString: (str) => {
        return typeof str == 'string' && str
    },
    isNumber: (num) => {
        return !isNaN(num)
    },
    isBoolean: (boo) => {
        return typeof boo == 'boolean'
    },
    isObject: (obj) => {
        return typeof obj == 'object' && obj && Object.keys(obj).length
    },
    isArray: (arr) => {
        return Array.isArray(arr) && arr.length
    },
    isMAC: (mac) => {
        if (!mac) return null;
        return mac.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/);
    },
    isMac: (mac) => {
        if (!mac) return null;
        return mac.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/);
    },
    isMACNoDelimiter: (str) => {
        let re = /^[0-9A-F]{12}$/i
        return re.test(str);
    },
    isEmail: (v) => {
        return /^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i.test(v);
    },
    classify: (verify, data) => {
        var bad = {}
        var good = {}
        if (!Util.isObject(verify)) return { bad: ['Verify not object'], good: good }
        for (var i in verify) {
            if (Util.isObject(verify[i])) {
                switch (verify[i].type) {
                    case String:
                        if (Util.isString(data[i])) {
                            if (i == 'email' && !Util.isEmail(data[i])) bad[i] = 'is required email'
                            else if (i == 'phone' && !Util.isPhone(data[i])) bad[i] = 'is required phone'
                            else if (verify[i].required == true && !data[i]) bad[i] = 'is required'
                            else good[i] = String(data[i])
                        }
                        else if (verify[i].required == true) bad[i] = 'is required string'
                        break
                    case Number:
                        if (Util.isNumber(parseInt(data[i]))) good[i] = data[i]
                        else if (verify[i].required == true) bad[i] = 'is required number'
                        break
                    case Boolean:
                        if (Util.isBoolean(data[i])) good[i] = data[i]
                        else if (verify[i].required == true) bad[i] = 'is required boolean'
                        break
                    case Array:
                        if (Util.isArray(data[i])) good[i] = data[i]
                        else if (verify[i].required == true) bad[i] = 'is required array'
                        break
                    case Object:
                        if (Util.isObject(data[i])) good[i] = data[i]
                        else if (verify[i].required == true) bad[i] = 'is required object'
                        break
                }
            }
        }
        return { bad, good }
    },
    splitQParams: (q) => {
        try {
            query = {};
            var params = q.split("__");

            for (i = 0, n = params.length; i < n; i++) {
                var aSplit = params[i].split("=");
                var key = aSplit[0];
                var value = aSplit[1];
                query[key] = value
            }

            return query;
        }
        catch (err) {
            logger.error(err);
            return {};
        }
    },
    formatQUrl: (queryString, enabled = true) => {
        if (enabled) {
            queryString = "?q=" + queryString.split("&").join("__").replace("?", "__");
        }

        return queryString;
    },
    encode_password: (password, challenge, secret, callback) => {
        execPhp(__ + '/modules/openmesh.php', (error, php, outprint) => {
            php.encode_password(password, challenge, secret, (err, result, output, printed) => {
                logger.debug("encode_password(", password, challenge, secret, ")");
                logger.debug(err, result, output, printed);
                return callback(err, result);
            });
        });
    },
    validate_login: (username, password, mac, secret, sigsecret, callback) => {
        execPhp(__ + '/modules/openmesh.php', (error, php, outprint) => {
            logger.debug(username, password, mac, secret, sigsecret);
            php.validate_login(username, password, mac, secret, sigsecret, (err, result, output, printed) => {
                logger.debug(err, result, output, printed);
                return callback(err, result);
            });
        });
    },
    calculate_new_ra: (ra, secret, callback) => {
        execPhp(__ + '/modules/openmesh.php', (error, php, outprint) => {
            logger.debug(ra, secret);
            php.calculate_new_ra(ra, secret, (err, result, output, printed) => {
                logger.debug(err, result, output, printed);
                return callback(err, result);
            });
        });
    },
    logImpr2File: (doc) => {
        var file = "/home/CLOUD/log/impr-" + Util.now("YYYYMMDD") + ".json";
        logger.debug(" [LOG FILE] -> %s", file);

        var content = "/*" + Util.now("HH:mm:ss") + "*/" + doc + ",\n";

        fs.appendFile(file, content, function (err) {
            if (err) throw err;
            logger.debug(" [LOG IMPRESSION FILE] SAVED");
        });
    },
    logClick2File: (doc) => {
        var file = "/home/CLOUD/log/click-" + Util.now("YYYYMMDD") + ".json";
        logger.debug(" [LOG FILE] -> %s", file);

        var content = "/*" + Util.now("HH:mm:ss") + "*/" + doc + ",\n";

        fs.appendFile(file, content, function (err) {
            if (err) throw err;
            logger.debug(" [LOG CLICK FILE] SAVED");
        });
    },
    logProfile2File: (doc) => {
        var file = "/home/CLOUD/log/profile" + Util.now("YYYYMMDD") + ".json";
        logger.debug(" [LOG FILE] -> %s", file);

        var content = "/*" + Util.now("HH:mm:ss") + "*/" + doc + ",\n";

        fs.appendFile(file, content, function (err) {
            if (err) throw err;
            logger.debug(" [LOG PROFILE FILE] SAVED");
        });
    },
    logVideo2File: (doc) => {
        var file = "/home/CLOUD/log/video" + Util.now("YYYYMMDD") + ".json";
        logger.debug(" [LOG FILE] -> %s", file);

        var content = "/*" + Util.now("HH:mm:ss") + "*/" + doc + ",\n";

        fs.appendFile(file, content, function (err) {
            if (err) throw err;
            logger.debug(" [LOG VIDEO FILE] SAVED");
        });
    },
}