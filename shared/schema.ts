import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  bloodType: text("blood_type"),
  isDoctor: boolean("is_doctor").default(false),
  licenseNumber: text("license_number"),
  specialization: text("specialization"),
  hospital: text("hospital"),
});

export const medicalHistory = pgTable("medical_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  condition: text("condition").notNull(),
  diagnosisDate: date("diagnosis_date").notNull(),
  notes: text("notes"),
  status: text("status").notNull(),
});

export const vaccines = pgTable("vaccines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  dateAdministered: date("date_administered").notNull(),
  provider: text("provider"),
  batchNumber: text("batch_number"),
  nextDueDate: date("next_due_date"),
});

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  hasAccess: boolean("has_access").default(false),
});

export const doctorAccess = pgTable("doctor_access", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  isActive: boolean("is_active").default(false),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // access_request, access_response
  relatedId: integer("related_id"), // doctorAccess id
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  dateOfBirth: true,
  gender: true,
  bloodType: true,
  isDoctor: true,
  licenseNumber: true,
  specialization: true,
  hospital: true,
});

export const insertDoctorSchema = insertUserSchema.extend({
  isDoctor: z.literal(true),
  licenseNumber: z.string().min(1, "License number is required"),
  specialization: z.string().min(1, "Specialization is required"),
  hospital: z.string().min(1, "Hospital is required"),
});

export const insertMedicalHistorySchema = createInsertSchema(medicalHistory).pick({
  condition: true,
  diagnosisDate: true,
  notes: true,
  status: true,
});

export const insertVaccineSchema = createInsertSchema(vaccines).pick({
  name: true,
  dateAdministered: true,
  provider: true,
  batchNumber: true,
  nextDueDate: true,
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).pick({
  name: true,
  relationship: true,
  dateOfBirth: true,
  hasAccess: true,
});

export const insertDoctorAccessSchema = createInsertSchema(doctorAccess).pick({
  doctorId: true,
  expiresAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  title: true,
  message: true,
  type: true,
  relatedId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type User = typeof users.$inferSelect;
export type MedicalHistory = typeof medicalHistory.$inferSelect;
export type Vaccine = typeof vaccines.$inferSelect;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type DoctorAccess = typeof doctorAccess.$inferSelect;
export type Notification = typeof notifications.$inferSelect;