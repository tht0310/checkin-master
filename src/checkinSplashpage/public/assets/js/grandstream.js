function jwifi_login_hotspot(url) {
	

	var redirectUrl = jwifi_clickUrl;
	if (typeof url == "string") {
		redirectUrl += "?landingpage=" + encodeURIComponent(url);
	}
	

	if (typeof localStorage !== "undefined") {
		localStorage.setItem("redirectUrl", redirectUrl);
	}

	// if (typeof jwifi_logClick == "function") {
	// 	jwifi_logClick(function () {
	// 		window.location.href = jwifi_getParam('login_url') + "?username=" + username + "&password=" + password;
	// 	});
	// }
	// else {
		window.location.href = jwifi_getParam('login_url') + "?username=" + username + "&password=" + password;
	// }
}