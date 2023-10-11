var secret = "greatsecret";
window.challenge = "";

pack = function (r) { for (var e, o, n, a, t, g, h, i, f, c, s, w, C, l, d, p, m, k, u, S, b, y, E = 0, W = 1, T = "", v = "", A = 0, M = []; E < r.length;) { for (e = r.charAt(E), o = "", E++; E < r.length && null !== r.charAt(E).match(/[\d*]/);)o += r.charAt(E), E++; switch ("" === o && (o = "1"), e) { case "a": case "A": if (void 0 === arguments[W]) throw new Error("Warning:  pack() Type " + e + ": not enough arguments"); for (v = String(arguments[W]), "*" === o && (o = v.length), A = 0; A < o; A++)void 0 === v[A] ? T += "a" === e ? String.fromCharCode(0) : " " : T += v[A]; W++; break; case "h": case "H": if (void 0 === arguments[W]) throw new Error("Warning: pack() Type " + e + ": not enough arguments"); if (v = arguments[W], "*" === o && (o = v.length), o > v.length) throw new Error("Warning: pack() Type " + e + ": not enough characters in string"); for (A = 0; A < o; A += 2)n = v[A], A + 1 >= o || void 0 === v[A + 1] ? n += "0" : n += v[A + 1], "h" === e && (n = n[1] + n[0]), T += String.fromCharCode(parseInt(n, 16)); W++; break; case "c": case "C": if ("*" === o && (o = arguments.length - W), o > arguments.length - W) throw new Error("Warning:  pack() Type " + e + ": too few arguments"); for (A = 0; A < o; A++)T += String.fromCharCode(arguments[W]), W++; break; case "s": case "S": case "v": if ("*" === o && (o = arguments.length - W), o > arguments.length - W) throw new Error("Warning:  pack() Type " + e + ": too few arguments"); for (A = 0; A < o; A++)T += String.fromCharCode(255 & arguments[W]), T += String.fromCharCode(arguments[W] >> 8 & 255), W++; break; case "n": if ("*" === o && (o = arguments.length - W), o > arguments.length - W) throw new Error("Warning: pack() Type " + e + ": too few arguments"); for (A = 0; A < o; A++)T += String.fromCharCode(arguments[W] >> 8 & 255), T += String.fromCharCode(255 & arguments[W]), W++; break; case "i": case "I": case "l": case "L": case "V": if ("*" === o && (o = arguments.length - W), o > arguments.length - W) throw new Error("Warning:  pack() Type " + e + ": too few arguments"); for (A = 0; A < o; A++)T += String.fromCharCode(255 & arguments[W]), T += String.fromCharCode(arguments[W] >> 8 & 255), T += String.fromCharCode(arguments[W] >> 16 & 255), T += String.fromCharCode(arguments[W] >> 24 & 255), W++; break; case "N": if ("*" === o && (o = arguments.length - W), o > arguments.length - W) throw new Error("Warning:  pack() Type " + e + ": too few arguments"); for (A = 0; A < o; A++)T += String.fromCharCode(arguments[W] >> 24 & 255), T += String.fromCharCode(arguments[W] >> 16 & 255), T += String.fromCharCode(arguments[W] >> 8 & 255), T += String.fromCharCode(255 & arguments[W]), W++; break; case "f": case "d": if (a = 23, t = 8, "d" === e && (a = 52, t = 11), "*" === o && (o = arguments.length - W), o > arguments.length - W) throw new Error("Warning:  pack() Type " + e + ": too few arguments"); for (A = 0; A < o; A++) { for (v = arguments[W], f = h = Math.pow(2, t - 1) - 1, (i = 1 - h) - a, c = isNaN(d = parseFloat(v)) || d === -1 / 0 || d === 1 / 0 ? d : 0, s = 0, w = 2 * h + 1 + a + 3, C = new Array(w), l = (d = 0 !== c ? 0 : d) < 0, m = (d = Math.abs(d)) - (p = Math.floor(d)), b = w; b;)C[--b] = 0; for (b = h + 2; p && b;)C[--b] = p % 2, p = Math.floor(p / 2); for (b = h + 1; m > 0 && b; --m)C[++b] = ((m *= 2) >= 1) - 0; for (b = -1; ++b < w && !C[b];); if (C[(k = a - 1 + (b = (s = h + 1 - b) >= i && s <= f ? b + 1 : h + 1 - (s = i - 1))) + 1]) { if (!(u = C[k])) for (S = k + 2; !u && S < w; u = C[S++]); for (S = k + 1; u && --S >= 0; (C[S] = !C[S] - 0) && (u = 0)); } for (b = b - 2 < 0 ? -1 : b - 3; ++b < w && !C[b];); for ((s = h + 1 - b) >= i && s <= f ? ++b : s < i && (b = h + 1 - (s = i - 1)), (p || 0 !== c) && (s = f + 1, b = h + 2, c === -1 / 0 ? l = 1 : isNaN(c) && (C[b] = 1)), d = Math.abs(s + h), y = "", S = t + 1; --S;)y = d % 2 + y, d = d >>= 1; for (d = 0, S = 0, b = (y = (l ? "1" : "0") + y + C.slice(b, b + a).join("")).length, M = []; b;)d += (1 << S) * y.charAt(--b), 7 === S && (M[M.length] = String.fromCharCode(d), d = 0), S = (S + 1) % 8; M[M.length] = d ? String.fromCharCode(d) : "", T += M.join(""), W++ } break; case "x": if ("*" === o) throw new Error("Warning: pack(): Type x: '*' ignored"); for (A = 0; A < o; A++)T += String.fromCharCode(0); break; case "X": if ("*" === o) throw new Error("Warning: pack(): Type X: '*' ignored"); for (A = 0; A < o; A++) { if (0 === T.length) throw new Error("Warning: pack(): Type X: outside of string"); T = T.substring(0, T.length - 1) } break; case "@": if ("*" === o) throw new Error("Warning: pack(): Type X: '*' ignored"); if (o > T.length) for (g = o - T.length, A = 0; A < g; A++)T += String.fromCharCode(0); o < T.length && (T = T.substring(0, o)); break; default: throw new Error("Warning: pack() Type " + e + ": unknown format code") } } if (W < arguments.length) { var N = "Warning: pack(): " + (arguments.length - W) + " arguments unused"; throw new Error(N) } return T };
var ChilliMD5 = (function () { return function () { var hex_chr = "0123456789abcdef"; var rhex = function (num) { str = ""; for (j = 0; j <= 3; j++) str += hex_chr.charAt((num >> (j * 8 + 4)) & 0x0F) + hex_chr.charAt((num >> (j * 8)) & 0x0F); return str; }; var str2blks_MD5 = function (str) { nblk = ((str.length + 8) >> 6) + 1; blks = new Array(nblk * 16); for (i = 0; i < nblk * 16; i++) blks[i] = 0; for (i = 0; i < str.length; i++) blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8); blks[i >> 2] |= 0x80 << ((i % 4) * 8); blks[nblk * 16 - 2] = str.length * 8; return blks; }; var add = function (x, y) { var lsw = (x & 0xFFFF) + (y & 0xFFFF); var msw = (x >> 16) + (y >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xFFFF); }; var rol = function (num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }; var cmn = function (q, a, b, x, s, t) { return add(rol(add(add(a, q), add(x, t)), s), b); }; var ff = function (a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }; var gg = function (a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }; var hh = function (a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }; var ii = function (a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }; var md5 = function (str) { x = str2blks_MD5(str); a = 1732584193; b = -271733879; c = -1732584194; d = 271733878; for (i = 0; i < x.length; i += 16) { olda = a; oldb = b; oldc = c; oldd = d; a = ff(a, b, c, d, x[i + 0], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586); c = ff(c, d, a, b, x[i + 2], 17, 606105819); b = ff(b, c, d, a, x[i + 3], 22, -1044525330); a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426); c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983); a = ff(a, b, c, d, x[i + 8], 7, 1770035416); d = ff(d, a, b, c, x[i + 9], 12, -1958414417); c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162); a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101); c = ff(c, d, a, b, x[i + 14], 17, -1502002290); b = ff(b, c, d, a, x[i + 15], 22, 1236535329); a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632); c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i + 0], 20, -373897302); a = gg(a, b, c, d, x[i + 5], 5, -701558691); d = gg(d, a, b, c, x[i + 10], 9, 38016083); c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848); a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690); c = gg(c, d, a, b, x[i + 3], 14, -187363961); b = gg(b, c, d, a, x[i + 8], 20, 1163531501); a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784); c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734); a = hh(a, b, c, d, x[i + 5], 4, -378558); d = hh(d, a, b, c, x[i + 8], 11, -2022574463); c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556); a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353); c = hh(c, d, a, b, x[i + 7], 16, -155497632); b = hh(b, c, d, a, x[i + 10], 23, -1094730640); a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i + 0], 11, -358537222); c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189); a = hh(a, b, c, d, x[i + 9], 4, -640364487); d = hh(d, a, b, c, x[i + 12], 11, -421815835); c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651); a = ii(a, b, c, d, x[i + 0], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415); c = ii(c, d, a, b, x[i + 14], 15, -1416354905); b = ii(b, c, d, a, x[i + 5], 21, -57434055); a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606); c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799); a = ii(a, b, c, d, x[i + 8], 6, 1873313359); d = ii(d, a, b, c, x[i + 15], 10, -30611744); c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649); a = ii(a, b, c, d, x[i + 4], 6, -145523070); d = ii(d, a, b, c, x[i + 11], 10, -1120210379); c = ii(c, d, a, b, x[i + 2], 15, 718787259); b = ii(b, c, d, a, x[i + 9], 21, -343485551); a = add(a, olda); b = add(b, oldb); c = add(c, oldc); d = add(d, oldd); } return rhex(a) + rhex(b) + rhex(c) + rhex(d); }; return { md5: md5 } } })();

/*Encode password to PAP password*/
function jwifi_encode_password(password, challenge) {
	String.prototype.xor = function (r) { for (var t = "", o = 0; o < this.length && o < r.length; ++o)t += String.fromCharCode(this.charCodeAt(o) ^ r.charCodeAt(o)); return t };
	String.prototype.toHex = function () { for (var t, r = "", n = 0; n < this.length; n++)1 == (t = this.charCodeAt(n).toString(16)).length && (t = "0" + t), r += t; return r };

	var chilliMD5 = ChilliMD5();
	var hexchal = pack('H32', challenge);
	var newchal, newpwd, pappassword;
	newchal = pack('H*', chilliMD5.md5(hexchal + secret));
	newpwd = pack("a32", password);
	pappassword = newpwd.xor(newchal).toHex();
	return pappassword;
};

function jwifi_login_hotspot(url) {
	window.jwifi_setRedirectPage(url);

	if (!window.jwifi_impression && typeof window.jwifi_impUrl == 'string') {
		var img = new Image();
		img.src = window.jwifi_impUrl;
		img.onerror = function () { throw "Impression can't loaded on " + navigator.userAgent; }
		img.onload = function () { window.jwifi_impression = true; }
	}

	var challenge = jwifi_getParam('challenge') || window.challenge;
	var ip = jwifi_getParam('uamip') || "10.1.0.1";
	var port = jwifi_getParam('uamport') || "3990";

	loginUrl = 'http://' + ip + ':' + port + '/logon?';
	loginUrl += "&username=" + username + "&password=" + jwifi_encode_password(password, challenge);

	if (typeof jwifi_logHit == "function") {
		jwifi_logHit(function () {
			window.location.href = loginUrl;
		});
	}
	else {
		window.location.href = loginUrl;
	}
};

function getChallenge(j) {
	if ((typeof j != "undefined")) {
		if (typeof j.challenge == "string") {
			window.challenge = j.challenge;
		}

		console.log("clientState: ", j.clientState)
	}
	else {
		var ip = jwifi_getParam('uamip') || "10.1.0.1";
		var port = jwifi_getParam('uamport') || "3990";
		var url = 'http://' + ip + ':' + port + '/json/status?callback=getChallenge'; /*random to prevent caching in Browser*/
		var s = document.createElement('script');
		s.type = 'text/javascript';
		s.src = url; s.async = 1;
		s.onerror = "console.log('Cannot Get Challenge');";
		var node = document.getElementsByTagName('head')[0].appendChild(s);
		var timer = setTimeout(function () {
			if (typeof (node) !== 'number') document.getElementsByTagName('head')[0].removeChild(node);
			node = 0; clearTimeout(timer);
		}, 5000);
	}
};

getChallenge(undefined);