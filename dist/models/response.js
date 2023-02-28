"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const resSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.SchemaTypes.ObjectId, index: true, required: true, ref: "User" },
    formId: { type: mongoose_1.default.SchemaTypes.ObjectId, index: true, required: true, ref: 'Form' },
    mcq_res: {
        type: Map,
        of: [{ type: String, maxlength: 50 }]
    },
    text_res: {
        type: Map,
        of: { type: String, maxlength: 400 }
    },
    createdAt: { type: Date, required: true, default: Date.now() },
    result: Number,
});
exports.default = mongoose_1.default.model("Response", resSchema);
