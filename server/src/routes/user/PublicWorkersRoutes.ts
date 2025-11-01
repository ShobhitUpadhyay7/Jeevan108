import { Router } from "express";
import { listPublicWorkers, getPublicWorkerById } from "../../controller/user/PublicWorkersController";

const router = Router();

// Public routes - no authentication required
router.get("/workers", listPublicWorkers); // Get all workers (nurses, caretakers, compounders)
router.get("/workers/:role", listPublicWorkers); // Get workers by role (role param is optional)
router.get("/workers/:role/:id", getPublicWorkerById); // Get specific worker details

export default router;

