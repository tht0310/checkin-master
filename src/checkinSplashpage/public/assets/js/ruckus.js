function jwifi_login_hotspot(url) {
    window.jwifi_setRedirectPage(url);
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

    //For ruckus smart zone
    if (jwifi_getParam("zoneName")) {  
        var f = document.createElement('form');
        f.name = 'hotspot_login_f';
        f.method = "POST";
        var protocol = location.protocol;
        var port = (protocol == "https:") ? ":9998" : ":9997";
        if (jwifi_getParam("sshTunnelStatus") == "1") {
            f.action = protocol + "//" + jwifi_getParam("sip") + port + "/SubscriberPortal/hotspotlogin";
        } else {
            f.action = protocol + "//" + jwifi_getParam("apip") + port + "/SubscriberPortal/hotspotlogin";
        }

        var e1 = document.createElement("input");
        e1.name = "uip";
        e1.value = jwifi_getParam('uip');
        e1.type = "hidden";
        f.appendChild(e1);

        var e2 = document.createElement("input");
        e2.name = "url";
        e2.value = redirectUrl;
        e2.type = "hidden";
        f.appendChild(e2);

        var e3 = document.createElement("input");
        e3.name = "proxy";
        e3.value = jwifi_getParam('proxy');
        e3.type = "hidden";
        f.appendChild(e3);

        var e4 = document.createElement("input");
        e4.name = "client_mac";
        e4.value = jwifi_getParam('client_mac');
        e4.type = "hidden";
        f.appendChild(e4);

        var e5 = document.createElement("input");
        e5.name = "username";
        e5.value = username;
        e5.type = "hidden";
        f.appendChild(e5);

        var e6 = document.createElement("input");
        e6.name = "password";
        e6.value = password;
        e6.type = "hidden";
        f.appendChild(e6);

        var eSubmit = document.createElement("input");
        eSubmit.value = "";
        eSubmit.name = "Submit";
        eSubmit.type = "hidden";
        f.appendChild(eSubmit);

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
    else {
        var f = document.createElement('form');
        f.name = 'hotspot_login_f';
        f.method = "POST";
        // f.action = "http://" + jwifi_getParam("sip") + ":9997/login";

        var protocol = window.location.protocol;
        var port = (protocol == "https:") ? ":9998" : ":9997";
        f.action = protocol + "//" + jwifi_getParam("sip") + port + "/login";

        var e5 = document.createElement("input");
        e5.name = "username";
        e5.value = username;
        e5.type = "hidden";
        f.appendChild(e5);

        var e6 = document.createElement("input");
        e6.name = "password";
        e6.value = password;
        e6.type = "hidden";
        f.appendChild(e6);

        var eSubmit = document.createElement("input");
        eSubmit.value = "";
        eSubmit.name = "Submit";
        eSubmit.type = "hidden";
        f.appendChild(eSubmit);

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
}