

function jwifi_login_hotspot(url) {
    window.jwifi_setRedirectPage(url);
    
    if (!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
        var img = new Image();
        img.src =  window.jwifi_impUrl;
        img.onerror = function() { throw "Impression can't loaded on " + navigator.userAgent; }
        img.onload = function() { window.jwifi_impression = true; }
    }
    

    var challenge = jwifi_getParam('challenge') || window.challenge;
    var ip = jwifi_getParam('uamip') || "10.1.0.1";
    var port = jwifi_getParam('uamport') || "3990";

    var actionurl = 'http://' + ip + ':' + port + "/portal.cgi";

    var f = document.createElement('form');
    f.name = 'frmPeplink';
    f.method = "POST";
    f.action = actionurl;

    var e1 = document.createElement("input");
    e1.value = username;
    e1.name = "username";
    e1.type = "hidden";
    f.appendChild(e1);

    var e2 = document.createElement("input");
    e2.value = password;
    e2.name = "password";
    e2.type = "hidden";
    f.appendChild(e2);

    var e3 = document.createElement("input");
    e3.value = "login";
    e3.name = "command";
    e3.type = "hidden";
    f.appendChild(e3);

    var n = document.getElementsByTagName('head')[0].appendChild(f);

    if (typeof jwifi_logHit == "function") {
        jwifi_logHit(function () {
            n.submit(); setTimeout(function () { document.getElementsByTagName('head')[0].removeChild(n) }, 2000);
        });
    }
    else {
        n.submit(); setTimeout(function () { document.getElementsByTagName('head')[0].removeChild(n) }, 2000);
    }
}