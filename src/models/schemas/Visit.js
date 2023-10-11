var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
    _id: {type: String, trim: true, required: true},   
    mac_device:{type: String, trim: true},   
    
    createdAt: {type: String, trim: true, required: true, default: Util.now},
    updatedAt: {type: String, trim: true, required: true, default: Util.now}
},{versionKey: false, strict: false}) //strict false: Allow save undefined field.

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;
