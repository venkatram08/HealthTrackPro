import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertMedicalHistorySchema, insertVaccineSchema, insertFamilyMemberSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Check authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Medical History routes
  app.get("/api/medical-history", requireAuth, async (req, res) => {
    const history = await storage.getMedicalHistory(req.user!.id);
    res.json(history);
  });

  app.post("/api/medical-history", requireAuth, async (req, res) => {
    const validatedData = insertMedicalHistorySchema.parse(req.body);
    const history = await storage.addMedicalHistory(req.user!.id, validatedData);
    res.status(201).json(history);
  });

  // Vaccine routes
  app.get("/api/vaccines", requireAuth, async (req, res) => {
    const vaccines = await storage.getVaccines(req.user!.id);
    res.json(vaccines);
  });

  app.post("/api/vaccines", requireAuth, async (req, res) => {
    const validatedData = insertVaccineSchema.parse(req.body);
    const vaccine = await storage.addVaccine(req.user!.id, validatedData);
    res.status(201).json(vaccine);
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

  const httpServer = createServer(app);
  return httpServer;
}
