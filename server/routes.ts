import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertMedicalHistorySchema, 
  insertVaccineSchema, 
  insertFamilyMemberSchema,
  insertDoctorSchema,
  insertDoctorAccessSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Doctor routes
  app.get("/api/doctors", requireAuth, async (req, res) => {
    const doctors = await storage.getDoctors();
    res.json(doctors.map(({ password, ...doctor }) => doctor));
  });

  app.post("/api/doctors/register", async (req, res, next) => {
    try {
      const validatedData = insertDoctorSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);

      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const doctor = await storage.createUser(validatedData);
      req.login(doctor, (err) => {
        if (err) return next(err);
        const { password, ...doctorData } = doctor;
        res.status(201).json(doctorData);
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid doctor registration data" });
    }
  });

  // Doctor access management
  app.post("/api/doctor-access", requireAuth, async (req, res) => {
    if (req.user!.isDoctor) {
      return res.status(403).json({ message: "Doctors cannot grant access" });
    }

    const validatedData = insertDoctorAccessSchema.parse(req.body);
    const doctor = await storage.getUser(validatedData.doctorId);

    if (!doctor?.isDoctor) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    const access = await storage.grantDoctorAccess(
      req.user!.id,
      validatedData.doctorId,
      validatedData.expiresAt
    );
    res.status(201).json(access);
  });

  app.delete("/api/doctor-access/:doctorId", requireAuth, async (req, res) => {
    if (req.user!.isDoctor) {
      return res.status(403).json({ message: "Doctors cannot revoke access" });
    }

    const doctorId = parseInt(req.params.doctorId);
    if (isNaN(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    await storage.revokeDoctorAccess(req.user!.id, doctorId);
    res.sendStatus(200);
  });

  app.get("/api/patients", requireAuth, async (req, res) => {
    if (!req.user!.isDoctor) {
      return res.status(403).json({ message: "Only doctors can view patients" });
    }

    const patients = await storage.getPatients(req.user!.id);
    res.json(patients.map(({ password, ...patient }) => patient));
  });

  // Medical History routes with doctor access check
  app.get("/api/medical-history/:userId?", requireAuth, async (req, res) => {
    const targetUserId = req.params.userId ? parseInt(req.params.userId) : req.user!.id;

    if (targetUserId !== req.user!.id && (!req.user!.isDoctor || !(await storage.checkDoctorAccess(targetUserId, req.user!.id)))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const history = await storage.getMedicalHistory(targetUserId);
    res.json(history);
  });

  // Vaccine routes with doctor access check
  app.get("/api/vaccines/:userId?", requireAuth, async (req, res) => {
    const targetUserId = req.params.userId ? parseInt(req.params.userId) : req.user!.id;

    if (targetUserId !== req.user!.id && (!req.user!.isDoctor || !(await storage.checkDoctorAccess(targetUserId, req.user!.id)))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const vaccines = await storage.getVaccines(targetUserId);
    res.json(vaccines);
  });

  // Family Member routes
  app.get("/api/family-members", requireAuth, async (req, res) => {
    const members = await storage.getFamilyMembers(req.user!.id);
    res.json(members);
  });

  app.post("/api/family-members", requireAuth, async (req, res) => {
    const validatedData = insertFamilyMemberSchema.parse(req.body);
    const member = await storage.addFamilyMember(req.user!.id, validatedData);
    res.status(201).json(member);
  });

  // Medical History routes
  app.post("/api/medical-history", requireAuth, async (req, res) => {
    const validatedData = insertMedicalHistorySchema.parse(req.body);
    const history = await storage.addMedicalHistory(req.user!.id, validatedData);
    res.status(201).json(history);
  });

  // Vaccine routes
  app.post("/api/vaccines", requireAuth, async (req, res) => {
    const validatedData = insertVaccineSchema.parse(req.body);
    const vaccine = await storage.addVaccine(req.user!.id, validatedData);
    res.status(201).json(vaccine);
  });

  const httpServer = createServer(app);
  return httpServer;
}