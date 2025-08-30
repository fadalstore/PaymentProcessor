import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: json("title").$type<{so: string; en: string; ar: string}>().notNull(),
  description: json("description").$type<{so: string; en: string; ar: string}>().notNull(),
  category: varchar("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.50"),
  duration: varchar("duration").notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("4.5"),
  image: text("image").notNull(),
  fileUrl: text("file_url").notNull(),
  curriculum: json("curriculum").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  phone: varchar("phone").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(), // evc, zaad, edahab
  status: varchar("status").notNull().default("pending"), // pending, completed, failed
  transactionId: varchar("transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: text("password").notNull(), // hashed password
  name: varchar("name").notNull(),
  phone: varchar("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  status: true,
  transactionId: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
