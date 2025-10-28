import { Router } from "express";
import { verifyJwt } from "../../utils/auth";
import { requireAnyRole } from "../../utils/roles";
import {
  approveApplication,
  getApplication,
  listPending,
  rejectApplication,
} from "../../controller/user/ApplicationController";

const router = Router();

router.use(verifyJwt, requireAnyRole(["Admin", "Staff"]));

router.get("/", listPending);
router.get("/:id", getApplication);
router.post("/:id/approve", approveApplication);
router.post("/:id/reject", rejectApplication);

export default router;
