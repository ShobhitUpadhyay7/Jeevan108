import { Request, Response } from "express";
import Nurse from "../../model/user/nurse";
import Caretaker from "../../model/user/caretaker";
import Compounder from "../../model/user/compounder";

const roleToModel: Record<string, any> = {
  nurse: Nurse,
  caretaker: Caretaker,
  compounder: Compounder,
};

function getModel(roleParam: string) {
  const normalizedRole = roleParam.toLowerCase();
  return roleToModel[normalizedRole] || null;
}

// Public endpoint - returns limited info for browsing (no email, no sensitive data)
export async function listPublicWorkers(req: Request, res: Response) {
  try {
    const { role } = req.params;
    
    if (role) {
      // Get workers by specific role
      const Model = getModel(role);
      if (!Model) {
        return res.status(400).json({ message: "Invalid role. Must be: nurse, caretaker, or compounder" });
      }
      
      const workers = await Model.find()
        .select("username phone address profilePicture role createdAt hourlyRate dailyRate weeklyRate isAvailable averageRating reviewCount")
        .lean();
      
      return res.json(workers);
    } else {
      // Get all workers (combine all three types)
      const [nurses, caretakers, compounders] = await Promise.all([
        Nurse.find().select("username phone address profilePicture role createdAt hourlyRate dailyRate weeklyRate isAvailable averageRating reviewCount").lean(),
        Caretaker.find().select("username phone address profilePicture role createdAt hourlyRate dailyRate weeklyRate isAvailable averageRating reviewCount").lean(),
        Compounder.find().select("username phone address profilePicture role createdAt hourlyRate dailyRate weeklyRate isAvailable averageRating reviewCount").lean(),
      ]);
      
      const allWorkers = [...nurses, ...caretakers, ...compounders];
      return res.json(allWorkers);
    }
  } catch (err) {
    console.error("Error listing public workers:", err);
    return res.status(500).json({ message: "Failed to fetch workers", error: String(err) });
  }
}

export async function getPublicWorkerById(req: Request, res: Response) {
  try {
    const { role, id } = req.params;
    const Model = getModel(role);
    
    if (!Model) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const worker = await Model.findById(id)
      .select("username phone address profilePicture role createdAt hourlyRate dailyRate weeklyRate isAvailable averageRating reviewCount")
      .lean();
    
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }
    
    return res.json(worker);
  } catch (err) {
    console.error("Error fetching public worker:", err);
    return res.status(500).json({ message: "Failed to fetch worker", error: String(err) });
  }
}

