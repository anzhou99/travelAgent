import { Agent, AgentInput } from "../types";
import { chatCompletion } from "../lib/fetcher";
import tools from "../tools";
import { RecordItem } from "@/model";

const name = "WeatherAgent";
const description =
  "天气信息收集与出行建议专家，擅长根据天气情况为旅行者提供个性化、实用的出行建议。, 擅长根据天气情况为旅行者提供个性化、实用的出行建议";
const inputPrompt = `你将接收到包含旅行地点和旅行日期的文本, 其原始JSON Schema为:
{
type: "string",
description: "旅行地点和旅行日期, 旅行地点和旅行日期用';'分割, 旅行日期用','分割",
}`;
const inputExample = `旅行地点: 九寨沟;旅行日期: 2025-07-01,2025-07-02`;

// 天气Agent
export const weatherAgent: Agent = {
  name,
  description,
  inputPrompt,
  inputExample,
  systemPrompt: `
    ## 角色设定 
    ${description}
    ## 任务描述
    你需要根据用户提供的旅行日期列表，结合天气查询工具查询每个日期的天气信息，并结合天气状况综合分析，输出实用、准确且简洁的出行建议。
    用户提供的旅行期间可能包含多个日期。因此你需要针对每个日期分别分析并输出建议，最终以数组形式返回结果。
    数组中的每个元素是一个对象，必须包含以下字段：
    1. date：旅行日期（格式必须为 'YYYY-MM-DD'，例如 '2025-07-01'）。必填
    2. weather：该日的天气信息，简洁描述，例如 '晴天'、'小雨'、'多云转阴'。必填
    3. high：该日的最高温度，单位为摄氏度，输出文本格式，例如 '34°C'。必填
    4. low：该日的最低温度，单位为摄氏度，输出文本格式，例如 '28°C'。必填
    5. recommendations：根据该日天气信息给出的综合性出行建议，应具体、实用。例如：'建议穿短袖，注意遮阳防晒；中午尽量避免暴晒'。必填
    请确保输出格式为JSON数组，并保持字段顺序一致。建议应尽量自然、贴近日常语言，并体现天气和出行场景的相关性。
    ## 任务逻辑
    你首先应该调用get_location_id工具查询目的地的LocationId，然后调用get_weather_by_location_id工具查询目的地天气信息，再根据天气信息填充recommendations字段给出建议。
    注意：如果用户提供的旅行日期列表中包含的日期在天气信息中不存在，则recommendations根据地点特点和日期所在的季节给出普适性建议。
    ## 输入信息
    ${inputPrompt}
    ## 输入示例
    ${inputExample}
    ## 输出格式
    请以JSON格式返回结果。
    ## 请按照以下格式返回结果：
    {
      "date": "日期", 
      "weather": "天气信息",
      "high": "最高温",
      "low": "最低温",
      "recommendations": "建议"
    }
    ## 示例[必须严格参考格式与风格]
    ### 示例1
    #### 用户输入
    "{destination:'九寨沟',allDates: '2025-07-01,2025-07-02'}"
    #### 输出
    [
      {
        "date": "2025-07-01",
        "weather": "晴天",
        "high": "34°C",
        "low": "27°C",
        "recommendations": "建议穿短袖和太阳帽，注意补水和防晒，避免中午外出。"
      },
      {
        "date": "2025-07-02",
        "weather": "小雨",
        "high": "30°C",
        "low": "25°C",
        "recommendations": "建议携带雨具，穿防滑鞋，尽量避开长时间室外活动。"
      }
    ]
    ### 示例2
    #### 用户输入
    "{destination:'北京',allDates: '2025-12-24,2025-12-25,2025-12-26'}"
    #### 输出
    [
      {
        "date": "2025-12-24",
        "weather": "多云转阴",
        "high": "12°C",
        "low": "5°C",
        "recommendations": "建议穿保暖衣物，室外活动时注意防风保暖。"
      },
      {
        "date": "2025-12-25",
        "weather": "小雪",
        "high": "4°C",
        "low": "-1°C",
        "recommendations": "注意道路湿滑，建议穿防滑鞋，户外活动时保持身体温暖。"
      },
      {
        "date": "2025-12-26",
        "weather": "晴天",
        "high": "6°C",
        "low": "-2°C",
        "recommendations": "晴冷天气适合出行，建议穿厚外套和围巾，注意防寒。"
      }
    ]
    ### 示例3
    #### 用户输入
    "{destination:'九寨沟',allDates: '2026-01-01,2026-01-02'}"
    #### 输出
    [
      {
        "date": "2026-01-01",
        "weather": "无天气信息",
        "high": "无天气信息",
        "low": "无天气信息",
        "recommendations": "出行季节为九寨沟的冬季，建议穿保暖衣物，室外活动时注意防风保暖。"
      },
      {
        "date": "2026-01-02",
        "weather": "无天气信息",
        "high": "无天气信息",
        "low": "无天气信息",
        "recommendations": "出行季节为九寨沟的冬季，建议穿保暖衣物，室外活动时注意防风保暖。"
      }
    ]
  `,

  async getJSONResult(
    input: AgentInput,
    addRecord?: (record: RecordItem) => void
  ): Promise<string> {
    addRecord?.({
      id: `weatherAgent_${Date.now()}`,
      name: name,
      type: "agent",
      desc: `开始获取天气信息...`,
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
        tools: [tools.getLocationIdTool.schema, tools.getWeatherTool.schema],
      },
      async (toolName, toolArgs) => {
        if (toolName === tools.getLocationIdTool.schema.function.name) {
          addRecord?.({
            id: `weatherAgent_${Date.now()}`,
            name: toolName,
            type: "tool",
            desc: `开始获取LocationId...`,
            content: JSON.stringify(toolArgs),
            contentType: "json",
            createdAt: Date.now(),
          });
          const locationId = await tools.getLocationIdTool.execute(toolArgs);
          addRecord?.({
            id: `weatherAgent_${Date.now()}`,
            name: toolName,
            type: "tool",
            desc: `获取LocationId完成`,
            content: locationId,
            contentType: "text",
            createdAt: Date.now(),
          });
          return `当前目的地的LocationId是: ${locationId}`;
        } else if (toolName === tools.getWeatherTool.schema.function.name) {
          addRecord?.({
            id: `weatherAgent_${Date.now()}`,
            name: toolName,
            type: "tool",
            desc: `开始获取天气信息...`,
            content: JSON.stringify(toolArgs),
            contentType: "json",
            createdAt: Date.now(),
          });
          const weatherData = await tools.getWeatherTool.execute({
            ...toolArgs,
          });
          addRecord?.({
            id: `weatherAgent_${Date.now()}`,
            name: toolName,
            type: "tool",
            desc: `获取天气信息完成`,
            content: JSON.stringify(weatherData),
            contentType: "json",
            createdAt: Date.now(),
          });

          return `当前目的地旅行日期期间的天气信息是: ${JSON.stringify(
            weatherData
          )}`;
        }
        return "";
      }
    );

    addRecord?.({
      id: `weatherAgent_${Date.now()}`,
      name: name,
      type: "agent",
      desc: `获取天气信息完成`,
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
      const weatherData = JSON.parse(planResult);
      addRecord?.({
        id: `weatherAgent_${Date.now()}`,
        name: name,
        type: "agent",
        desc: `开始格式化输出...`,
        content: planResult,
        contentType: "json",
        createdAt: Date.now(),
      });

      const weatherReport = weatherData
        .map((v: any) =>
          v.weather !== "无天气信息"
            ? `
        **${v.date}：**
        🌤️ 天气：${v.weather}
        🌡️ 温度：${v.high} - ${v.low}°C
        💡 天气建议：${v.recommendations}
`
            : `
        **${v.date}：**
        💡 天气建议：${v.recommendations}
`
        )
        .join("\n");

      addRecord?.({
        id: `weatherAgent_${Date.now()}`,
        name: name,
        type: "agent",
        desc: `格式化输出完成`,
        content: weatherReport,
        contentType: "text",
        createdAt: Date.now(),
      });

      return `
      用户旅行期间的天气信息与建议:
      ${weatherReport}
      `;
    } catch (error) {
      console.error("天气信息收集失败:", error);
      return `天气信息收集失败: ${error}`;
    }
  },
};
