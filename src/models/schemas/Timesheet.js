var mongoose = require('mongoose')
var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
    _id: {type: String, trim: true, required: true}, 
    eId:   {type: String, trim: true, required: true, index: true}, //Employee ID
    groupId:   {type: String, trim: true, required: true}, //Group ID
    d:   {type: String, trim: true, required: true, index: true}, //Date
},{ versionKey: false, strict: false}) //strict false: Allow save undefined field.

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;