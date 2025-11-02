"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
exports.requireAnyRole = requireAnyRole;
const BaseModel_1 = __importDefault(require("../model/user/BaseModel"));
function requireRole(requiredRole) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.userId;
            if (!userId)
                return res.status(401).json({ message: "Unauthorized" });
            const user = yield BaseModel_1.default.findById(userId).select("role");
            if (!user)
                return res.status(401).json({ message: "Unauthorized" });
            if (user.role !== requiredRole) {
                return res.status(403).json({ message: "Forbidden" });
            }
            return next();
        }
        catch (err) {
            return res.status(500).json({ message: "Authorization check failed" });
        }
    });
}
function requireAnyRole(allowedRoles) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.userId;
            if (!userId)
                return res.status(401).json({ message: "Unauthorized" });
            const user = yield BaseModel_1.default.findById(userId).select("role");
            if (!user)
                return res.status(401).json({ message: "Unauthorized" });
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: "Forbidden" });
            }
            return next();
        }
        catch (err) {
            return res.status(500).json({ message: "Authorization check failed" });
        }
    });
}
