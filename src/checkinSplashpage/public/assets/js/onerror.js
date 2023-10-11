if (typeof (Worker) !== "undefined") {
    console.log("Start Worker Catch Unexpected.");//

    var url = "/assets/js/error_worker.js";
    window.worker_error = new Worker(url);
    window.onerror = function (msg, file, line, column, error) {
        try {
            var err = ["msg=" + msg, "url=" + encodeURIComponent(window.location.href), "file=" + encodeURIComponent(file), "line=" + line + ":" + column, "object=" + JSON.stringify(error)];
            console.log(JSON.stringify(err));
            window.worker_error.postMessage(err);
        }
        catch (err) {
            console.log(err);
        }
        return false;
    };
}
else {
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
}