const retry_strategy = function (options) {
    if (options.error && options.error.code === "ECONNREFUSED") { // End reconnecting on a specific error and flush all commands with a individual error
        logger.error("The server refused the connection");
        return 5000;
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
        logger.error("Retry time exhausted");
    }
    if (options.attempt > 10) { // End reconnecting with built in error
        return undefined;
    }

    return Math.min(options.attempt * 100, 3000); // reconnect after
}

const RedisLocal = require("redis").createClient(
    { port: 6379, host: "localhost" }
).on('error', (err) => {
    logger.error('[REDIS] Error: ', err)
}).on('ready', () => {
    logger.info('[REDIS] connected: LOCAL');
})

const Redis = require("redis").createClient(
    { port: CONF.REDIS.port, host: CONF.REDIS.host, password: CONF.REDIS.password, retry_strategy: retry_strategy }
).on('error', (err) => {
    logger.error('[REDIS] Error: ', err)
}).on('ready', () => {
    logger.info('[REDIS] connected: ' + JSON.stringify(CONF.REDIS))
})

module.exports = {
    //Stringify JSON and set Cache
    set: (prefix, suffix, docs, callback) => {
        logger.debug(CONF.CACHE_PREFIX + prefix, suffix)
        var keycache = CONF.CACHE_PREFIX + prefix + ((typeof suffix != "undefined" && suffix != '') ? Util.hashKey(JSON.stringify(suffix)) : '');
        logger.debug("[set] [KeyCache]", keycache)
        if (prefix == "AP") {
            RedisLocal.set(keycache, JSON.stringify(docs), (err, result) => { })
        }
        Redis.set(keycache, JSON.stringify(docs), (err, result) => {
            return callback(err, result);
        })
    },

    //Stringify JSON and set Cache by plaintext key
    setRaw: (prefix, suffix, docs, callback) => {
        logger.debug(CONF.CACHE_PREFIX + prefix, suffix)
        var keycache = CONF.CACHE_PREFIX + prefix + ((typeof suffix != "undefined" && suffix != '') ? suffix : '');
        logger.debug("[set] [KeyCache]", keycache)
        if (prefix == "AP") {
            RedisLocal.set(keycache, JSON.stringify(docs), (err, result) => { })
        }
        Redis.set(keycache, JSON.stringify(docs), (err, result) => {
            return callback(err, result);
        })
    },

    //Get cache and parse JSON
    get: (prefix, suffix, callback) => {
        logger.debug(CONF.CACHE_PREFIX + prefix, suffix)
        suffix = ((typeof suffix != "undefined" && suffix != '') ? Util.hashKey(JSON.stringify(suffix)) : '')
        var keycache = CONF.CACHE_PREFIX + prefix + suffix;
        logger.debug("[get] [KeyCache]", keycache)

        Redis.get(keycache, (err, result) => {
            if (result) {
                return callback(err, JSON.parse(result));
            }

            RedisLocal.get(keycache, (err, result) => {
                return callback(err, JSON.parse(result));
            })
        })
    },
    //Get cache and parse JSON
    getRaw: (prefix, suffix, callback) => {
        logger.debug(CONF.CACHE_PREFIX + prefix, suffix)
        suffix = ((typeof suffix != "undefined" && suffix != '') ? suffix : '')
        var keycache = CONF.CACHE_PREFIX + prefix + suffix;
        logger.debug("[get] [KeyCache]", keycache)

        Redis.get(keycache, (err, result) => {
            if (result) {
                return callback(err, JSON.parse(result));
            }

            RedisLocal.get(keycache, (err, result) => {
                return callback(err, JSON.parse(result));
            })
        })
    },
    getAll: (callback) => {
        Redis.keys(CONF.CACHE_PREFIX + "*", (err, result) => {
            logger.debug("Cache", result);
            return callback(err, JSON.parse(result));
        })
    },
    //Get cache and parse JSON
    getByPrefix: (prefix, callback) => {
        var keycache = CONF.CACHE_PREFIX + prefix + '*';
        logger.debug("[get] [KeyCache]", keycache)

        Redis.keys(keycache, (err, keys) => {
            logger.debug("[KeyCache]", Object.keys(keys));
            return callback(err, keys);
        })
    },
    clearByPrefix: (prefix, suffix, callback) => {
        var suffix = ((typeof suffix != "undefined" && suffix != '') ? Util.hashKey(JSON.stringify(suffix)) : '*')
        var keycache = CONF.CACHE_PREFIX + prefix + suffix;
        logger.debug("[remove] [KeyCache]", keycache);

        if (suffix == "*") { // * is all
            Redis.keys(keycache, (err, keys) => {
                if (err) return callback(err, keys);
                logger.debug("[KeyCache]", keys);
                keys.forEach(key => {
                    logger.debug("[clear] [KeyCache]", keycache);
                    RedisLocal.del(key, (err, result) => { })
                    Redis.del(key, (err, result) => { })
                })
                return callback(null, {});
            })
        }
        else {
            RedisLocal.del(keycache, (err, result) => { })
            Redis.del(keycache, (err, result) => {
                return callback(err, JSON.parse(result));
            })
        }
    },
    //Clear all cache by prefix
    clear: (prefix, callback) => {
        var keycache = CONF.CACHE_PREFIX + prefix + "*";
        Redis.keys(keycache, (err, keys) => {
            if (err) return callback(err, keys);
            logger.debug("[KeyCache]", keys);
            keys.forEach(key => {
                logger.debug("[clear] [KeyCache]", key);
                RedisLocal.del(key, (err, result) => { })
                Redis.del(key, (err, result) => { })
            })
            return callback(null, {});
        })

        Redis.del(CONF.CACHE_PREFIX + prefix, (err, result) => { });
        RedisLocal.del(CONF.CACHE_PREFIX + prefix, (err, result) => { })
    },
    clearAll: (callback) => {
        var keycache = CONF.CACHE_PREFIX + "*";
        Redis.keys(keycache, (err, keys) => {
            if (err) return callback(err, keys);
            logger.debug("[clearAll] [KeyCache]", keys);
            keys.forEach(key => {
                RedisLocal.del(key, (err, result) => { })
                Redis.del(key, (err, result) => { })
            })
            return callback(null, {});
        })
    },
    //Clear all cache by prefix
    clearSession: (mac, callback) => {
        var keycache = "RADIUSMacAuth" + mac + "*";
        logger.debug("[KeyCache]", keycache);
        Redis.keys(keycache, (err, keys) => {
            if (err) return callback(err, keys);
            logger.debug("[KeyCache]", keys);
            keys.forEach(key => {
                logger.debug("[clear] [KeyCache]", keycache);
                RedisLocal.del(key, (err, result) => { })
                Redis.del(key, (err, result) => { });
            })
            return callback(err, {});
        })
    },
    //Get Session by mac_device
    getSession: (mac, callback) => {
        var keycache = "RADIUSMacAuth" + mac + "*";
        logger.debug("[KeyCache]", keycache);

        Redis.keys(keycache, (err, keys) => {
            logger.debug("[KeyCache]", Object.keys(keys));
            var fAsync = [];

            for (i = 0; i < keys.length; i++) {
                let key = keys[i];

                fAsync.push(function (cb) {

                    Redis.get(key, (err, result) => {
                        if (result) {
                            return cb(err, key + " = " + result);
                        }

                        RedisLocal.get(key, (err, result) => {
                            return cb(err, key + " = " + result);
                        })
                    })

                })
            }

            if (fAsync.length > 0) {
                async.parallel(fAsync, function (err, results) {
                    return callback(err, results);
                });
            }
        })
    },
}