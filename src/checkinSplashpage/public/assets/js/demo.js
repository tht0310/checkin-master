function jwifi_login_hotspot(url) {
    // if(!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
        // var img = new Image();
        // img.src =  window.jwifi_impUrl;
        // img.onerror = function() { throw "Impression can't loaded on " + navigator.userAgent; }
        // img.onload = function() { window.jwifi_impression = true; }
    // }
    

	var redirectUrl = jwifi_clickUrl;

	if (typeof url == "string") {
        // redirectUrl += "&landingpage=" + encodeURIComponent(url);
        redirectUrl = url;
	}

    if (typeof jwifi_logHit == "function") {
        jwifi_logHit(function () {
			window.location.href = redirectUrl;
        });
    }
    else {
        setTimeout(function () {
			window.location.href = redirectUrl;
        }, 500);
    }
}