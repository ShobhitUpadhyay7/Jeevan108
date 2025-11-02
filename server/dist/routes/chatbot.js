"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatbot_1 = require("../controller/chatbot");
const router = express_1.default.Router();
// Public route for chatbot
router.post("/chat", chatbot_1.chatWithAI);
// AI-powered worker recommendations
router.post("/recommend-workers", chatbot_1.recommendWorkers);
exports.default = router;
