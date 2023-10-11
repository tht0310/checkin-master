const axios = require('axios')

const Geo = module.exports = {
    getGoogleMap: (address, cb) => {
        const url = 'https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDx41JR9QUf4AlTl5ZZX4tfsWg1vN7v7VY&address=' + Util.removeDMVS(address);
        logger.debug("GET LAT LONG FROM API", url);
        axios.get(url).then(function (result) {
            var data = result.data;
            if (data.length > 0) {
                logger.debug(data[0]);
                var doc = {
                    keyword: Util.removeDMV(address),
                    address: address,
                    lat: Number(data[0].geometry.location.lat),
                    long: Number(data[0].geometry.location.lng),
                }

                var args = { schema: "LatLong", query: { keyword: Util.removeDMV(address) }, update: { $set: doc } };
                JCloud.findOneAndUpsert(args, (err, result) => {
                    if (err) {
                        logger.error(err)
                    }
                    logger.debug("SAVE LAT LONG TO DB")
                })

                cb(doc);
            }
            else {
                logger.debug("NO DATA");
                Geo.getPositionStack(address, cb);
            }
        }).catch(
            function (error) {
                logger.error("ERROR");
                Geo.getDefault(address, cb);
            }
        )
    },
    getPositionStack: (address, cb) => {
        //api free 25.000  request/ month
        const url = 'http://api.positionstack.com/v1/forward?access_key=c53430096d971f6ffb30e066d0f74a99&limit=1&output=json&query=' + Util.removeDMVS(address);
        logger.debug("GET LAT LONG FROM API", url);
        axios.get(url).then(function (result) {
            logger.debug(result.data);
            var data = result.data.data;
            if (data.length > 0) {
                var doc = {
                    keyword: Util.removeDMV(address),
                    address: address,
                    lat: Number(data[0].latitude),
                    long: Number(data[0].longitude),
                }

                var args = { schema: "LatLong", query: { keyword: Util.removeDMV(address) }, update: { $set: doc } };
                JCloud.findOneAndUpsert(args, (err, result) => {
                    if (err) {
                        logger.error(err)
                    }
                    logger.debug("SAVE LAT LONG TO DB")
                })

                cb(data[0]);
            }
            else {
                logger.debug("NO DATA");
                Geo.getOpenStreet(address, cb);
            }
        }).catch(
            function (error) {
                logger.error("ERROR");
                Geo.getDefault(address, cb);
            }
        )
    },
    getOpenStreet: (address, cb) => {
        logger.debug(address);

        var args = { schema: "LatLong", query: { keyword: Util.removeDMV(address) }, select: "lat long" };
        JCloud.findOne(args, (err, result) => {
            if (err) {
                logger.error(err)
            }

            if (result) {
                logger.debug("GET LAT LONG FROM DB or Cache");
                cb(result);
            } else {
                const url = 'https://nominatim.openstreetmap.org/?format=json&limit=1&q=' + Util.removeDMVS(address);
                logger.debug("GET LAT LONG FROM API", url);
                axios.get(url).then(function (result) {
                    var data = result.data;
                    if (data.length > 0) {
                        logger.debug(data[0]);
                        var doc = {
                            keyword: Util.removeDMV(address),
                            address: address,
                            lat: Number(data[0].lat),
                            long: Number(data[0].lon),
                        }

                        var args = { schema: "LatLong", query: { keyword: Util.removeDMV(address) }, update: { $set: doc } };
                        JCloud.findOneAndUpsert(args, (err, result) => {
                            if (err) {
                                logger.error(err)
                            }
                            logger.debug("SAVE LAT LONG TO DB")
                        })

                        cb(doc);
                    }
                    else {
                        logger.debug("NO DATA");
                        Geo.getDefault(address, cb);
                    }
                }).catch(
                    function (error) {
                        logger.error("ERROR");
                        Geo.getDefault(address, cb);
                    }
                )
            }
        })
    },
    getDefault: (address, cb) => {        
        cb({ code: 404, lat: 10.772126517143002, long: 106.69845057974072 });
    },
    getLatLong: (address, cb) => {
        var args = { schema: "LatLong", query: { keyword: Util.removeDMV(address) }, select: "lat long" };
        JCloud.findOne(args, (err, result) => {
            if (err) {
                logger.error(err)
            }

            if (result) {
                logger.debug("GET LAT LONG FROM DB/Cache");
                cb(result);
            } else {
                Geo.getOpenStreet(address, cb);
            }
        })
    }
}