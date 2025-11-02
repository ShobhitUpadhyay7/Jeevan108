"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const patientSchema = new mongoose_1.default.Schema({
// Add fields for patient
});
// Create patient model using discriminator
const Patient = BaseModel_1.default.discriminator("Patient", patientSchema);
exports.default = Patient;
