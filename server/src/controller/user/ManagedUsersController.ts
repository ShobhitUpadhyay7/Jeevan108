import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Nurse from "../../model/user/nurse";
import Caretaker from "../../model/user/caretaker";
import Compounder from "../../model/user/compounder";

const roleToModel: Record<string, any> = {
  Nurse,
  Caretaker,
  Compounder,
};

function getModel(roleParam: string) {
  const role =
    roleParam.charAt(0).toUpperCase() + roleParam.slice(1).toLowerCase();
  return roleToModel[role];
}

export async function listUsersByRole(req: Request, res: Response) {
  try {
    const Model = getModel(req.params.role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });
    const items = await Model.find().select("username email phone").lean();
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: "List failed", error: String(err) });
  }
}

export async function getUserByRole(req: Request, res: Response) {
  try {
    const Model = getModel(req.params.role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json(doc);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Fetch failed", error: String(err) });
  }
}

export async function updateUserByRole(req: Request, res: Response) {
  try {
    const Model = getModel(req.params.role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });
    const { password, ...rest } = req.body || {};
    const update: any = { ...rest };
    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json(doc);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Update failed", error: String(err) });
  }
}

export async function deleteUserByRole(req: Request, res: Response) {
  try {
    const Model = getModel(req.params.role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });
    const deleted = await Model.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    return res.status(204).send();
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Delete failed", error: String(err) });
  }
}
