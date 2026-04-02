import { prisma } from "../index.js";
import ApiError from "../utils/ApiError.js";
import asynchandler from "../utils/asyncHandler.js";
import { getIO } from "../socket/socket.js";
import { categorySorter } from "../categorysortingAi/ai.js";
import ApiResponse from "../utils/ApiResponse.js";
import client from "../redis.js";

const placeOrder = asynchandler(async (req, res) => {
    const {  name, quantity } = req.body;
    const buyerId = req.user.id
    const buyer = await prisma.buyer.findUnique({
        where: { id: buyerId }
    });

    if (!buyer) {
        throw new ApiError(404,"Buyer either not signedup or any technical isuue");
    }
    

    const order = await prisma.order.create({
        data: {
            buyerId,
            name,
            quantity,
            status: "pending"
        }
    });

    const productCategory = await categorySorter(name);

    const sellers = await prisma.seller.findMany({
        where: {
            shopCategory: productCategory
        }
    });

    const nearbySellers = sellers.filter((seller : any) => {
        const distance = Math.sqrt(
            Math.pow(seller.latitude - buyer.latitude, 2) +
            Math.pow(seller.longitude - buyer.longitude, 2)
        );

        return distance < 0.05;
    });

    const io = getIO();

    nearbySellers.forEach((seller : any) => {
        io.to(`seller_${seller.id}`).emit("new-order", order);
    });

    return res.status(201).json({
        message: "Order placed",
        order,
        notifiedSellers: nearbySellers.length
    });
});


const confirmOrder = asynchandler(async(req,res)=>{
    const {id} = req.params;
    const sellerId = req.user?.id;
    const {acceptance} = req.body;
    
    if(!id){
        throw new ApiError(400,"Technical issue")
    }
     const existingOrder = await prisma.order.findUnique({
    where: { id: Number(id) }
      });
    if(existingOrder?.sellerId){
        throw new ApiError(400,"Order already accepted")
    }
    if(acceptance == "Accepted"){
    const userOrder = await prisma.order.update({
        where :{
            id : Number(id)
        },
        data :{
            sellerId ,
            status:"accepted"
        }
    })
        if(!userOrder){
        throw new ApiError(400,"order not found")
    }}

    return res.status(200)
              .json(new ApiResponse(sellerId,"Oredr accepted"))
    
    
})

const listOrders = asynchandler(async(req,res)=>{
   const  ownerId = req.user?.id;
   if(!ownerId){
    throw new ApiError(404,"owneerId not found")
   }
   const cursor = req.query.cursor? Number(req.query.cursor) : undefined;

    const key = cursor ? `orders:${ownerId}:${cursor}` : `orders:${ownerId}:first`;
    const cachedData = await client.get(key);
   if(cachedData)return JSON.parse(cachedData);

  const orders = await prisma.order.findMany({
  where: {
    sellerId : ownerId
  }
})

if(!orders){
    throw new ApiError(400,"Error while finding order")
}

const responseData = {
    orders,
    nextCursor: orders.length
      ? orders[orders.length - 1].id
      : null,
  }; 

  if(orders.length){
    await client.set(key,JSON.stringify(responseData),"EX",100)
  }

return res.status(200)
          .json(new ApiResponse(200,{
        orders,
        nextCursor: orders.length
          ? orders[orders.length - 1].id
          : null
      },
      orders.length? "Fetched products successfully": "No more products"))

})