var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
    _id: { type: String, trim: true, required: true },
    filename: { type: String, trim: true, required: true },
    filesize: { type: Number, trim: true, required: true },
    width: { type: Number, trim: true},
    height: { type: Number, trim: true },
    duration: { type: Number, trim: true },
    url: { type: String, trim: true, required: true },
    groupId: { type: String, required: true },
    createdBy: { type: String, trim: true},
    createdAt: { type: String, trim: true, default: Util.now() },
},{ versionKey: false, strict: false, minimize: false });

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;