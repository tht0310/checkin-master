var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
   _id: { type: String, required: true },
   name: { type: String, trim: true, required: true },
   keyword: { type: String, trim: true, required: true },
   group: { type: String, ref: "Group", required: true },
   status: { type: String, trim: true, required: true, enum: ["Active", "Inactive"] },
   location: { type: String, ref: "Location", required: true },
   lat: { type: Number },
   long: { type: Number },
   qrcode: { type: String, trim: true },
   comment: { type: String, trim: true },
   inherited: [{ type: String, trim: true, require: true }],
   createdBy: { type: String, trim: true, ref: "User" },
   updatedBy: { type: String, trim: true, ref: "User" },
   createdAt: { type: String, trim: true, default: Util.now() },
   updatedAt: { type: String, trim: true, default: Util.now() }
}, { versionKey: false })

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;