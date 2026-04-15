import asynchandler from '../../shared/utils/asyncHandler';
import ApiError from '../../shared/utils/ApiError';
import {hashPasswordIfNeeded} from '../service/password.service';
import {prisma} from '../index';
import ApiResponse from '../../shared/utils/ApiResponse'
import bcrypt from 'bcryptjs';
import { CookieOptions } from 'express';
import {generateAccessToken} from '../service/generateAccessToken.service'
import { generateRefreshToken } from '../service/generateRefreshToken.service';
import {client} from "../config/redis";
import { Prisma } from '@prisma/client';


export const signup = asynchandler(async (req, res) => {
  const { username, email, address, password, latitude, longitude, category } = req.body;

  if (!username || !email || !address || !password || !latitude || !longitude || !category) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    }
  });

  if (existedUser) {
    throw new ApiError(400, "User already exists");
  }

  const hashedPassword = await hashPasswordIfNeeded(password);

  const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const createdUser = await tx.user.create({
      data: {
        username,
        email,
        address,
        latitude,
        longitude,
        password: hashedPassword,
        category
      }
    });

    if (category === "seller") {
      await tx.seller.create({
        data: {
          shopName: createdUser.username,
          shopAddress: createdUser.address,
          shopCategory: createdUser.category,
          latitude: createdUser.latitude,
          longitude: createdUser.longitude,
          userId: createdUser.id
        }
      });
    }

    if (category === "buyer") {
      await tx.buyer.create({
        data: {
          userId: createdUser.id,
          latitude: createdUser.latitude,
          longitude: createdUser.longitude,
        }
      });
    }

    return createdUser;
  });

  const createdUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User created successfully")
  );
});

export const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    path: "/"
};

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
    const userId = req.user?.id; 

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    await prisma.user.update({
        where: { id: userId },
        data: {
            refreshToken: null, 
        },
    });

    return res
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .status(200)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        );
});


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