"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../utils/auth");
const roles_1 = require("../../utils/roles");
const ManagedUsersController_1 = require("../../controller/user/ManagedUsersController");
const router = (0, express_1.Router)();
router.use(auth_1.verifyJwt, (0, roles_1.requireAnyRole)(["Admin", "Staff"]));
router.get("/:role", ManagedUsersController_1.listUsersByRole); // role in [nurse|caretaker|compounder]
router.get("/:role/:id", ManagedUsersController_1.getUserByRole);
router.put("/:role/:id", ManagedUsersController_1.updateUserByRole);
router.delete("/:role/:id", ManagedUsersController_1.deleteUserByRole);
exports.default = router;
