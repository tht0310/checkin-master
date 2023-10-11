var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSaveUser, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
  _id: { type: String, trim: true, required: true },
  name: { type: String, trim: true, required: true },
  keyword: { type: String, trim: true},
  username: { type: String, trim: true, required: true },
  password: { type: String, trim: true, required: true},
  email: { type: String, trim: true, required: true },
  salt: { type: String, trim: true},
  extend: [{type: String,trim : true,ref : "Group"}],
  inherited : [{type: String,trim: true,require: true}],
  role: { type: String, trim: true, required: true },
  group: { type: String, ref: "Group", required: true },
  createdBy: { type: String, trim: true, ref: "User"},
  updatedBy: { type: String, trim: true, ref: "User"},
  createdAt: { type: String, trim: true, required: true, default: Util.now() },
  updatedAt: { type: String, trim: true, required: true, default: Util.now() }
},{ versionKey: false });

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSaveUser);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;