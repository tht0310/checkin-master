function jwifi_login_hotspot(url) {
    try {
        if (!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
            var img = new Image();
            img.src =  window.jwifi_impUrl;
            img.onerror = function() { throw "Impression can't loaded on " + navigator.userAgent; }
            img.onload = function() { window.jwifi_impression = true; }
        }

        var redirectUrl = jwifi_clickUrl;
        if (typeof url == "string") {
            redirectUrl += "&landingpage=" + encodeURIComponent(url);
        }

        if (typeof localStorage != "undefined" && localStorage != null) {
            localStorage.setItem("redirectUrl", redirectUrl);
        }
        else {
            jwifi_logClick(function () {})
        }
    }
    catch (e) { }

    var f = document.getElementById("frmAerohive");		
    f.action = "http://" + decodeURI(jwifi_getParam("RADIUS-NAS-IP")) + "/reg.php";
    document.getElementById("rusername").value = username; 
    document.getElementById("rpassword").value = password; 
    
    if (typeof jwifi_logHit == "function") {
        jwifi_logHit(function () {
            f.submit();
        });
    }
    else {
        f.submit(); 
    }
}
