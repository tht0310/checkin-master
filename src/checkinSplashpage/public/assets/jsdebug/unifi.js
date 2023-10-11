
function jwifi_login_hotspot(url) {
    window.jwifi_setRedirectPage(url);

	if(!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
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
        if (repeat <= 10) {
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
