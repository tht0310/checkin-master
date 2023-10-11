//function jwifi_login_hotspot(url) {if (!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') { var img = new Image(); img.src =  window.jwifi_impUrl; img.onerror = function() { throw "Impression can't loaded on " + navigator.userAgent; }; img.onload = function() { window.jwifi_impression = true; } }    	var redirectUrl = jwifi_clickUrl;    if(typeof url == "string") {        redirectUrl += "&landingpage=" + url;    }        var f = document.createElement('form');    f.name = 'frmUnifi';    f.method = "POST";    f.action = cloudkey;    var e1 = document.createElement("input");    e1.value = mac_device;    e1.name = "mac_device";    e1.type = "hidden";    f.appendChild(e1);    var e2 = document.createElement("input");    e2.value = mac_ap;    e2.name = "mac_ap";    e2.type = "hidden";    f.appendChild(e2);    var e3 = document.createElement("input");    e3.value = username;    e3.name = "username";    e3.type = "hidden";    f.appendChild(e3);    var e4 = document.createElement("input");    e4.value = password;    e4.name = "password";    e4.type = "hidden";    f.appendChild(e4);    var e5 = document.createElement("input");    e5.value = redirectUrl;    e5.name = "redirectUrl";    e5.type = "hidden";    f.appendChild(e5);    var e6 = document.createElement("input");    e6.value = sitename;    e6.name = "sitename";    e6.type = "hidden";    f.appendChild(e6);    var n = document.getElementsByTagName('head')[0].appendChild(f);  if(typeof window.jwifi_loading == "function") {window.jwifi_loading(); }  if (typeof jwifi_logHit == "function") {        jwifi_logHit(function () {            n.submit();setTimeout(function() { document.getElementsByTagName('head')[0].removeChild(n) }, 2000);        });    }    else {        n.submit();setTimeout(function() { document.getElementsByTagName('head')[0].removeChild(n) }, 2000);    }}

function jwifi_login_hotspot(url) {
    if (!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
        var img = new Image();
        img.src =  window.jwifi_impUrl;
        img.onerror = function() { throw "Impression can't loaded on " + navigator.userAgent; }
        img.onload = function() { window.jwifi_impression = true; }
    }
    
    
    var redirectUrl = jwifi_clickUrl;
    if (typeof url == "string") {
        redirectUrl += "&landingpage=" + url;
    }

    var url = cloudkey;
    url += "&mac_device=" + mac_device;
    url += "&mac_ap=" + mac_ap;
    url += "&username=" + username;
    url += "&password=" + password;
    url += "&sitename=" + sitename;

    if (typeof jwifi_logHit == "function") {
        jwifi_logHit(function () {
            jwifi_ajax(url, function (data) {
                if (data.status == 200) {
                    checkInternetToRedirect(function () {
                        window.location.href = redirectUrl;
                    })
                }
                else {
                    jwifi_login_hotspot(url);
                }
            })
        });
    }
    else {
        jwifi_ajax(url, function (data) {
            if (data.status == 200) {
                checkInternetToRedirect(function () {
                    window.location.href = redirectUrl;
                })
            }
            else {
                jwifi_login_hotspot(url);
            }
        })
    }
}

var repeat = 0;
function checkInternetToRedirect(callback) {
    var img = new Image();
    img.onload = callback;
    img.onerror = function () {
        if (repeat <= 60) {
            setTimeout(function () {
                checkInternetToRedirect(callback);
            }, 1000);
        }
    };
    img.src = "https://www.google.com/favicon.ico";
    repeat++;
}

function jwifi_auto_login_hotspot() {

    var url = cloudkey;
    url += "&mac_device=" + mac_device;
    url += "&mac_ap=" + mac_ap;
    url += "&username=" + username;
    url += "&password=" + password;
    url += "&sitename=" + sitename;


    jwifi_ajax(url, function (data) {
        if (data.status == 200) {
            console.log("Auto login success");
        }
    });
}