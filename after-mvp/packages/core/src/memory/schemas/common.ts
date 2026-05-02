import { z } from "zod";

export const isoDateSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().date());

export const sourceSchema = z.object({
  path: z.string(),
  line: z.number().int().positive().optional(),
  note: z.string().optional(),
});

export const metadataSchema = z.object({
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  version: z.string().default("1.0.0"),
});

export type BrainMetadata = z.infer<typeof metadataSchema>;
export type BrainSource = z.infer<typeof sourceSchema>;
