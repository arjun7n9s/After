import { z } from "zod";
import { sourceSchema } from "./common";

export const entitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["package", "module", "component", "service", "command", "concept"]),
  description: z.string().default(""),
  sources: z.array(sourceSchema).default([]),
});

export const entitiesSchema = z.array(entitySchema).default([]);

export type Entity = z.infer<typeof entitySchema>;
