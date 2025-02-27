import session from "express-session";
import connectPg from "connect-pg-simple";
import { User, InsertUser, MedicalHistory, Vaccine, FamilyMember } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, medicalHistory, vaccines, familyMembers } from "@shared/schema";

const PostgresSessionStore = connectPg(session);

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

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: db.client,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getMedicalHistory(userId: number): Promise<MedicalHistory[]> {
    return db.select().from(medicalHistory).where(eq(medicalHistory.userId, userId));
  }

  async addMedicalHistory(
    userId: number,
    history: Omit<MedicalHistory, "id" | "userId">,
  ): Promise<MedicalHistory> {
    const [newHistory] = await db
      .insert(medicalHistory)
      .values({ ...history, userId })
      .returning();
    return newHistory;
  }

  async getVaccines(userId: number): Promise<Vaccine[]> {
    return db.select().from(vaccines).where(eq(vaccines.userId, userId));
  }

  async addVaccine(
    userId: number,
    vaccine: Omit<Vaccine, "id" | "userId">,
  ): Promise<Vaccine> {
    const [newVaccine] = await db
      .insert(vaccines)
      .values({ ...vaccine, userId })
      .returning();
    return newVaccine;
  }

  async getFamilyMembers(userId: number): Promise<FamilyMember[]> {
    return db.select().from(familyMembers).where(eq(familyMembers.userId, userId));
  }

  async addFamilyMember(
    userId: number,
    member: Omit<FamilyMember, "id" | "userId">,
  ): Promise<FamilyMember> {
    const [newMember] = await db
      .insert(familyMembers)
      .values({ ...member, userId })
      .returning();
    return newMember;
  }
}

export const storage = new DatabaseStorage();