"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const formSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true, maxLength: 100 },
    desc: { type: String, maxLength: 150 },
    author: { type: mongoose_1.default.SchemaTypes.ObjectId, required: true },
    questions: [{ type: mongoose_1.default.SchemaTypes.ObjectId, ref: 'Question' }],
    formResSummery: { type: mongoose_1.default.SchemaTypes.ObjectId, ref: 'ResSummery' },
    starttime: { type: Date },
    endtime: { type: Date },
});
formSchema.path('questions').validate((val) => { return val.length <= 21; }, 'form can have 20 questions at max');
exports.default = mongoose_1.default.model("Form", formSchema);
