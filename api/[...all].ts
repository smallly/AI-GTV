import dotenv from "dotenv";
import express from "express";
import Database from "better-sqlite3";

dotenv.config();

type GlobalState = typeof globalThis & {
  __brokerDb?: Database.Database;
  __brokerDbInitialized?: boolean;
};

const globalState = globalThis as GlobalState;
const dbFile = process.env.VERCEL ? "/tmp/broker.db" : "broker.db";
const db = globalState.__brokerDb ?? new Database(dbFile);
if (!globalState.__brokerDb) {
  globalState.__brokerDb = db;
}

function initDb() {
  if (globalState.__brokerDbInitialized) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      phone TEXT,
      crm_bound INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      industry TEXT,
      area TEXT,
      region TEXT,
      type TEXT,
      client_name TEXT,
      client_phone TEXT,
      stage TEXT,
      last_contact TEXT,
      remarks TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS follow_up_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      user_id INTEGER,
      time TEXT,
      action TEXT,
      topic TEXT,
      goal TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS drill_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      project_id INTEGER,
      scenario_type TEXT,
      transcript TEXT,
      score INTEGER,
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  const mockUser = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get("broker@example.com") as { id: number } | undefined;

  let userId = mockUser?.id;
  if (!userId) {
    const info = db
      .prepare("INSERT INTO users (email, name) VALUES (?, ?)")
      .run("broker@example.com", "Demo Broker");
    userId = Number(info.lastInsertRowid);
  }

  const existingProjects = db
    .prepare("SELECT COUNT(1) as count FROM projects WHERE user_id = ?")
    .get(userId) as { count: number };

  if (existingProjects.count === 0) {
    const samples = [
      {
        name: "EV Battery Plant Expansion",
        industry: "New Energy",
        area: "12000sqm",
        region: "Suzhou",
        type: "Factory",
        clientName: "Zhang",
        clientPhone: "13800138000",
        stage: "matching",
        remarks: "Power supply stability required",
      },
      {
        name: "Cold-Chain Warehouse",
        industry: "Logistics",
        area: "8000sqm",
        region: "Shanghai",
        type: "Warehouse",
        clientName: "Li",
        clientPhone: "13900139000",
        stage: "site-visit",
        remarks: "Close to expressway preferred",
      },
      {
        name: "Semiconductor R&D Center",
        industry: "Semiconductor",
        area: "5000sqm",
        region: "Shenzhen",
        type: "R&D",
        clientName: "Wang",
        clientPhone: "13700137000",
        stage: "contract",
        remarks: "Cleanroom retrofit planned",
      },
    ];

    for (const sample of samples) {
      const projectInfo = db
        .prepare(
          `
            INSERT INTO projects (
              user_id, name, industry, area, region, type, client_name, client_phone, stage, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
        )
        .run(
          userId,
          sample.name,
          sample.industry,
          sample.area,
          sample.region,
          sample.type,
          sample.clientName,
          sample.clientPhone,
          sample.stage,
          sample.remarks
        );

      db.prepare(
        `
          INSERT INTO follow_up_plans (project_id, user_id, time, action, topic, goal)
          VALUES (?, ?, ?, ?, ?, ?)
        `
      ).run(
        Number(projectInfo.lastInsertRowid),
        userId,
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        "Call",
        "Needs confirmation",
        "Schedule next meeting"
      );
    }
  }

  globalState.__brokerDbInitialized = true;
}

function parseUserId(value: unknown): number {
  const id = Number(value);
  return Number.isFinite(id) ? id : 0;
}

initDb();

const app = express();
app.use(express.json({ limit: "2mb" }));

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body?.email ?? "").trim();
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | {
        id: number;
        email: string;
        name: string;
        phone: string | null;
        crm_bound: number;
      }
    | undefined;

  if (!user) {
    const info = db
      .prepare("INSERT INTO users (email, name) VALUES (?, ?)")
      .run(email, email.split("@")[0] || "user");
    user = {
      id: Number(info.lastInsertRowid),
      email,
      name: email.split("@")[0] || "user",
      phone: null,
      crm_bound: 0,
    };
  }

  res.json({ user });
});

app.get("/api/projects", (req, res) => {
  const userId = parseUserId(req.query.userId);
  const projects = db
    .prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY id DESC")
    .all(userId);
  res.json(projects);
});

app.post("/api/projects", (req, res) => {
  const {
    user_id,
    name,
    industry,
    area,
    region,
    type,
    client_name,
    client_phone,
    stage,
    remarks,
  } = req.body ?? {};

  const info = db
    .prepare(
      `
        INSERT INTO projects (user_id, name, industry, area, region, type, client_name, client_phone, stage, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      parseUserId(user_id),
      name ?? "",
      industry ?? "",
      area ?? "",
      region ?? "",
      type ?? "",
      client_name ?? "",
      client_phone ?? "",
      stage ?? "",
      remarks ?? ""
    );

  res.json({ id: Number(info.lastInsertRowid) });
});

app.get("/api/plans", (req, res) => {
  const userId = parseUserId(req.query.userId);
  const plans = db
    .prepare("SELECT * FROM follow_up_plans WHERE user_id = ? ORDER BY time ASC")
    .all(userId);
  res.json(plans);
});

app.post("/api/plans", (req, res) => {
  const { project_id, user_id, time, action, topic, goal } = req.body ?? {};
  const info = db
    .prepare(
      `
        INSERT INTO follow_up_plans (project_id, user_id, time, action, topic, goal)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      parseUserId(project_id),
      parseUserId(user_id),
      String(time ?? new Date().toISOString()),
      String(action ?? ""),
      String(topic ?? ""),
      String(goal ?? "")
    );
  res.json({ id: Number(info.lastInsertRowid) });
});

app.get("/api/drills", (req, res) => {
  const userId = parseUserId(req.query.userId);
  const drills = db
    .prepare("SELECT * FROM drill_records WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId);
  res.json(drills);
});

app.post("/api/drills", (req, res) => {
  const { user_id, project_id, scenario_type, transcript, score, feedback } = req.body ?? {};
  const info = db
    .prepare(
      `
        INSERT INTO drill_records (user_id, project_id, scenario_type, transcript, score, feedback)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      parseUserId(user_id),
      parseUserId(project_id),
      String(scenario_type ?? ""),
      JSON.stringify(transcript ?? []),
      Number(score ?? 0),
      JSON.stringify(feedback ?? {})
    );
  res.json({ id: Number(info.lastInsertRowid) });
});

app.post("/api/ai/chat", async (req, res) => {
  const { messages, jsonMode = false, systemInstruction } = req.body ?? {};

  try {
    const apiMessages: Array<{ role: string; content: string }> = [];
    if (systemInstruction) {
      apiMessages.push({ role: "system", content: String(systemInstruction) });
    }
    if (Array.isArray(messages)) {
      for (const message of messages) {
        if (!message) continue;
        apiMessages.push({
          role: String(message.role ?? "user"),
          content: String(message.content ?? ""),
        });
      }
    }

    const aiRes = await fetch(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen-plus",
          messages: apiMessages,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
      }
    );

    const data = (await aiRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    res.json({ content: data.choices?.[0]?.message?.content || "" });
  } catch (error) {
    console.error("AI proxy error:", error);
    res.status(500).json({ content: "" });
  }
});

export default app;
