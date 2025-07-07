import { chatCompletion } from "../../lib/fetcher";
import { analyzerAgent } from "../analyzerAgent";
import { weatherAgent } from "../weatherAgent";
import { plannerAgent } from "../plannerAgent";
import { RecordItem } from "@/model";

// GateKeeper 输入参数的类型定义
export interface GateKeeperInput {
  agentName: string;
  outputPool: Array<{
    makerName: string;
    outputText: string;
    outputJson: string;
  }>;
}

// GateKeeper 输出结果类型
export interface GateKeeperResult {
  success: boolean;
  targetAgentInput: string;
  reasoning: string;
  usedSources: string[];
  error?: string;
}

/**
 * GateKeeper Agent - 智能参数适配器
 * 为专家 Agent 提供符合其输入要求的参数
 */
export class GateKeeper {
  private readonly name = "GateKeeper";
  private addRecord: (record: RecordItem) => void;
  // 专家 Agent 的输入要求配置
  private readonly agentInputRequirements = {
    AnalyzerAgent: {
      description: analyzerAgent.description,
      inputFormat: analyzerAgent.inputPrompt,
      inputExample: analyzerAgent.inputExample,
    },
    WeatherAgent: {
      description: weatherAgent.description,
      inputFormat: weatherAgent.inputPrompt,
      inputExample: weatherAgent.inputExample,
    },
    PlannerAgent: {
      description: plannerAgent.description,
      inputFormat: plannerAgent.inputPrompt,
      inputExample: plannerAgent.inputExample,
    },
  };

  constructor(addRecord: (record: RecordItem) => void) {
    this.addRecord = addRecord;
  }

  /**
   * 生成动态提示词
   */
  private generatePrompt(agentName: string): string {
    const requirements =
      this.agentInputRequirements[
        agentName as keyof typeof this.agentInputRequirements
      ];

    if (!requirements) {
      throw new Error(`未知的 Agent: ${agentName}`);
    }

    return `
## 角色设定
你是一个智能参数适配器 GateKeeper，专门为各种专家 Agent 准备符合其输入要求的参数。

## 当前任务
为 **${agentName}** 准备输入参数。

## 目标 Agent 信息
- **Agent 名称**: ${agentName}
- **Agent 描述**: ${requirements.description}
- **输入格式要求**: ${requirements.inputFormat}
- **输入示例**: ${requirements.inputExample}

## 任务要求
1. **数据筛选**: 从 outputPool 中找到与 ${agentName} 相关的输出数据
2. **格式转换**: 将找到的数据转换为 ${agentName} 要求的输入格式
3. **智能组合**: 如果需要多个数据源，智能地组合它们
4. **质量保证**: 确保生成的输入参数完整、准确且符合格式要求
5. **不要代劳**: 你不要自己生成参数, 你只需要根据输入池中的数据, 为${agentName}选择最合适的参数即可
6. **不要使用中文标点符号**: 在输出结果中使用英文标点符号,如",':;等, 不要使用中文标点符号


## 输出格式
请严格按照以下 JSON 格式输出：
{
  "targetAgentInput": "为目标Agent准备的输入参数",
  "reasoning": "选择和处理数据的推理过程",
  "usedSources": ["使用的数据源列表"],
  "confidence": 0.0-1.0
}

## 注意事项
- 如果 outputPool 中没有合适的数据，请在 reasoning 中说明
- 严格遵循目标 Agent 的输入格式要求
- 保持数据的完整性和准确性
- 优先使用最新和最相关的数据源
- 如果agent需要的是文本格式的JSON对象, 请在提供参数时将数据转换为文本格式的JSON对象
`;
  }

  /**
   * 主要方法：为指定的 Agent 制作输入参数
   */
  async makeParams(input: GateKeeperInput): Promise<GateKeeperResult> {
    const startTime = Date.now();

    console.log(
      `🚪 [${this.name}] [makeParams] 为 ${input.agentName} 准备输入参数...`
    );
    console.log(`🚪 [${this.name}] [makeParams] 数据池:`, input.outputPool);

    this.addRecord({
      id: `gateKeeper_${Date.now()}`,
      name: this.name,
      type: "agent",
      desc: `为 ${input.agentName} 准备输入参数...`,
      content: "",
      contentType: "",
      createdAt: Date.now(),
    });

    // 生成动态提示词
    const systemPrompt = this.generatePrompt(input.agentName);

    // 构造用户输入
    const userPrompt = `
请为 ${input.agentName} 准备输入参数。

可用的输出池数据：
${input.outputPool
  .map(
    (item, index) => `
${index + 1}. **来源**: ${item.makerName}
   **文本内容**: ${item.outputText}
   **JSON内容**: ${item.outputJson}
`
  )
  .join("\n")}

请根据以上数据，为 ${input.agentName} 生成合适的输入参数。
`;

    // 调用 LLM 进行智能处理
    const response = await chatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const result = JSON.parse(response);
    const duration = Date.now() - startTime;

    console.log(`✅ [${this.name}] [makeParams] result参数结果: `, result);

    console.log(
      `✅ [${this.name}] [makeParams] 参数准备完成，用时 ${duration}ms`
    );

    this.addRecord({
      id: `gateKeeper_${Date.now()}`,
      name: this.name,
      type: "agent",
      desc: `为 ${input.agentName} 准备输入参数完成`,
      content: JSON.stringify(result),
      contentType: "json",
      createdAt: Date.now(),
    });
    return {
      success: true,
      targetAgentInput: result.targetAgentInput,
      reasoning: result.reasoning,
      usedSources: result.usedSources || [],
    };
  }

  /**
   * 检查是否支持指定的 Agent
   */
  supportsAgent(agentName: string): boolean {
    return agentName in this.agentInputRequirements;
  }

  /**
   * 获取指定 Agent 的输入要求说明
   */
  getAgentRequirements(agentName: string) {
    return this.agentInputRequirements[
      agentName as keyof typeof this.agentInputRequirements
    ];
  }
}
