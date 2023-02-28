"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const questionSchema = new mongoose_1.default.Schema({
    formId: { type: mongoose_1.default.SchemaTypes.ObjectId, required: true },
    required: { type: Boolean, required: true, default: true },
    title: { type: String, required: true, maxLength: 150 },
    desc: { type: String, maxLength: 150 },
    ans_type: { type: String, required: true, enum: ['short_ans', 'long_ans', 'mcq', 'checkbox', 'dropdown', 'mcq_grid', 'checkboc_grid', 'range', 'date', 'time'] },
    optionsArray: [{ type: String, maxlength: 50 }],
    correct_ans: [{ type: String, maxlength: 50 }],
    point: { type: Number, min: 0, max: 100 }
});
questionSchema.path('optionsArray').validate((val) => { return val.length < 20; }, 'question can have 100 options at max');
questionSchema.path('correct_ans').validate((val) => { return val.length < 20; }, 'question can have 100 options at max');
const Question = mongoose_1.default.model("Question", questionSchema);
exports.default = Question;
