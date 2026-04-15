import { prisma } from "../index";
import ApiError from "../../shared/utils/ApiError";
import asynchandler from "../../shared/utils/asyncHandler";


export const forgotpassword = asynchandler(async(req,res)=>{
    const {email} = req.body;

    if(!email){
        throw new ApiError(404,"Missing of email")
    }

    const user = await prisma.
})