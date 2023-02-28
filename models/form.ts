import mongoose, { Date } from "mongoose";
import { IMongooseObjectId } from "../types";
import { IQuestion } from "./question";


export interface IForm {
    author: IMongooseObjectId,
    title: string,
    desc?: string,
    starttime?: Date,
    endtime?: Date,
    questions: IMongooseObjectId[]
}
export interface IFormStored extends IForm {
    _id: IMongooseObjectId ,
    formResSummery: IMongooseObjectId,
    settings?: {

    }
}


const formSchema = new mongoose.Schema<IFormStored>({
    title: { type: String, required: true, maxLength: 100 },
    desc: { type: String, maxLength: 150 },
    author: { type: mongoose.SchemaTypes.ObjectId, required: true },
    questions: [{type : mongoose.SchemaTypes.ObjectId,ref:'Question'}],
    formResSummery: {type : mongoose.SchemaTypes.ObjectId, ref:'ResSummery'},
    starttime: { type: Date },
    endtime: { type: Date },
})
formSchema.path('questions').validate((val: IMongooseObjectId[]) => { return val.length <= 21 }, 'form can have 20 questions at max')

export default mongoose.model<IFormStored>("Form", formSchema);