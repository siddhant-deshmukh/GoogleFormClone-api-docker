"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true, maxLength: 50, minlength: 3 },
    email: { type: String, unique: true, maxLength: 50, minlength: 3 },
    bio: { type: String, maxLength: 150 },
    password: { type: String, maxLength: 100, minlength: 5 },
    auth_type: [{ type: String, required: true, enum: ['google', 'github', 'password'] }],
    forms: [{ type: mongoose_1.default.SchemaTypes.ObjectId, ref: 'Forms' }],
    emailVerfied: { type: Boolean, default: false }
});
userSchema.path('forms').validate((val) => { return val.length < 10; }, 'user can have 10 forms at max');
userSchema.path('auth_type').validate((val) => { return val.length < 3; }, 'user can have 3 authtype at max');
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
