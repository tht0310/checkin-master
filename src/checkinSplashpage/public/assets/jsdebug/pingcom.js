function jwifi_login_hotspot(url) {
	if(!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
        var img = new Image();
        img.src =  window.jwifi_impUrl;
        img.onerror = function() { throw "Impression can't loaded on " + navigator.userAgent; }
        img.onload = function() { window.jwifi_impression = true; }
	}
    
    
    var url ="https://api.wifi.pingcom.vn/api/accessjwifi?user_partner=jwifi&pw_partner=jwifi&apmac="+mac_ap+ "&mac="+mac_device +"&state="+ state;
    
    var pingcom= jwifi_clickUrl + "&landingpage="+ encodeURIComponent(url);
    
    if (typeof jwifi_logHit == "function") {
        jwifi_logHit(function () {
            window.location.href = pingcom;
        });
    }
    else {
        window.location.href = pingcom;
    }    
}