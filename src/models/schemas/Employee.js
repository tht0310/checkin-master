var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSaveUser, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
    _id: { type: String, required: true },
    no: { type: String },
    name: { type: String, trim: true, required: true },
    keyword: { type: String, trim: true },
    username: { type: String, trim: true, required: true },
    password: { type: String, trim: true, required: true },
    salt: { type: String, trim: true },
    nickname: { type: String, trim: true },
    birthday: { type: String },
    gender: { type: String, enum: ['Male', 'Female'] },
    phone: { type: String },
    email: { type: String },
    mac_device: { type: String },
    position: { type: String },
    department: { type: String },
    avatar: { type: String },
    portrait: { type: String },
    group: { type: String },
    role: { type: String, trim: true, required: true },
    startAt: { type: String },
    createdAt: { type: String, trim: true, required: true },
    updatedAt: { type: String, trim: true, required: true }
}, { versionKey: false, strict: false })

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSaveUser);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;