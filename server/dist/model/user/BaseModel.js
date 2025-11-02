"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const BaseUser = new mongoose_1.default.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    profilePicture: { type: String },
    role: {
        type: String,
        enum: [
            "User",
            "Admin",
            "Staff",
            "Nurse",
            "Caretaker",
            "Compounder",
            "Patient",
        ],
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { discriminatorKey: "role" });
const User = mongoose_1.default.model("User", BaseUser);
exports.default = User;
