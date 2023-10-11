var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
   _id: { type: String, required: true },
   keyword: { type: String },
   address: { type: String, required: true },
   lat: { type: Number },
   long: { type: Number },
}, { versionKey: false, strict: false })

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;