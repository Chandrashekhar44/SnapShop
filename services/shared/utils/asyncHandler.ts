import {Request,Response,NextFunction} from "express"

type Asynchandler = (
    req : Request,
    res: Response,
    next:NextFunction
 ) => Promise<any>

const asynchandler = (requesthandler : Asynchandler)=>{
    return(req : Request,res : Response,next:NextFunction)=>{
        Promise.resolve(requesthandler(req,res,next)).catch((err)=>next(err))
    }
}

export default asynchandler;