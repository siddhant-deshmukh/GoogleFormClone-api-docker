"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const formController_1 = require("../controllers/formController");
var router = express_1.default.Router();
const auth_1 = __importDefault(require("../middleware/auth"));
/* GET home page. */
router.post('/', (0, express_validator_1.body)('title').isString().isLength({ max: 100, min: 3 }), (0, express_validator_1.body)('desc').optional().isString().isLength({ max: 150 }), (0, express_validator_1.body)('starttime').optional().isDate(), (0, express_validator_1.body)('endtime').optional().isDate(), (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}, auth_1.default, formController_1.createNewForm);
router.put('/:formId', (0, express_validator_1.body)('title').optional().isString().isLength({ max: 100, min: 3 }), (0, express_validator_1.body)('desc').optional().isString().isLength({ max: 150 }), (0, express_validator_1.body)('starttime').optional().isDate(), (0, express_validator_1.body)('endtime').optional().isDate(), (0, express_validator_1.body)('questions').exists().isArray({ max: 20 }), (0, express_validator_1.body)('new_questions').exists().isArray({ max: 20 }), 
// body('delete_questions').exists().isArray({max:20}),
(0, express_validator_1.body)('new_questions.*.required').isBoolean().exists(), (0, express_validator_1.body)('new_questions.*.title').isString().isLength({ min: 3, max: 150 }), (0, express_validator_1.body)('new_questions.*.desc').isString().optional().isLength({ max: 150 }), (0, express_validator_1.body)('new_questions.*.ans_type').exists().isIn(['short_ans', 'long_ans', 'mcq', 'checkbox', 'dropdown', 'mcq_grid', 'checkboc_grid', 'range', 'date', 'time']), (0, express_validator_1.body)('new_questions.*.optionsArray').optional().isArray({ max: 20, min: 1 }), (0, express_validator_1.body)('new_questions.*.optionsArray.*').optional().isString().isLength({ min: 1, max: 50 }), (0, express_validator_1.body)('new_questions.*.correct_ans').optional().isArray({ max: 20, min: 1 }), (0, express_validator_1.body)('new_questions.*.correct_ans.*').optional().isString().isLength({ min: 1, max: 50 }), (0, express_validator_1.body)('new_questions.*.point').optional().isInt({ max: 100, min: 0 }), (0, express_validator_1.body)('new_questions').custom((value, { req, path }) => {
    let check = true;
    value.forEach((question) => {
        const { ans_type, optionsArray, correct_ans } = question;
        if (optionsArray && correct_ans && (ans_type === "checkbox" || ans_type === "mcq" || ans_type === "dropdown")) {
            if (!correct_ans.every(r => optionsArray.includes(r))) {
                check = false;
                throw new Error("Correct Ans don't match with optionsArray");
            }
        }
        else if (!optionsArray) {
            if (ans_type === "checkbox" || ans_type === "mcq" || ans_type === "dropdown") {
                check = false;
                throw new Error("Ans type demands an optionsArray");
            }
        }
        else if (optionsArray) {
            if (!(ans_type === "checkbox" || ans_type === "mcq" || ans_type === "dropdown")) {
                check = false;
                throw new Error("Ans type don't need an optionsArray");
            }
        }
    });
    if (!check) {
        throw new Error("Check the questions!");
    }
    else {
        return value;
    }
}), (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}, auth_1.default, formController_1.editForm);
router.get('/:formId', auth_1.default, formController_1.getForm);
router.get('/:formId/q/:queId', auth_1.default, formController_1.getQuestion);
router.put('/:formId/q/:queId', (0, express_validator_1.body)('required').isBoolean().exists(), (0, express_validator_1.body)('title').isString().isLength({ min: 3, max: 150 }), (0, express_validator_1.body)('desc').isString().optional().isLength({ max: 150 }), (0, express_validator_1.body)('ans_type').exists().isIn(['short_ans', 'long_ans', 'mcq', 'checkbox', 'dropdown', 'mcq_grid', 'checkboc_grid', 'range', 'date', 'time']), (0, express_validator_1.body)('optionsArray').optional().isArray({ max: 20, min: 1 }), (0, express_validator_1.body)('optionsArray.*').optional().isString().isLength({ min: 1, max: 50 }), (0, express_validator_1.body)('correct_ans').optional().isArray({ max: 20, min: 1 }).custom((value, { req, path }) => {
    let optionsArray = req.body.optionsArray;
    if (!value.every(r => optionsArray.includes(r))) {
        throw new Error("Correct Ans don't match with optionsArray");
    }
    else {
        return value;
    }
}), (0, express_validator_1.body)('correct_ans.*').optional().isString().isLength({ min: 3, max: 50 }), (0, express_validator_1.body)('point').optional().isInt({ max: 100, min: 0 }), (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}, auth_1.default, formController_1.editQuestion);
exports.default = router;
