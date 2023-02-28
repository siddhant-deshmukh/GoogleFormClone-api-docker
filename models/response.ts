import mongoose, { Date } from "mongoose";
import { IMongooseObjectId } from "../types";

export interface IRes_b {
    userId : IMongooseObjectId,
    formId : IMongooseObjectId,
    mcq_res? : Map<string,string[]>,
    text_res? : Map<string,string>,
    result? : number
}
export interface IRes extends IRes_b{
    _id : IMongooseObjectId,
    createdAt : Date,
}

const resSchema = new mongoose.Schema<IRes>({
    userId: { type: mongoose.SchemaTypes.ObjectId, index:true, required: true, ref:"User" },
    formId :  { type: mongoose.SchemaTypes.ObjectId, index:true, required: true, ref:'Form' },
    mcq_res : {
        type : Map,
        of : [{type: String,maxlength:50}]
    },
    text_res : {
        type : Map,
        of : {type: String,maxlength:400}
    },
    createdAt: { type: Date, required:true, default: Date.now() },
    result : Number,
})

export default mongoose.model<IRes>("Response", resSchema)