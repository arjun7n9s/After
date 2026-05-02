import { z } from "zod";
import { metadataSchema } from "./common";

export const overviewSchema = z.object({
  metadata: metadataSchema,
  projectName: z.string().min(1),
  summary: z.string().default(""),
  repositoryPath: z.string(),
  primaryLanguage: z.string().optional(),
  frameworks: z.array(z.string()).default([]),
  status: z.string().default("initialized"),
});

export type Overview = z.infer<typeof overviewSchema>;
