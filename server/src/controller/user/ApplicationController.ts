import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import PendingApplication from "../../model/user/PendingApplication";
import Nurse from "../../model/user/nurse";
import Caretaker from "../../model/user/caretaker";
import Compounder from "../../model/user/compounder";

const roleToModel: Record<string, any> = {
  Nurse,
  Caretaker,
  Compounder,
};

export async function submitApplication(req: Request, res: Response) {
  try {
    const {
      username,
      email,
      password,
      phone,
      address,
      profilePicture,
      role,
      documents,
    } = req.body || {};
    if (!username || !email || !password || !phone || !role) {
      return res.status(400).json({
        message: "username, email, password, phone, role are required",
      });
    }
    if (!roleToModel[role])
      return res.status(400).json({ message: "Invalid role" });

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await PendingApplication.create({
      username,
      email,
      password: passwordHash,
      phone,
      address,
      profilePicture,
      role,
      documents,
    });
    return res
      .status(201)
      .json({ applicationId: created._id, status: created.status });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Submit application failed", error: String(err) });
  }
}

export async function getApplicationStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const app = await PendingApplication.findById(id).select(
      "status role submittedAt"
    );
    if (!app) return res.status(404).json({ message: "Not found" });
    return res.json(app);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Fetch status failed", error: String(err) });
  }
}

export async function listPending(req: Request, res: Response) {
  try {
    const { status = "pending" } = req.query as any;
    const apps = await PendingApplication.find({ status })
      .select("username email phone role submittedAt")
      .lean();
    return res.json(apps);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "List applications failed", error: String(err) });
  }
}

export async function getApplication(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const app = await PendingApplication.findById(id);
    if (!app) return res.status(404).json({ message: "Not found" });
    return res.json(app);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Fetch application failed", error: String(err) });
  }
}

export async function approveApplication(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const reviewerId = (req as any).userId as string;
    const app = await PendingApplication.findById(id);
    if (!app) return res.status(404).json({ message: "Not found" });
    if (app.status !== "pending")
      return res.status(400).json({ message: "Already processed" });

    const Model = roleToModel[app.role];
    const created = await Model.create({
      username: app.username,
      email: app.email,
      password: app.password,
      phone: app.phone,
      address: app.address,
      profilePicture: app.profilePicture,
      role: app.role,
      ...(app.documents || {}),
    });

    app.status = "approved";
    app.reviewedAt = new Date();
    app.reviewedBy = reviewerId as any;
    await app.save();

    return res.json({ userId: created._id });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Approve failed", error: String(err) });
  }
}

export async function rejectApplication(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const reviewerId = (req as any).userId as string;
    const app = await PendingApplication.findById(id);
    if (!app) return res.status(404).json({ message: "Not found" });
    if (app.status !== "pending")
      return res.status(400).json({ message: "Already processed" });
    app.status = "rejected";
    app.rejectionReason = reason;
    app.reviewedAt = new Date();
    app.reviewedBy = reviewerId as any;
    await app.save();
    return res.json({ ok: true });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Reject failed", error: String(err) });
  }
}
