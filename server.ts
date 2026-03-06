import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("broker.db");

// Initialize Database
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

  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    project_id INTEGER,
    role TEXT,
    content TEXT,
    type TEXT DEFAULT 'chat',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Mock Data Insertion
const mockUser = db.prepare("SELECT * FROM users WHERE email = ?").get("broker@example.com") as any;
if (true) { // Force update for demo
  let userId: number;
  if (!mockUser) {
    const info = db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("broker@example.com", "Gold Broker");
    userId = Number(info.lastInsertRowid);
  } else {
    userId = mockUser.id as number;
  }

  // Insert Mock Projects
  db.prepare("DELETE FROM follow_up_plans").run();
  db.prepare("DELETE FROM drill_records").run();
  db.prepare("DELETE FROM chat_history").run();
  db.prepare("DELETE FROM projects").run();
  const projects = [
    { name: "【优】芯动科技芯片制造5000平厂房", industry: "半导体", area: "5000 平", region: "苏州", type: "厂房", client_name: "张总", client_phone: "13800138001", stage: "房源匹配", remarks: "关注供电稳定性" },
    { name: "【良】优选食品消费品代工2000平仓库", industry: "食品消费品", area: "2000 平", region: "嘉兴", type: "仓库", client_name: "李经理", client_phone: "13900139002", stage: "夯实", remarks: "关注物流动线与冷链条件" },
    { name: "【优】恒能电池新能源10000平厂房", industry: "新能源", area: "10000 平", region: "常州", type: "厂房", client_name: "王工", client_phone: "13700137003", stage: "带看", remarks: "需高压扩容" },
    { name: "【良】大疆创新无人机3000平研发办公", industry: "智能制造", area: "3000 平", region: "深圳", type: "研发办公", client_name: "刘工", client_phone: "13600136004", stage: "未推进", remarks: "等待预算确认" },
    { name: "【优】宁德时代动力电池20000平厂房", industry: "新能源", area: "20000 平", region: "宁德", type: "厂房", client_name: "陈总", client_phone: "13500135005", stage: "签约", remarks: "合同条款收尾" },
    { name: "【优】比亚迪新能源汽车15000平厂房", industry: "新能源汽车", area: "15000 平", region: "合肥", type: "厂房", client_name: "周经理", client_phone: "13400134006", stage: "回款中", remarks: "按里程碑回款" },
    { name: "【良】华为技术通信设备8000平研发中心", industry: "通信设备", area: "8000 平", region: "东莞", type: "研发中心", client_name: "赵工", client_phone: "13300133007", stage: "回款完成", remarks: "进入复盘阶段" },
    { name: "【优】腾讯云云计算12000平数据中心", industry: "云计算", area: "12000 平", region: "天津", type: "数据中心", client_name: "马经理", client_phone: "13200132008", stage: "夯实", remarks: "补充机柜电力方案" },
    { name: "【良】阿里巴巴电商物流30000平物流园", industry: "电商物流", area: "30000 平", region: "杭州", type: "物流园", client_name: "蔡总", client_phone: "13100131009", stage: "签约", remarks: "履约节点确认" },
    { name: "【优】字节跳动AI算力6000平机房", industry: "AI算力", area: "6000 平", region: "上海", type: "机房", client_name: "孙经理", client_phone: "13000130010", stage: "房源匹配", remarks: "关注机房承重和散热" }
  ];

  for (const p of projects) {
    const pInfo = db.prepare(`
      INSERT INTO projects (user_id, name, industry, area, region, type, client_name, client_phone, stage, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, p.name, p.industry, p.area, p.region, p.type, p.client_name, p.client_phone, p.stage, p.remarks);
    
    // Insert a mock plan for each
    db.prepare(`
      INSERT INTO follow_up_plans (project_id, user_id, time, action, topic, goal)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(Number(pInfo.lastInsertRowid), userId, new Date(Date.now() + 86400000 * 2).toISOString(), "Call follow-up", "Confirm requirements", "Book site visit");
  }
}

function parseUserId(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeUser(user: any) {
  if (!user) return user;
  return {
    ...user,
    crm_bound: Boolean(user.crm_bound),
  };
}

async function startServer() {
  const app = express();
  const PORT = 3300;

  app.use((req, res, next) => {
    const originalWriteHead = res.writeHead.bind(res);
    res.writeHead = ((statusCode: number, ...args: any[]) => {
      const headerArg =
        args.length === 1 && typeof args[0] === "object"
          ? args[0]
          : args.length >= 2 && typeof args[1] === "object"
            ? args[1]
            : undefined;
      const headerContentType =
        (headerArg?.["Content-Type"] as string | undefined) ??
        (headerArg?.["content-type"] as string | undefined);
      const contentType = headerContentType ?? (res.getHeader("Content-Type") as string | undefined);
      if (typeof contentType === "string" && !/charset=/i.test(contentType)) {
        const shouldSetUtf8 =
          contentType.startsWith("text/") ||
          contentType.startsWith("application/javascript") ||
          contentType.startsWith("application/json");
        if (shouldSetUtf8) {
          const nextContentType = `${contentType}; charset=utf-8`;
          if (headerArg) {
            if (typeof headerArg["Content-Type"] === "string") {
              headerArg["Content-Type"] = nextContentType;
            } else if (typeof headerArg["content-type"] === "string") {
              headerArg["content-type"] = nextContentType;
            } else {
              headerArg["Content-Type"] = nextContentType;
            }
          } else {
            res.setHeader("Content-Type", nextContentType);
          }
        }
      }
      return originalWriteHead(statusCode, ...args);
    }) as typeof res.writeHead;
    next();
  });

  app.use(express.json());

  // --- API Routes ---

  // Auth (Mock for now, simple ID based)
  app.post("/api/auth/login", (req, res) => {
    const { email } = req.body;
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      const info = db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run(email, email.split('@')[0]);
      user = { id: info.lastInsertRowid, email, name: email.split('@')[0] };
    }
    res.json({ user: normalizeUser(user) });
  });

  app.post("/api/auth/bind-gtv", (req, res) => {
    const userId = parseUserId(req.body?.userId);
    const nextBound = req.body?.crm_bound ? 1 : 0;
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    db.prepare("UPDATE users SET crm_bound = ? WHERE id = ?").run(nextBound, userId);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    if (!user) {
      res.status(404).json({ error: "user not found" });
      return;
    }
    res.json({ user: normalizeUser(user) });
  });

  // Projects
  app.get("/api/projects", (req, res) => {
    const userId = req.query.userId;
    const projects = db.prepare("SELECT * FROM projects WHERE user_id = ?").all(userId);
    res.json(projects);
  });

  app.post("/api/projects", (req, res) => {
    const { user_id, name, industry, area, region, type, client_name, client_phone, stage, remarks } = req.body;
    const info = db.prepare(`
      INSERT INTO projects (user_id, name, industry, area, region, type, client_name, client_phone, stage, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, name, industry, area, region, type, client_name, client_phone, stage, remarks);
    res.json({ id: info.lastInsertRowid });
  });

  // Follow-up Plans
  app.get("/api/plans", (req, res) => {
    const userId = req.query.userId;
    const plans = db.prepare("SELECT * FROM follow_up_plans WHERE user_id = ? ORDER BY time ASC").all(userId);
    res.json(plans);
  });

  app.post("/api/plans", (req, res) => {
    const { project_id, user_id, time, action, topic, goal } = req.body;
    const info = db.prepare(`
      INSERT INTO follow_up_plans (project_id, user_id, time, action, topic, goal)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(project_id, user_id, time, action, topic, goal);
    res.json({ id: info.lastInsertRowid });
  });

  // Drill Records
  app.get("/api/drills", (req, res) => {
    const userId = req.query.userId;
    const drills = db.prepare("SELECT * FROM drill_records WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    res.json(drills);
  });

  app.post("/api/drills", (req, res) => {
    const { user_id, project_id, scenario_type, transcript, score, feedback } = req.body;
    const info = db.prepare(`
      INSERT INTO drill_records (user_id, project_id, scenario_type, transcript, score, feedback)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user_id, project_id, scenario_type, JSON.stringify(transcript), score, JSON.stringify(feedback));
    res.json({ id: info.lastInsertRowid });
  });

  // --- AI Proxy (DashScope / Bailian) ---
  app.post("/api/ai/chat", async (req, res) => {
    const { messages, jsonMode = false, systemInstruction } = req.body;
    try {
      const apiMessages: Array<{ role: string; content: string }> = [];
      if (systemInstruction) {
        apiMessages.push({ role: "system", content: systemInstruction });
      }
      apiMessages.push(...messages);

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
      const data = (await aiRes.json()) as any;
      res.json({ content: data.choices?.[0]?.message?.content || "" });
    } catch (err) {
      console.error("AI proxy error:", err);
      res.status(500).json({ content: "" });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

