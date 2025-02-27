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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  dateOfBirth: true,
  gender: true,
  bloodType: true,
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type MedicalHistory = typeof medicalHistory.$inferSelect;
export type Vaccine = typeof vaccines.$inferSelect;
export type FamilyMember = typeof familyMembers.$inferSelect;
