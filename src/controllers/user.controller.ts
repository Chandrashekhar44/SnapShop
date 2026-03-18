import ApiError from "../utils/ApiError.js";
import asynchandler from "../utils/asyncHandler.js";
import { prisma } from "../index.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { hashPasswordIfNeeded, generateAccessToken, generateRefreshToken } from "../utils/userfunction.js";
import { CookieOptions } from "express";



export const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    path: "/"
};

const registerUser = asynchandler(async (req, res) => {

    const { username, email, password, address, category } = req.body;

    if (!username || !email || !password || !address || !category) {
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
            password: hashedPassword,
            address,
            category
        }
    })

    if (!user) {
        throw new ApiError(500, "User not created");
    }

    if (user.category === "seller") {
        const seller = await prisma.seller.create({
            data: {
                userId: user.id,
                shopName: user.username,
                shopAddress: user.address,
                shopCategory: user.category
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
                buyerName: user.username,
                buyerAddress: user.address,
                buyerCategory: user.category
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

