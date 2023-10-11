var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {preSave, preFindOneAndUpdate, generateId} = require("../functions");

var _Schema = new Schema({
    _id: { type: String, required: true },
    name: { type: String, trim: true, required: true },
    keyword: { type: String, trim: true, required: true },
    override: { type: Boolean, required: true, default: false },
    weight: { type: Number, required: true },
    kindof: { type: String, trim: true, default: "free", enum: ["free", "paid"] },
    status: { type: String, trim: true, enum: ["Active","Inactive"] },
    imp_daily: { type: Number, default: -1 },
    imp_limit: { type: Number, default: -1 },
    click_daily: { type: Number, default: -1 },
    click_limit: { type: Number, default: -1 },
    watch_daily: { type: Number, default: -1 },
    watch_limit: { type: Number, default: -1 },
    act_daily: { type: Number, default: -1 },
    act_limit: { type: Number, default: -1 },
    watchpoint: { type: Number},// watchpoint is time which you want set kpi.
    fromDate: { type: String, trim: true },
    toDate: { type: String, trim: true },
    inherited: [{ type: String, trim: true, require: true }],
    ap: [{ type: String, ref: "AccessPoint", required: true }],
    group: { type: String, ref: "Group", required: true },
    createdBy: { type: String, trim: true, ref: "User"},
    updatedBy: { type: String, trim: true, ref: "User"},
    createdAt: { type: String, trim: true, default: Util.now() },
    updatedAt: { type: String, trim: true, default: Util.now() }
},{ versionKey: false });

_Schema.methods.generateId = generateId;
_Schema.pre("save", preSave);
_Schema.pre("findOneAndUpdate", preFindOneAndUpdate);

module.exports = _Schema;