import { Router } from "express";
import {
  getApplicationStatus,
  submitApplication,
} from "../../controller/user/ApplicationController";

const router = Router();

router.post("/", submitApplication);
router.get("/:id/status", getApplicationStatus);

export default router;
