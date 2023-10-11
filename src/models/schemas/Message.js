var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
   _id: { type: String, required: true },
   name: { type: String, trim: true, required: true },
   keyword: { type: String, trim: true, required: true },
   groupId: { type: String, required: true },
   status: { type: String, trim: true, enum: ["Active", "Inactive"] },

   inherited: [{ type: String, trim: true, require: true }],
   createdBy: { type: String, trim: true },
   updatedBy: { type: String, trim: true },
   createdAt: { type: String, trim: true },
   updatedAt: { type: String, trim: true }
}, { versionKey: false, strict: false });

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;