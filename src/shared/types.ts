import z from "zod";

export const CameraSchema = z.object({
  id: z.number(),
  name: z.string(),
  ip: z.string(),
  serial: z.string(),
  location: z.string(),
  store: z.string(),
  status: z.enum(['online', 'offline', 'aviso', 'erro', 'reparo']),
  channels_total: z.number().int(),
  channels_working: z.number().int(),
  channels_blackscreen: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Camera = z.infer<typeof CameraSchema>;

export interface CameraFormData {
  name: string;
  ip: string;
  serial: string;
  location: string;
  store: string;
  status: "online" | "offline" | "aviso" | "erro" | "reparo";
  channels_total: number;
  channels_working: number;
  channels_blackscreen: number;
}

export interface Channels {
  total: number;
  working: number;
  blackscreen: number;
}
