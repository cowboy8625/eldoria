import { z } from "zod";
import { WebSocket } from "ws";

export const PlayerSchema = z.object({
  socket: z.instanceof(WebSocket),
});
export type Player = z.infer<typeof PlayerSchema>;

export const StatsSchema = z.object({
  health: z.number(),
});
export type Stats = z.infer<typeof StatsSchema>;

export const LocationSchema = z.object({
  region: z.string(),
  room: z.string(),
});
export type Location = z.infer<typeof LocationSchema>;
