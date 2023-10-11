var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
    _id: {type: String, trim: true, required: true},
    bId:{type: String, trim: true, ref:'Banner',required: true},
    cId:{type: String, trim: true, ref:'Campaign', required: true},
    zId:{type: String, trim: true, ref:'Zone', required: true},
    mac_device:{type: String, trim: true},
    imp: {type: Number, required: true, default: 0},//impression
    hit: {type: Number, required: true, default: 0},//hit
    cli: {type: Number, required: true, default: 0},//click
    w_0: {type: Number, required: true, default: 0},//watch 0% video
    w_25: {type: Number, required: true, default: 0},//watch 25% video
    w_50: {type: Number, required: true, default: 0},//watch 50% video
    w_75: {type: Number, required: true, default: 0},//watch 75% video
    w_100: {type: Number, required: true, default: 0},//watch 100% video.
    ua: {type: Object},
    createdAt: {type: String, trim: true, required: true, default: Util.now},
    updatedAt: {type: String, trim: true, required: true, default: Util.now}
},{ versionKey: false })

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;