# 🤖 AI 旅行规划助手

这是一个基于多 Agent 协作的智能旅行规划系统，演示了现代 AI Agent 架构和设计模式。

## Notice1: 使用时记得填写自己的Api Key.
- src\tools\index.ts 中 qweatherApiKey 变量(和风天气)
- src\lib\fetcher.ts 中 apiKey 变量(阿里云OpenAI)


## Notice2: 本项目为[《前端视角下认识AI Agent》](https://juejin.cn/post/7522476555774066703#comment)配套的演示项目, 代码或文档中均存在不完善之处, 请谅解.

## ✨ 功能特色

### 🧠 多 Agent 协作
- **AnalyzerAgent（需求分析）**：分析用户输入，提取旅行需求
- **PlannerAgent（行程规划）**：制定详细的多日行程
- **WeatherAgent（天气信息）**：获取天气预报并分析影响
- **FormatterAgent（格式整合）**：整合所有信息并格式化输出

### 🏗️ Agent 架构演示
- **ReAct 模式**：思考-行动-观察的认知架构
- **Plan & Execute 模式**：先规划后执行的分层架构
- **Function Call**：基于 OpenAI 接口的工具调用
- **Memory 系统**：基于 IndexedDB 的持久化记忆
- **MCP 协议**：模拟 Model Context Protocol 标准

### 💻 技术栈
- **前端**：Vite + React + TypeScript
- **样式**：Tailwind CSS + Shadcn/UI 风格
- **AI 服务**：阿里云 OpenAI 兼容接口
- **状态管理**：React Hook + 本地状态
- **数据存储**：IndexedDB（Memory 系统）

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- pnpm >= 7

### 安装依赖
\`\`\`bash
cd travel-agent-ui
pnpm install
\`\`\`

### 启动开发服务器
\`\`\`bash
pnpm dev
\`\`\`

### 构建生产版本
\`\`\`bash
pnpm build
\`\`\`

## 📖 使用说明

1. **填写旅行需求**
   - 选择目的地（青岛、北京、上海等）
   - 设置旅行天数（1-10天）
   - 选择偏好类型（美食、观光、购物等）
   - 设置出发日期和预算

2. **AI Agent 执行**
   - 系统会按顺序执行4个Agent
   - 实时显示每个Agent的执行状态
   - 展示思考过程、执行动作和结果

3. **查看旅行计划**
   - 详细的每日行程安排
   - 天气预报和建议
   - 活动和餐饮安排

## 🏗️ 项目结构

\`\`\`
src/
├── agents/           # Agent 实现
│   ├── analyzerAgent.ts     # 需求分析Agent
│   ├── plannerAgent.ts      # 行程规划Agent
│   ├── weatherAgent.ts      # 天气信息Agent
│   ├── formatterAgent.ts    # 格式整合Agent
│   └── coordinator.ts       # Agent协调器
├── components/       # React组件
│   ├── PlannerForm.tsx      # 规划表单
│   ├── AgentStatus.tsx      # Agent状态
│   └── PlanResult.tsx       # 结果展示
├── lib/             # 工具库
│   ├── fetcher.ts          # API调用封装
│   └── utils.ts            # 通用工具函数
├── utils/           # 功能模块
│   └── memory.ts           # Memory管理
├── types/           # 类型定义
│   └── index.ts
└── App.tsx          # 主应用
\`\`\`

## 🤖 Agent 设计模式

### ReAct 模式
每个Agent都实现了"思考-行动-观察"的认知循环：
\`\`\`typescript
// 思考阶段
const thought = "分析用户需求..."

// 行动阶段  
const action = await tool.execute(params)

// 观察阶段
const observation = "获得了..."
\`\`\`

### Plan & Execute 模式
Agent首先制定计划，然后逐步执行：
\`\`\`typescript
// 制定计划
const plan = await agent.plan(input)

// 执行计划
const result = await agent.execute(plan)
\`\`\`

### Memory 系统
支持持久化的上下文记忆：
\`\`\`typescript
// 保存记忆
await MemoryManager.saveMemory(content, context)

// 检索记忆
const memories = await MemoryManager.getRecentMemories()
\`\`\`

## 🔧 配置说明

### API 配置
在 \`src/lib/fetcher.ts\` 中配置阿里云 OpenAI 兼容接口：
\`\`\`typescript
const client = new OpenAI({
  apiKey: 'your-api-key',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  dangerouslyAllowBrowser: true
})
\`\`\`

### 模型配置
默认使用 \`qwen-turbo\` 模型，可以在各Agent中调整：
\`\`\`typescript
const response = await chatCompletion({
  model: 'qwen-turbo',  // 可选：qwen-plus, qwen-max
  messages: [...],
  temperature: 0.7
})
\`\`\`

## 📚 技术细节

### Agent 工具系统
每个Agent都有专门的工具集：
- **解析工具**：分析用户输入
- **规划工具**：生成行程安排
- **查询工具**：获取外部信息
- **分析工具**：处理数据和建议
- **格式化工具**：整理输出结果

### 错误处理
- 网络请求失败自动重试
- AI 服务异常graceful降级
- 用户输入验证和提示
- Agent执行失败的错误恢复

### 性能优化
- 组件按需加载
- 状态更新防抖
- 大数据分页展示
- 内存清理机制

## 🌟 扩展建议

1. **新增Agent类型**
   - TransportAgent（交通规划）
   - BudgetAgent（预算计算）
   - ReviewAgent（评价收集）

2. **增强功能**
   - 多语言支持
   - 语音输入
   - 地图集成
   - 分享功能

3. **优化体验**
   - 响应式设计
   - 暗黑模式
   - 离线支持
   - PWA 支持

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**🎯 项目目标**：演示现代 AI Agent 系统的设计和实现，展示多Agent协作、认知架构、工具使用等核心概念。 