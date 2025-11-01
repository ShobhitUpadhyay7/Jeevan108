import { Router } from "express";
import { login, me, register, updateMyProfile } from "../../controller/user/BaseController";
import { verifyJwt } from "../../utils/auth";

const router = Router();

// Only allow non-staff roles via open registration. Enforce staff creation via Admin-only routes.
router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyJwt, me);
router.put("/me", verifyJwt, updateMyProfile); // Update own profile

export default router;
