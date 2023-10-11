function jwifi_login_hotspot(url) {
   window.jwifi_setRedirectPage(url);

   if (!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
       var img = new Image();
       img.src =  window.jwifi_impUrl;
       img.onerror = function() { throw "Impression can't loaded on " + navigator.userAgent; }
       img.onload = function() { window.jwifi_impression = true; }
   }
   

   var f_hs_server = jwifi_getParam('hs_server') || "192.168.40.1";
   var f_Qv = jwifi_getParam('Qv');

   var f = document.createElement('form');
   f.name = 'frmMotorola';
   f.method = "POST";
   f.action = "http://" + f_hs_server + ":880/cgi-bin/hslogin.cgi";

   var e1 = document.createElement("input");
   e1.value = username;
   e1.name = "f_user";
   e1.type = "hidden";
   f.appendChild(e1);

   var e2 = document.createElement("input");
   e2.value = password;
   e2.name = "f_pass";
   e2.type = "hidden";
   f.appendChild(e2);

   var e3 = document.createElement("input");
   e3.value = f_hs_server;
   e3.name = "f_hs_server";
   e3.type = "hidden";
   f.appendChild(e3);

   var e4 = document.createElement("input");
   e4.value = f_Qv + "&amp;submit=Sign In";
   e4.name = "f_Qv";
   e4.type = "hidden";
   f.appendChild(e4);

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