"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = __importStar(require("jsonwebtoken"));
const users_1 = __importDefault(require("../models/users"));
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.GoogleFormClone_acesstoken;
        // console.log("req.cookies.access_token",req.cookies.GoogleFormClone_acesstoken,process.env.TOKEN_KEY || 'zhingalala');
        // console.log("Coming")
        if (!token) {
            return res.status(401).json({ err: "Not authorized!", user: null });
        }
        const decoded = jwt.verify(token, process.env.TOKEN_KEY || 'zhingalala');
        if (typeof decoded === 'string' || !decoded._id) {
            res.clearCookie("access_token");
            return res.status(403).json({ err: "Something is wrong with verification!", user: null });
        }
        const user = yield users_1.default.findById(decoded._id).select({ 'password': 0, 'auth_type': 0 });
        if (!user) {
            res.clearCookie("access_token");
            return res.status(403).json({ err: "A token is required for authentication", user: null });
        }
        res.user = user;
    }
    catch (err) {
        return res.status(403).json({ err: "A token is required for authentication", user: null });
    }
    return next();
});
exports.default = verifyToken;
