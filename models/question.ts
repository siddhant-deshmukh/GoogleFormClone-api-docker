import mongoose, { Date } from "mongoose";
import { IMongooseObjectId } from "../types";

export interface IQuestion_b{
    required: boolean,
    title: string,
    desc?: string,
    ans_type: 'short_ans' | 'long_ans' | 'mcq' | 'checkbox' | 'dropdown' | 'mcq_grid' | 'checkboc_grid' | 'range' | 'date' | 'time',
    optionsArray?: string[],
    point?:number,
    correct_ans?: string[]
}
export interface IQuestion extends IQuestion_b{
    formId: IMongooseObjectId,
}
export interface IQuestionStored extends IQuestion {
    _id : IMongooseObjectId,
}
const questionSchema = new mongoose.Schema<IQuestionStored>({
    formId: {type: mongoose.SchemaTypes.ObjectId,required:true},
    required: { type: Boolean, required: true, default: true },
    title: { type: String, required: true, maxLength: 150 },
    desc: { type: String, maxLength: 150 },
    ans_type: { type: String, required: true, enum: ['short_ans', 'long_ans', 'mcq', 'checkbox', 'dropdown', 'mcq_grid', 'checkboc_grid', 'range', 'date', 'time'] },
    optionsArray: [{ type: String, maxlength: 50 }],
    correct_ans:[{type:String,maxlength:50}],
    point:{type:Number,min:0,max:100}
})
questionSchema.path('optionsArray').validate((val: IMongooseObjectId[]) => { return val.length < 20 }, 'question can have 100 options at max')
questionSchema.path('correct_ans').validate((val: IMongooseObjectId[]) => { return val.length < 20 }, 'question can have 100 options at max')

const Question = mongoose.model<IQuestionStored>("Question", questionSchema);
export default Question