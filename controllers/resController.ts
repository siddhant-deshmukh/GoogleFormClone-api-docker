import express, { NextFunction, Request, Response } from 'express'
import mongoose, { ClientSession, Types } from 'mongoose';
import Form, { IForm, IFormStored } from '../models/form';
import Question, { IQuestion, IQuestionStored } from '../models/question';
import { IResSummery_b } from '../models/resSummery';
import ResSummery from '../models/resSummery';
import User from '../models/users';
import formRes, { IRes_b } from '../models/response';



export async function newFormRes(req: Request, res: Response) {
  try {
    const { formId } = req.body
    const { _id: userId, forms } = res.user

    const oldForm = await Form.findById(formId)
    if (!oldForm) return res.status(404).json({ msg: 'form not found' })

    const { questions }: {
      questions: ({
        _id: string,
        res_array: string[],
        res_text: string,
        ans_type: 'short_ans' | 'long_ans' | 'mcq' | 'checkbox' | 'dropdown' | 'mcq_grid' | 'checkboc_grid' | 'range' | 'date' | 'time'
      })[]
    } = req.body

    //  ----------------                     checking all the responses    -------------------------------------
    // console.log(questions)
    const question_res_PromiseArray = questions.map(async ({ _id: qId, ans_type, res_array, res_text })
      : Promise<null | { questionId: string, res_text?: string, res_array?: string[] }> => {

      const oldQue = await Question.findById(qId)
      if (!oldQue || oldQue.ans_type !== ans_type) return null;
      if (oldQue.ans_type === 'short_ans' || oldQue.ans_type === 'long_ans') {
        if (res_text) {
          return { questionId: qId, res_text } as { questionId: string, res_text: string }
        } else return null
      }
      if (oldQue.ans_type === 'checkbox' || oldQue.ans_type === 'dropdown' || oldQue.ans_type === 'mcq') {
        // console.log(res_array.every(r => oldQue.optionsArray?.includes(r)))

        if (res_array && res_array.every(r => oldQue.optionsArray?.includes(r))) {
          return { questionId: qId, res_array } as { questionId: string, res_array: string[] }
        } else return null
      }
      return null
    });
    const question_res = await Promise.all(question_res_PromiseArray)
    // if all responses doesn't follow rules then don't accept response
    // console.log(question_res)
    const isNull = question_res.findIndex((ele) => ele === null)
    if (isNull !== -1) {
      return res.status(401).json({ msg: 'Improper format of questions' })
    }

    const oldRes = await formRes.findOne({ formId, userId })
    if (oldRes?.__v > 1) {
      return res.status(401).json({ msg: 'Already submitted two times!' })
    }

    // -------------------------------------          making Res Summery    --------------------------------------------
    const formResSummery = await ResSummery.findById(oldForm.formResSummery)
    // -----------------------------------------    making new res document    ------------------------------
    const newRes: IRes_b = {
      formId,
      userId,
      mcq_res: new Map(),
      text_res: new Map(),
    }

    // --------------------------------              if older response exist  -------------------------------------
    if (oldRes !== null) {
      newRes.mcq_res?.clear()
      newRes.text_res?.clear()
      oldRes.mcq_res?.forEach((value, key) => {
        const quesSummery = formResSummery?.mcq_res_summery.get(key)
        if (quesSummery) {
          value.forEach((option) => {
            quesSummery.set(option, (quesSummery.get(option) || 1) - 1)
          })
        }
      })
      oldRes.text_res?.forEach((value, key) => {
        formResSummery?.text_res_summery.set(key, (formResSummery?.text_res_summery.get(key) || 1) - 1)
      })
    }

    // console.log(question_res)
    // console.log('-------------------------------')
    // console.log("New res begaining!", newRes)

    question_res.forEach((qRes) => {
      if (!qRes) return;
      const { res_array, res_text } = qRes
      if (res_array) { // if res type array
        let currQues = formResSummery?.mcq_res_summery.get(qRes.questionId)
        if (currQues !== undefined) { // if count for this exist
          res_array.forEach((ele) => {
            currQues?.set(ele, (currQues?.get(ele) || 0) + 1)
          })
        } else {
          let newM: Map<string, number> = new Map()
          res_array.forEach((ele) => {
            newM.set(ele, 1)
          })
          formResSummery?.mcq_res_summery.set(qRes.questionId, newM)
        }
        newRes.mcq_res?.set(qRes.questionId, res_array)
      }
      if (res_text) {  // if res type text
        formResSummery?.text_res_summery.set(qRes.questionId, (formResSummery?.text_res_summery.get(qRes.questionId) || 0) + 1)
        newRes.text_res?.set(qRes.questionId, res_text)
      }

    })



    const session: ClientSession = await mongoose.startSession();
    session.startTransaction();
    try {
      if (formResSummery) {
        await ResSummery.findByIdAndUpdate(oldForm.formResSummery, formResSummery)
      }

      let newRes_ = (oldRes !== null) ? (await formRes.findByIdAndUpdate(oldRes._id, newRes)) : (await formRes.create(newRes))

      session.endSession();
      return res.status(201).json({ formId, formResSummery, newRes, newRes_ })
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (err) {
    return res.status(500).json({ msg: 'Some internal error occured', err })
  }
}
export async function getFormRes(req: Request, res: Response) {
  try {
    
    const { formId } = req.params
    const { _id: userId } = res.user

    // console.log(formId,userId)
    const oldRes = await formRes.findOne({
      formId,
      userId
    })
    if (!oldRes) {
      return res.status(201).json({ msg: 'Response doesnt exist' })
    }
    return res.status(201).json({ oldRes })
  } catch (err) {
    return res.status(500).json({ msg: 'Some internal error occured', err })
  }
}