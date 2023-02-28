import express, { NextFunction, Request, Response } from 'express'
import mongoose, { ClientSession } from 'mongoose';
import Form, { IForm, IFormStored } from '../models/form';
import Question, { IQuestion, IQuestionStored } from '../models/question';
import { IResSummery_b } from '../models/resSummery';
import ResSummery from '../models/resSummery';
import User from '../models/users';
import { IMongooseObjectId } from '../types';

// to create new form add adding it's referance to users document
export async function createNewForm(req: Request, res: Response) {
  try {
    const { title, desc, starttime, endtime }: IForm = req.body
    const { _id, forms } = res.user
    if (forms.length > 9) return res.status(403).json({ msg: 'Can not make more than 10 forms' })

    // --------------------              Data to be stored          -------------------------------------------------
    const form: IForm= {
      title, desc, starttime, endtime, author: _id, questions: []
    }
    let defaultQuestion = {
      required: false,
      ans_type: 'mcq',
      optionsArray: ['Option 1'],
      title: 'Untitle Question',
    }

    const session: ClientSession = await mongoose.startSession();
    session.startTransaction();
    try {
      const formCreated = await Form.create(form);
      await User.findByIdAndUpdate(_id, {
        forms: [formCreated._id, ...forms]
      })

      const newQue = await Question.create({ ...defaultQuestion, formId: formCreated._id })

      const resSummery =  await ResSummery.create({
        formId: formCreated._id,
        userId: _id,
        mcq_res_summery: {},
        text_res_summery: {}
      })

      await Form.findByIdAndUpdate(formCreated._id, {
        questions: newQue._id,
        formResSummery: resSummery._id,
      })
      

      await session.commitTransaction();
      session.endSession();
      return res.status(201).json({ formId: formCreated._id, resSummery, newQue })
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (err) {
    return res.status(500).json({ msg: 'Some internal error occured', err })
  }
}

// to edit form add adding or deleting question as per instructions
export async function editForm(req: Request, res: Response) {
  try {
    const { _id } = res.user

    const { formId } = req.params
    const oldForm = await Form.findById(formId)
    if (!oldForm) return res.status(404).json({ msg: 'form not found' })
    if (oldForm.author.toString() !== _id.toString()) return res.status(401).json({ msg: 'Unauthorized' })

    let newForm = {}

    const { title, desc, starttime, endtime }: IForm = req.body
    if (title) newForm = { ...newForm, title }
    if (desc) newForm = { ...newForm, desc }
    if (starttime && endtime) newForm = { ...newForm, title, starttime, endtime }

    const { questions, new_questions }: { questions: (string | null | number)[], new_questions: IQuestionStored[] } = req.body;

    let count = 0;
    questions.forEach((element, index) => {
      if (element === null && count < new_questions.length) {
        questions[index] = count;
        count += 1;
      }
    });

    const session: ClientSession = await mongoose.startSession();
    session.startTransaction();

    try {
      //------------------------------          create newly added questions  ------------------------------
      const PromiseArray = questions.map(async (que) => {
        try {
          console.log("Type que", typeof que)
          if (typeof que === 'string') return que
          else if (typeof que === 'number') {
            let que_ = new_questions[que]
            console.log(que_)
            let newQue = await Question.create({ ...que_, formId })
            return newQue._id
          } else return null
        } catch {
          return null
        }
      })
      let quesIds = await Promise.all(PromiseArray)
      quesIds = quesIds.filter(ele => (!(ele === null)))

      console.log(" Questions : ", questions)
      console.log(" new questions", new_questions)

      //           -----------          deleting other  questions  ------------------------------
      const deleteQueList: (string | IMongooseObjectId)[] = []
      oldForm.questions.forEach((oldQueId) => {
        if (!(quesIds.includes(oldQueId.toString()))) {
          // console.log(oldQueId.toString() in quesIds,oldQueId.toString(),quesIds)
          deleteQueList.push(oldQueId)
        }
      })
      const delPromiseArray = deleteQueList.map(async (que) => {
        try {
          const a = await Question.findByIdAndDelete(que)
        } catch {
          return null
        }
      })
      await Promise.all(delPromiseArray)

      //           ------------------     Updating form    --------------------------------
      await Form.findByIdAndUpdate(formId, {
        ...newForm,
        questions: quesIds
      })

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        ...newForm,
        questions: quesIds
      })

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    } 
  } catch (err) {
    return res.status(500).json({ msg: 'Some internal error occured', err })
  }
}

// to get form information
export async function getForm(req: Request, res: Response) {
  try {
    const { formId } = req.params
    const { withQuestions } = req.query
    const { _id, forms } = res.user
    const oldForm: IFormStored | null = await Form.findById(formId)
    if (!oldForm) return res.status(404).json({ msg: 'form not found' })

    // console.log(withQuestions)
    if (withQuestions === "true") {
      const questions: { [key: string]: IQuestionStored } = {}

      let queListPromises = oldForm.questions.map(async (queId) => {
        try {
          if (oldForm.author === _id) return (await Question.findById(queId)) as IQuestionStored | null
          else return (await Question.findById(queId).select({ correct_ans: 0 })) as IQuestionStored | null
        } catch {
          return null;
        }
      })
      let queList = await Promise.all(queListPromises)
      queList = queList.filter(ele => (!(ele === null)))
      queList.forEach(que => {
        questions[que?._id.toString() as string] = que as IQuestionStored
      })

      return res.status(201).json({ form: oldForm, questions })
    } else {
      return res.status(201).json({ form: oldForm })
    }
  } catch (err) {
    return res.status(500).json({ msg: 'Some internal error occured', err })
  }


}
// to get question information
export async function getQuestion(req: Request, res: Response) {
  // try {
  const { _id, forms } = res.user

  const { formId, queId } = req.params

  const oldForm = await Form.findById(formId)
  if (!oldForm) return res.status(404).json({ msg: 'form not found' })
  let que: IQuestion | null;
  if (oldForm.author.toString() !== _id.toString()) {
    que = await Question.findById(queId).select({ correct_ans: 0 })
  } else {
    que = await Question.findById(queId)
  }

  if (!que) return res.status(404).json({ msg: 'question not found' })
  if (que.formId.toString() !== formId) return res.status(401).json({ msg: 'Unauthorized' })


  return res.status(201).json(que)
  // } catch (err) {
  //   return res.status(500).json({ msg: 'Some internal error occured', err })
  // }
}
// to edit the question
export async function editQuestion(req: Request, res: Response) {
  try {
    const { _id, forms } = res.user

    const { formId, queId } = req.params

    const oldForm = await Form.findById(formId)
    if (!oldForm) return res.status(404).json({ msg: 'form not found' })
    const que = await Question.findById(queId);
    if (oldForm.author.toString() !== _id.toString()) return res.status(401).json({ msg: 'Unauthorized' });

    if (!que) return res.status(404).json({ msg: 'question not found' })
    if (que.formId.toString() !== formId) return res.status(401).json({ msg: 'Unauthorized' })

    const { title, desc, ans_type, required, optionsArray, correct_ans, point }: IQuestionStored = req.body
    await Question.findByIdAndUpdate(queId, { title, desc, ans_type, required, optionsArray, correct_ans, point })

    return res.status(201).json({ title, desc, ans_type, required, optionsArray, correct_ans, point })
  } catch (err) {
    return res.status(500).json({ msg: 'Some internal error occured', err })
  }
}
