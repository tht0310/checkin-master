function jwifi_login_hotspot(url) {
    if (!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
        var img = new Image();
        img.src = window.jwifi_impUrl;
        img.onerror = function () { throw "Impression can't loaded on " + navigator.userAgent; }
        img.onload = function () { window.jwifi_impression = true; }
    }
    

    var redirectUrl = jwifi_clickUrl;
    if (typeof url == "string") {
        redirectUrl += "&landingpage=" + url;
    }
    
    var login_url = jwifi_getParam('login_url');
    if (login_url) {
        login_url = decodeURIComponent(login_url);
        login_url = login_url.split('?')[0];
        login_url += "?&username=" + username + "&password=" + password + "&redirect=" + encodeURIComponent(redirectUrl);
    }

    if (typeof jwifi_logHit == "function") {
        jwifi_logHit(function () {
            window.location.href = login_url;
        });
    }
    else {
        setTimeout(function () {
            window.location.href = login_url;
        }, 500);
    }
}