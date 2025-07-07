import { analyzerAgent } from "../analyzerAgent";
import { weatherAgent } from "../weatherAgent";
import { plannerAgent } from "../plannerAgent";
import { ExpertAgent, AgentExecutionResult } from "./types";

/**
 * 专家Agent适配器
 * 将现有的Agent包装为统一的接口，用于智能编排系统
 */

/**
 * 分析Agent适配器
 * 分析用户需求，提取关键信息
 */
export const AnalyzerAgentAdapter: ExpertAgent = {
  name: "AnalyzerAgent",
  description: "分析用户旅行需求，提取目的地、时间、预算等关键信息",
  capabilities: [
    "提取目的地信息",
    "分析出行时间",
    "识别预算范围",
    "理解用户偏好",
    "结构化需求信息"
  ],
  
  canHandle(task: string): boolean {
    const keywords = ["分析", "需求", "提取", "解析", "目的地", "时间", "预算"];
    return keywords.some(keyword => 
      task.toLowerCase().includes(keyword.toLowerCase())
    );
  },

  estimateDuration(task: string): number {
    // 基础分析时间3秒，复杂需求增加时间
    const baseTime = 3000;
    const complexity = task.length > 100 ? 1 : 0;
    return baseTime + (complexity * 1000);
  },
  
  async execute(input: any): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 [AnalyzerAgent] 开始分析用户需求...`);
      
      // 调用原有的analyzerAgent，这里需要使用正确的调用方式
      const query = input.query || input;
      const result = await analyzerAgent.getJSONResult({ query, context: {}, previousResults: [] });
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ [AnalyzerAgent] 分析完成，用时 ${duration}ms`);
      
      return {
        agentName: "AnalyzerAgent",
        stepId: input.stepId || `analyzer_${Date.now()}`,
        success: true,
        result,
        duration,
        observations: [
          "提取了用户的基本旅行需求",
          "识别了关键信息字段",
          "为后续Agent提供结构化输入"
        ]
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`❌ [AnalyzerAgent] 执行失败:`, error);
      
      return {
        agentName: "AnalyzerAgent", 
        stepId: input.stepId || `analyzer_${Date.now()}`,
        success: false,
        error: error instanceof Error ? error.message : '分析Agent执行失败',
        duration,
        observations: [
          "用户需求分析遇到错误",
          "可能需要更明确的用户输入"
        ]
      };
    }
  }
};

/**
 * 天气Agent适配器  
 * 查询指定地点和时间的天气信息
 */
export const WeatherAgentAdapter: ExpertAgent = {
  name: "WeatherAgent",
  description: "查询指定日期和地点的天气信息，为旅行规划提供参考",
  capabilities: [
    "查询实时天气",
    "获取天气预报",
    "分析天气趋势",
    "提供穿衣建议",
    "评估出行适宜性"
  ],
  
  canHandle(task: string): boolean {
    const keywords = ["天气", "气温", "降雨", "晴天", "下雨", "温度"];
    return keywords.some(keyword => 
      task.toLowerCase().includes(keyword.toLowerCase())
    );
  },

  estimateDuration(task: string): number {
    // 基础天气查询4秒
    return 4000;
  },
  
  async execute(input: any): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🌤️ [WeatherAgent] 开始查询天气信息...`);
      
      // 调用原有的weatherAgent
      const query = input.query || input;
      const result = await weatherAgent.getJSONResult({ query, context: {}, previousResults: [] });
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ [WeatherAgent] 天气查询完成，用时 ${duration}ms`);
      
      return {
        agentName: "WeatherAgent",
        stepId: input.stepId || `weather_${Date.now()}`,
        success: true,
        result,
        duration,
        observations: [
          "获取了目的地天气信息",
          "提供了天气相关建议",
          "为行程规划提供天气参考"
        ]
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`❌ [WeatherAgent] 执行失败:`, error);
      
      return {
        agentName: "WeatherAgent",
        stepId: input.stepId || `weather_${Date.now()}`,
        success: false,
        error: error instanceof Error ? error.message : '天气Agent执行失败',
        duration,
        observations: [
          "天气信息查询失败",
          "可能是网络问题或API限制",
          "建议跳过天气信息或使用默认建议"
        ]
      };
    }
  }
};

/**
 * 规划Agent适配器
 * 生成详细的旅行计划
 */
export const PlannerAgentAdapter: ExpertAgent = {
  name: "PlannerAgent", 
  description: "基于需求分析和天气信息，生成详细的旅行行程计划",
  capabilities: [
    "制定多日行程",
    "安排景点路线",
    "推荐住宿餐饮",
    "优化时间安排",
    "考虑预算约束",
    "结合天气建议"
  ],
  
  canHandle(task: string): boolean {
    const keywords = ["规划", "行程", "计划", "安排", "路线", "景点", "住宿"];
    return keywords.some(keyword => 
      task.toLowerCase().includes(keyword.toLowerCase())
    );
  },

  estimateDuration(task: string): number {
    // 基础规划时间5秒，多天行程增加时间
    const baseTime = 5000;
    const dayMatches = task.match(/(\d+)\s*[天日]/);
    const days = dayMatches ? parseInt(dayMatches[1], 10) : 3;
    return baseTime + (Math.max(0, days - 1) * 1000);
  },
  
  async execute(input: any): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`📝 [PlannerAgent] 开始制定旅行计划...`);
      
      // 如果有前序Agent的结果，可以组合输入
      let plannerInput = input.query || input;
      
      // 如果传入了上下文中的其他Agent结果，可以合并
      if (input.context && input.context.agentResults) {
        const previousResults = Object.values(input.context.agentResults)
          .filter((result: any) => result.success)
          .map((result: any) => result.result)
          .join('\n\n');
          
        if (previousResults) {
          plannerInput = `${plannerInput}\n\n=== 前序分析结果 ===\n${previousResults}`;
        }
      }
      
      // 调用原有的plannerAgent
      const query = typeof plannerInput === 'string' ? plannerInput : JSON.stringify(plannerInput);
      const result = await plannerAgent.getJSONResult({ query, context: {}, previousResults: [] });
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ [PlannerAgent] 计划制定完成，用时 ${duration}ms`);
      
      return {
        agentName: "PlannerAgent",
        stepId: input.stepId || `planner_${Date.now()}`,
        success: true,
        result,
        duration,
        observations: [
          "生成了详细的旅行计划",
          "整合了需求分析和天气信息",
          "提供了可执行的行程安排"
        ]
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`❌ [PlannerAgent] 执行失败:`, error);
      
      return {
        agentName: "PlannerAgent",
        stepId: input.stepId || `planner_${Date.now()}`,
        success: false,
        error: error instanceof Error ? error.message : '规划Agent执行失败',
        duration,
        observations: [
          "旅行计划生成失败",
          "可能是输入信息不足或模型调用错误",
          "建议检查前序步骤的结果"
        ]
      };
    }
  }
};

/**
 * 获取所有专家Agent的列表
 */
export function getAllExpertAgents(): ExpertAgent[] {
  return [
    AnalyzerAgentAdapter,
    WeatherAgentAdapter, 
    PlannerAgentAdapter
  ];
}

/**
 * 根据名称获取特定的专家Agent
 */
export function getExpertAgent(name: string): ExpertAgent | undefined {
  const agents = getAllExpertAgents();
  return agents.find(agent => agent.name === name);
}

/**
 * 检查指定Agent是否可用
 */
export function isAgentAvailable(name: string): boolean {
  return getExpertAgent(name) !== undefined;
}

/**
 * 获取Agent的能力描述
 */
export function getAgentCapabilities(name: string): string[] {
  const agent = getExpertAgent(name);
  return agent?.capabilities || [];
}

/**
 * 验证Agent执行输入
 */
export function validateAgentInput(agentName: string, input: any): {
  valid: boolean;
  message?: string;
} {
  if (!input) {
    return {
      valid: false,
      message: "输入不能为空"
    };
  }
  
  // 基本验证：需要query字段或者input本身是字符串
  if (typeof input === 'string' || input.query) {
    return { valid: true };
  }
  
  return {
    valid: false,
    message: "输入必须包含query字段或为字符串类型"
  };
}

/**
 * 创建标准化的Agent执行输入
 */
export function createAgentInput(
  query: string,
  stepId?: string,
  context?: any
): any {
  return {
    query,
    stepId: stepId || `step_${Date.now()}`,
    context,
    timestamp: Date.now()
  };
} 