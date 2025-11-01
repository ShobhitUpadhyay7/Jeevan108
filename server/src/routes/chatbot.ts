import express from "express";
import { chatWithAI } from "../controller/chatbot";

const router = express.Router();

// Public route for chatbot
router.post("/chat", chatWithAI);

export default router;