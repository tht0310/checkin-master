

function jwifi_login_hotspot(url) {
    if(!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
        var img = new Image();
        img.src =  window.jwifi_impUrl;
        img.onerror = function() { throw "Impression can't loaded on " + navigator.userAgent; }
        img.onload = function() { window.jwifi_impression = true; }
    }
    
    
    var redirectUrl = jwifi_clickUrl;
    if (typeof url == "string") {
        redirectUrl += "&landingpage=" + url;
    }

    var gw_address = jwifi_getParam('gw_address') || "1.2.3.4";
    var gw_port = jwifi_getParam('gw_port') || "2060";
    var gw_id = jwifi_getParam('gw_id');
    var gw_sn = jwifi_getParam('gw_sn');
    var queryString = "?mac_device=" + mac_device;
    queryString += "&mac_ap=" + mac_ap;
    queryString += "&gw_address=" + gw_address;
    queryString += "&gw_port=" + gw_port;
    queryString += "&gw_id=" + gw_id;
    queryString += "&gw_sn=" + gw_sn;
    queryString += "&username=" + username;
    queryString += "&password=" + password;
    queryString += "&url=" + encodeURIComponent(redirectUrl);
    jwifi_trackByImage("/wifidog/login.gif" + queryString);

    var token = mac_device + "_" + mac_ap;

	if (typeof jwifi_logHit == "function") {
		jwifi_logHit(function () {
			window.location.href = "http://" + gw_address + ":" + gw_port + "/auth?token=" + token;
		});
	}
	else {
		window.location.href = "http://" + gw_address + ":" + gw_port + "/auth?token=" + token;
    }    
}