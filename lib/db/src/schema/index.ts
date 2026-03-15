import { pgTable, text, serial, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export * from "./auth";
import { usersTable } from "./auth";

export const savedStrategiesTable = pgTable("saved_strategies", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
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
