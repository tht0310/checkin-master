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
    }
    catch (e) { }

    var f = document.createElement('form');
    f.name = 'frmAruba';
    f.method = "POST";
    f.action = "http://securelogin.arubanetworks.com/cgi-bin/login";

    var e1 = document.createElement("input");
    e1.value = username;
    e1.name = "user";
    e1.type = "hidden";
    f.appendChild(e1);

    var e2 = document.createElement("input");
    e2.value = password;
    e2.name = "password";
    e2.type = "hidden";
    f.appendChild(e2);

    var e3 = document.createElement("input");
    e3.value = redirectUrl;
    e3.name = "url";
    e3.type = "hidden";
    f.appendChild(e3);

    var e4 = document.createElement("input");
    e4.value = "authenticate";
    e4.name = "cmd";
    e4.type = "hidden";
    f.appendChild(e4);

    var n = document.getElementsByTagName('head')[0].appendChild(f);

    if (typeof jwifi_logHit == "function") {
        // if (typeof window.jwifi_clickGif == 'string') {
        //     (new Image()).src = window.jwifi_clickGif;
        // }
        jwifi_logHit(function () {
            n.submit(); setTimeout(function () { document.getElementsByTagName('head')[0].removeChild(n) }, 2000);
        });
    }
    else {
        // if (typeof window.jwifi_clickGif == 'string') {
        //     (new Image()).src = window.jwifi_clickGif;
        // }
        n.submit(); setTimeout(function () { document.getElementsByTagName('head')[0].removeChild(n) }, 2000);
    }
}
