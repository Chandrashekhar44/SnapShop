import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../../src/index.js";



async function hashPasswordIfNeeded(password: string, currentHash?: string) {
    if (!password) return currentHash || '';
    if (currentHash && await bcrypt.compare(password, currentHash)) {
        return currentHash;
    }
    return await bcrypt.hash(password, 10);
}

async function generateAccessToken(user: User) {
    return jwt.sign(
        {
            id: user.id,
        },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: "15m" }
    );
}

async function generateRefreshToken(user: User) {
    return jwt.sign(
        {
            id: user.id,
        },
        process.env.REFRESH_TOKEN_SECRET!,
        { expiresIn: "7d" }
    );
}

export { hashPasswordIfNeeded, generateAccessToken, generateRefreshToken };