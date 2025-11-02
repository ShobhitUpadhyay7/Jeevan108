"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BaseController_1 = require("../../controller/user/BaseController");
const auth_1 = require("../../utils/auth");
const router = (0, express_1.Router)();
// Only allow non-staff roles via open registration. Enforce staff creation via Admin-only routes.
router.post("/register", BaseController_1.register);
router.post("/login", BaseController_1.login);
router.get("/me", auth_1.verifyJwt, BaseController_1.me);
router.put("/me", auth_1.verifyJwt, BaseController_1.updateMyProfile); // Update own profile
exports.default = router;
