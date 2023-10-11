const dgram = require("dgram");
const radius = require('radius');
radius.add_dictionary(__RDAPI__ + '/dictionary');
global.AA = require(__RDAPI__ + '/modules/AA');

var server = dgram.createSocket("udp4");

server.on("message", function (msg, rinfo) {
  try {
    var obj = { msg: msg, rinfo };

    var start = (callback) => {
      callback(null, obj);
    }

    var step1 = AA.getInfo;
    var step2 = AA.authen;

    var final = (response) => {
      server.send(response, 0, response.length, rinfo.port, rinfo.address, function (err, bytes) {
        if (err) {
          logger.debug('Error sending response to ', rinfo);
        }
      });
    }

    async.waterfall([start, step1, step2], final);
  }
  catch (err) {
    logger.error(err);
  }
});

server.on("listening", function () {
  var address = server.address();
  logger.info("[RADIUS START] [PORT:" + CONF.authPORT + "]");
});

server.bind(CONF.authPORT);