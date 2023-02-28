"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const resSummerySchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.SchemaTypes.ObjectId, ref: "User" },
    formId: { type: mongoose_1.default.SchemaTypes.ObjectId, ref: 'Form' },
    mcq_res_summery: {
        type: Map,
        of: {
            type: Map,
            of: { type: Number, minlength: 1 }
        }
    },
    text_res_summery: {
        type: Map,
        of: { type: Number, minlength: 1 }
    }
});
exports.default = mongoose_1.default.model("ResSummery", resSummerySchema);
