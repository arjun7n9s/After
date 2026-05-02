import { z } from "zod";
import { metadataSchema } from "./common";

export const intentSchema = z.object({
  metadata: metadataSchema,
  problem: z.string().default(""),
  audience: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  nonGoals: z.array(z.string()).default([]),
  successCriteria: z.array(z.string()).default([]),
});

export type Intent = z.infer<typeof intentSchema>;
