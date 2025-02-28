import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertMedicalHistorySchema, 
  insertVaccineSchema, 
  insertFamilyMemberSchema,
  insertDoctorSchema,
  insertDoctorAccessSchema,
  insertNotificationSchema
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

  app.get("/api/doctors/search/:licenseNumber", requireAuth, async (req, res) => {
    const doctor = await storage.getUserByLicenseNumber(req.params.licenseNumber);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    const { password, ...doctorData } = doctor;
    res.json(doctorData);
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
      return res.status(403).json({ message: "Doctors cannot request access" });
    }

    const doctor = await storage.getUserByLicenseNumber(req.body.licenseNumber);
    if (!doctor?.isDoctor) {
      return res.status(400).json({ message: "Invalid doctor license number" });
    }

    const access = await storage.requestDoctorAccess(
      req.user!.id,
      doctor.id,
      req.body.expiresAt
    );

    // Create notification for doctor
    await storage.addNotification(doctor.id, {
      title: "New Access Request",
      message: `${req.user!.fullName} has requested access to their health records`,
      type: "access_request",
      relatedId: access.id
    });

    res.status(201).json(access);
  });

  app.post("/api/doctor-access/:accessId/respond", requireAuth, async (req, res) => {
    if (!req.user!.isDoctor) {
      return res.status(403).json({ message: "Only doctors can respond to access requests" });
    }

    const accessId = parseInt(req.params.accessId);
    const access = await storage.getDoctorAccessById(accessId);

    if (!access || access.doctorId !== req.user!.id) {
      return res.status(404).json({ message: "Access request not found" });
    }

    const updatedAccess = await storage.respondToDoctorAccess(accessId, req.body.accepted);

    // Create notification for patient
    const patient = await storage.getUser(access.patientId);
    if (patient) {
      await storage.addNotification(patient.id, {
        title: "Access Request Response",
        message: `Dr. ${req.user!.fullName} has ${req.body.accepted ? 'accepted' : 'rejected'} your access request`,
        type: "access_response",
        relatedId: access.id
      });
    }

    res.json(updatedAccess);
  });

  app.get("/api/doctor-access/requests", requireAuth, async (req, res) => {
    if (!req.user!.isDoctor) {
      return res.status(403).json({ message: "Only doctors can view access requests" });
    }

    const requests = await storage.getDoctorAccessRequests(req.user!.id);
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const patient = await storage.getUser(request.patientId);
        return {
          ...request,
          patient: patient ? { 
            id: patient.id,
            fullName: patient.fullName,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            bloodType: patient.bloodType
          } : null
        };
      })
    );

    res.json(requestsWithUsers);
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const notifications = await storage.getNotifications(req.user!.id);
    res.json(notifications);
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    await storage.markNotificationAsRead(parseInt(req.params.id));
    res.sendStatus(200);
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

  app.post("/api/medical-history", requireAuth, async (req, res) => {
    const validatedData = insertMedicalHistorySchema.parse(req.body);
    const history = await storage.addMedicalHistory(req.user!.id, validatedData);
    res.status(201).json(history);
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