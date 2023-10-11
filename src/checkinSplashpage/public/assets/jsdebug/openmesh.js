function jwifi_login_hotspot(url) {
	window.jwifi_setRedirectPage(url);

	if (!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
		var img = new Image();
		img.src = window.jwifi_impUrl;
		img.onerror = function () { throw "Impression can't loaded on " + navigator.userAgent; }
		img.onload = function () { window.jwifi_impression = true; }
	}
	

	var ip = jwifi_getParam('uamip') || "10.1.0.1";
	var port = jwifi_getParam('uamport') || "3990";
	var url = window.location.href;
	var protocol = url.split("/")[0];

	loginUrl = protocol + '//' + ip + ':' + port + '/logon?';	/*'http://10.1.0.1:3990/json/logon?&username=???&password=????;*/
	loginUrl += '&username=' + username + "&password=" + password;

	if (typeof jwifi_logHit == "function") {
		jwifi_logHit(function () {
			window.location.href = loginUrl;
		});
	}
	else {
		setTimeout(function () {
			window.location.href = loginUrl;
		}, 500);
	}
}