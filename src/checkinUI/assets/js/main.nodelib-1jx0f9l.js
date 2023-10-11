"use strict";(self.webpackChunkcheckin_jwifi=self.webpackChunkcheckin_jwifi||[]).push([[323],{60549:(t,e,s)=>{s.d(e,{sk:()=>U,Vq:()=>p,Y3:()=>q,Qc:()=>H});var r=s(34303),i=s(95260);const o="undefined"!=typeof self?self:"undefined"!=typeof window?window:Function("return this")();function n(t,...e){return e.reduce(((e,s)=>(t.hasOwnProperty(s)&&(e[s]=t[s]),e)),{})}const a=o.setTimeout,h=o.clearTimeout;function p(t,e){e.useNativeTimers?(t.setTimeoutFn=a.bind(o),t.clearTimeoutFn=h.bind(o)):(t.setTimeoutFn=o.setTimeout.bind(o),t.clearTimeoutFn=o.clearTimeout.bind(o))}class c extends Error{constructor(t,e,s){super(t),this.description=e,this.context=s,this.type="TransportError"}}class d extends i.Q{constructor(t){super(),this.writable=!1,p(this,t),this.opts=t,this.query=t.query,this.socket=t.socket}onError(t,e,s){return super.emitReserved("error",new c(t,e,s)),this}open(){return this.readyState="opening",this.doOpen(),this}close(){return"opening"!==this.readyState&&"open"!==this.readyState||(this.doClose(),this.onClose()),this}send(t){"open"===this.readyState&&this.write(t)}onOpen(){this.readyState="open",this.writable=!0,super.emitReserved("open")}onData(t){const e=(0,r.Yi)(t,this.socket.binaryType);this.onPacket(e)}onPacket(t){super.emitReserved("packet",t)}onClose(t){this.readyState="closed",super.emitReserved("close",t)}pause(t){}createUri(t,e={}){return t+"://"+this._hostname()+this._port()+this.opts.path+this._query(e)}_hostname(){const t=this.opts.hostname;return-1===t.indexOf(":")?t:"["+t+"]"}_port(){return this.opts.port&&(this.opts.secure&&Number(443!==this.opts.port)||!this.opts.secure&&80!==Number(this.opts.port))?":"+this.opts.port:""}_query(t){const e=function(t){let e="";for(let s in t)t.hasOwnProperty(s)&&(e.length&&(e+="&"),e+=encodeURIComponent(s)+"="+encodeURIComponent(t[s]));return e}(t);return e.length?"?"+e:""}}const u="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(""),l=64,f={};let m,g=0,y=0;function w(t){let e="";do{e=u[t%l]+e,t=Math.floor(t/l)}while(t>0);return e}function b(){const t=w(+new Date);return t!==m?(g=0,m=t):t+"."+w(g++)}for(;y<l;y++)f[u[y]]=y;let v=!1;try{v="undefined"!=typeof XMLHttpRequest&&"withCredentials"in new XMLHttpRequest}catch(t){}const k=v;function T(t){const e=t.xdomain;try{if("undefined"!=typeof XMLHttpRequest&&(!e||k))return new XMLHttpRequest}catch(t){}if(!e)try{return new(o[["Active"].concat("Object").join("X")])("Microsoft.XMLHTTP")}catch(t){}}function x(){}const S=null!=new T({xdomain:!1}).responseType;class R extends i.Q{constructor(t,e){super(),p(this,e),this.opts=e,this.method=e.method||"GET",this.uri=t,this.data=void 0!==e.data?e.data:null,this.create()}create(){var t;const e=n(this.opts,"agent","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","autoUnref");e.xdomain=!!this.opts.xd;const s=this.xhr=new T(e);try{s.open(this.method,this.uri,!0);try{if(this.opts.extraHeaders){s.setDisableHeaderCheck&&s.setDisableHeaderCheck(!0);for(let t in this.opts.extraHeaders)this.opts.extraHeaders.hasOwnProperty(t)&&s.setRequestHeader(t,this.opts.extraHeaders[t])}}catch(t){}if("POST"===this.method)try{s.setRequestHeader("Content-type","text/plain;charset=UTF-8")}catch(t){}try{s.setRequestHeader("Accept","*/*")}catch(t){}null===(t=this.opts.cookieJar)||void 0===t||t.addCookies(s),"withCredentials"in s&&(s.withCredentials=this.opts.withCredentials),this.opts.requestTimeout&&(s.timeout=this.opts.requestTimeout),s.onreadystatechange=()=>{var t;3===s.readyState&&(null===(t=this.opts.cookieJar)||void 0===t||t.parseCookies(s)),4===s.readyState&&(200===s.status||1223===s.status?this.onLoad():this.setTimeoutFn((()=>{this.onError("number"==typeof s.status?s.status:0)}),0))},s.send(this.data)}catch(t){return void this.setTimeoutFn((()=>{this.onError(t)}),0)}"undefined"!=typeof document&&(this.index=R.requestsCount++,R.requests[this.index]=this)}onError(t){this.emitReserved("error",t,this.xhr),this.cleanup(!0)}cleanup(t){if(void 0!==this.xhr&&null!==this.xhr){if(this.xhr.onreadystatechange=x,t)try{this.xhr.abort()}catch(t){}"undefined"!=typeof document&&delete R.requests[this.index],this.xhr=null}}onLoad(){const t=this.xhr.responseText;null!==t&&(this.emitReserved("data",t),this.emitReserved("success"),this.cleanup())}abort(){this.cleanup()}}function E(){for(let t in R.requests)R.requests.hasOwnProperty(t)&&R.requests[t].abort()}R.requestsCount=0,R.requests={},"undefined"!=typeof document&&("function"==typeof attachEvent?attachEvent("onunload",E):"function"==typeof addEventListener&&addEventListener("onpagehide"in o?"pagehide":"unload",E,!1));const q="function"==typeof Promise&&"function"==typeof Promise.resolve?t=>Promise.resolve().then(t):(t,e)=>e(t,0),C=o.WebSocket||o.MozWebSocket,L="undefined"!=typeof navigator&&"string"==typeof navigator.product&&"reactnative"===navigator.product.toLowerCase(),P={websocket:class extends d{constructor(t){super(t),this.supportsBinary=!t.forceBase64}get name(){return"websocket"}doOpen(){if(!this.check())return;const t=this.uri(),e=this.opts.protocols,s=L?{}:n(this.opts,"agent","perMessageDeflate","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","localAddress","protocolVersion","origin","maxPayload","family","checkServerIdentity");this.opts.extraHeaders&&(s.headers=this.opts.extraHeaders);try{this.ws=L?new C(t,e,s):e?new C(t,e):new C(t)}catch(t){return this.emitReserved("error",t)}this.ws.binaryType=this.socket.binaryType,this.addEventListeners()}addEventListeners(){this.ws.onopen=()=>{this.opts.autoUnref&&this.ws._socket.unref(),this.onOpen()},this.ws.onclose=t=>this.onClose({description:"websocket connection closed",context:t}),this.ws.onmessage=t=>this.onData(t.data),this.ws.onerror=t=>this.onError("websocket error",t)}write(t){this.writable=!1;for(let e=0;e<t.length;e++){const s=t[e],i=e===t.length-1;(0,r.I4)(s,this.supportsBinary,(t=>{try{this.ws.send(t)}catch(t){}i&&q((()=>{this.writable=!0,this.emitReserved("drain")}),this.setTimeoutFn)}))}}doClose(){void 0!==this.ws&&(this.ws.close(),this.ws=null)}uri(){const t=this.opts.secure?"wss":"ws",e=this.query||{};return this.opts.timestampRequests&&(e[this.opts.timestampParam]=b()),this.supportsBinary||(e.b64=1),this.createUri(t,e)}check(){return!!C}},webtransport:class extends d{get name(){return"webtransport"}doOpen(){"function"==typeof WebTransport&&(this.transport=new WebTransport(this.createUri("https"),this.opts.transportOptions[this.name]),this.transport.closed.then((()=>{this.onClose()})).catch((t=>{this.onError("webtransport error",t)})),this.transport.ready.then((()=>{this.transport.createBidirectionalStream().then((t=>{const e=(0,r.p4)(Number.MAX_SAFE_INTEGER,this.socket.binaryType),s=t.readable.pipeThrough(e).getReader(),i=(0,r._s)();i.readable.pipeTo(t.writable),this.writer=i.writable.getWriter();const o=()=>{s.read().then((({done:t,value:e})=>{t||(this.onPacket(e),o())})).catch((t=>{}))};o();const n={type:"open"};this.query.sid&&(n.data=`{"sid":"${this.query.sid}"}`),this.writer.write(n).then((()=>this.onOpen()))}))})))}write(t){this.writable=!1;for(let e=0;e<t.length;e++){const s=t[e],r=e===t.length-1;this.writer.write(s).then((()=>{r&&q((()=>{this.writable=!0,this.emitReserved("drain")}),this.setTimeoutFn)}))}}doClose(){var t;null===(t=this.transport)||void 0===t||t.close()}},polling:class extends d{constructor(t){if(super(t),this.polling=!1,"undefined"!=typeof location){const e="https:"===location.protocol;let s=location.port;s||(s=e?"443":"80"),this.xd="undefined"!=typeof location&&t.hostname!==location.hostname||s!==t.port}const e=t&&t.forceBase64;this.supportsBinary=S&&!e,this.opts.withCredentials&&(this.cookieJar=void 0)}get name(){return"polling"}doOpen(){this.poll()}pause(t){this.readyState="pausing";const e=()=>{this.readyState="paused",t()};if(this.polling||!this.writable){let t=0;this.polling&&(t++,this.once("pollComplete",(function(){--t||e()}))),this.writable||(t++,this.once("drain",(function(){--t||e()})))}else e()}poll(){this.polling=!0,this.doPoll(),this.emitReserved("poll")}onData(t){(0,r.pH)(t,this.socket.binaryType).forEach((t=>{if("opening"===this.readyState&&"open"===t.type&&this.onOpen(),"close"===t.type)return this.onClose({description:"transport closed by the server"}),!1;this.onPacket(t)})),"closed"!==this.readyState&&(this.polling=!1,this.emitReserved("pollComplete"),"open"===this.readyState&&this.poll())}doClose(){const t=()=>{this.write([{type:"close"}])};"open"===this.readyState?t():this.once("open",t)}write(t){this.writable=!1,(0,r.V1)(t,(t=>{this.doWrite(t,(()=>{this.writable=!0,this.emitReserved("drain")}))}))}uri(){const t=this.opts.secure?"https":"http",e=this.query||{};return!1!==this.opts.timestampRequests&&(e[this.opts.timestampParam]=b()),this.supportsBinary||e.sid||(e.b64=1),this.createUri(t,e)}request(t={}){return Object.assign(t,{xd:this.xd,cookieJar:this.cookieJar},this.opts),new R(this.uri(),t)}doWrite(t,e){const s=this.request({method:"POST",data:t});s.on("success",e),s.on("error",((t,e)=>{this.onError("xhr post error",t,e)}))}doPoll(){const t=this.request();t.on("data",this.onData.bind(this)),t.on("error",((t,e)=>{this.onError("xhr poll error",t,e)})),this.pollXhr=t}}},O=/^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,B=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"];function H(t){const e=t,s=t.indexOf("["),r=t.indexOf("]");-1!=s&&-1!=r&&(t=t.substring(0,s)+t.substring(s,r).replace(/:/g,";")+t.substring(r,t.length));let i=O.exec(t||""),o={},n=14;for(;n--;)o[B[n]]=i[n]||"";return-1!=s&&-1!=r&&(o.source=e,o.host=o.host.substring(1,o.host.length-1).replace(/;/g,":"),o.authority=o.authority.replace("[","").replace("]","").replace(/;/g,":"),o.ipv6uri=!0),o.pathNames=function(t,e){const s=e.replace(/\/{2,9}/g,"/").split("/");return"/"!=e.slice(0,1)&&0!==e.length||s.splice(0,1),"/"==e.slice(-1)&&s.splice(s.length-1,1),s}(0,o.path),o.queryKey=function(t,e){const s={};return e.replace(/(?:^|&)([^&=]*)=?([^&]*)/g,(function(t,e,r){e&&(s[e]=r)})),s}(0,o.query),o}class U extends i.Q{constructor(t,e={}){super(),this.binaryType="arraybuffer",this.writeBuffer=[],t&&"object"==typeof t&&(e=t,t=null),t?(t=H(t),e.hostname=t.host,e.secure="https"===t.protocol||"wss"===t.protocol,e.port=t.port,t.query&&(e.query=t.query)):e.host&&(e.hostname=H(e.host).host),p(this,e),this.secure=null!=e.secure?e.secure:"undefined"!=typeof location&&"https:"===location.protocol,e.hostname&&!e.port&&(e.port=this.secure?"443":"80"),this.hostname=e.hostname||("undefined"!=typeof location?location.hostname:"localhost"),this.port=e.port||("undefined"!=typeof location&&location.port?location.port:this.secure?"443":"80"),this.transports=e.transports||["polling","websocket","webtransport"],this.writeBuffer=[],this.prevBufferLen=0,this.opts=Object.assign({path:"/engine.io",agent:!1,withCredentials:!1,upgrade:!0,timestampParam:"t",rememberUpgrade:!1,addTrailingSlash:!0,rejectUnauthorized:!0,perMessageDeflate:{threshold:1024},transportOptions:{},closeOnBeforeunload:!1},e),this.opts.path=this.opts.path.replace(/\/$/,"")+(this.opts.addTrailingSlash?"/":""),"string"==typeof this.opts.query&&(this.opts.query=function(t){let e={},s=t.split("&");for(let t=0,r=s.length;t<r;t++){let r=s[t].split("=");e[decodeURIComponent(r[0])]=decodeURIComponent(r[1])}return e}(this.opts.query)),this.id=null,this.upgrades=null,this.pingInterval=null,this.pingTimeout=null,this.pingTimeoutTimer=null,"function"==typeof addEventListener&&(this.opts.closeOnBeforeunload&&(this.beforeunloadEventListener=()=>{this.transport&&(this.transport.removeAllListeners(),this.transport.close())},addEventListener("beforeunload",this.beforeunloadEventListener,!1)),"localhost"!==this.hostname&&(this.offlineEventListener=()=>{this.onClose("transport close",{description:"network connection lost"})},addEventListener("offline",this.offlineEventListener,!1))),this.open()}createTransport(t){const e=Object.assign({},this.opts.query);e.EIO=r.TF,e.transport=t,this.id&&(e.sid=this.id);const s=Object.assign({},this.opts,{query:e,socket:this,hostname:this.hostname,secure:this.secure,port:this.port},this.opts.transportOptions[t]);return new P[t](s)}open(){let t;if(this.opts.rememberUpgrade&&U.priorWebsocketSuccess&&-1!==this.transports.indexOf("websocket"))t="websocket";else{if(0===this.transports.length)return void this.setTimeoutFn((()=>{this.emitReserved("error","No transports available")}),0);t=this.transports[0]}this.readyState="opening";try{t=this.createTransport(t)}catch(t){return this.transports.shift(),void this.open()}t.open(),this.setTransport(t)}setTransport(t){this.transport&&this.transport.removeAllListeners(),this.transport=t,t.on("drain",this.onDrain.bind(this)).on("packet",this.onPacket.bind(this)).on("error",this.onError.bind(this)).on("close",(t=>this.onClose("transport close",t)))}probe(t){let e=this.createTransport(t),s=!1;U.priorWebsocketSuccess=!1;const r=()=>{s||(e.send([{type:"ping",data:"probe"}]),e.once("packet",(t=>{if(!s)if("pong"===t.type&&"probe"===t.data){if(this.upgrading=!0,this.emitReserved("upgrading",e),!e)return;U.priorWebsocketSuccess="websocket"===e.name,this.transport.pause((()=>{s||"closed"!==this.readyState&&(p(),this.setTransport(e),e.send([{type:"upgrade"}]),this.emitReserved("upgrade",e),e=null,this.upgrading=!1,this.flush())}))}else{const t=new Error("probe error");t.transport=e.name,this.emitReserved("upgradeError",t)}})))};function i(){s||(s=!0,p(),e.close(),e=null)}const o=t=>{const s=new Error("probe error: "+t);s.transport=e.name,i(),this.emitReserved("upgradeError",s)};function n(){o("transport closed")}function a(){o("socket closed")}function h(t){e&&t.name!==e.name&&i()}const p=()=>{e.removeListener("open",r),e.removeListener("error",o),e.removeListener("close",n),this.off("close",a),this.off("upgrading",h)};e.once("open",r),e.once("error",o),e.once("close",n),this.once("close",a),this.once("upgrading",h),-1!==this.upgrades.indexOf("webtransport")&&"webtransport"!==t?this.setTimeoutFn((()=>{s||e.open()}),200):e.open()}onOpen(){if(this.readyState="open",U.priorWebsocketSuccess="websocket"===this.transport.name,this.emitReserved("open"),this.flush(),"open"===this.readyState&&this.opts.upgrade){let t=0;const e=this.upgrades.length;for(;t<e;t++)this.probe(this.upgrades[t])}}onPacket(t){if("opening"===this.readyState||"open"===this.readyState||"closing"===this.readyState)switch(this.emitReserved("packet",t),this.emitReserved("heartbeat"),this.resetPingTimeout(),t.type){case"open":this.onHandshake(JSON.parse(t.data));break;case"ping":this.sendPacket("pong"),this.emitReserved("ping"),this.emitReserved("pong");break;case"error":const e=new Error("server error");e.code=t.data,this.onError(e);break;case"message":this.emitReserved("data",t.data),this.emitReserved("message",t.data)}}onHandshake(t){this.emitReserved("handshake",t),this.id=t.sid,this.transport.query.sid=t.sid,this.upgrades=this.filterUpgrades(t.upgrades),this.pingInterval=t.pingInterval,this.pingTimeout=t.pingTimeout,this.maxPayload=t.maxPayload,this.onOpen(),"closed"!==this.readyState&&this.resetPingTimeout()}resetPingTimeout(){this.clearTimeoutFn(this.pingTimeoutTimer),this.pingTimeoutTimer=this.setTimeoutFn((()=>{this.onClose("ping timeout")}),this.pingInterval+this.pingTimeout),this.opts.autoUnref&&this.pingTimeoutTimer.unref()}onDrain(){this.writeBuffer.splice(0,this.prevBufferLen),this.prevBufferLen=0,0===this.writeBuffer.length?this.emitReserved("drain"):this.flush()}flush(){if("closed"!==this.readyState&&this.transport.writable&&!this.upgrading&&this.writeBuffer.length){const t=this.getWritablePackets();this.transport.send(t),this.prevBufferLen=t.length,this.emitReserved("flush")}}getWritablePackets(){if(!(this.maxPayload&&"polling"===this.transport.name&&this.writeBuffer.length>1))return this.writeBuffer;let t=1;for(let s=0;s<this.writeBuffer.length;s++){const r=this.writeBuffer[s].data;if(r&&(t+="string"==typeof(e=r)?function(t){let e=0,s=0;for(let r=0,i=t.length;r<i;r++)e=t.charCodeAt(r),e<128?s+=1:e<2048?s+=2:e<55296||e>=57344?s+=3:(r++,s+=4);return s}(e):Math.ceil(1.33*(e.byteLength||e.size))),s>0&&t>this.maxPayload)return this.writeBuffer.slice(0,s);t+=2}var e;return this.writeBuffer}write(t,e,s){return this.sendPacket("message",t,e,s),this}send(t,e,s){return this.sendPacket("message",t,e,s),this}sendPacket(t,e,s,r){if("function"==typeof e&&(r=e,e=void 0),"function"==typeof s&&(r=s,s=null),"closing"===this.readyState||"closed"===this.readyState)return;(s=s||{}).compress=!1!==s.compress;const i={type:t,data:e,options:s};this.emitReserved("packetCreate",i),this.writeBuffer.push(i),r&&this.once("flush",r),this.flush()}close(){const t=()=>{this.onClose("forced close"),this.transport.close()},e=()=>{this.off("upgrade",e),this.off("upgradeError",e),t()},s=()=>{this.once("upgrade",e),this.once("upgradeError",e)};return"opening"!==this.readyState&&"open"!==this.readyState||(this.readyState="closing",this.writeBuffer.length?this.once("drain",(()=>{this.upgrading?s():t()})):this.upgrading?s():t()),this}onError(t){U.priorWebsocketSuccess=!1,this.emitReserved("error",t),this.onClose("transport error",t)}onClose(t,e){"opening"!==this.readyState&&"open"!==this.readyState&&"closing"!==this.readyState||(this.clearTimeoutFn(this.pingTimeoutTimer),this.transport.removeAllListeners("close"),this.transport.close(),this.transport.removeAllListeners(),"function"==typeof removeEventListener&&(removeEventListener("beforeunload",this.beforeunloadEventListener,!1),removeEventListener("offline",this.offlineEventListener,!1)),this.readyState="closed",this.id=null,this.emitReserved("close",t,e),this.writeBuffer=[],this.prevBufferLen=0)}filterUpgrades(t){const e=[];let s=0;const r=t.length;for(;s<r;s++)~this.transports.indexOf(t[s])&&e.push(t[s]);return e}}U.protocol=r.TF,U.protocol}}]);