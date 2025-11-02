"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJwt = verifyJwt;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error("JWT_SECRET is not configured");
    return secret;
}
function verifyJwt(req, res, next) {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : undefined;
        if (!token)
            return res.status(401).json({ message: "Missing token" });
        const payload = jsonwebtoken_1.default.verify(token, getJwtSecret());
        req.userId = payload.sub;
        return next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}
