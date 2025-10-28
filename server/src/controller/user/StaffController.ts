import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Staff from "../../model/user/staff";

export async function createStaff(req: Request, res: Response) {
  try {
    const { username, email, password, phone, address, profilePicture } =
      req.body || {};
    if (!username || !email || !password || !phone) {
      return res
        .status(400)
        .json({ message: "username, email, password, phone are required" });
    }
    const existing = await Staff.findOne({ email }).lean();
    if (existing)
      return res.status(409).json({ message: "Email already registered" });
    const passwordHash = await bcrypt.hash(password, 10);
    const created = await Staff.create({
      username,
      email,
      password: passwordHash,
      phone,
      address,
      profilePicture,
      role: "Staff",
    });
    return res.status(201).json({ id: created._id, username: created.username, email: created.email, phone: created.phone, role: "Staff" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Create staff failed", error: String(err) });
  }
}

export async function listStaff(_req: Request, res: Response) {
  try {
    const items = await Staff.find().select("username email phone").lean();
    return res.json(items);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "List staff failed", error: String(err) });
  }
}

export async function getStaff(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const staff = await Staff.findById(id).select(
      "username email phone address profilePicture"
    );
    if (!staff) return res.status(404).json({ message: "Not found" });
    return res.json(staff);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Get staff failed", error: String(err) });
  }
}

export async function updateStaff(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { username, email, phone, address, profilePicture } = req.body || {};
    const updated = await Staff.findByIdAndUpdate(
      id,
      { $set: { username, email, phone, address, profilePicture } },
      { new: true }
    ).select("username email phone address profilePicture");
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.json(updated);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Update staff failed", error: String(err) });
  }
}

export async function deleteStaff(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const deleted = await Staff.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    return res.status(204).send();
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Delete staff failed", error: String(err) });
  }
}
