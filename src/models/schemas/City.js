var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
    _id: { type: String, require: true },
    name: { type: String, trim: true, require: true },
    keyword: { type: String, trim: true, required: true },
    createdBy: { type: String, trim: true, ref: "User"},
    updatedBy: { type: String, trim: true, ref: "User"},
    createAt: { type: String, trim: true, default: Util.now() },
    updateAt: { type: String, trim: true, default: Util.now() }
},{ versionKey: false })

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;
