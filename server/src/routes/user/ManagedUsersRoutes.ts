import { Router } from "express";
import { verifyJwt } from "../../utils/auth";
import { requireAnyRole } from "../../utils/roles";
import {
  deleteUserByRole,
  getUserByRole,
  listUsersByRole,
  updateUserByRole,
} from "../../controller/user/ManagedUsersController";

const router = Router();

router.use(verifyJwt, requireAnyRole(["Admin", "Staff"]));

router.get("/:role", listUsersByRole); // role in [nurse|caretaker|compounder]
router.get("/:role/:id", getUserByRole);
router.put("/:role/:id", updateUserByRole);
router.delete("/:role/:id", deleteUserByRole);

export default router;
