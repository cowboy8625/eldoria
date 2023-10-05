import { z } from 'zod';
import { WebSocket } from 'ws';

export const PlayerSchema = z.object({
  socket: z.instanceof(WebSocket),
});
export type Player = z.infer<typeof PlayerSchema>;

export const StatsSchema = z.object({
  health: z.number(),
});
export type Stats = z.infer<typeof StatsSchema>;
