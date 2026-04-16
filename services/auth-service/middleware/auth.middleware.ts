import { prisma } from "../index.js";
import ApiError from "../../shared/utils/ApiError.js";
import asynchandler from "../../shared/utils/asyncHandler.js";
import jwt from "jsonwebtoken"

interface JwtPayloadType {
  id: number;
}
const authMiddleware = asynchandler(async(req,res,next)=>{

    const token = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ","")

    if(!token){
        throw new ApiError(404,"Unauthorized request");
    }

    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET!) as JwtPayloadType
    if(!decodedToken?.id){
        throw new ApiError(401,"unauthorized request")
    }

    const user = await prisma.user.findUnique({
        where:{
            id : decodedToken.id
        },
    }
    )

    if(!user){
        throw new ApiError(400,"user not found")

    }

    req.user = user;

    next();

})