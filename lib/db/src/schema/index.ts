import { pgTable, text, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const savedStrategiesTable = pgTable("saved_strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  ticker: text("ticker").notNull(),
  spotPrice: text("spot_price").notNull(),
  legs: jsonb("legs").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSavedStrategySchema = createInsertSchema(savedStrategiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSavedStrategy = z.infer<typeof insertSavedStrategySchema>;
export type SavedStrategyRow = typeof savedStrategiesTable.$inferSelect;
