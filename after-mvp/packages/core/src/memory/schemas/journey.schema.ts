import { z } from "zod";
import { isoDateSchema, sourceSchema } from "./common";

export const journeyEntrySchema = z.object({
  id: z.string().min(1),
  timestamp: isoDateSchema,
  kind: z.enum(["milestone", "capture", "decision", "debugging", "note"]),
  title: z.string().min(1),
  narrative: z.string().default(""),
  sources: z.array(sourceSchema).default([]),
});

export const journeySchema = z.array(journeyEntrySchema).default([]);

export type JourneyEntry = z.infer<typeof journeyEntrySchema>;
