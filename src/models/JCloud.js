var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
// mongoose.set("strictQuery", false);


// //Connect Mongo DB
// var jcloudDB = mongoose.createConnection(CONF.CHECKIN_MONGO_URL);

// //Handle events
// jcloudDB.on('error', (err) => {
//     app.set('MONGO_ERROR', 'MongoDb ' + err)
//     logger.fatal(err);
//     jcloudDB.disconnect()
// }).on('connected', () => {
//     app.set('MONGO_ERROR', 'none')
//     logger.info('[MongoDB] connected ' + CONF.CHECKIN_MONGO_URL)
// }).on('reconnected', () => {
//     app.set('MONGO_ERROR', 'none')
//     logger.info('[MongoDB] reconnected')
// }).on('disconnected', () => {
//     jcloudDB = mongoose.createConnection(CONF.CHECKIN_MONGO_URL, { useNewUrlParser: true, poolSize: 2 });
// })

const timeout = 5000; // ms.
var connect = () => {
  mongoose.connect(CONF.CHECKIN_MONGO_URL).catch(() => { });
}

const jcloudDB = mongoose.connection;

jcloudDB.on('error', (err) => {
  app.set('MONGO_ERROR', 'MongoDb ' + err)
  logger.fatal("[MongoDB] error " + err);
  logger.info(`MongoDB disconnected! Reconnecting in ${timeout / 1000}s...`);
  setTimeout(() => connect, timeout);
}).on('connected', () => {
  app.set('MONGO_ERROR', 'none')
  logger.info('[MongoDB] connected ' + CONF.CHECKIN_MONGO_URL)
}).on('reconnected', () => {
  app.set('MONGO_ERROR', 'none')
  logger.info('[MongoDB] reconnected')
}).on('disconnected', () => {
  logger.info(`MongoDB disconnected! Reconnecting in ${timeout / 1000}s...`);
  setTimeout(() => connect, timeout);
});

connect();

const SchemaObj = {
  Raw: require(__ + '/models/schemas/Raw'),
  Group: require(__ + "/models/schemas/Group"),
  User: require(__ + "/models/schemas/User"),
  AccessPoint: require(__ + "/models/schemas/AccessPoint"),
  Campaign: require(__ + "/models/schemas/Campaign"),
  Banner: require(__ + "/models/schemas/Banner"),
  City: require(__ + "/models/schemas/City"),
  Location: require(__ + "/models/schemas/Location"),
  Category: require(__ + "/models/schemas/Category"),
  Timesheet: require(__ + "/models/schemas/Timesheet"),
  Media: require(__ + "/models/schemas/Media"),
  Plan: require(__ + '/models/schemas/Plan'),
  Employee: require(__ + "/models/schemas/Employee"),
  Guest: require(__ + "/models/schemas/Guest"),
  Policy: require(__ + "/models/schemas/Policy"),
  OT: require(__ + "/models/schemas/OT"),
  UserLog: require(__ + "/models/schemas/UserLog"),
  SheetLog: require(__ + "/models/schemas/SheetLog"),
  CheatLog: require(__ + "/models/schemas/CheatLog"),
  LOA: require(__ + "/models/schemas/LOA"),
  LOADetail: require(__ + "/models/schemas/LOADetail"),
  Quote: require(__ + "/models/schemas/Quote"),
  QRScanner: require(__ + "/models/schemas/QRScanner"),
  Scanner: require(__ + "/models/schemas/Scanner"),
  HIKCentral: require(__ + "/models/schemas/HIKCentral"),
  Ekko: require(__ + "/models/schemas/Ekko"),
  LatLong: require(__ + "/models/schemas/LatLong"),

  Shift: require(__ + "/models/schemas/Shift"),
  Message: require(__ + "/models/schemas/Message"),
  UserCookie: require(__ + "/models/schemas/UserCookie"),
  UserDevice: require(__ + "/models/schemas/UserDevice"),
  AppInfo: require(__ + "/models/schemas/AppInfo"),
  BackupEmployee: require(__ + "/models/schemas/BackupEmployee"),
  Department: require(__ + "/models/schemas/Department"),
}

var createModelByName = (collection) => {
  var schemaName;

  if (collection.indexOf("_") > -1) {
    schemaName = collection.split("_")[1];
  }
  else {
    schemaName = collection;
  }

  if (schemaName in SchemaObj) {
    var schema = SchemaObj[schemaName];
    return jcloudDB.model(collection, schema, collection.toLowerCase());// ModelName, Schema, CollectionName
  }
  else {
    return false;
  }
}

module.exports = {
  //INSERT - insert object data
  save: (args, callback) => {
    var schema = args.schema;
    var update = args.update;

    var model = createModelByName(schema)
    if (model) {
      var db = new model(update);
      if (!db._id) {
        db._id = db.generateId();
      }
      db.save((err) => {
        if (err) return callback(err, null);
        return callback(err, db._id);
      });
    }
    else {
      return callback("Schema [" + schema + "] Not Found", null)
    }
  },
  //insert array data
  saveMany: (args, callback) => {
    var schema = args.schema;
    var update = args.update;

    var model = createModelByName(schema)
    if (update.length != 0) {
      update.forEach(item => {
        if (!item._id) {
          item._id = Util.randomId();
        }
      });
    }
    if (model) {
      model.insertMany(update, (err, docs) => {
        if (err) return callback(err, null);
        return callback(err, docs);
      });
    }
    else {
      return callback("Schema [" + schema + "] Not Found", null)
    }
  },
  find: (args, callback) => {
    var schema = args.schema;
    var query = args.query;
    var select = args.select;
    var sort = args.sort;

    var model = createModelByName(schema)
    if (model) {
      var cmd = model.find(query)
      if (select) cmd.select(select);
      if (sort) cmd.sort(sort);
      cmd.exec((err, docs) => {
        if (err) return callback(err)
        return callback(err, docs);
      })
    }
    else {
      callback("Schema [" + schema + "] Not Found", null)
    }
  },
  findLimit: (args, callback) => {
    var schema = args.schema;
    var query = args.query;
    var select = args.select || "";
    var sort = args.sort;
    var pageSize = args.pageSize;
    var skip = args.skip;

    var model = createModelByName(schema)
    if (model) {
      model.countDocuments(query).exec((err, count) => {
        model.find(query)
          .select(select)
          .skip(skip)
          .limit(pageSize)
          .sort(sort)
          .lean()
          .exec((err, doc) => {
            var res = {
              doc,
              total: count,
              pages: Math.ceil(count / pageSize)
            };
            return callback(err, res);
          });
      });
    }
    else {
      return callback("Schema [" + schema + "] Not Found", null)
    }
  },
  findOne: (args, callback) => {
    var schema = args.schema;
    var query = args.query;
    var select = args.select;
    var find = args.find;

    var model = createModelByName(schema)
    if (model) {
      model.findOne(find || query || {})
        .select(select || "")
        .lean()
        .exec((err, docs) => {
          if (err) return callback(err);
          return callback(err, docs);
        })
    }
    else {
      return callback("Schema [" + schema + "] Not Found", null)
    }
  },
  findInCache: (args, callback) => {
    var schema = args.schema;
    var query = args.query;
    var select = args.select;
    var sort = args.sort;

    Cache.get(schema, JSON.stringify(args), (err, docs) => {
      if (err) return callback(err, docs);
      if (docs) return callback(err, docs)

      var model = createModelByName(schema)
      if (model) {
        var cmd = model.find(query)
        if (select) cmd.select(select);
        if (sort) cmd.sort(sort);
        cmd.lean()
        cd.exec((err, docs) => {
          if (err) return callback(err);
          Cache.set(schema, JSON.stringify(query), docs, (err, docs) => {
            if (err) console.error(err);
          });
          return callback(err, docs);
        })
      }
      else {
        callback("Schema [" + schema + "] Not Found", null)
      }
    })
  },
  findOneInCache: (args, callback) => {
    var schema = args.schema;
    var query = args.query;
    var select = args.select;

    Cache.get(schema, JSON.stringify(args), (err, docs) => {
      if (err) return callback(err, docs);
      if (docs) return callback(err, docs)
      var model = createModelByName(schema)
      if (model) {
        var cmd = model.findOne(query);
        if (select) cmd.select(select);

        cmd.exec((err, docs) => {
          if (err) return next(err)
          Cache.set(schema, JSON.stringify(query), docs, (err, docs) => {
            if (err) logger.error(err)
          })
          return callback(err, docs);
        })
      }
      else {
        callback("Schema [" + schema + "] Not Found", null)
      }
    })
  },
  findOneAndUpsert: (args, callback) => {
    var schema = args.schema;
    var query = args.query;
    var select = args.select;
    var update = args.update;
    var isNew = (typeof args.isNew == "boolean") ? args.isNew : true;
    var prefix = args.prefix;

    var model = createModelByName(schema)
    if (model) {
      var cmd = model.findOneAndUpdate(query, update, { upsert: true, new: isNew })
      cmd.select(select || "").exec((err, doc) => {
        callback(err, doc);
      })

      if (prefix) {
        var submodel = createModelByName(prefix + schema)
        if (submodel) {
          var subcmd = submodel.findOneAndUpdate(query, update, { upsert: true, new: isNew })
          subcmd.exec((err, doc) => { })
        }
      }
    }
    else {
      callback("Schema [" + schema + "] Not Found", null)
    }
  },
  findOneAndUpdate: (args, callback) => {
    var schema = args.schema;
    var query = args.query;
    var select = args.select;
    var update = args.update;
    var isNew = (typeof args.isNew == "boolean") ? args.isNew : true;
    var prefix = args.prefix;

    var model = createModelByName(schema)
    if (model) {
      var cmd = model.findOneAndUpdate(query, update, { upsert: false, new: isNew })
      cmd.select(select || "").exec((err, doc) => {
        callback(err, doc);
      })

      if (prefix) {
        var submodel = createModelByName(prefix + schema)
        if (submodel) {
          submodel.findOneAndUpdate(query, update, { upsert: false, new: isNew }, (err, doc) => { })
        }
      }
    }
    else {
      callback("Schema [" + schema + "] Not Found", null)
    }
  },
  findOneAndRemove: (args, callback) => {
    var schema = args.schema;
    var query = args.query;
    var select = args.select;

    var model = createModelByName(schema)
    if (model) {
      model.findOneAndRemove(query, { rawResult: true }, (err, result) => {
        return callback(err, result);
      });
    }
    else {
      callback("Schema [" + schema + "] Not Found", null)
    }
  },
  //DELETE -
  findOneAndDelete: (args, callback) => {
    var schema = args.schema;
    var query = args.query;
    var select = args.select;

    var model = createModelByName(schema)
    if (model) {
      model.findOneAndDelete(query, { rawResult: true }, (err, result) => {
        return callback(err, result);
      });
    }
    else {
      return callback("Schema [" + schema + "] Not Found", null)
    }
  },
  //Multi Update
  findAndUpdate: (args, callback) => {
    var schema = args.schema;
    var query = args.query;
    var update = args.update;

    var model = createModelByName(schema)
    if (model) {
      model.updateMany(query, update, { upsert: false }, (err, doc) => {
        return callback(err, doc);
      });
    }
    else {
      return callback("Schema [" + schema + "] Not Found", null)
    }
  },
  populate: (args, callback) => {
    var schema = args.schema;
    var query = args.query || {};
    var select = args.select || "";
    var populate = args.populate || { path: '' };

    //create schema to refenrence
    JCloud.createSchema();

    //creeate model
    var model = createModelByName(schema)

    if (model) {
      model.find(query).populate(populate).select(select).lean().exec((err, docs) => {
        if (err) return callback(err);
        return callback(err, docs);
      });
    }
    else {
      return callback("Schema [" + schema + "] Not Found", null)
    }
  },
  populateInCache: (args, callback) => {
    var schema = args.schema;
    var query = args.query || {};
    var select = args.select || "";
    var populate = args.populate || { path: '' };

    Cache.get(schema, JSON.stringify(args), (err, docs) => {
      if (err) return callback(err, docs);
      if (docs) return callback(err, docs);
      //create schema to refenrence
      JCloud.createSchema();

      //creeate model
      var model = createModelByName(schema)

      if (model) {
        model.find(query).populate(populate).select(select).lean().exec((err, docs) => {
          if (err) return callback(err);
          if (docs) {
            Cache.set(schema, JSON.stringify(args), docs, (err, docs) => {
              if (err) logger.error(err)
            })
          }
          return callback(err, docs);
        });
      }
      else {
        return callback("Schema [" + schema + "] Not Found", null)
      }
    })
  },
  populateOne: (args, callback) => {
    var schema = args.schema;
    var query = args.query || {};
    var select = args.select || "";
    var populate = args.populate;

    //create schema to refenrence
    JCloud.createSchema();

    //creeate model
    var model = createModelByName(schema)
    if (model) {
      model.findOne(query).select(select).populate(populate).lean().exec((err, docs) => {
        if (err) { return callback(err, null); }
        return callback(err, docs);
      });
    } else {
      return callback("Schema [" + schema + "] Not Found", null)
    }
  },
  //Reference to relationship collection pages
  populateLimit: (args, callback) => {
    var schema = args.schema;
    var query = args.query;
    var select = args.select;
    var populate = args.populate || { path: '' };
    var skip = args.skip;
    var pageSize = args.pageSize;
    var sort = args.sort;

    //create schema to refenrence
    JCloud.createSchema();

    //Create model
    var model = createModelByName(schema)

    if (model) {
      // model.countDocuments(query).exec((err, count) => {
      model.estimatedDocumentCount(query).exec((err, count) => {
        model.find(query).skip(skip).select(select).limit(pageSize).sort(sort).populate(populate).lean().exec((err, doc) => {
          if (err) { return callback(err, null); }
          var res = { doc, total: count, pages: Math.ceil(count / pageSize) };
          return callback(err, res);
        });
      });
    }
    else {
      return callback("Schema [" + schema + "] Not Found", null)
    }
  },
  aggregate: (args, callback) => {
    var schema = args.schema;
    var query = args.query;

    var model = createModelByName(schema)
    if (model) {
      model.aggregate(query).exec((err, result) => {
        if (err) { return callback(err) }
        return callback(null, result);
      });
    }
    else {
      return callback("Schema [" + schema + "] Not Found", null)
    }
  },
  aggregateOne: (args, callback) => {
    var schema = args.schema;
    var query = args.query;

    var model = createModelByName(schema)
    if (model) {
      query.push({ $skip: 0 });
      query.push({ $limit: 1 });
      model.aggregate(query).exec((err, result) => {
        if (err) { return callback(err) }

        result = (result && result.length > 0) ? result[0] : null
        return callback(null, result);
      });
    }
    else {
      return callback("Schema [" + schema + "] Not Found", null)
    }
  },
  //Count
  count: (args, callback) => {
    var schema = args.schema;
    var query = args.query;

    var model = createModelByName(schema)
    if (model) {
      model.countDocuments(query, (err, result) => {
        return callback(err, result);
      });
    } else {
      return callback("Schema [" + schema + "] Not Found", null)
    }
  },

  createSchema: () => {
    createModelByName("Group");
    createModelByName("User");
    createModelByName("City");
    createModelByName("Location");
    createModelByName("Category");
    createModelByName("AccessPoint");
    createModelByName("Campaign");
    createModelByName("Policy");
  }
}
