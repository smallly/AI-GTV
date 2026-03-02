async function callAI(
  messages: Array<{ role: string; content: string }>,
  jsonMode = false,
  systemInstruction?: string
): Promise<string> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, jsonMode, systemInstruction }),
  });

  const data = await response.json();
  return data.content || '';
}

function parseJsonOrDefault<T>(content: string, fallback: T): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export interface ProjectInfo {
  name: string;
  industry: string;
  area: string;
  region: string;
  type: string;
  clientName: string;
  stage: string;
  remarks?: string;
}

export interface FollowUpPlan {
  time: string;
  action: string;
  topic: string;
  goal: string;
}

export interface AnalysisReport {
  industryAnalysis: string;
  projectAnalysis: string;
  plans: FollowUpPlan[];
  strategy: string;
}

export async function analyzeProject(project: ProjectInfo): Promise<AnalysisReport> {
  const prompt = `You are an industrial real-estate assistant. Analyze this project and return JSON only.
Project:
- Name: ${project.name}
- Industry: ${project.industry}
- Area: ${project.area}
- Region: ${project.region}
- Type: ${project.type}
- Stage: ${project.stage}
- Remarks: ${project.remarks || 'N/A'}

Return schema:
{
  "industryAnalysis": "string",
  "projectAnalysis": "string",
  "plans": [
    {"time": "string", "action": "string", "topic": "string", "goal": "string"},
    {"time": "string", "action": "string", "topic": "string", "goal": "string"},
    {"time": "string", "action": "string", "topic": "string", "goal": "string"}
  ],
  "strategy": "string"
}`;

  const fallback: AnalysisReport = {
    industryAnalysis: `${project.industry}行业客户通常关注选址效率、运营成本和交付周期。`,
    projectAnalysis: `项目目前处于${project.stage}阶段，建议围绕${project.region}与${project.area}需求推进。`,
    plans: [
      { time: '近期', action: '电话沟通', topic: '需求确认', goal: '明确关键指标' },
      { time: '中期', action: '实地带看', topic: '园区配套', goal: '完成方案对比' },
      { time: '后续', action: '商务推进', topic: '条款沟通', goal: '推动签约决策' },
    ],
    strategy: '先需求澄清，再样本对比，最后聚焦决策人推进。',
  };

  try {
    const content = await callAI([{ role: 'user', content: prompt }], true);
    return parseJsonOrDefault(content || '{}', fallback);
  } catch (error) {
    console.error('Analysis Error:', error);
    return fallback;
  }
}

export async function getDrillFeedback(
  transcript: { role: string; content: string }[],
  project?: ProjectInfo
) {
  const prompt = `You are a sales coach. Evaluate the conversation and return JSON only.
Context: ${project ? JSON.stringify(project) : 'general drill'}
Transcript:\n${transcript.map((t) => `${t.role}: ${t.content}`).join('\n')}

Return schema:
{
  "score": 85,
  "advantages": ["..."],
  "improvements": ["..."],
  "topicCoverage": [{"topic": "...", "status": "covered"}],
  "objectionHandling": "...",
  "skills": {"questioning": 80, "information": 75, "speed": 70, "push": 85},
  "nextSteps": ["..."]
}`;

  const fallback = {
    score: 80,
    advantages: ['沟通节奏稳定', '需求确认较完整'],
    improvements: ['加强异议处理', '增加收口动作'],
    topicCoverage: [{ topic: '客户需求', status: 'covered' }],
    objectionHandling: '可进一步量化成本与时效对比。',
    skills: { questioning: 80, information: 78, speed: 75, push: 76 },
    nextSteps: ['整理复盘要点', '准备下一轮跟进话术'],
  };

  try {
    const content = await callAI([{ role: 'user', content: prompt }], true);
    return parseJsonOrDefault(content || '{}', fallback);
  } catch (error) {
    console.error('Drill Feedback Error:', error);
    return fallback;
  }
}

export async function getTodayVisitPlan(projects: {
  name: string;
  industry: string;
  area: string;
  region: string;
  type: string;
  client_name: string;
  stage: string;
  remarks?: string;
}[]): Promise<string> {
  const items = projects.slice(0, 8);
  if (items.length === 0) {
    return '当前暂无可用项目，请先添加项目后再生成拜访计划。';
  }

  const escapeCell = (value: string) => String(value || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

  const buildFallback = () => {
    const getTaskType = (stage: string) => {
      if (stage.includes('房源匹配') || stage.includes('未推进')) return '高意向带看';
      if (stage.includes('带看')) return '方案汇报';
      if (stage.includes('签约')) return '签约推进';
      if (stage.includes('回款')) return '关系维护';
      return '深度洽谈';
    };

    const getPriority = (stage: string, index: number) => {
      if (stage.includes('房源匹配') || stage.includes('带看') || stage.includes('签约')) return '高';
      if (index <= 1) return '高';
      return '中';
    };

    const rowLines = items.map((p, idx) => {
      const priority = getPriority(p.stage, idx);
      const taskType = getTaskType(p.stage);
      const goal = stageToGoal(p.stage);
      const action = stageToAction(p.stage, taskType);
      return `| ${priority} | ${escapeCell(p.name)} | ${taskType} | ${goal} | ${escapeCell(action)} |`;
    });

    return [
      '## 开场分析',
      `你今天有 ${items.length} 个在跟进项目，建议优先推进高意向与临近签约项目，执行节奏采用“先推进结果，再补充维护”的顺序。`,
      '',
      '## 📋 今日拜访计划表',
      '| 优先级 | 项目 | 任务类型 | 核心目标 | 执行要点 |',
      '| --- | --- | --- | --- | --- |',
      ...rowLines,
      '',
      '## 💡 加分项建议',
      '1. 每次拜访结尾都明确“下一步动作 + 时间点 + 责任人”。',
      '2. 带看前提前准备 2 套可替代方案，降低客户决策阻力。',
      '3. 对关键项目做“异议预案清单”，现场直接闭环核心疑虑。',
      '',
      '## 🎒 拜访随身清单',
      '- 目标项目参数表与竞品对比页',
      '- 园区配套与交通动线图',
      '- 关键条款模板（租期、免租期、交付条件）',
      '- 拜访纪要模板（便于会后 30 分钟内发送）',
      '',
      '## 激励结语',
      '今天的目标不是“多跑”，而是“每次拜访都推动一个实质节点”。你离签约只差几次高质量推进。',
    ].join('\n');
  };

  const stageToGoal = (stage: string) => {
    if (stage.includes('签约')) return '锁定签约节点';
    if (stage.includes('回款')) return '保障回款节奏';
    if (stage.includes('带看')) return '推进客户决策';
    if (stage.includes('房源匹配')) return '确认选址标准';
    return '明确合作路径';
  };

  const stageToAction = (stage: string, taskType: string) => {
    if (stage.includes('签约')) return '对齐商务条款与法务资料，明确签约时间窗口。';
    if (stage.includes('回款')) return '同步交付里程碑与付款节点，提前处理潜在异议。';
    if (stage.includes('带看')) return '围绕能耗、消防、承重与交通进行现场验证。';
    if (taskType === '高意向带看') return '确认硬性指标，安排1-2套备选方案对比。';
    return '聚焦决策链与预算边界，锁定下次会谈目标。';
  };

  const prompt = `你是资深产业地产经纪人教练。请基于项目列表生成“今日拜访计划”，输出中文 Markdown。

必须严格包含并按顺序输出以下 5 个部分标题：
1) ## 开场分析
2) ## 📋 今日拜访计划表
3) ## 💡 加分项建议
4) ## 🎒 拜访随身清单
5) ## 激励结语

其中“今日拜访计划表”必须是 Markdown 表格，列为：
| 优先级 | 项目 | 任务类型 | 核心目标 | 执行要点 |

要求：
- 结合每个项目当前阶段(stage)给出优先级（高/中/低）
- 建议务实、可执行、偏销售推进
- 不要输出 JSON，不要省略任何一个标题

项目列表：
${JSON.stringify(items, null, 2)}`;

  try {
    const content = await callAI([{ role: 'user', content: prompt }], false);
    return content?.trim() ? content : buildFallback();
  } catch (error) {
    console.error('Today Visit Plan Error:', error);
    return buildFallback();
  }
}

export async function getChatResponse(
  messages: { role: string; content: string }[],
  isDrill = false,
  project?: ProjectInfo
) {
  const systemInstruction = isDrill
    ? `你是一个正在选址的客户决策人。基于以下项目背景进行模拟演练：${JSON.stringify(project || {})}。请真实提出问题和异议，保持对话简洁。`
    : '你是资深产业地产经纪人助手，回答要专业、简洁、可执行。';

  try {
    const apiMessages = messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));
    return await callAI(apiMessages, false, systemInstruction);
  } catch (error) {
    console.error('Chat AI Error:', error);
    return '抱歉，AI 暂时无法响应，请稍后再试。';
  }
}
