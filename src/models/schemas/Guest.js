var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSaveUser, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
    _id: { type: String, required: true },
    name: { type: String, trim: true, required: true },
    keyword: { type: String, trim: true },
    gender: { type: String, enum: ['Male', 'Female'] },
    phone: { type: String },
    email: { type: String },
    groupId: { type: String }
}, { versionKey: false, strict: false })

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSaveUser);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;