import { Context } from "@netlify/functions";
import { Hono } from "hono";
import { handle } from "hono/netlify";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

// Simular o ambiente D1 para desenvolvimento local
interface MockDB {
  prepare: (query: string) => {
    bind: (...params: any[]) => {
      run: () => Promise<{ meta: { last_row_id: number } }>;
      all: () => Promise<{ results: any[] }>;
      first: () => Promise<any>;
    };
  };
}

const createMockDB = (): MockDB => {
  // Em produção, você deve configurar um banco de dados real
  // Como PostgreSQL, MySQL ou outro banco compatível com Netlify
  const mockData: any[] = [];
  let nextId = 1;

  return {
    prepare: (query: string) => ({
      bind: (...params: any[]) => ({
        run: async () => {
          if (query.includes("INSERT")) {
            const id = nextId++;
            const newItem = { id, ...params.slice(0, -1) };
            mockData.push(newItem);
            return { meta: { last_row_id: id } };
          }
          if (query.includes("UPDATE")) {
            const id = params[params.length - 1];
            const index = mockData.findIndex(item => item.id === id);
            if (index >= 0) {
              Object.assign(mockData[index], params.slice(0, -1));
            }
            return { meta: { last_row_id: id } };
          }
          if (query.includes("DELETE")) {
            const id = params[0];
            const index = mockData.findIndex(item => item.id === id);
            if (index >= 0) {
              mockData.splice(index, 1);
            }
            return { meta: { last_row_id: id } };
          }
          return { meta: { last_row_id: 0 } };
        },
        all: async () => ({ results: mockData }),
        first: async () => {
          const id = params[0];
          return mockData.find(item => item.id === id) || null;
        }
      })
    })
  };
};

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

const app = new Hono();

// Middleware para adicionar o mock DB ao contexto
app.use("*", async (c, next) => {
  // Em produção, configure aqui sua conexão com banco real
  c.set("DB", createMockDB());
  await next();
});

// Get all cameras
app.get("/api/cameras", async (c) => {
  try {
    const db = c.get("DB") as MockDB;
    const cameras = await db.prepare("SELECT * FROM cameras ORDER BY created_at DESC").bind().all();
    return c.json({ cameras: cameras.results });
  } catch (error) {
    console.error("Error fetching cameras:", error);
    return c.json({ error: "Failed to fetch cameras" }, 500);
  }
});

// Add new camera
app.post("/api/cameras", zValidator("json", CameraSchema), async (c) => {
  try {
    const db = c.get("DB") as MockDB;
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
    console.error("Error creating camera:", error);
    return c.json({ error: "Failed to create camera" }, 500);
  }
});

// Update camera
app.put("/api/cameras/:id", zValidator("json", UpdateCameraSchema), async (c) => {
  try {
    const db = c.get("DB") as MockDB;
    const id = parseInt(c.req.param("id"));
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
    console.error("Error updating camera:", error);
    return c.json({ error: "Failed to update camera" }, 500);
  }
});

// Delete camera
app.delete("/api/cameras/:id", async (c) => {
  try {
    const db = c.get("DB") as MockDB;
    const id = parseInt(c.req.param("id"));
    
    await db.prepare("DELETE FROM cameras WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting camera:", error);
    return c.json({ error: "Failed to delete camera" }, 500);
  }
});

export const handler = handle(app);
