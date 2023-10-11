var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { preSaveUser, preFindOneAndUpdate, generateId } = require("../functions");

var _Schema = new Schema({
    _id: { type: String, required: true },
    updatedAt: { type: String, required: true },
    data: { type: Array }
}, { versionKey: false, strict: false })

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSaveUser);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;