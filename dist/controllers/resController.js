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
exports.getFormRes = exports.newFormRes = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const form_1 = __importDefault(require("../models/form"));
const question_1 = __importDefault(require("../models/question"));
const resSummery_1 = __importDefault(require("../models/resSummery"));
const response_1 = __importDefault(require("../models/response"));
function newFormRes(req, res) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { formId } = req.body;
            const { _id: userId, forms } = res.user;
            const oldForm = yield form_1.default.findById(formId);
            if (!oldForm)
                return res.status(404).json({ msg: 'form not found' });
            const { questions } = req.body;
            //  ----------------                     checking all the responses    -------------------------------------
            // console.log(questions)
            const question_res_PromiseArray = questions.map(({ _id: qId, ans_type, res_array, res_text }) => __awaiter(this, void 0, void 0, function* () {
                const oldQue = yield question_1.default.findById(qId);
                if (!oldQue || oldQue.ans_type !== ans_type)
                    return null;
                if (oldQue.ans_type === 'short_ans' || oldQue.ans_type === 'long_ans') {
                    if (res_text) {
                        return { questionId: qId, res_text };
                    }
                    else
                        return null;
                }
                if (oldQue.ans_type === 'checkbox' || oldQue.ans_type === 'dropdown' || oldQue.ans_type === 'mcq') {
                    // console.log(res_array.every(r => oldQue.optionsArray?.includes(r)))
                    if (res_array && res_array.every(r => { var _a; return (_a = oldQue.optionsArray) === null || _a === void 0 ? void 0 : _a.includes(r); })) {
                        return { questionId: qId, res_array };
                    }
                    else
                        return null;
                }
                return null;
            }));
            const question_res = yield Promise.all(question_res_PromiseArray);
            // if all responses doesn't follow rules then don't accept response
            // console.log(question_res)
            const isNull = question_res.findIndex((ele) => ele === null);
            if (isNull !== -1) {
                return res.status(401).json({ msg: 'Improper format of questions' });
            }
            const oldRes = yield response_1.default.findOne({ formId, userId });
            if ((oldRes === null || oldRes === void 0 ? void 0 : oldRes.__v) > 1) {
                return res.status(401).json({ msg: 'Already submitted two times!' });
            }
            // -------------------------------------          making Res Summery    --------------------------------------------
            const formResSummery = yield resSummery_1.default.findById(oldForm.formResSummery);
            // -----------------------------------------    making new res document    ------------------------------
            const newRes = {
                formId,
                userId,
                mcq_res: new Map(),
                text_res: new Map(),
            };
            // --------------------------------              if older response exist  -------------------------------------
            if (oldRes !== null) {
                (_a = newRes.mcq_res) === null || _a === void 0 ? void 0 : _a.clear();
                (_b = newRes.text_res) === null || _b === void 0 ? void 0 : _b.clear();
                (_c = oldRes.mcq_res) === null || _c === void 0 ? void 0 : _c.forEach((value, key) => {
                    const quesSummery = formResSummery === null || formResSummery === void 0 ? void 0 : formResSummery.mcq_res_summery.get(key);
                    if (quesSummery) {
                        value.forEach((option) => {
                            quesSummery.set(option, (quesSummery.get(option) || 1) - 1);
                        });
                    }
                });
                (_d = oldRes.text_res) === null || _d === void 0 ? void 0 : _d.forEach((value, key) => {
                    formResSummery === null || formResSummery === void 0 ? void 0 : formResSummery.text_res_summery.set(key, ((formResSummery === null || formResSummery === void 0 ? void 0 : formResSummery.text_res_summery.get(key)) || 1) - 1);
                });
            }
            // console.log(question_res)
            // console.log('-------------------------------')
            // console.log("New res begaining!", newRes)
            question_res.forEach((qRes) => {
                var _a, _b;
                if (!qRes)
                    return;
                const { res_array, res_text } = qRes;
                if (res_array) { // if res type array
                    let currQues = formResSummery === null || formResSummery === void 0 ? void 0 : formResSummery.mcq_res_summery.get(qRes.questionId);
                    if (currQues !== undefined) { // if count for this exist
                        res_array.forEach((ele) => {
                            currQues === null || currQues === void 0 ? void 0 : currQues.set(ele, ((currQues === null || currQues === void 0 ? void 0 : currQues.get(ele)) || 0) + 1);
                        });
                    }
                    else {
                        let newM = new Map();
                        res_array.forEach((ele) => {
                            newM.set(ele, 1);
                        });
                        formResSummery === null || formResSummery === void 0 ? void 0 : formResSummery.mcq_res_summery.set(qRes.questionId, newM);
                    }
                    (_a = newRes.mcq_res) === null || _a === void 0 ? void 0 : _a.set(qRes.questionId, res_array);
                }
                if (res_text) { // if res type text
                    formResSummery === null || formResSummery === void 0 ? void 0 : formResSummery.text_res_summery.set(qRes.questionId, ((formResSummery === null || formResSummery === void 0 ? void 0 : formResSummery.text_res_summery.get(qRes.questionId)) || 0) + 1);
                    (_b = newRes.text_res) === null || _b === void 0 ? void 0 : _b.set(qRes.questionId, res_text);
                }
            });
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                if (formResSummery) {
                    yield resSummery_1.default.findByIdAndUpdate(oldForm.formResSummery, formResSummery);
                }
                let newRes_ = (oldRes !== null) ? (yield response_1.default.findByIdAndUpdate(oldRes._id, newRes)) : (yield response_1.default.create(newRes));
                session.endSession();
                return res.status(201).json({ formId, formResSummery, newRes, newRes_ });
            }
            catch (error) {
                yield session.abortTransaction();
                session.endSession();
                throw error;
            }
        }
        catch (err) {
            return res.status(500).json({ msg: 'Some internal error occured', err });
        }
    });
}
exports.newFormRes = newFormRes;
function getFormRes(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { formId } = req.params;
            const { _id: userId } = res.user;
            // console.log(formId,userId)
            const oldRes = yield response_1.default.findOne({
                formId,
                userId
            });
            if (!oldRes) {
                return res.status(201).json({ msg: 'Response doesnt exist' });
            }
            return res.status(201).json({ oldRes });
        }
        catch (err) {
            return res.status(500).json({ msg: 'Some internal error occured', err });
        }
    });
}
exports.getFormRes = getFormRes;
