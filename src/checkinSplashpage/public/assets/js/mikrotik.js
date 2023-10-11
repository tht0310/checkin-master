function jwifi_login_hotspot(url) {
   window.jwifi_setRedirectPage(url);

   if (!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
       var img = new Image();
       img.src =  window.jwifi_impUrl;
       img.onerror = function() { throw "Impression can't loaded on " + navigator.userAgent; }
       img.onload = function() { window.jwifi_impression = true; }
   }
   

   var redirectUrl = jwifi_friendly_clickUrl;
   if (typeof url == "string") {
       redirectUrl += "?landingpage=" + encodeURIComponent(url);
   }

   var f = document.createElement('form');
   f.name = 'frmMikrotik';
   f.method = "POST";
   f.action = unescape(jwifi_getParam("link-login-only") || "http://10.5.10.1");

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
   e3.value = redirectUrl;
   e3.name = "dst";
   e3.type = "hidden";
   f.appendChild(e3);

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