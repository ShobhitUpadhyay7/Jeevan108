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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsersByRole = listUsersByRole;
exports.getUserByRole = getUserByRole;
exports.updateUserByRole = updateUserByRole;
exports.deleteUserByRole = deleteUserByRole;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const nurse_1 = __importDefault(require("../../model/user/nurse"));
const caretaker_1 = __importDefault(require("../../model/user/caretaker"));
const compounder_1 = __importDefault(require("../../model/user/compounder"));
const upload_1 = require("../../utils/upload");
const roleToModel = {
    Nurse: nurse_1.default,
    Caretaker: caretaker_1.default,
    Compounder: compounder_1.default,
};
function getModel(roleParam) {
    const role = roleParam.charAt(0).toUpperCase() + roleParam.slice(1).toLowerCase();
    return roleToModel[role];
}
function listUsersByRole(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const Model = getModel(req.params.role);
            if (!Model)
                return res.status(400).json({ message: "Invalid role" });
            const items = yield Model.find().select("username email phone").lean();
            return res.json(items);
        }
        catch (err) {
            return res.status(500).json({ message: "List failed", error: String(err) });
        }
    });
}
function getUserByRole(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const Model = getModel(req.params.role);
            if (!Model)
                return res.status(400).json({ message: "Invalid role" });
            const doc = yield Model.findById(req.params.id);
            if (!doc)
                return res.status(404).json({ message: "Not found" });
            return res.json(doc);
        }
        catch (err) {
            return res
                .status(500)
                .json({ message: "Fetch failed", error: String(err) });
        }
    });
}
function updateUserByRole(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const Model = getModel(req.params.role);
            if (!Model)
                return res.status(400).json({ message: "Invalid role" });
            const _a = req.body || {}, { password } = _a, rest = __rest(_a, ["password"]);
            const update = Object.assign({}, rest);
            if (password) {
                update.password = yield bcryptjs_1.default.hash(password, 10);
            }
            const doc = yield Model.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
            if (!doc)
                return res.status(404).json({ message: "Not found" });
            return res.json(doc);
        }
        catch (err) {
            return res
                .status(500)
                .json({ message: "Update failed", error: String(err) });
        }
    });
}
// Helper function to delete user documents
function deleteUserDocuments(user, role) {
    return __awaiter(this, void 0, void 0, function* () {
        const documentsToDelete = [];
        // Extract document URLs based on role
        if (role === "Nurse") {
            if (user.governmentId)
                documentsToDelete.push(user.governmentId);
            if (user.nursingRegistrationCertificate)
                documentsToDelete.push(user.nursingRegistrationCertificate);
            if (user.policeVerificationCertificate)
                documentsToDelete.push(user.policeVerificationCertificate);
        }
        else if (role === "Caretaker") {
            if (user.governmentId)
                documentsToDelete.push(user.governmentId);
            if (user.policeVerificationCertificate)
                documentsToDelete.push(user.policeVerificationCertificate);
        }
        else if (role === "Compounder") {
            if (user.governmentId)
                documentsToDelete.push(user.governmentId);
            if (user.trainingCertificate)
                documentsToDelete.push(user.trainingCertificate);
            if (user.policeVerificationCertificate)
                documentsToDelete.push(user.policeVerificationCertificate);
        }
        // Delete each document file (deleteFile now handles Cloudinary URLs)
        const deletePromises = documentsToDelete.map((url) => __awaiter(this, void 0, void 0, function* () {
            if (url) {
                try {
                    yield (0, upload_1.deleteFile)(url, "document");
                    console.log(`Deleted document from Cloudinary`);
                }
                catch (err) {
                    // Log error but don't fail the entire deletion
                    console.error(`Failed to delete document:`, err);
                }
            }
        }));
        yield Promise.all(deletePromises);
    });
}
// Helper function to delete user profile picture
function deleteUserProfilePicture(user) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!user.profilePicture)
            return;
        const profilePicUrl = user.profilePicture;
        try {
            yield (0, upload_1.deleteFile)(profilePicUrl, "image");
            console.log(`Deleted profile picture from Cloudinary`);
        }
        catch (err) {
            // Log error but don't fail the entire deletion
            console.error(`Failed to delete profile picture:`, err);
        }
    });
}
function deleteUserByRole(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const Model = getModel(req.params.role);
            if (!Model)
                return res.status(400).json({ message: "Invalid role" });
            // Find the user first to get document URLs and profile picture before deletion
            const user = yield Model.findById(req.params.id);
            if (!user)
                return res.status(404).json({ message: "Not found" });
            // Delete user's documents
            const role = req.params.role.charAt(0).toUpperCase() + req.params.role.slice(1).toLowerCase();
            yield deleteUserDocuments(user, role);
            // Delete user's profile picture
            yield deleteUserProfilePicture(user);
            // Delete the user from database
            yield Model.findByIdAndDelete(req.params.id);
            return res.status(204).send();
        }
        catch (err) {
            return res
                .status(500)
                .json({ message: "Delete failed", error: String(err) });
        }
    });
}
