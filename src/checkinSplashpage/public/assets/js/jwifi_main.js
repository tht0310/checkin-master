window.onerror = function (msg, file, line, column, error) {
    try {
        var err = ["msg=" + msg, "url=" + encodeURIComponent(window.location.href), "file=" + encodeURIComponent(file), "line=" + line + ":" + column, "object=" + JSON.stringify(error)];
        console.log(JSON.stringify(err));
        (new Image()).src = "/sp/log/error/?" + err.join("&");
    }
    catch (err) {
        console.log(err);
    }
    return false;
};

window.jwifi_getParam = function (v) {
    try {
        var url = new URL(window.location.href);
        return url.searchParams.get(v);
    }
    catch (err) {
        var url = window.location.href;
        v = v.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + v + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(url);
        return results == null ? null : results[1];
    }
};

function jwifi_ajax(url, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            console.log("Status:", this.status);
            if (this.status == 200) {
                console.log("responseText:", this.responseText);
                return callback({ status: this.status, response: this.responseText });
            } else {
                return callback({ status: this.status, response: null });
            }
        }
    };

    xhttp.open("GET", url, true);
    xhttp.send();
};

//jwifi_trackByImage new
window.jwifi_trackByImage = function (url, callback) {
    r = "&rd=" + Math.floor(1000 + Math.random() * 9000);
    (new Image()).src = url + "&" + r;
    if (typeof callback == "function") callback();
};
//End jwifi_trackByImage new

//jwifi_trackByIFrame
window.jwifi_trackByIFrame = function (url) {
    (function (d, b, u, e, r) {
        r = "&rd=" + Math.floor(1000 + Math.random() * 9000);
        e = d.createElement("iframe");
        e.src = u + "&" + r;
        e.width = "0";
        e.id = "_id" + r;
        e.height = "0";
        e.frameborder = "0";
        e.scrolling = "no";
        e.vspace = "0";
        e.hspace = "0";
        e.marginheight = "0";
        e.marginwidth = "0";
        e.style = "margin: 0;display: block";

        e.onload = function () {
            try {
                b.removeChild(d.querySelector("#_id" + r));
                if (typeof callback == "function") callback();
            } catch (err) { console.log(err); }
        };

        b.appendChild(e);
    })(document, document.body, url);
};

var $jsonp = (function () {
    var that = {};

    that.send = function (src, options) {
        var callback_name = options.callbackName || 'callback',
            on_success = options.onSuccess || function () { },
            on_timeout = options.onTimeout || function () { },
            timeout = options.timeout || 10; // sec

        var timeout_trigger = window.setTimeout(function () {
            window[callback_name] = function () { };
            on_timeout();
        }, timeout * 1000);

        window[callback_name] = function (data) {
            window.clearTimeout(timeout_trigger);
            on_success(data);
        }

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = src + "&callback=" + callback_name;

        document.getElementsByTagName('head')[0].appendChild(script);
    }

    return that;
})();

window.emojiStrip = function (u) { function D(E) { if (F[E]) return F[E].exports; var C = F[E] = { i: E, l: !1, exports: {} }; return u[E].call(C.exports, C, C.exports, D), C.l = !0, C.exports } var F = {}; return D.m = u, D.c = F, D.i = function (u) { return u }, D.d = function (u, F, E) { D.o(u, F) || Object.defineProperty(u, F, { configurable: !1, enumerable: !0, get: E }) }, D.n = function (u) { var F = u && u.__esModule ? function () { return u.default } : function () { return u }; return D.d(F, "a", F), F }, D.o = function (u, D) { return Object.prototype.hasOwnProperty.call(u, D) }, D.p = "", D(D.s = 1) }([function (u, D, F) { "use strict"; u.exports = function () { return /(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC69\uDC6E\uDC70-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD26\uDD30-\uDD39\uDD3D\uDD3E\uDDD1-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])?|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDEEB\uDEEC\uDEF4-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])\uFE0F/g } }, function (u, D, F) { function E(u) { return u.replace(A, "") } var C = F(0), A = C(); u.exports = E }]);

window.jwifi_checkin = function (reason, callback) {

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "/sp/checkin");
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    if (typeof reason == "function") {
        callback = reason;
        reason = "";
    }

    // var data = { lId: ap.location._id, apId: ap._id, groupId: ap.group._id, eId: employee._id, reason: reason, mac_ap: mac_ap, mac_device: mac_device, rdId: rdId, hashId: hashId };
    var data = { lId: lId, apId: apId, groupId: groupId, eId: employee._id, reason: reason, mac_ap: mac_ap, mac_device: mac_device, rdId: rdId, hashId: hashId };
    xmlhttp.send(JSON.stringify(data));
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4) {
            if (xmlhttp.status === 200) {
                var res = JSON.parse(xmlhttp.responseText);
                return callback(res);
            } else if (xmlhttp.status === 405) {
                if (typeof openCheckinAlert == "function") {
                    openCheckinAlert({
                        header: "Chấm công không thành công!",
                        msg: "Phương thức chấm công không được phép.",
                        textAlign: "center"
                    }, function () {
                    })
                }
                else {
                    alert("Phương thức chấm công không được phép!");
                }
            }
            else if (xmlhttp.status === 404) {
                if (typeof openCheckinAlert == "function") {
                    openCheckinAlert({
                        header: "Chấm công không thành công!",
                        msg: "Tài khoản không tồn tại!",
                        textAlign: "center"
                    }, function () {
                    })
                }
                else {
                    alert("Tài khoản không tồn tại!");
                }
            }
            else if (xmlhttp.status === 502 || xmlhttp.status === 501 || xmlhttp.status === 500) {
                if (openCheckinAlert) {
                    openCheckinAlert({
                        header: "Chấm công không thành công!",
                        msg: "Dịch vụ tạm gián đoạn. Vui lòng thử lại sau. Xin cám ơn!",
                        textAlign: "center"
                    }, function () {
                    })
                }
                else {
                    alert("Dịch vụ tạm gián đoạn. Vui lòng thử lại sau. Xin cám ơn!");
                }
            }
        }
    }
}

window.jwifi_checkin_bypass = function (username, password, reason, callback) {
    window.username = username;
    window.password = password;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "/sp/checkin");
    xmlhttp.setRequestHeader("Content-Type", "application/json");

    if (typeof reason == "function") {
        callback = reason;
        reason = "";
    }

    var data = { lId: lId, apId: apId, groupId: groupId, username: username, password: password, mac_ap: mac_ap, mac_device: mac_device, rdId: rdId, hashId: hashId }
    xmlhttp.send(JSON.stringify(data));
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4) {
            if (xmlhttp.status === 200) {
                var res = JSON.parse(xmlhttp.responseText);
                return callback(res);
            } else if (xmlhttp.status === 405) {
                if (openCheckinAlert) {
                    openCheckinAlert({
                        header: "Chấm công không thành công!",
                        msg: "Phương thức chấm công không được phép.",
                        textAlign: "center"
                    }, function () {
                    })
                }
                else {
                    alert("Phương thức chấm công không được phép!");
                }
            }
            else if (xmlhttp.status === 404) {
                if (openCheckinAlert) {
                    openCheckinAlert({
                        header: "Chấm công không thành công!",
                        msg: "Tài khoản không tồn tại!",
                        textAlign: "center"
                    }, function () {
                    })
                }
                else {
                    alert("Tài khoản không tồn tại!");
                }
            }
            else if (xmlhttp.status === 502 || xmlhttp.status === 501 || xmlhttp.status === 500) {
                if (openCheckinAlert) {
                    openCheckinAlert({
                        header: "Chấm công không thành công!",
                        msg: "Dịch vụ tạm gián đoạn. Vui lòng thử lại sau. Xin cám ơn!",
                        textAlign: "center"
                    }, function () {
                    })
                }
                else {
                    alert("Dịch vụ tạm gián đoạn. Vui lòng thử lại sau. Xin cám ơn!");
                }
            }
        }
    }
}