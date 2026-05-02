import { z } from "zod";
import { metadataSchema, sourceSchema } from "./common";

export const architectureComponentSchema = z.object({
  name: z.string().min(1),
  responsibility: z.string().default(""),
  technologies: z.array(z.string()).default([]),
  sources: z.array(sourceSchema).default([]),
});

export const architectureSchema = z.object({
  metadata: metadataSchema,
  overview: z.string().default(""),
  components: z.array(architectureComponentSchema).default([]),
  dataFlow: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
});

export type Architecture = z.infer<typeof architectureSchema>;
export type ArchitectureComponent = z.infer<typeof architectureComponentSchema>;
