var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
   _id: { type: String, required: true },
   no: { type: String },
   name: { type: String, trim: true, required: true },
   wd: { type: Number, required: true },
   updatedAt: { type: String },
   endAt: { type: String }
}, { versionKey: false, strict: false })

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;