import session from "express-session";
import createMemoryStore from "memorystore";
import { User, InsertUser, MedicalHistory, Vaccine, FamilyMember, DoctorAccess } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Medical History operations
  getMedicalHistory(userId: number): Promise<MedicalHistory[]>;
  addMedicalHistory(userId: number, history: Omit<MedicalHistory, "id" | "userId">): Promise<MedicalHistory>;

  // Vaccine operations
  getVaccines(userId: number): Promise<Vaccine[]>;
  addVaccine(userId: number, vaccine: Omit<Vaccine, "id" | "userId">): Promise<Vaccine>;

  // Family Member operations
  getFamilyMembers(userId: number): Promise<FamilyMember[]>;
  addFamilyMember(userId: number, member: Omit<FamilyMember, "id" | "userId">): Promise<FamilyMember>;

  // Doctor Access operations
  getDoctors(): Promise<User[]>;
  getPatients(doctorId: number): Promise<User[]>;
  grantDoctorAccess(patientId: number, doctorId: number, expiresAt?: Date): Promise<DoctorAccess>;
  revokeDoctorAccess(patientId: number, doctorId: number): Promise<void>;
  checkDoctorAccess(patientId: number, doctorId: number): Promise<boolean>;

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private medicalHistories: Map<number, MedicalHistory[]>;
  private vaccines: Map<number, Vaccine[]>;
  private familyMembers: Map<number, FamilyMember[]>;
  private doctorAccess: Map<string, DoctorAccess>;
  private currentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.medicalHistories = new Map();
    this.vaccines = new Map();
    this.familyMembers = new Map();
    this.doctorAccess = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMedicalHistory(userId: number): Promise<MedicalHistory[]> {
    return this.medicalHistories.get(userId) || [];
  }

  async addMedicalHistory(
    userId: number,
    history: Omit<MedicalHistory, "id" | "userId">,
  ): Promise<MedicalHistory> {
    const id = this.currentId++;
    const newHistory: MedicalHistory = { ...history, id, userId };

    const existingHistories = this.medicalHistories.get(userId) || [];
    this.medicalHistories.set(userId, [...existingHistories, newHistory]);

    return newHistory;
  }

  async getVaccines(userId: number): Promise<Vaccine[]> {
    return this.vaccines.get(userId) || [];
  }

  async addVaccine(
    userId: number,
    vaccine: Omit<Vaccine, "id" | "userId">,
  ): Promise<Vaccine> {
    const id = this.currentId++;
    const newVaccine: Vaccine = { ...vaccine, id, userId };

    const existingVaccines = this.vaccines.get(userId) || [];
    this.vaccines.set(userId, [...existingVaccines, newVaccine]);

    return newVaccine;
  }

  async getFamilyMembers(userId: number): Promise<FamilyMember[]> {
    return this.familyMembers.get(userId) || [];
  }

  async addFamilyMember(
    userId: number,
    member: Omit<FamilyMember, "id" | "userId">,
  ): Promise<FamilyMember> {
    const id = this.currentId++;
    const newMember: FamilyMember = { ...member, id, userId };

    const existingMembers = this.familyMembers.get(userId) || [];
    this.familyMembers.set(userId, [...existingMembers, newMember]);

    return newMember;
  }

  async getDoctors(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isDoctor);
  }

  async getPatients(doctorId: number): Promise<User[]> {
    const activeAccess = Array.from(this.doctorAccess.values())
      .filter(access => 
        access.doctorId === doctorId && 
        access.isActive && 
        (!access.expiresAt || new Date(access.expiresAt) > new Date())
      );

    return await Promise.all(
      activeAccess.map(access => this.getUser(access.patientId))
    ).then(patients => patients.filter((patient): patient is User => patient !== undefined));
  }

  async grantDoctorAccess(patientId: number, doctorId: number, expiresAt?: Date): Promise<DoctorAccess> {
    const id = this.currentId++;
    const access: DoctorAccess = {
      id,
      patientId,
      doctorId,
      grantedAt: new Date(),
      expiresAt: expiresAt,
      isActive: true,
    };

    const key = `${patientId}-${doctorId}`;
    this.doctorAccess.set(key, access);
    return access;
  }

  async revokeDoctorAccess(patientId: number, doctorId: number): Promise<void> {
    const key = `${patientId}-${doctorId}`;
    const access = this.doctorAccess.get(key);
    if (access) {
      access.isActive = false;
      this.doctorAccess.set(key, access);
    }
  }

  async checkDoctorAccess(patientId: number, doctorId: number): Promise<boolean> {
    const key = `${patientId}-${doctorId}`;
    const access = this.doctorAccess.get(key);

    return !!(
      access?.isActive && 
      (!access.expiresAt || new Date(access.expiresAt) > new Date())
    );
  }
}

export const storage = new MemStorage();