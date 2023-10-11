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

   var target = (jwifi_getParam("target") || '127.0.0.1');
   var targetPort = (jwifi_getParam("targetPort") || '');
   var submitUrl = "http://" + target + ":" + targetPort + "/portal/radius/auth";
   
   var f = document.createElement('form');
   f.name = 'frmUnifi';
   f.method = "POST";
   f.action = submitUrl;

   var e1 = document.createElement("input");
   e1.value = mac_device;
   e1.name = "clientMac";
   e1.type = "hidden";
   f.appendChild(e1);

   var e2 = document.createElement("input");
   e2.value = username;
   e2.name = "username";
   e2.type = "hidden";
   f.appendChild(e2);

   var e3 = document.createElement("input");
   e3.value = password;
   e3.name = "password";
   e3.type = "hidden";
   f.appendChild(e3);

   var e4 = document.createElement("input");
   e4.value = redirectUrl;
   e4.name = "redirectUrl";
   e4.type = "hidden";
   f.appendChild(e4);

   var e5 = document.createElement("input");
   e5.value = (jwifi_getParams("clientIp") || "");
   e5.name = "clientIp";
   e5.type = "hidden";
   f.appendChild(e5);


   var e6 = document.createElement("input");
   e6.value = mac_ap;
   e6.name = "ap";
   e6.type = "hidden";
   f.appendChild(e6);

   var e7 = document.createElement("input");
   e7.value = (jwifi_getParams("ssid") || "");
   e7.name = "ssid";
   e7.type = "hidden";
   f.appendChild(e7);

   var e8 = document.createElement("input");
   e8.value = (jwifi_getParams("radioId") || "");
   e8.name = "radioId";
   e8.type = "hidden";
   f.appendChild(e8);

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