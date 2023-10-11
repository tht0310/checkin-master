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

    var user_continue_url = encodeURIComponent(redirectUrl);

    if (jwifi_getParam('base_grant_url')) {
        var base_grant_url = unescape(jwifi_getParam('base_grant_url'));
        var grant_url = base_grant_url + "?continue_url=" + user_continue_url;

        if (typeof jwifi_logHit == "function") {
            jwifi_logHit(function () {
                if (typeof jwifi_logClick == "function") {
                    jwifi_logClick(function () {
                        top.location.href = grant_url;
                    });
                }
                else {
                    top.location.href = grant_url;
                }
            });
        } else {
            if (typeof jwifi_logClick == "function") {
                jwifi_logClick(function () {
                    top.location.href = grant_url;
                });
            }
            else {
                top.location.href = grant_url;
            }
        }
    }
    else {
        var f = document.createElement('form');
        f.name = 'frmMeraki';
        f.method = "POST";
        f.action = unescape(jwifi_getParam('login_url'));

        var e1 = document.createElement("input");
        e1.name = "username";
        e1.value = username;
        e1.type = "hidden";
        f.appendChild(e1);

        var e2 = document.createElement("input");
        e2.name = "password";
        e2.value = password;
        e2.type = "hidden";
        f.appendChild(e2);

        var e3 = document.createElement("input");
        e3.name = "success_url";
        e3.value = user_continue_url;
        e3.type = "hidden";
        f.appendChild(e3);

        var eSubmit = document.createElement("input");
        eSubmit.value = "Login";
        eSubmit.name = "Submit";
        eSubmit.type = "hidden";
        f.appendChild(eSubmit);

        var n = document.getElementsByTagName('head')[0].appendChild(f);

        if (typeof jwifi_logHit == "function") {
            jwifi_logHit(function () {
                n.submit(); setTimeout(function () { document.getElementsByTagName('head')[0].removeChild(n); }, 2000);
            });
        }
        else {
            n.submit(); setTimeout(function () { document.getElementsByTagName('head')[0].removeChild(n); }, 2000);
        }
    }
}