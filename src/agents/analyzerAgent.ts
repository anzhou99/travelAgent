import { Agent, AgentInput } from "../types";
import { chatCompletion } from "../lib/fetcher";
import tools from "../tools";
import { RecordItem } from "@/model";

const name = "AnalyzerAgent";
const description = "旅行信息分析归类专家, 擅长从用户输入中提取旅行相关信息";
const inputPrompt = `你通常接收用户的原始输入内容作为你的输入, 其JSON Schema为:
{
type: "string",
description: "用户输入的文本",
}`;
const inputExample =
  "2025年7月1日去北京3天，预算1200元，我喜欢自然风光, 最想去故宫";

// 需求分析Agent实现
export const analyzerAgent: Agent = {
  name,
  description,
  inputPrompt,
  inputExample,
  systemPrompt: `
    ## 角色设定
    ${description}
    ## 任务描述
    你需要根据用户的需求，从中提取出如下与旅行相关的信息：
    1. 目的地[destination], 用户想要去的地方. 必填, 输出文本, 如'北京'
    2. 旅行天数[duration], 用户计划旅行的天数. 必填, 输出不带单位的纯数字, 如'3'
    3. 出发时间[startDate], 用户计划出发的时间. 必填, 输出文本格式为'YYYY-MM-DD', 如'2025-07-01'
    4. 所有日期[allDates], 用户计划旅行的所有日期. 必填, 多个日期之间用','分割, 如'2025-07-01,2025-07-02,2025-07-03'
    5. 预算范围[budget], 用户旅行的总预算. 必填, 输出不带单位的纯数字, 如'1000'
    6. 偏好类型[preferences], 用户偏好的景点或地点类型. 选填, 输出文本, 如'美食'
    7. 额外要求[extraRequirements],用户旅行的额外要求. 选填, 输出文本, 如'必须去故宫'
    ## 注意事项
    如果用户没有提供明确的出发时间, 而是使用了'明天', '后天'等需要预先知道当前日期才能计算出出发时间的表达, 请调用工具计算出出发时间.
    ## 输入信息
    ${inputPrompt}
    ## 输入示例
    ${inputExample}
    ## 输出格式
    请以JSON格式返回结果。
    ## 请按照以下格式返回结果：
    {
      "destination": "目的地", 
      "duration": "旅行天数",
      "startDate": "出发时间",
      "allDates": "所有日期",
      "budget": "预算范围",
      "preferences": "偏好类型",
      "extraRequirements": "额外要求"
    }
    ## 示例[必须严格参考格式与风格]
    ### 示例1
    #### 用户输入
    2025年7月1日去北京3天，预算1200元，我喜欢自然风光, 最想去故宫
    #### 输出
    {
      "destination": "北京",
      "duration": 3,
      "startDate": "2025-07-01",
      "allDates": "2025-07-01,2025-07-02,2025-07-03",
      "budget": "1200",
      "preferences": "自然风光",
      "extraRequirements": "去故宫"
    }
    ### 示例2
    #### 用户输入
    今年国庆节在成都玩两天，每天计划400元
    #### 输出
    {
      "destination": "成都",
      "duration": 2,
      "startDate": "2025-10-01",
      "allDates": "2025-10-01,2025-10-02",
      "budget": "800",
      "preferences": "",
      "extraRequirements": ""
    }
`,
  async getJSONResult(
    input: AgentInput,
    addRecord?: (record: RecordItem) => void
  ): Promise<string> {
    addRecord?.({
      id: `analyzerAgent_${Date.now()}`,
      name: name,
      type: "agent",
      desc: `开始分析...`,
      content: input.query,
      contentType: "text",
      createdAt: Date.now(),
    });
    const plan = await chatCompletion(
      {
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: input.query },
        ],
        tools: [tools.getCurrentDateTool.schema],
      },
      (toolName) => {
        if (toolName === tools.getCurrentDateTool.schema.function.name) {
          const currentDate = tools.getCurrentDateTool.execute();
          addRecord?.({
            id: `analyzerAgent_${Date.now()}`,
            name: toolName,
            type: "tool",
            desc: `获取当前日期...`,
            content: currentDate,
            contentType: "text",
            createdAt: Date.now(),
          });
          return `当前日期是${currentDate}`;
        }
        return "";
      }
    );
    addRecord?.({
      id: `analyzerAgent_${Date.now()}`,
      name: name,
      type: "agent",
      desc: `分析完成`,
      content: plan,
      contentType: "json",
      createdAt: Date.now(),
    });

    return plan;
  },

  async makeTextResult(
    planResult: string,
    addRecord?: (record: RecordItem) => void
  ): Promise<string> {
    try {
      const parseResult = JSON.parse(planResult);
      addRecord?.({
        id: `analyzerAgent_${Date.now()}`,
        name: name,
        type: "agent",
        desc: `开始格式化输出...`,
        content: planResult,
        contentType: "json",
        createdAt: Date.now(),
      });

      // 生成结构化的分析结果
      const analysis = `
    用户旅行意图分析结果:
    🏕️ **目的地**：${parseResult.destination}
    ⏰ **旅行天数**：${parseResult.duration}天
    📅 **出发时间**：${parseResult.startDate}
    📅 **所有日期**：${parseResult.allDates}
    🎯 **偏好类型**：${(parseResult.preferences || ["观光"]).join("、")}
    💰 **预算范围**：${parseResult.budget || "中等"}
    👥 **出行人数**：${parseResult.travelers || 1}人**
    `;

      addRecord?.({
        id: `analyzerAgent_${Date.now()}`,
        name: name,
        type: "agent",
        desc: `格式化输出完成`,
        content: analysis,
        contentType: "text",
        createdAt: Date.now(),
      });
      return analysis;
    } catch (error) {
      console.error("需求组织失败:", error);
      return `需求组织失败: ${error}`;
    }
  },
};
