var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
    _id: { type: String, required: true },
    name: { type: String, trim: true, required: true },
    keyword: { type: String, trim: true, required: true },
    group: { type: String, ref: "Group", required: true },
    status: { type: String, trim: true, required: true, enum: ["Active", "Inactive"] },
    baseUrl: { type: String, trim: true, required: true },
    appKey: { type: String, required: true },
    appSecret: { type: String, required: true },
    mapAp: { type: Array, required: true },
    inherited: [{ type: String, trim: true, require: true }],
}, { versionKey: false, strict: false });

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;