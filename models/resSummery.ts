import mongoose, { Date } from "mongoose";
import { IMongooseObjectId } from "../types";

export interface IResSummery_b {
    userId : IMongooseObjectId,
    formId : IMongooseObjectId,
    mcq_res_summery :  Map<string,Map<string,number>>,
    text_res_summery : Map<string,number>,
}
export interface IResSummery extends IResSummery_b{
    _id : IMongooseObjectId
}

const resSummerySchema = new mongoose.Schema<IResSummery>({
    userId: { type: mongoose.SchemaTypes.ObjectId, ref:"User" },
    formId :  { type: mongoose.SchemaTypes.ObjectId, ref:'Form' },
    mcq_res_summery : {
        type : Map,
        of : {
            type : Map,
            of : {type: Number,minlength:1}
        }
    },
    text_res_summery : {
        type : Map,
        of : {type: Number,minlength:1}
    }
})

export default mongoose.model<IResSummery>("ResSummery", resSummerySchema)