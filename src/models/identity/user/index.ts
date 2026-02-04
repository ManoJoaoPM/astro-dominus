import { z } from "zod";

export type UserRole = "admin" | "operational" | "commercial";

export interface UserInterface {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: "active" | "inactive";
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const userFormSchema = z.object({
  name: z.string().min(2, { message: "Name must have at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().optional(),
  role: z.enum(["admin", "operational", "commercial"]).default("operational"),
  avatar: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active").optional(),
});
