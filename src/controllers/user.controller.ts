import ApiError from "../utils/ApiError.js";
import asynchandler from "../utils/asyncHandler.js";
import { prisma } from "../index.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { hashPasswordIfNeeded, generateAccessToken, generateRefreshToken } from "../utils/userfunction.js";
import { CookieOptions } from "express";
import {client} from "../config/redis.js";



export const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    path: "/"
};

const registerUser = asynchandler(async (req, res) => {

    const { username, email,address, password, latitude,longitude, category } = req.body;

    if (!username || !email || !address || !password || !latitude || !longitude || !category) {
        throw new ApiError(400, "All fields are required");
    }



    const existedUser = await prisma.user.findUnique({
        where: {
            email,
            username
        }
    })

    if (existedUser) {
        throw new ApiError(400, "User already exists");
    }

    const hashedPassword = await hashPasswordIfNeeded(password);

    const user = await prisma.user.create({
        data: {
            username,
            email,
            address,
            latitude,
            longitude,
            password: hashedPassword,
            category
        }
    })

    if (!user) {
        throw new ApiError(500, "User not created");
    }

    if (user.category === "seller") {
        const seller = await prisma.seller.create({
            data: {
                shopName: user.username,
                shopAddress: user.address,
                shopCategory: user.category,
                latitude: user.latitude,
                longitude:user.longitude,
                userId : user.id
            }
        })

        if (!seller) {
            throw new ApiError(500, "Account not created");
        }
    }

    if (user.category === "buyer") {
        const buyer = await prisma.buyer.create({
            data: {
                userId: user.id,
                latitude: user.latitude,
                longitude: user.longitude,
            }
        })

        if (!buyer) {
            throw new ApiError(500, "Account not created");
        }
    }

    const createdUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,

        },
    });

    if (!createdUser) {
        throw new ApiError(500, "User not created");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully"))
})

const loginUser = asynchandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await prisma.user.findUnique({
        where: {
            email,
        }
    })

    if (!user) {
        throw new ApiError(400, "User not found");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);


    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid password");
    }

    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(200, user, "User logged in successfully")
        );
})


const logoutUser = asynchandler(async (req, res) => {

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true
    })
    return res.status(200).json(
        new ApiResponse(200, {}, "User logged out successfully"))
})

const getCurrentUser = asynchandler(async(req,res)=>{
   const {id} = req.params;
   if(!id || isNaN(Number(id))){
    throw new ApiError(404,"Invalid userid or user not found")
   }
   const cachekey = `user:${id}`
   const cachedData = await client.get(cachekey);
   if(cachedData){
    const parsed = JSON.parse(cachedData);
    return res.status(200).json(new ApiResponse(200,parsed,"Fetched cache data successfully"))
   }

   const currUser = await prisma.user.findUnique({
    where:{
        id: Number(id)
    }
   })

   if(!currUser){
    throw new ApiError(400,"User not found")
   }
   const responseData = {
  username: currUser.username,
  email: currUser.email,
  address: currUser.address,
  category: currUser.category,
};

   if(responseData){
    await client.set(cachekey,JSON.stringify(responseData),"EX",60)
   }
   

   return res.status(200).json(new ApiResponse(200,
    responseData,"Fetched current user successfully"))

})

const getCurrUserProducts = asynchandler(async (req, res) => {
  const { sellerId } = req.params;

  if (!sellerId || isNaN(Number(sellerId))) {
    throw new ApiError(400, "Invalid sellerId");
  }

   const cursor = req.query.cursor
    ? Number(req.query.cursor)
    : undefined;
    const cachekey = `products:${sellerId}:${cursor || "first"}`

  const cachedData = await client.get(cachekey);
     if(cachedData){ 
        const parsed = JSON.parse(cachedData);

        return res.status(200)
                  .json(new ApiResponse(200,parsed,"Fetched products from cache"))
    }

 

  const products = await prisma.product.findMany({
    where: {
      sellerId: Number(sellerId)
    },
    take: 10,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: {
      id: "desc"
    }
  });

 const responseData = {
    products,
    nextCursor: products.length
      ? products[products.length - 1].id
      : null,
  };

  if (products.length) {
    await client.set(cachekey, JSON.stringify(responseData), "EX", 150);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        nextCursor: products.length
          ? products[products.length - 1].id
          : null
      },
      products.length
        ? "Fetched products successfully"
        : "No more products"
    )
  );
});
