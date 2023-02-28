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
exports.editQuestion = exports.getQuestion = exports.getForm = exports.editForm = exports.createNewForm = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const form_1 = __importDefault(require("../models/form"));
const question_1 = __importDefault(require("../models/question"));
const resSummery_1 = __importDefault(require("../models/resSummery"));
const users_1 = __importDefault(require("../models/users"));
// to create new form add adding it's referance to users document
function createNewForm(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { title, desc, starttime, endtime } = req.body;
            const { _id, forms } = res.user;
            if (forms.length > 9)
                return res.status(403).json({ msg: 'Can not make more than 10 forms' });
            // --------------------              Data to be stored          -------------------------------------------------
            const form = {
                title, desc, starttime, endtime, author: _id, questions: []
            };
            let defaultQuestion = {
                required: false,
                ans_type: 'mcq',
                optionsArray: ['Option 1'],
                title: 'Untitle Question',
            };
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const formCreated = yield form_1.default.create(form);
                yield users_1.default.findByIdAndUpdate(_id, {
                    forms: [formCreated._id, ...forms]
                });
                const newQue = yield question_1.default.create(Object.assign(Object.assign({}, defaultQuestion), { formId: formCreated._id }));
                const resSummery = yield resSummery_1.default.create({
                    formId: formCreated._id,
                    userId: _id,
                    mcq_res_summery: {},
                    text_res_summery: {}
                });
                yield form_1.default.findByIdAndUpdate(formCreated._id, {
                    questions: newQue._id,
                    formResSummery: resSummery._id,
                });
                yield session.commitTransaction();
                session.endSession();
                return res.status(201).json({ formId: formCreated._id, resSummery, newQue });
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
exports.createNewForm = createNewForm;
// to edit form add adding or deleting question as per instructions
function editForm(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = res.user;
            const { formId } = req.params;
            const oldForm = yield form_1.default.findById(formId);
            if (!oldForm)
                return res.status(404).json({ msg: 'form not found' });
            if (oldForm.author.toString() !== _id.toString())
                return res.status(401).json({ msg: 'Unauthorized' });
            let newForm = {};
            const { title, desc, starttime, endtime } = req.body;
            if (title)
                newForm = Object.assign(Object.assign({}, newForm), { title });
            if (desc)
                newForm = Object.assign(Object.assign({}, newForm), { desc });
            if (starttime && endtime)
                newForm = Object.assign(Object.assign({}, newForm), { title, starttime, endtime });
            const { questions, new_questions } = req.body;
            let count = 0;
            questions.forEach((element, index) => {
                if (element === null && count < new_questions.length) {
                    questions[index] = count;
                    count += 1;
                }
            });
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                //------------------------------          create newly added questions  ------------------------------
                const PromiseArray = questions.map((que) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        console.log("Type que", typeof que);
                        if (typeof que === 'string')
                            return que;
                        else if (typeof que === 'number') {
                            let que_ = new_questions[que];
                            console.log(que_);
                            let newQue = yield question_1.default.create(Object.assign(Object.assign({}, que_), { formId }));
                            return newQue._id;
                        }
                        else
                            return null;
                    }
                    catch (_a) {
                        return null;
                    }
                }));
                let quesIds = yield Promise.all(PromiseArray);
                quesIds = quesIds.filter(ele => (!(ele === null)));
                console.log(" Questions : ", questions);
                console.log(" new questions", new_questions);
                //           -----------          deleting other  questions  ------------------------------
                const deleteQueList = [];
                oldForm.questions.forEach((oldQueId) => {
                    if (!(quesIds.includes(oldQueId.toString()))) {
                        // console.log(oldQueId.toString() in quesIds,oldQueId.toString(),quesIds)
                        deleteQueList.push(oldQueId);
                    }
                });
                const delPromiseArray = deleteQueList.map((que) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const a = yield question_1.default.findByIdAndDelete(que);
                    }
                    catch (_b) {
                        return null;
                    }
                }));
                yield Promise.all(delPromiseArray);
                //           ------------------     Updating form    --------------------------------
                yield form_1.default.findByIdAndUpdate(formId, Object.assign(Object.assign({}, newForm), { questions: quesIds }));
                yield session.commitTransaction();
                session.endSession();
                return res.status(201).json(Object.assign(Object.assign({}, newForm), { questions: quesIds }));
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
exports.editForm = editForm;
// to get form information
function getForm(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { formId } = req.params;
            const { withQuestions } = req.query;
            const { _id, forms } = res.user;
            const oldForm = yield form_1.default.findById(formId);
            if (!oldForm)
                return res.status(404).json({ msg: 'form not found' });
            // console.log(withQuestions)
            if (withQuestions === "true") {
                const questions = {};
                let queListPromises = oldForm.questions.map((queId) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        if (oldForm.author === _id)
                            return (yield question_1.default.findById(queId));
                        else
                            return (yield question_1.default.findById(queId).select({ correct_ans: 0 }));
                    }
                    catch (_a) {
                        return null;
                    }
                }));
                let queList = yield Promise.all(queListPromises);
                queList = queList.filter(ele => (!(ele === null)));
                queList.forEach(que => {
                    questions[que === null || que === void 0 ? void 0 : que._id.toString()] = que;
                });
                return res.status(201).json({ form: oldForm, questions });
            }
            else {
                return res.status(201).json({ form: oldForm });
            }
        }
        catch (err) {
            return res.status(500).json({ msg: 'Some internal error occured', err });
        }
    });
}
exports.getForm = getForm;
// to get question information
function getQuestion(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // try {
        const { _id, forms } = res.user;
        const { formId, queId } = req.params;
        const oldForm = yield form_1.default.findById(formId);
        if (!oldForm)
            return res.status(404).json({ msg: 'form not found' });
        let que;
        if (oldForm.author.toString() !== _id.toString()) {
            que = yield question_1.default.findById(queId).select({ correct_ans: 0 });
        }
        else {
            que = yield question_1.default.findById(queId);
        }
        if (!que)
            return res.status(404).json({ msg: 'question not found' });
        if (que.formId.toString() !== formId)
            return res.status(401).json({ msg: 'Unauthorized' });
        return res.status(201).json(que);
        // } catch (err) {
        //   return res.status(500).json({ msg: 'Some internal error occured', err })
        // }
    });
}
exports.getQuestion = getQuestion;
// to edit the question
function editQuestion(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id, forms } = res.user;
            const { formId, queId } = req.params;
            const oldForm = yield form_1.default.findById(formId);
            if (!oldForm)
                return res.status(404).json({ msg: 'form not found' });
            const que = yield question_1.default.findById(queId);
            if (oldForm.author.toString() !== _id.toString())
                return res.status(401).json({ msg: 'Unauthorized' });
            if (!que)
                return res.status(404).json({ msg: 'question not found' });
            if (que.formId.toString() !== formId)
                return res.status(401).json({ msg: 'Unauthorized' });
            const { title, desc, ans_type, required, optionsArray, correct_ans, point } = req.body;
            yield question_1.default.findByIdAndUpdate(queId, { title, desc, ans_type, required, optionsArray, correct_ans, point });
            return res.status(201).json({ title, desc, ans_type, required, optionsArray, correct_ans, point });
        }
        catch (err) {
            return res.status(500).json({ msg: 'Some internal error occured', err });
        }
    });
}
exports.editQuestion = editQuestion;
