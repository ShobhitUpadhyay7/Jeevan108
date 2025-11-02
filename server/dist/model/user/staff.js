"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const staffSchema = new mongoose_1.default.Schema({
// Add fields for staff
});
const Staff = BaseModel_1.default.discriminator("Staff", staffSchema);
exports.default = Staff;
