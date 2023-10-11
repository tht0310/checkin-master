var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
    _id: { type: String, trim: true, required: true },
    name: { type: String, trim: true, required: true },
    status: { type: String, trim: true, enum: ["Active","Inactive"] },
    keyword: { type: String, trim: true, required: true },
    weight: { type: Number, required: true, default: 1 },
    // targets: { type: Array },
    landingpage: { type: String, trim: true, required: true },
    // layout: { type: String, trim: true },//exHTML or Standard or HTML
    // prepend: { type: String, trim: true },//Prepend code
    // htmlCode: { type: String, trim: true },//htmlCode
    // append: { type: String, trim: true },
    html: { type: String, trim: true },
    inherited: [{ type: String, trim: true, require: true }],
    campaign: { type: String, ref: "Campaign", required: true },
    username: { type: String },
    password: { type: String },
    // interval: { type: Number },
    // openBrowser: { type: String, trim: true, enum: ["Active","Inactive"] },
    group: { type: String, ref: "Group", required: true },
    // width: { type: Number, /*required: true,*/ default: -1},
    // height: { type: Number, /*required: true,*/  default: -1},
    createdBy: { type: String, trim: true, ref: "User" },
    updatedBy: { type: String, trim: true, ref: "User" },
    createdAt: { type: String, trim: true, default: Util.now() },
    updatedAt: { type: String, trim: true, default: Util.now() }
},{ versionKey: false, strict: false, minimize: false })

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;