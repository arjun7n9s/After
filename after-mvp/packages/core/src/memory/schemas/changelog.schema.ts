import { z } from "zod";
import { isoDateSchema, sourceSchema } from "./common";

export const changeEntrySchema = z.object({
  id: z.string().min(1),
  date: isoDateSchema,
  type: z.enum(["added", "changed", "fixed", "removed", "documented"]),
  summary: z.string().min(1),
  details: z.string().default(""),
  sources: z.array(sourceSchema).default([]),
});

export const changelogSchema = z.array(changeEntrySchema).default([]);

export type ChangeEntry = z.infer<typeof changeEntrySchema>;
