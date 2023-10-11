var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { preSave, preFindOneAndUpdate, generateId } = require("../functions");

var _Schema = new Schema({
    _id: { type: String, required: true },
    name: { type: String, trim: true, required: true },
    fullname: { type: String, trim: true },
    category: { type: String, trim: true, ref: "Category", required: true },
    city: { type: String, ref: "City" },
    address: { type: String },
    lat: { type: Number },
    long: { type: Number },
    radius: { type: Number },
    status: { type: String, trim: true, enum: ["Active", "Inactive"] },
    keyword: { type: String, trim: true, required: true },
    inherited: [{ type: String, trim: true }],
    group: { type: String, ref: "Group", required: true },
    createdBy: { type: String, trim: true, ref: "User" },
    updatedBy: { type: String, trim: true, ref: "User" },
    createdAt: { type: String, trim: true, default: Util.now() },
    updatedAt: { type: String, trim: true, default: Util.now() }
}, { versionKey: false, strict: false })

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;