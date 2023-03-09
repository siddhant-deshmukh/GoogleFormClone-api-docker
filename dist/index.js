"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
const indexRoutes_1 = __importDefault(require("./routes/indexRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const formRoutes_1 = __importDefault(require("./routes/formRoutes"));
const resRoutes_1 = __importDefault(require("./routes/resRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use((0, cors_1.default)({ origin: `${process.env.Client_Url}`, credentials: true, optionsSuccessStatus: 200 }));
app.use(express_1.default.urlencoded({ extended: false, limit: '1kb' }));
app.use(express_1.default.json({ limit: '20kb' })); // limit the size of incoming request body and parse i.e convert string json to js object for every incoming request
app.use((0, cookie_parser_1.default)());
mongoose_1.default.connect(process.env.MONGODB_ATLAS_URL)
    .then(() => { console.log("Connected to database"); })
    .catch((err) => { console.error("Unable to connect database", err); });
app.use('/', indexRoutes_1.default);
app.use('/u', userRoutes_1.default);
app.use('/f', formRoutes_1.default);
app.use('/res', resRoutes_1.default);
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
