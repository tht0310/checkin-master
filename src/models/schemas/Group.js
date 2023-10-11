var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
    _id: { type: String, trim: true, required: true },
    name: { type: String, trim: true, required: true },
    keyword: { type: String, trim: true, required: true },
    group: { type: String, ref: "Group", required: true },
    inherited: [{ type: String, ref: "Group", required: true }],
    createdBy: { type: String, trim: true, ref: "User"},
    updatedBy: { type: String, trim: true, ref: "User"},
    createdAt: { type: String, trim: true, default: Util.now() },
    updatedAt: { type: String, trim: true, default: Util.now() }
},{ versionKey: false, strict: false, minimize: false });

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;
