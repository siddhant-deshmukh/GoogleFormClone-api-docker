"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const resController_1 = require("../controllers/resController");
var router = express_1.default.Router();
const auth_1 = __importDefault(require("../middleware/auth"));
/* GET home page. */
router.post('/', (0, express_validator_1.body)('formId').exists().isString(), (0, express_validator_1.body)('questions', 'Check question array').isArray().exists().isLength({ max: 20, min: 1 }), (0, express_validator_1.body)('questions.*._id', 'Check question ID').exists().isString(), (0, express_validator_1.body)('questions.*.ans_type', 'Check question ans_type').exists().isIn(['short_ans', 'long_ans', 'mcq', 'checkbox', 'dropdown', 'mcq_grid', 'checkboc_grid', 'range', 'date', 'time']), (0, express_validator_1.body)('questions.*.res_array', 'Check question res_array').optional().isArray({ max: 50 }), (0, express_validator_1.body)('questions.*.res_array.*', 'Check question res_array content').optional().isString().trim().isLength({ min: 1, max: 50 }), (0, express_validator_1.body)('questions.*.res_text', 'Check question res_text').optional().isString().trim().isLength({ min: 1, max: 400 }), (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}, auth_1.default, resController_1.newFormRes);
router.get('/f/:formId', auth_1.default, resController_1.getFormRes);
exports.default = router;
