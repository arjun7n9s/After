import { z } from "zod";
import { isoDateSchema, sourceSchema } from "./common";

export const decisionSchema = z.object({
  id: z.string().min(1),
  date: isoDateSchema,
  title: z.string().min(1),
  context: z.string().default(""),
  decision: z.string().default(""),
  consequences: z.array(z.string()).default([]),
  sources: z.array(sourceSchema).default([]),
});

export const decisionsSchema = z.array(decisionSchema).default([]);

export type Decision = z.infer<typeof decisionSchema>;
