import express from "express";
import { chatWithAI, recommendWorkers } from "../controller/chatbot";

const router = express.Router();

// Public route for chatbot
router.post("/chat", chatWithAI);
// AI-powered worker recommendations
router.post("/recommend-workers", recommendWorkers);

export default router;