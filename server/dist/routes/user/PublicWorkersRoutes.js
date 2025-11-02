"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PublicWorkersController_1 = require("../../controller/user/PublicWorkersController");
const router = (0, express_1.Router)();
// Public routes - no authentication required
router.get("/workers", PublicWorkersController_1.listPublicWorkers); // Get all workers (nurses, caretakers, compounders)
router.get("/workers/:role", PublicWorkersController_1.listPublicWorkers); // Get workers by role (role param is optional)
router.get("/workers/:role/:id", PublicWorkersController_1.getPublicWorkerById); // Get specific worker details
exports.default = router;
