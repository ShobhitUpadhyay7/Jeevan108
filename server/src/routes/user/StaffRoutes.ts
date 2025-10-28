import { Router } from "express";
import { verifyJwt } from "../../utils/auth";
import { requireRole } from "../../utils/roles";
import {
  createStaff,
  deleteStaff,
  getStaff,
  listStaff,
  updateStaff,
} from "../../controller/user/StaffController";

const router = Router();

router.use(verifyJwt, requireRole("Admin"));

router.post("/", createStaff);
router.get("/", listStaff);
router.get("/:id", getStaff);
router.put("/:id", updateStaff);
router.delete("/:id", deleteStaff);

export default router;
