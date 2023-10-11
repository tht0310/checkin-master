function jwifi_login_hotspot(url) {
   window.jwifi_setRedirectPage(url);

  if(!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
       var img = new Image();
       img.src =  window.jwifi_impUrl;
       img.onerror = function() { throw "Impression can't loaded on " + navigator.userAgent; }
       img.onload = function() { window.jwifi_impression = true; }
  }
  

  var redirectUrl = jwifi_friendly_clickUrl;
   if(typeof url == "string") {
       redirectUrl += "?landingpage=" + encodeURIComponent(url);
   }    

   var f = document.createElement('form');
   f.name = 'frmCisco';
   f.method = "POST";
   f.action = unescape(jwifi_getParam("switch_url"));

   var e1 = document.createElement("input");
   e1.name = "buttonClicked";
   e1.value = 4;
   e1.type = "hidden";
   f.appendChild(e1);

   var e2 = document.createElement("input");
   e2.name = "redirect_url";
   e2.value = redirectUrl;
   e2.type = "hidden";
   f.appendChild(e2);  

   var e3 = document.createElement("input");
   e3.name = "err_flag";
   e3.value = "0";
   e3.type = "hidden";
   f.appendChild(e3);

   var e4 = document.createElement("input");
   e4.name = "username";
   e4.value = username;
   e4.type = "hidden";
   f.appendChild(e4);

   var e5 = document.createElement("input");
   e5.name = "password";
   e5.value = password;
   e5.type = "hidden";
   f.appendChild(e5);
   
   var eSubmit = document.createElement("input");
   eSubmit.value = "";
   eSubmit.name = "Submit";
   eSubmit.type = "hidden";
   f.appendChild(eSubmit);

   var n = document.getElementsByTagName('head')[0].appendChild(f);
   
   if (typeof jwifi_logHit == "function") {
       jwifi_logHit(function () {
           n.submit(); setTimeout(function() { document.getElementsByTagName('head')[0].removeChild(n); }, 2000);
       });
   }
   else {
       n.submit(); setTimeout(function() { document.getElementsByTagName('head')[0].removeChild(n); }, 2000);
   }
}