function jwifi_login_hotspot(url) {
    window.jwifi_setRedirectPage(url);

	if(!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
        var img = new Image();
        img.src =  window.jwifi_impUrl;
        img.onerror = function() { throw "Impression can't loaded on " + navigator.userAgent; }
        img.onload = function() { window.jwifi_impression = true; }
	}

    var f_hs_server = jwifi_getParam('ga_srvr');

    var f = document.createElement('form');
    f.name = 'frmCambium';
    f.method = "POST";
    f.action = "http://" + f_hs_server + ":880/cgi-bin/hotspot_login.cgi" + "?" + window.location.search.substr(1);
    
    var e1 = document.createElement("input");
    e1.value = username;
    e1.name = "ga_user";
    e1.type = "hidden";
    f.appendChild(e1);

    var e2 = document.createElement("input");
    e2.value = password;
    e2.name = "ga_pass";
    e2.type = "hidden";
    f.appendChild(e2);

    var n = document.getElementsByTagName('head')[0].appendChild(f);
    
    if (typeof jwifi_logHit == "function") {
        jwifi_logHit(function () {
            n.submit();setTimeout(function() { document.getElementsByTagName('head')[0].removeChild(n) }, 2000);
        });
    }
    else {
        n.submit();setTimeout(function() { document.getElementsByTagName('head')[0].removeChild(n) }, 2000);
    }    
}