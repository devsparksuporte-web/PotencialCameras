import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const CameraSchema = z.object({
  name: z.string().min(1),
  ip: z.string().min(1),
  serial: z.string().min(1),
  location: z.string().min(1),
  store: z.string().min(1),
  status: z.enum(['online', 'offline', 'aviso', 'erro', 'reparo']),
  channels_total: z.number().int().min(0),
  channels_working: z.number().int().min(0),
  channels_blackscreen: z.number().int().min(0),
});

const UpdateCameraSchema = CameraSchema.partial();

const app = new Hono<{ Bindings: Env }>();

// Get all cameras
app.get("/api/cameras", async (c) => {
  try {
    const db = c.env.DB;
    const cameras = await db.prepare("SELECT * FROM cameras ORDER BY created_at DESC").all();
    return c.json({ cameras: cameras.results });
  } catch (error) {
    return c.json({ error: "Failed to fetch cameras" }, 500);
  }
});

// Add new camera
app.post("/api/cameras", zValidator("json", CameraSchema), async (c) => {
  try {
    const db = c.env.DB;
    const data = c.req.valid("json");
    
    const result = await db.prepare(`
      INSERT INTO cameras (name, ip, serial, location, store, status, channels_total, channels_working, channels_blackscreen, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      data.name,
      data.ip,
      data.serial,
      data.location,
      data.store,
      data.status,
      data.channels_total,
      data.channels_working,
      data.channels_blackscreen
    ).run();

    const camera = await db.prepare("SELECT * FROM cameras WHERE id = ?").bind(result.meta.last_row_id).first();
    return c.json({ camera });
  } catch (error) {
    return c.json({ error: "Failed to create camera" }, 500);
  }
});

// Update camera
app.put("/api/cameras/:id", zValidator("json", UpdateCameraSchema), async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    const updateFields = [];
    const values = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (updateFields.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }
    
    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    await db.prepare(`UPDATE cameras SET ${updateFields.join(", ")} WHERE id = ?`).bind(...values).run();
    
    const camera = await db.prepare("SELECT * FROM cameras WHERE id = ?").bind(id).first();
    return c.json({ camera });
  } catch (error) {
    return c.json({ error: "Failed to update camera" }, 500);
  }
});

// Delete camera
app.delete("/api/cameras/:id", async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param("id");
    
    await db.prepare("DELETE FROM cameras WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete camera" }, 500);
  }
});

export default app;
