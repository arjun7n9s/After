import { z } from "zod";
import { isoDateSchema, sourceSchema } from "./common";

export const mediaItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["screenshot", "terminal", "diff", "video", "audio", "thumbnail"]),
  path: z.string().min(1),
  capturedAt: isoDateSchema,
  caption: z.string().default(""),
  sources: z.array(sourceSchema).default([]),
});

export const mediaSchema = z.array(mediaItemSchema).default([]);

export type MediaItem = z.infer<typeof mediaItemSchema>;
