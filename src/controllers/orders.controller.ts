import { prisma } from "../index.js";
import asynchandler from "../utils/asyncHandler.js";


const refreshOrder = asynchandler(async (req, res) => {

    const orders = await prisma.productRequest.all({
        where: {
            productId: req.body.productId,
            buyerName: req.body.buyerName,
            quantity: req.body.quantity
        }
    })

})