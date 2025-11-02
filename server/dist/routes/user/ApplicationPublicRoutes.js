"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ApplicationController_1 = require("../../controller/user/ApplicationController");
const router = (0, express_1.Router)();
router.post("/", ApplicationController_1.submitApplication);
router.get("/:id/status", ApplicationController_1.getApplicationStatus);
exports.default = router;
