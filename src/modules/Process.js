//V2 diff v1 in calculating weight
//Module get random banner by ap.
const url = require('url');
const UaParser = require('ua-parser-js');
global.Target = require(__ + '/modules/Target');

var Process = module.exports = {
   start: (jsonRes, callback) => {
      var ap = jsonRes.ap;
      var obj = { lId: ap.location._id, apId: ap._id, mac_device: jsonRes.mac_device, mac_ap: jsonRes.mac_ap, campaignoff: jsonRes.ap.campaignoff || [], type_ap: jsonRes.type_ap, groupId: ap.group, rdId: jsonRes.rdId, ssid: jsonRes.ssid, cId: jsonRes.cId, defaultCampaign: ap.campaign, client_ip: jsonRes.client_ip || "", user_url: jsonRes.user_url || "" };
      obj.landingpage = jsonRes.landingpage;
      obj.challenge = jsonRes.challenge;
      obj.userAgent = jsonRes.userAgent;
      obj.host = jsonRes.host;
      obj.queryString = "?lId=" + obj.lId;
      obj.queryString += "&apId=" + obj.apId;
      obj.queryString += "&mac_device=" + obj.mac_device;
      obj.queryString += "&mac_ap=" + obj.mac_ap;
      obj.queryString += "&type_ap=" + obj.type_ap;
      obj.queryString += "&client_ip=" + obj.client_ip;
      obj.queryString += "&user_url=" + obj.user_url;
      obj.queryString += "&ssid=" + obj.ssid;
      obj.queryString += "&rdId=" + obj.rdId;

      var start = (cb) => {
         logger.info("[Start processing]");
         return cb(null, obj);
      }

      var step1 = Process.getProfile; //Get profile by mac_device
      var step2 = Process.getCampaign;
      // var step3 = Process.filterBanner;
      var step3 = Process.getRandomBannerByWeight;
      var step4 = Process.renderEJS;

      var final = (obj) => {
         logger.info("[End processing] " + obj.queryString)

         if (jsonRes.type_ap == "openmesh") {
            Util.encode_password(jsonRes.password, jsonRes.challenge, CONF.SECRET, (err, result) => {
               obj.password = result;
               return callback(obj);
            })
         }
         else {
            return callback(obj);
         }
      }

      async.waterfall([start, step1, step2, step3, step4], final);
   },
   getProfile: (obj, callback) => {
      obj.profile = { userAgent: obj.userAgent }
      return callback(null, obj);
   },
   getCampaign: (obj, callback) => {
      var d = Util.now("YYYY-MM-DD");
      var args = { schema: "Campaign", query: [] }

      args.query.push({ $match: { _id: { $nin: obj.campaignoff }, $or: [{ ap: { $elemMatch: { $eq: obj.apId } } }] } });//, { _ap2: { $elemMatch: { $eq: obj.apId } } }

      if (typeof obj.cId != "undefined") {
         args.query.push({ $match: { _id: obj.cId } });
      }
      args.query.push({
         $addFields: {
            fromDate: { $cond: { if: { $or: [{ $eq: ["$fromDate", "-1"] }, { $eq: ["$fromDate", ""] }] }, then: d, else: { $ifNull: ["$fromDate", d] } } },
            toDate: { $cond: { if: { $or: [{ $eq: ["$toDate", "-1"] }, { $eq: ["$toDate", ""] }] }, then: d, else: { $ifNull: ["$toDate", d] } } }
         }
      })
      args.query.push({ $match: { weight: { $gt: 0 }, status: "Active", fromDate: { $lte: d }, toDate: { $gte: d } } });


      args.query.push({
         $lookup: {
            from: "campaignongroups",
            let: { groupId: obj.groupId, cId: "$_id" },
            pipeline: [
               { $match: { $expr: { $and: [{ $eq: ["$groupId", "$$groupId"] }, { $eq: ["$cId", "$$cId"] }] } } },
            ],
            as: "cog"
         }
      });

      args.query.push({ $unwind: { path: "$cog", preserveNullAndEmptyArrays: true } });
      args.query.push({ $match: { $or: [{ cog: null }, { "cog.status": "Accepted" }, { "cog.status": "Waiting", lockAt: { $lte: d } }] } });

      args.query.push({
         $lookup: {
            from: "banner",
            let: { cId: "$_id" },
            pipeline: [
               { $match: { $expr: { $and: [{ $eq: ["$campaign", "$$cId"] }] } } },
            ],
            as: "banner"
         }
      });

      args.query.push({ $unwind: { path: "$banner", preserveNullAndEmptyArrays: true } });


      logger.debug("[QUERY] -", JSON.stringify(args.query));

      obj.Campaigns = [];
      obj.cCampaigns = [];
      obj.override = [];
      obj.remnant = [];

      JCloud.aggregate(args, (err, campaigns) => {
         if (err) { //If error return banner default
            logger.error(err);
            return callback(null, obj); //Return cCampaigns=[]
         }

         // logger.debug("Campaign", JSON.stringify(campaigns));
         if (campaigns.length == 0) {
            if (obj.defaultCampaign) {
               logger.debug("Campaign default:", obj.defaultCampaign);
               obj.Campaigns.push(obj.defaultCampaign);
            }

            return callback(null, obj);
         }
         else {
            obj.idx = 0;
            obj.Campaigns = campaigns;

            var filter = [(cb) => { cb(null, obj); }];
            for (var i = 0, n = campaigns.length; i < n; i++) {
               filter.push(Process.filterCampaign);
            }

            async.waterfall(filter, (err, obj) => {
               return callback(null, obj);//call getBanner
            })
         }
      })
   },
   filterCampaign: (obj, cb) => {
      try {
         var temp = JSON.parse(JSON.stringify(obj.Campaigns));
         var campaign = temp[obj.idx++];

         logger.debug("Kpi Unlimit", campaign._id)
         if (campaign.override) {
            obj.override.push(campaign);
         }
         else {
            obj.remnant.push(campaign);
         }
         return cb(null, obj);
      }
      catch (err) {
         logger.error(err);
         return cb(null, obj); //Return obj.campaigns=[]
      }
   },
   filterBanner: (campaign, cb) => {
      try {
         var banner = campaign.banner;
         logger.debug(JSON.stringify(banner.targets));

         //Check targets if exists
         if (banner.targets && banner.targets.length && obj.type_ap != 'demo' && obj.defaultCampaign._id != campaign._id) {
            Target.check(obj, banner, (result) => {
               logger.debug("Target banner {", banner._id, "}", result);
               if (result) {
                  if (campaign.override) {
                     obj.override.push(campaign);
                  }
                  else {
                     obj.remnant.push(campaign);
                  }
               }

               return cb(null, obj); // back to getBanner
            })
         }
         else {
            //classify campaign. override and remnant
            if (campaign.override) {
               obj.override.push(campaign);
            }
            else {
               obj.remnant.push(campaign);
            }

            return cb(null, obj); // back to getBanner
         }
      }
      catch (err) {
         if (err) logger.error(err);
      }
   },
   getRandomBannerByWeight: (obj, callback) => {
      var cCampaigns = []; //Candidate Campaigns

      if (obj.override.length > 0) {
         logger.debug("override");
         cCampaigns = obj.override;
      }
      else if (obj.remnant.length > 0) {
         logger.debug("remnant");
         cCampaigns = obj.remnant;
      }
      else {//If no banner -> banner default
         obj.queryString += "&_apId=" + obj.apId + "&_lId=" + obj.lId;
         return callback(null, obj);
      }

      if (cCampaigns.length == 1) {
         obj.campaign = cCampaigns[0];
      }
      else {
         //new v2
         var totalCampaignWeight = 0;

         //Sum campaign weight
         for (i = 0; i < cCampaigns.length; i++) {
            totalCampaignWeight += cCampaigns[i].weight;
         }

         var index = 0;
         var rand = Math.random() * 100;// 1/100

         //Calculate banner weight
         for (i = 0, n = cCampaigns.length; i < n; i++) {
            var campaign = cCampaigns[i];
            var weight = campaign.weight * 100 / totalCampaignWeight;
            logger.trace("campaign._id: " + campaign._id);
            logger.trace(campaign.weight, "/", totalCampaignWeight);
            logger.trace("weight: " + weight);
            logger.trace(index + "<" + rand + " && " + rand + "<=" + (index + weight));

            if (index < rand && rand <= index + weight) {
               obj.campaign = campaign;
               break;
            }
            else {
               index += weight;
            }
         }
      }

      // if (Util.isArray(obj.campaign.ap) && Util.isArray(obj.campaign.ap2) && obj.campaign.ap2.indexOf(obj.apId) != -1) {
      //     obj._apId = obj.campaign.banner.ap[Math.floor((Math.random() * obj.campaign.banner.ap.length))];

      //     // if(obj.campaign.location) {
      //     //     obj._lId = obj.campaign.location[Math.floor((Math.random() * obj.campaign.location.length))];
      //     //     obj.queryString += "&_apId=" + obj._apId + "&_lId=" + obj._lId;

      //     //     return callback(null, obj);
      //     // }
      //     // else {
      //     var args = { schema: "AccessPoint", query: { _id: obj._apId }, select: "_id location" };

      //     JCloud.findOne(args, (err, ap) => {
      //         if (err) {
      //             logger.error(err);
      //             return callback(null, obj);
      //         }

      //         if (ap) {
      //             obj._lId = ap.location;
      //             obj.queryString += "&_apId=" + obj._apId + "&_lId=" + obj._lId;
      //         }
      //         else {
      //             obj.queryString += "&_apId=" + obj.apId + "&_lId=" + obj.lId;
      //         }

      //         return callback(null, obj);
      //     })
      //     // }
      // }
      // else {
      obj.queryString += "&_apId=" + obj.apId + "&_lId=" + obj.lId;
      return callback(null, obj);
      // }
   },
   renderEJS: (obj, callback) => {
      try {
         obj.campaign = (obj.campaign != null) ? obj.campaign : JSON.parse(JSON.stringify(CONF.CAMPAIGN));
         obj.queryString += "&cId=" + obj.campaign._id + "&bId=" + obj.campaign.banner._id + "&kindof=" + obj.campaign.kindof + "&layout=" + obj.campaign.banner.layout + "&rd=[timestamp]";
         obj.cId = obj.campaign._id;

         if (obj.campaign.banner.landingpage) {
            obj.queryString += "&landingpage=" + encodeURIComponent(obj.campaign.banner.landingpage);
         }

         //If banner specify username password
         if (obj.campaign.banner && obj.campaign.banner.username && obj.campaign.banner.password) {
            if (typeof obj.campaign.challenge != "undefined") {
               Util.encode_password(obj.password, obj.challenge, CONF.SECRET, (err, result) => {
                  obj.campaign.banner.password = result;
                  logger.trace(obj.campaign.banner.password);
               });
            }

            obj.campaign.banner.html += '<script>\n//Redefine username and password';
            obj.campaign.banner.html += '\n  window.onload = function() { ';
            obj.campaign.banner.html += '\n  username = "' + obj.campaign.banner.username + '";';
            obj.campaign.banner.html += '\n password = "' + obj.campaign.banner.password + '"; \n}\n </script>';
         }

         obj.script = "<script> console.log('Mac AP: ' + mac_ap);";
         obj.script += "console.log('Mac Device: ' + mac_device);";
         obj.script += "console.log('Campaign: " + obj.campaign.name + "'); </script>";
         obj.script += '<script src="/sp/js/jwifi.js' + obj.queryString + '" type="text/javascript" defer></script>\n';
         obj.html = obj.campaign.banner.html;


         var index = 0;
         var idx1 = obj.html.indexOf(`<!-- End Head -->`)
         if (idx1 == -1) idx1 = obj.html.indexOf(`<!-- scriptHead -->`);
         var idx2 = obj.html.indexOf(`<!-- scriptBody -->`);

         if (idx1 != -1) {
            obj.scriptHead = obj.html.slice(index, idx1) + "\n";
            index = idx1;
         }

         if (idx2 != -1) {
            obj.scriptBody = obj.html.slice(index, idx2).replace("<!-- scriptHead -->", "").replace("<!-- End Head -->", "") + "\n";
            index = idx2;
         }

         obj.html = obj.html.slice(index).replace("<!-- scriptBody -->", "").replace("<!-- scriptHead -->", "").replace("<!-- End Head -->", "");

         return callback(obj);
      }
      catch (err) {
         logger.error(err);
      }
   },
   getMac: (req, callback) => {
      var arg = req.query || {};//Get agrument from URL query string

      var jsonRes = {};
      jsonRes.mode = (typeof arg.mode != "undefined") ? "info" : "";
      jsonRes.cId = arg.cId || undefined;
      jsonRes.type_ap = arg.type_ap = req.params.type_ap || "demo"
      jsonRes.landingpage = arg.landingpage;
      jsonRes.rdId = Util.randomId();
      jsonRes.host_name = req.headers.host;
      jsonRes.host = url.format({ protocol: req.protocol, host: req.get('host') })
      jsonRes.userAgent = UaParser(req.headers['user-agent']);

      switch (arg.type_ap) {
         case 'demo': //Demo
            jsonRes.mac_ap = arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";

            break;
         case 'aruba': //AP Aruba
            if (typeof arg.apname != "undefined" && arg.apname.indexOf('**') != -1) {
               arg.apname = arg.apname.split("**")[1];
            }
            else {

            }

            if (Util.isMAC(arg.name)) {
               jsonRes.mac_ap = arg.apname;
            }
            else {
               jsonRes.mac_ap = arg.apmac || 'DD-EE-FF-DD-EE-FF';
            }

            jsonRes.mac_ap = decodeURIComponent(jsonRes.mac_ap);
            jsonRes.mac_device = arg.mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = arg.ip || "";
            jsonRes.user_url = arg.url || "";
            jsonRes.ssid = arg.ssid || "";

            break;
         case 'motorola': //AP Motorola
            // /motorola/?mac_device=94-E9-79-9B-E1-C5&mac_ap=FC-0A-81-EE-BC-2B&hs_server=192.168.40.1&Qv=it_qpmjdz=dbqujwf@bbb_qpmjdz=BBB@dmjfou_njou=562964466@dmjfou_nbd=:5.F:.8:.:C.F2.D6@ttje=Auftu!npupspmb!Soe!@bq_nbd=GD.1B.92.FF.CD.3C             
            jsonRes.mac_ap = arg.ap_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.client_mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";

            break;
         case 'mikrotik': //AP mikrotik 
            if (Util.isMAC(arg["server-name"])) {
               jsonRes.mac_ap = arg["server-name"];
            }
            else {
               jsonRes.mac_ap = arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            }

            jsonRes.mac_device = arg.mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = arg.ip || "";
            jsonRes.user_url = arg["link-orig"] || "";
            jsonRes.ssid = arg.ssid || "";

            break;
         case 'cisco': //AP cisco 
            jsonRes.mac_ap = arg.ap_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.client_mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";
            break;
         case 'chilli'://AP chilli
            jsonRes.mac_ap = arg.called || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = arg.ip || "";
            jsonRes.user_url = arg.userurl || "";
            jsonRes.ssid = arg.ssid || "";
            break;
         case 'ruckus': //AP ruckus 
            jsonRes.mac_ap = arg.mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.client_mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = "";
            jsonRes.user_url = arg.url || "";
            jsonRes.ssid = arg.ssid || "";

            if (jsonRes.mac_ap.indexOf("-") == -1 && jsonRes.mac_ap.indexOf(":") == -1) {
               var temp = jsonRes.mac_ap.match(/(([0-9]|[A-Fa-f]){2})/g);
               jsonRes.mac_ap = temp[0] + "-" + temp[1] + "-" + temp[2] + "-" + temp[3] + "-" + temp[4] + "-" + temp[5];
            }

            if (jsonRes.mac_device.indexOf("-") == -1 && jsonRes.mac_device.indexOf(":") == -1) {
               temp = jsonRes.mac_device.match(/(([0-9]|[A-Fa-f]){2})/g);
               jsonRes.mac_device = temp[0] + "-" + temp[1] + "-" + temp[2] + "-" + temp[3] + "-" + temp[4] + "-" + temp[5];
            }

            break;
         case 'ruckusz': //AP ruckus smart zone
            jsonRes.mac_ap = arg.mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.client_mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = "";
            jsonRes.user_url = arg.url || "";
            jsonRes.ssid = arg.ssid || "";

            if (jsonRes.mac_ap.indexOf("-") == -1 && jsonRes.mac_ap.indexOf(":") == -1) {
               var temp = jsonRes.mac_ap.match(/(([0-9]|[A-Fa-f]){2})/g);
               jsonRes.mac_ap = temp[0] + "-" + temp[1] + "-" + temp[2] + "-" + temp[3] + "-" + temp[4] + "-" + temp[5];
            }

            if (jsonRes.mac_device.indexOf("-") == -1 && jsonRes.mac_device.indexOf(":") == -1) {
               temp = jsonRes.mac_device.match(/(([0-9]|[A-Fa-f]){2})/g);
               jsonRes.mac_device = temp[0] + "-" + temp[1] + "-" + temp[2] + "-" + temp[3] + "-" + temp[4] + "-" + temp[5];
            }

            break;
         case 'meraki': //AP Meraki 
            if (typeof arg.node_mac != "undefined") {
               jsonRes.mac_ap = arg.node_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            }
            else {
               jsonRes.mac_ap = arg.ap_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            }

            jsonRes.mac_device = arg.client_mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN'
            jsonRes.client_ip = arg.client_ip || "";
            jsonRes.user_url = arg.continue_url || "";
            jsonRes.ssid = arg.ssid || "";
            break;
         case 'unifi': //
            jsonRes.mac_ap = arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.sitename = arg.sitename || "default";
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";
            break;
         case 'wifidog': //
            jsonRes.mac_ap = arg.apmac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";
            break;
         case 'tplink': //
            jsonRes.mac_ap = arg.ap || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.clientMac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";
            break;
         case 'openmesh'://
            jsonRes.mac_ap = arg.called || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.challenge = arg.challenge;
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";

            break;
         case 'relay2'://
            jsonRes.mac_ap = arg.apmac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";

            break;
         case 'engenius'://
            var actionUrl = arg.actionurl;
            var params = url.parse(actionUrl, true).query;
            jsonRes.mac_ap = params.called || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = params.mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";

            break;
         case 'peplink'://
            jsonRes.mac_ap = arg.called || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.challenge = arg.challenge;
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";

            break;
         case 'grandstream'://
            jsonRes.mac_ap = arg.ap_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.client_mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";

            break;
         case 'cambium'://
            jsonRes.mac_ap = arg.ga_ap_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.ga_cmac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ga_ssid || "";

            break;
         case 'aerohive'://
            if (Util.isMAC(arg['NAS-ID'])) {
               jsonRes.mac_ap = arg["NAS-ID"] || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            }
            else {
               var mac_ap = arg['Called-Station-Id'] || 'DD-EE-FF-DD-EE-FF';
               if (mac_ap != 'DD-EE-FF-DD-EE-FF') {
                  var temp = mac_ap.match(/(([0-9]|[A-Fa-f]){2})/g);
                  mac_ap = temp[0] + "-" + temp[1] + "-" + temp[2] + "-" + temp[3] + "-" + temp[4] + "-00";
               }
               jsonRes.mac_ap = mac_ap;
            }

            jsonRes.mac_device = arg.mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';

            if (!Util.isMAC(jsonRes.mac_device) && jsonRes.mac_device != 'UN-KK-NN-OO-WW-NN') {
               var temp = jsonRes.mac_device.match(/(([0-9]|[A-Fa-f]){2})/g);
               jsonRes.mac_device = temp[0] + "-" + temp[1] + "-" + temp[2] + "-" + temp[3] + "-" + temp[4] + "-" + temp[5];
            }
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";

            break;
         case 'everest'://
            jsonRes.mac_ap = arg.ap_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.client_mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";

            break;
         case 'nuclias'://
            jsonRes.mac_ap = arg.ap_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = arg.ip || "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";

            break;
         case 'meganet'://
            jsonRes.mac_ap = arg.ap_mac || arg.mac_ap || 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = arg.client_mac || arg.mac_device || 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = arg.client_ip;
            jsonRes.user_url = "";
            jsonRes.ssid = "";

            break;
         default: //
            jsonRes.mac_ap = 'DD-EE-FF-DD-EE-FF';
            jsonRes.mac_device = 'UN-KK-NN-OO-WW-NN';
            jsonRes.client_ip = "";
            jsonRes.user_url = "";
            jsonRes.ssid = arg.ssid || "";

            break;
      }

      if (Array.isArray(jsonRes.mac_ap) == true) {
         jsonRes.mac_ap = jsonRes.mac_ap[0];
      }

      if (Array.isArray(jsonRes.mac_device) == true) {
         jsonRes.mac_device = jsonRes.mac_device[0];
      }

      //Format Mac Address from ':' to '-'
      jsonRes.mac_ap = jsonRes.mac_ap.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();
      jsonRes.mac_device = jsonRes.mac_device.replace(/:/g, '-').replace(/("|')/g, "").toUpperCase();

      // jsonRes.referrer = 0;
      jsonRes.referrer = req.headers.referrer || req.headers.referer || req.get('referrer') || "";
      // if (referrer.indexOf("www.samsung.com") != -1) {
      //     jsonRes.referrer = 1;
      // }

      return callback(jsonRes);
   },
   getAccessPoint: (jsonRes, callback) => {
      logger.debug("Mac Ap", jsonRes.mac_ap)
      Cache.getRaw("AccessPoint", jsonRes.mac_ap, (err, doc) => {
         if (err) {
            logger.error("[GET AP FROM CACHE] ERROR", err);
            return callback(err, CONF.AP);
         }

         if (doc) {
            logger.debug("[GET AP FROM CACHE]");
            ap = doc;
            if (typeof ap.group.expiry_date != 'undefined' && ap.group.expiry_date != '' && ap.group.expiry_date != '-1' && ap.group.expiry_date > Util.now("YYYY-MM-DD")) {
               logger.debug("Licence Expired.")
               return callback(null, CONF.AP);
            }

            return callback(null, ap)
         }
         else {
            logger.debug("[GET AP FROM DB]");
            var args = { schema: "AccessPoint", query: [] }
            args.query.push({ $match: { mac_ap: jsonRes.mac_ap, status: "Active" } });

            args.query.push({
               $lookup: {
                  from: "group",
                  let: { groupId: "$group" },
                  pipeline: [
                     { $match: { $expr: { $and: [{ $eq: ["$_id", "$$groupId"] }] } } },
                     { $project: { _id: 1, name: 1, keyword: 1, click_limit: 1, expiry_date: 1, campaign_default: 1 } },
                  ],
                  as: "group"
               }
            });
            args.query.push({ $unwind: { path: "$group", preserveNullAndEmptyArrays: true } });

            args.query.push({
               $lookup: {
                  from: "location",
                  let: { location: "$location" },
                  pipeline: [
                     { $match: { $expr: { $and: [{ $eq: ["$_id", "$$location"] }] } } },
                     { $project: { _id: 1, name: 1, keyword: 1, fullname: 1 } }
                  ],
                  as: "location"
               }
            })

            args.query.push({ $unwind: { path: "$location", preserveNullAndEmptyArrays: true } });


            args.query.push({
               $lookup: {
                  from: "campaign",
                  let: { campaign: "$group.campaign_default" },
                  pipeline: [

                     { $match: { $expr: { $and: [{ $eq: ["$_id", "$$campaign"] }] } } },
                     {
                        $lookup: {
                           from: "banner",
                           let: { cId: "$_id" },
                           pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$campaign", "$$cId"] }] } } }],
                           as: "banner"
                        }
                     },
                     { $unwind: "$banner" }
                  ],
                  as: "campaign"
               }
            })

            args.query.push({ $unwind: { path: "$campaign", preserveNullAndEmptyArrays: true } });

            args.query.push({ $project: { _id: 1, createdAt: 1, updatedAt: -1, name: 1, group: 1, location: 1, campaign: 1, keyword: 1, campaignoff: 1, username: 1, password: 1 } });

            logger.debug("[QUERY] -", JSON.stringify(args.query));
            JCloud.aggregate(args, (err, ap) => {
               if (err) {
                  logger.error("[GET AP FROM DB] ERROR", err);
                  return callback(err, CONF.AP);
               }

               logger.debug("[GET AP FROM DB]");
               if (!ap[0]) {
                  logger.debug("NULL");
                  return callback(err, CONF.AP);
               }

               ap = ap[0];
               logger.debug(JSON.stringify(ap));
               Cache.setRaw("AccessPoint", jsonRes.mac_ap, ap, (err, result) => {
                  if (err) logger.error(err);
               });

               return callback(err, ap);
            })
         }
      })
   },
   whenError: (jsonRes, callback) => {
      Process.start(jsonRes, (obj) => {
         jsonRes.HTML = obj.html;
         jsonRes.SCRIPT = obj.script;
         jsonRes.cId = obj.cId;

         if (typeof obj.password != "undefined") {
            jsonRes.password = obj.password;
            logger.debug(jsonRes.password);
         }

         return callback(jsonRes);
      })
   }
}
