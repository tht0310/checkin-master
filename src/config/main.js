module.exports = {
    dev: {
        ...require(__ + "/config/general"),
        PORT: 8000,
        sPORT: 8143,
        beca_PORT: 8480,
        beca_sPORT: 8443,
        CHECKIN_MONGO_URL: "mongodb://localhost:27017/jcloud",
        REDIS: {
            port: 6379,
            host: 'localhost',
            password: undefined
        },
        HOST: "localhost:8000",
        IMG_1x1: __SP__ + '/public/assets/img/1x1.gif',
        SSL: {
            key: '/etc/nginx/ssl/jwifi.key',
            cert: '/etc/nginx/ssl/jwifi.crt'
        },
        becaSSL: {
            key: '/etc/nginx/ssl/becawifi.key',
            cert: '/etc/nginx/ssl/becawifi.crt'
        },
        ENV: "development"
    },
    prod: {
        ...require(__ + "/config/general"),
        PORT: 8000,
        sPORT: 8143,
        beca_PORT: 8480,
        beca_sPORT: 8443,
        CHECKIN_MONGO_URL: 'mongodb://checkin:7FdGL3yb@45.118.139.101,45.118.139.102,45.118.139.103/checkin?replicaSet=mongorep',
        REDIS: {
            port: 6379,
            host: 'localhost',
            password: undefined
        },
        HOST: "checkin.becawifi.vn/sp",
        HOSTID1: "45.118.139.106",
        HOSTID2: "45.118.139.107",
        HOSTID3: "45.118.139.114",
        IMG_1x1: __SP__ + '/public/assets/img/1x1.gif',
        SSL: {
            key: '/etc/nginx/ssl/jwifi.key',
            cert: '/etc/nginx/ssl/jwifi.crt'
        },
        becaSSL: {
            key: '/etc/nginx/ssl/becawifi.key',
            cert: '/etc/nginx/ssl/becawifi.crt'
        },
    }
}
