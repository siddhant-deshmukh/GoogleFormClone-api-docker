"use strict";
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
const express_1 = __importDefault(require("express"));
var router = express_1.default.Router();
const express_validator_1 = require("express-validator");
const users_1 = __importDefault(require("../models/users"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = __importDefault(require("../middleware/auth"));
const googleapis_1 = require("googleapis");
const dotenv_1 = __importDefault(require("dotenv"));
const qs_1 = __importDefault(require("qs"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const googleClient = new googleapis_1.google.auth.OAuth2(process.env.GoogleClientId, process.env.Google_Secret, "http://localhost:5173");
// console.log(process.env.GoogleClientId,process.env.Google_Secret)
/* GET home page. */
router.get('/', auth_1.default, function (req, res, next) {
    return res.status(201).json({ user: res.user });
});
router.post('/', auth_1.default, function (req, res, next) {
    res.send({ title: 'This is for GoogleForm' });
});
router.post('/register', (0, express_validator_1.body)('email').isEmail().isLength({ max: 50, min: 3 }).toLowerCase().trim(), (0, express_validator_1.body)('name').isString().isLength({ max: 50, min: 3 }).trim(), (0, express_validator_1.body)('password').isString().isLength({ max: 30, min: 5 }).trim(), function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, name, password } = req.body;
            const checkEmail = yield users_1.default.findOne({ email });
            if (checkEmail)
                return res.status(409).json({ msg: 'User already exists!' });
            const encryptedPassword = yield bcryptjs_1.default.hash(password, 15);
            const newUser = yield users_1.default.create({
                email,
                name,
                password: encryptedPassword,
            });
            const token = jsonwebtoken_1.default.sign({ _id: newUser._id.toString(), email }, process.env.TOKEN_KEY || 'zhingalala', { expiresIn: '2h' });
            res.cookie("GoogleFormClone_acesstoken", token);
            return res.status(201).json({ token });
        }
        catch (err) {
            return res.status(500).json({ msg: 'Some internal error occured', err });
        }
    });
});
router.post('/login-password', (0, express_validator_1.body)('email').isEmail().isLength({ max: 50, min: 3 }), (0, express_validator_1.body)('password').isString().isLength({ max: 30, min: 5 }), function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password } = req.body;
        const checkUser = yield users_1.default.findOne({ email });
        if (!checkUser)
            return res.status(404).json({ msg: 'User doesn`t exists!' });
        if (!checkUser.password)
            return res.status(405).json({ msg: 'Try another method' });
        if (!(yield bcryptjs_1.default.compare(password, checkUser.password)))
            return res.status(406).json({ msg: 'Wrong password!' });
        const token = jsonwebtoken_1.default.sign({ _id: checkUser._id.toString(), email }, process.env.TOKEN_KEY || 'zhingalala', { expiresIn: '2h' });
        res.cookie("GoogleFormClone_acesstoken", token);
        return res.status(201).json({ token });
    });
});
router.post('/login-google', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { code } = req.body;
            // console.log(code)
            if (!code) {
                console.log("No code given while using login-google");
                throw "code doesn't exist";
            }
            let { tokens } = yield googleClient.getToken(code); // get tokens
            if (!tokens || !tokens.access_token) {
                console.log("Token not found for code", code);
                throw "token not found";
            }
            let oauth2Client = new googleapis_1.google.auth.OAuth2(); // create new auth client
            oauth2Client.setCredentials({ access_token: tokens.access_token }); // use the new auth client with the access_token
            let oauth2 = googleapis_1.google.oauth2({
                auth: oauth2Client,
                version: 'v2'
            });
            let { data } = yield oauth2.userinfo.get(); // get user info
            if (!data) {
                console.log("No user dound for token", tokens.access_token);
                throw "token not found";
            }
            // console.log(data);
            const { email, name, verified_email: emailVerfied } = data;
            if (!email || !name || !emailVerfied) {
                console.log("Error in data (Incomplete data found)", data);
                throw "Incomplete data found";
            }
            const checkUser = yield users_1.default.findOne({ email });
            let token = "";
            console.log(checkUser);
            if (checkUser && checkUser.email === email) {
                if (checkUser.auth_type.findIndex((ele) => (ele === 'google')) === -1) {
                    checkUser.auth_type = [...checkUser.auth_type, 'google'];
                    yield checkUser.save();
                }
                token = jsonwebtoken_1.default.sign({ _id: checkUser._id.toString(), email }, process.env.TOKEN_KEY || 'zhingalala', { expiresIn: '2h' });
                res.cookie("GoogleFormClone_acesstoken", token);
            }
            else {
                const newUser = {
                    email,
                    name,
                    emailVerfied,
                    auth_type: ['google'],
                };
                console.log("\n-------------------\nnewUser created!", newUser);
                const newUserCreated = yield users_1.default.create(newUser);
                token = jsonwebtoken_1.default.sign({ _id: newUserCreated._id.toString(), email }, process.env.TOKEN_KEY || 'zhingalala', { expiresIn: '2h' });
                res.cookie("GoogleFormClone_acesstoken", token);
            }
            return res.status(201).json({ token });
        }
        catch (err) {
            // console.log(err)
            return res.status(500).json({ msg: 'Some internal error occured', err });
        }
    });
});
router.get('/login-github', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { code } = req.query;
            console.log(code);
            console.log("--------- Here in login github ---------------------------");
            if (!code) {
                console.log("No code error");
                // return res.redirect(`${process.env.Client_Url}&error=true`);
                throw "No code given";
            }
            const rootUrl = 'https://github.com/login/oauth/access_token';
            const options = {
                client_id: process.env.GithubClientId,
                client_secret: process.env.Github_Secret,
                code,
            };
            const queryString = qs_1.default.stringify(options);
            console.log("queryString", queryString);
            const { data } = yield axios_1.default.post(`${rootUrl}?${queryString}`, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            console.log("rootUrl with code", data);
            const { access_token } = qs_1.default.parse(data);
            // return decoded;
            console.log("access_token", access_token);
            if (!access_token) {
                console.log("No access_token error");
                // return res.redirect(`${process.env.Client_Url}&error=true`);
                throw "No access_token while getting acess token";
            }
            const { data: email_data } = yield axios_1.default.get('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });
            const { data: user_data } = yield axios_1.default.get('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });
            // return res.status(201).json(user_data_res);
            if (!user_data || !email_data) {
                console.log("while getting api user", user_data, email_data);
                throw "while getting api user";
            }
            // if( email_data.length < 1 ){
            //   console.log("while getting email data",email_data.isArray,email_data.length < 1)
            //   throw "while getting email data"
            // }
            //@ts-ignore
            const userEmail = (email_data.filter((email) => email.primary))[0].email;
            console.log("Email  :", userEmail);
            if ((!userEmail) || typeof userEmail !== 'string') {
                console.log("Error getting primary email");
                throw "Error getting primary email";
            }
            const checkUser = yield users_1.default.findOne({ email: userEmail });
            let token = "";
            console.log(checkUser);
            if (checkUser && checkUser.email === userEmail) {
                if (checkUser.auth_type.findIndex((ele) => (ele === 'github')) === -1) {
                    checkUser.auth_type = [...checkUser.auth_type, 'github'];
                    yield checkUser.save();
                }
                token = jsonwebtoken_1.default.sign({ _id: checkUser._id.toString(), email: userEmail }, process.env.TOKEN_KEY || 'zhingalala', { expiresIn: '2h' });
                res.cookie("GoogleFormClone_acesstoken", token);
            }
            else {
                const newUser = {
                    email: userEmail,
                    name: user_data.name || user_data.login || "unnamed",
                    emailVerfied: true,
                    auth_type: ['github'],
                    bio: user_data.bio
                };
                console.log("\n-------------------\nnewUser created!", newUser);
                const newUserCreated = yield users_1.default.create(newUser);
                token = jsonwebtoken_1.default.sign({ _id: newUserCreated._id.toString(), email: userEmail }, process.env.TOKEN_KEY || 'zhingalala', { expiresIn: '2h' });
                res.cookie("GoogleFormClone_acesstoken", token);
            }
            console.log({ token });
            return res.status(201).json({ token });
        }
        catch (err) {
            console.log(`${process.env.Client_Url}&error=true`, "\n err in login github \n\n");
            return res.status(500).json({ err, msg: "Internal error occured" });
        }
    });
});
router.get('/logout', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('cookie token', req.cookies.GoogleFormClone_acesstoken);
            res.cookie("GoogleFormClone_acesstoken", null);
            return res.status(201).json({ msg: 'Sucessfull!' });
        }
        catch (err) {
            return res.status(500).json({ msg: 'Some internal error occured', err });
        }
    });
});
exports.default = router;
