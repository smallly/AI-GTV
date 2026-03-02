export async function processNLU(text: string, context?: any) {
  const prompt = `你是一个AI助手的意图识别模块。请分析用户的输入并提取意图和参数，以JSON格式返回。

意图类型:
1. FOLLOW_UP_PLAN: 分析项目、制定计划、怎么跟进、制定拜访计划、生成跟进策略
2. SIMULATION_DRILL: 模拟演练、练习沟通
3. INFO_QUERY: 查询日程、查询客户、查询项目信息、搜索项目
4. MATCH_PROPERTY: 匹配房源、推荐载体、找房子、找厂房、找仓库
5. TASK_MGMT: 提醒、任务、待办
6. HELP: 帮助、怎么用

当前上下文: ${JSON.stringify(context || {})}

用户输入: "${text}"

请返回如下JSON格式:
{
  "intent": "意图类型",
  "params": {},
  "response": "如果是简单查询或帮助，直接返回回复文字；如果是复杂功能，返回null"
}`;

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        jsonMode: true,
      }),
    });
    const data = await response.json();
    return JSON.parse(data.content || '{}');
  } catch (error) {
    console.error('NLU Error:', error);
    return { intent: 'UNKNOWN', response: '抱歉，我遇到了一点技术问题。' };
  }
}
