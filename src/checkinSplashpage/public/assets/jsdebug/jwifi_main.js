window.jwifi_getParam = function (v, d) {
    try {        
        var url = new URL(window.location.href);
        return url.searchParams.get(v);
    }
    catch(err) {
        var url =window.location.href;
        v = v.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+v+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec( url );
        return results == null ? null : results[1];
    }
};

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

function jwifi_ajax(url, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            console.log("Status:", this.status);
            if (this.status == 200) {
                console.log("responseText:", this.responseText);
                return callback({status: this.status, response: this.responseText});
            } else {
                return callback({status: this.status, response: null});
            }
        }
    };

    xhttp.open("GET", url, true);
    xhttp.send();
};