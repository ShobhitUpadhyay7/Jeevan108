"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPublicWorkers = listPublicWorkers;
exports.getPublicWorkerById = getPublicWorkerById;
const nurse_1 = __importDefault(require("../../model/user/nurse"));
const caretaker_1 = __importDefault(require("../../model/user/caretaker"));
const compounder_1 = __importDefault(require("../../model/user/compounder"));
const roleToModel = {
    nurse: nurse_1.default,
    caretaker: caretaker_1.default,
    compounder: compounder_1.default,
};
function getModel(roleParam) {
    const normalizedRole = roleParam.toLowerCase();
    return roleToModel[normalizedRole] || null;
}
// Public endpoint - returns limited info for browsing (no email, no sensitive data)
function listPublicWorkers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { role } = req.params;
            if (role) {
                // Get workers by specific role
                const Model = getModel(role);
                if (!Model) {
                    return res.status(400).json({ message: "Invalid role. Must be: nurse, caretaker, or compounder" });
                }
                const workers = yield Model.find()
                    .select("username phone address profilePicture role createdAt hourlyRate dailyRate weeklyRate isAvailable averageRating reviewCount")
                    .lean();
                return res.json(workers);
            }
            else {
                // Get all workers (combine all three types)
                const [nurses, caretakers, compounders] = yield Promise.all([
                    nurse_1.default.find().select("username phone address profilePicture role createdAt hourlyRate dailyRate weeklyRate isAvailable averageRating reviewCount").lean(),
                    caretaker_1.default.find().select("username phone address profilePicture role createdAt hourlyRate dailyRate weeklyRate isAvailable averageRating reviewCount").lean(),
                    compounder_1.default.find().select("username phone address profilePicture role createdAt hourlyRate dailyRate weeklyRate isAvailable averageRating reviewCount").lean(),
                ]);
                const allWorkers = [...nurses, ...caretakers, ...compounders];
                return res.json(allWorkers);
            }
        }
        catch (err) {
            console.error("Error listing public workers:", err);
            return res.status(500).json({ message: "Failed to fetch workers", error: String(err) });
        }
    });
}
function getPublicWorkerById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { role, id } = req.params;
            const Model = getModel(role);
            if (!Model) {
                return res.status(400).json({ message: "Invalid role" });
            }
            const worker = yield Model.findById(id)
                .select("username phone address profilePicture role createdAt hourlyRate dailyRate weeklyRate isAvailable averageRating reviewCount")
                .lean();
            if (!worker) {
                return res.status(404).json({ message: "Worker not found" });
            }
            return res.json(worker);
        }
        catch (err) {
            console.error("Error fetching public worker:", err);
            return res.status(500).json({ message: "Failed to fetch worker", error: String(err) });
        }
    });
}
