var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
    _id: { type: String, required: true },
    name: { type: String, trim: true, required: true },
    keyword: { type: String, trim: true, required: true },
    group: { type: String, ref: "Group", required: true },
    status: { type: String, trim: true, required: true, enum: ["Active", "Inactive"] }, 
    mac_ap: { type: String, trim: true, required: true},
    location: { type: String, ref: "Location", required: true },
    campaignoff: { type: Array, trim: true },  
    username: { type: String, trim: true },
    password: { type: String, trim: true },
    comment: { type: String, trim: true },
    ip: { type: String, trim: true },
    inherited: [{ type: String, trim: true, require: true }],
    session: { type: Number },
    idle: { type: Number },
    bwdown: { type: Number },
    bwup: { type: Number },
    vendor: { type: String, trim: true },
    createdBy: { type: String, trim: true, ref: "User" },
    updatedBy: { type: String, trim: true, ref: "User" },
    createdAt: { type: String, trim: true, default: Util.now() },
    updatedAt: { type: String, trim: true, default: Util.now() }
},{ versionKey: false })

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;