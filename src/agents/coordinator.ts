import { RecordItem } from "@/model";
import { Agent, AgentExecution, AgentResults } from "../types";
import { analyzerAgent } from "./analyzerAgent";
import { plannerAgent } from "./plannerAgent";
import { weatherAgent } from "./weatherAgent";

// Agent协调器类
export class AgentCoordinator {
  public name = "AgentCoordinator";
  private addRecord: (record: RecordItem) => void;

  constructor(addRecord: (record: RecordItem) => void) {
    this.addRecord = addRecord;
  }

  // 执行多Agent协作旅行规划
  async execute(userQuery: string): Promise<AgentResults> {
    try {
      //  第一步：需求分析
      this.addRecord({
        id: `coordinator_${Date.now()}`,
        name: this.name,
        type: "supervisor",
        desc: "执行需求分析任务...",
        content: userQuery,
        contentType: "text",
        createdAt: Date.now(),
      });
      const { textResult: analysisResult, jsonResult: analysisJsonResult } =
        await this.executeAgentWithCallback(analyzerAgent, userQuery);
      this.addRecord({
        id: `coordinator_${Date.now()}`,
        name: this.name,
        type: "supervisor",
        desc: "需求分析任务完成",
        content: "",
        contentType: "",
        createdAt: Date.now(),
      });

      console.log("analysisResult", analysisResult);
      console.log("analysisJsonResult", analysisJsonResult);

      this.addRecord({
        id: `coordinator_${Date.now()}`,
        name: this.name,
        type: "supervisor",
        desc: "执行天气收集任务...",
        content: "",
        contentType: "",
        createdAt: Date.now(),
      });

      // 第二步：天气收集
      const { textResult: weatherResult, jsonResult: weatherJsonResult } =
        await this.executeAgentWithCallback(
          weatherAgent,
          `旅行地点: ${JSON.parse(analysisJsonResult).destination};旅行日期: ${
            JSON.parse(analysisJsonResult).allDates
          }`
        );
      this.addRecord({
        id: `coordinator_${Date.now()}`,
        name: this.name,
        type: "supervisor",
        desc: "天气收集任务完成",
        content: "",
        contentType: "",
        createdAt: Date.now(),
      });
      console.log("weatherResult", weatherResult);
      console.log("weatherJsonResult", weatherJsonResult);

      this.addRecord({
        id: `coordinator_${Date.now()}`,
        name: this.name,
        type: "supervisor",
        desc: "执行行程规划任务...",
        content: "",
        contentType: "",
        createdAt: Date.now(),
      });
      // 第三步：行程规划
      const { jsonResult: plannerJsonResult, textResult: plannerResult } =
        await this.executeAgentWithCallback(
          plannerAgent,
          `
          用户旅行意图分析结果:
          ${analysisResult}
          用户旅行期间的天气信息与建议:
          ${weatherResult}
          `
        );
      this.addRecord({
        id: `coordinator_${Date.now()}`,
        name: this.name,
        type: "supervisor",
        desc: "行程规划任务完成",
        content: "",
        contentType: "",
        createdAt: Date.now(),
      });

      console.log("plannerTextResult", plannerResult);
      console.log("plannerJsonResult", plannerJsonResult);

      // 返回包含所有Agent结果的完整数据
      return {
        analysis: {
          text: analysisResult,
          json: analysisJsonResult,
        },
        weather: {
          text: weatherResult,
          json: weatherJsonResult,
        },
        planner: {
          text: plannerResult,
          json: plannerJsonResult,
        },
      };
    } catch (error) {
      console.error("Agent协作执行失败:", error);
      throw error;
    }
  }

  // 执行单个Agent并回调进度（用于新UI）
  private async executeAgentWithCallback(
    agent: Agent,
    input: string
  ): Promise<{ textResult: string; jsonResult?: any }> {
    try {
      const jsonResult = await agent.getJSONResult(
        { query: input },
        this.addRecord
      );

      const textResult = await agent.makeTextResult(jsonResult, this.addRecord);
      return {
        textResult: textResult,
        jsonResult: jsonResult,
      };
    } catch (error) {
      throw error;
    }
  }
}
