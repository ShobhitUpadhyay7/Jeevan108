import { Router } from "express";
import { login, me, register } from "../../controller/user/BaseController";
import { verifyJwt } from "../../utils/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyJwt, me);

export default router;
