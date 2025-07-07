import { AgentResults } from "@/types";
import { chatCompletion } from "../../lib/fetcher";
import { analyzerAgent } from "../analyzerAgent";
import { plannerAgent } from "../plannerAgent";
import { weatherAgent } from "../weatherAgent";
import { GateKeeper } from "./GateKeeper";
import { TaskPlan, PlanStep } from "./types";
import { RecordItem } from "@/model";

/**
 * 主管Agent
 * 通过大模型分析用户输入，智能决定Agent调用顺序和选择
 */
export class SmartSupervisor {
  public name = "SmartSupervisor";
  private plan: TaskPlan | null = null;
  private outputPool: any[] = [];
  private finalResult: AgentResults = {
    analysis: {
      text: "",
      json: "",
    },
    weather: {
      text: "",
      json: "",
    },
    planner: {
      text: "",
      json: "",
    },
  };
  private addRecord: (record: RecordItem) => void;
  private gateKeeper: GateKeeper;

  private readonly planningPrompt = `
  ## 角色设定
  你是一名资深的Agent管理专家，在你的团队下有"PlannerAgent"、"WeatherAgent"、"AnalyzerAgent"三个专家Agent。你的任何是根据用户的输入，规划出合理的Agent执行计划。
  ## 团队中的各Agent的系统设定如下(系统设定中含有角色设定, 任务描述, 输入信息, 输出格式以及示例等):
  - PlannerAgent: ${plannerAgent.systemPrompt}
  - WeatherAgent: ${weatherAgent.systemPrompt}
  - AnalyzerAgent: ${analyzerAgent.systemPrompt}
  ## 规划原则
  1. **熟悉团队成员**: 熟悉团队各Agent的系统设定, 熟悉他们的职责以及要求的输入信息, 输出格式等
  2. **信息完整性分析**: 分析用户已提供的信息，确定缺失的关键信息
  3. **Agent选择优化**: 结合团队中各Agent的系统设定, 确定需要调用的Agent
  4. **执行顺序优化**: 根据信息依赖关系确定最优调用顺序
  5. **效率优先**: 在保证质量的前提下，尽量减少Agent调用次数
  6. **不要代劳**: 只完成你的规划工作, 不要代劳团队成员职责内的任务
  7. **智能规划**: 如果用户输入中已经包含了某个Agent的职责内的信息, 则不需要调用该Agent

  ## 输出格式
  请严格按照以下JSON格式输出执行计划：
  你应该输出一个数组，数组中每个元素都是一个对象，对象中包含agentName和reason字段，agentName为当前agent的名称，reason为选择当前agent的原因。
  ### 输出示例:
  [
      {
        agentName: "当前agent的名称",# AnalyzerAgent"|"WeatherAgent"|"PlannerAgent"
        reason: "选择当前agent的原因",
      },
      {
        agentName: "当前agent的名称",# AnalyzerAgent"|"WeatherAgent"|"PlannerAgent"
        reason: "选择当前agent的原因",
      }
    ]
  `;

  constructor(addRecord: (record: RecordItem) => void) {
    this.addRecord = addRecord;
    this.gateKeeper = new GateKeeper(addRecord);
  }

  /**
   * 主要的任务执行入口 - Plan-and-Execute模式
   */
  async execute(query: string): Promise<any> {
    console.log(`🎯 主管开始处理任务: ${query}`);

    this.outputPool = [
      {
        makerName: "user",
        outputText: query,
        outputJson: "",
      },
    ];
    // Plan阶段：通过LLM智能规划
    console.log(`🧠 [${this.name}] [plan] 开始规划...`);
    this.addRecord({
      id: `plan_${Date.now()}`,
      name: this.name,
      type: "supervisor",
      desc: "开始规划...",
      content: query,
      contentType: "text",
      createdAt: Date.now(),
    });
    this.plan = await this.intelligentPlanning(query);
    console.log(`📋 [${this.name}] [plan] 规划完成`, this.plan);
    this.addRecord({
      id: `plan_${Date.now()}`,
      name: this.name,
      type: "supervisor",
      desc: "规划完成",
      content: JSON.stringify(this.plan),
      contentType: "json",
      createdAt: Date.now(),
    });

    // Execute阶段：执行规划的任务
    console.log(`🧠 [${this.name}] [execute] 开始执行...`);
    this.addRecord({
      id: `plan_${Date.now()}`,
      name: this.name,
      type: "supervisor",
      desc: "开始执行...",
      content: "",
      contentType: "",
      createdAt: Date.now(),
    });
    const result = await this.executeStep(this.plan!);
    console.log(`✅ [${this.name}] [execute] 执行完成`, result);
    this.addRecord({
      id: `plan_${Date.now()}`,
      name: this.name,
      type: "supervisor",
      desc: "执行完成",
      content: JSON.stringify(result),
      contentType: "json",
      createdAt: Date.now(),
    });

    return result;
  }

  /**
   * 智能规划阶段 - 通过LLM分析用户输入，制定执行计划
   */
  private async intelligentPlanning(query: string): Promise<any> {
    const userInput = `用户输入为: "${query}"`;

    const response = await chatCompletion({
      messages: [
        { role: "system", content: this.planningPrompt },
        { role: "user", content: userInput },
      ],
    });

    const planData = JSON.parse(response);

    const planId = `intelligent_plan_${Date.now()}`;

    // 根据LLM建议的执行顺序创建步骤
    const steps: PlanStep[] = planData.map(
      (agentConfig: any, index: number) => {
        const step: PlanStep = {
          id: `step_${agentConfig.agentName.toLowerCase()}_${
            Date.now() + index
          }`,
          title: agentConfig.agentName,
          description: agentConfig.reason,
          inputs: {},
          outputs: {},
          done: false,
          observeDone: false,
          error: null,
        };
        return step;
      }
    );

    const plan: TaskPlan = {
      id: planId,
      steps,
      originalInput: query,
      createdAt: Date.now(),
    };

    return plan;
  }

  /**
   * 按计划执行
   */
  private async executeStep(plan: TaskPlan): Promise<any> {
    let index = 0;
    for await (const step of plan.steps) {
      console.log(`🔄 [${this.name}] [execute] 执行步骤: ${step.title}`);
      this.addRecord({
        id: `plan_${Date.now()}`,
        name: this.name,
        type: "supervisor",
        desc: `分配任务到: ${step.title}`,
        content: "",
        contentType: "",
        createdAt: Date.now(),
      });
      const agent = {
        AnalyzerAgent: analyzerAgent,
        WeatherAgent: weatherAgent,
        PlannerAgent: plannerAgent,
      }[step.title];

      const gateKeeperResult = await this.gateKeeper.makeParams({
        agentName: step.title,
        outputPool: this.outputPool,
      });

      const jsonResult = await agent!.getJSONResult(
        {
          query: gateKeeperResult.targetAgentInput,
        },
        this.addRecord
      );

      const textResult = await agent!.makeTextResult(
        jsonResult,
        this.addRecord
      );

      this.outputPool.push({
        makerName: step.title,
        outputText: textResult,
        outputJson: JSON.parse(jsonResult),
      });

      this.plan!.steps[index].outputs = {
        jsonResult: jsonResult,
        textResult: textResult,
      };
      index++;
    }

    for (const step of this.plan!.steps) {
      if (step.title === "AnalyzerAgent") {
        this.finalResult.analysis = {
          text: step.outputs?.textResult,
          json: step.outputs?.jsonResult,
        };
      } else if (step.title === "WeatherAgent") {
        this.finalResult.weather = {
          text: step.outputs?.textResult,
          json: step.outputs?.jsonResult,
        };
      } else if (step.title === "PlannerAgent") {
        this.finalResult.planner = {
          text: step.outputs?.textResult,
          json: step.outputs?.jsonResult,
        };
      }
    }
    return this.finalResult;
  }
}
