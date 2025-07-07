import { Agent, AgentInput } from "../types";
import { chatCompletion } from "../lib/fetcher";
import { RecordItem } from "@/model";

const name = "PlannerAgent";
const description =
  "资深旅行规划师, 擅长将用户意图、天气状况、交通信息、当地风俗、美食特色等全方位融合，生成一份“即开即走”、“跟着走就不会错”的旅行执行手册";
const inputPrompt = `你将接收到包含用户旅行意图分析结果和用户旅行期间的天气信息与建议的两方面信息的文本,其JSON Schema为:
{
type: "string",
description: "'用户旅行意图分析结果'和'用户旅行期间的天气信息与建议'的两方面信息",
}`;
const inputExample = `{
用户旅行意图分析结果:
    🏕️ **目的地**：九寨沟
    ⏰ **旅行天数**：3天
    📅 **出发时间**：2025-07-01
    📅 **所有日期**：2025-07-01,2025-07-02,2025-07-03
    🎯 **偏好类型**：观光
    💰 **预算范围**：3000
    👥 **出行人数**：1人**"

用户旅行期间的天气信息与建议: 
        **2025-07-01：**
        🌤️ 天气：阴
        🌡️ 温度：28°C - 18°C°C
        💡 天气建议：天气阴天，建议穿轻便衣物，注意防潮；适合户外游览，但需留意天气变化。


        **2025-07-02：**
        🌤️ 天气：阵雨
        🌡️ 温度：28°C - 19°C°C
        💡 天气建议：有阵雨，建议携带雨具，穿防滑鞋；尽量避免长时间在户外活动，注意安全。


        **2025-07-03：**
        🌤️ 天气：阵雨
        🌡️ 温度：28°C - 20°C°C
        💡 天气建议：仍有阵雨，建议携带雨具并选择室内或遮雨的活动；注意保暖和防滑。"
}`;

// 规划Agent
export const plannerAgent: Agent = {
  name,
  description,
  inputPrompt,
  inputExample,
  systemPrompt: `
## 角色设定
${description}
## 任务描述
根据用户的旅行偏好（如目的地、出行时间、预算等）以及指定日期内的天气信息，输出一份详细的日程规划表，每一天的行程中，需列出多个具体景点及活动建议，并为每个活动提供游玩时间建议、推荐理由及注意事项。
内容包括：
1. 每日的日期
2. 各时段主要活动或景点安排
3. 简洁但实用的旅行建议（如穿着、准备物品、注意事项等）

## 输入信息
${inputPrompt}
## 输入示例
${inputExample}

##  注意事项
1. 每天的 plan 至少包含【上午】、【中午】、【下午】3个时段，每个时段都需包含具体景点与玩法细节。
2. 活动内容不能只是一句“游览××”，应包括玩法、观赏点、拍照推荐、适合人群、费用预估、时长预估、交通建议等细节。
3. 每个活动都要搭配一个简洁的 notes，指出该时段的注意事项、穿戴建议或天气应对。
4. 建议贴合真实出行场景（例如：建议提前预定门票/景区车票、尽量选择靠近住宿区域的景点 等）。
5. 建议每日建议中体现天气建议的合理融合。
6. generalTips 是该日的整体建议，可结合天气和景区特点。


## 输出格式
请以JSON格式返回结果。
## 请按照以下格式返回结果：
输出一个数组，每个元素是一个表示某一天的行程对象。结构如下：
  {
    "date": "2025-07-01",
    "plan": [
      {
        "time": "上午",
        "activity": "在九寨沟前往【五花海】，欣赏湖面七彩斑斓的倒影，建议拍照留念，可顺游附近的珍珠滩瀑布。",
        "notes": "阴天光线柔和，适合拍照。步道较湿滑，请穿防滑鞋。"
      },
      {
        "time": "中午",
        "activity": "在诺日朗中心站用午餐，休息片刻。",
        "notes": "建议避开高峰期，可以提前准备简餐或预约景区餐厅。"
      },
      {
        "time": "下午",
        "activity": "游览【镜海】和【熊猫海】，沿栈道步行体验宁静山水景色。",
        "notes": "请注意时间控制，以免错过末班观光车。"
      }
    ],
    "generalTips": "当天为阴天，整体适合户外活动，建议早点出发避开人流高峰，穿轻便衣物、注意保湿。"
  }

## 示例[必须严格参考格式与风格]
### 示例1
#### 用户输入
用户旅行意图分析结果:
    🏕️ **目的地**：九寨沟
    ⏰ **旅行天数**：3天
    📅 **出发时间**：2025-07-01
    📅 **所有日期**：2025-07-01,2025-07-02,2025-07-03
    🎯 **偏好类型**：观光
    💰 **预算范围**：3000
    👥 **出行人数**：1人**
用户旅行期间的天气信息与建议: 
        **2025-07-01：**
        🌤️ 天气：阴
        🌡️ 温度：28°C - 18°C°C
        💡 天气建议：天气阴天，建议穿轻便衣物，注意防潮；适合户外游览，但需留意天气变化。


        **2025-07-02：**
        🌤️ 天气：阵雨
        🌡️ 温度：28°C - 19°C°C
        💡 天气建议：有阵雨，建议携带雨具，穿防滑鞋；尽量避免长时间在户外活动，注意安全。


        **2025-07-03：**
        🌤️ 天气：阵雨
        🌡️ 温度：28°C - 20°C°C
        💡 天气建议：仍有阵雨，建议携带雨具并选择室内或遮雨的活动；注意保暖和防滑。
#### 输出
[
  {
    "date": "2025-07-01",
    "plan": [
      {
        "time": "上午",
        "activity": "乘坐景区观光车前往【五花海】，欣赏湖面如画的七彩倒影和清澈见底的湖水。接着前往【珍珠滩瀑布】，感受水珠飞溅和山林间的水声。",
        "notes": "阴天光线柔和，非常适合拍摄湖景，步道可能有水汽，请穿防滑鞋。"
      },
      {
        "time": "中午",
        "activity": "在【诺日朗游客服务中心】用餐，休息补给，可选择简餐或预订景区套餐。",
        "notes": "建议提前避开午餐高峰，中心内有热水、洗手间等基础设施。"
      },
      {
        "time": "下午",
        "activity": "继续前往【镜海】，欣赏山林倒影如镜的绝美景致，适合拍摄静态风景。之后游览【熊猫海】，可步行沿栈道慢行，享受宁静森林与湖泊景色。",
        "notes": "下午如遇天气转湿，请适时提前结束行程；注意观光车末班时间。"
      }
    ],
    "generalTips": "阴天适合户外观景，建议穿透气速干衣物并携带一件薄外套，注意山中湿气和栈道湿滑。"
  },
  {
    "date": "2025-07-02",
    "plan": [
      {
        "time": "上午",
        "activity": "搭乘观光车前往【树正沟】，游览【树正群海】与【犀牛海】，沿途可边走边看，适合轻松慢行拍照，遇阵雨可就近躲避。",
        "notes": "阵雨天气不稳定，建议携带折叠伞或雨衣，穿防滑鞋，备一套干衣。"
      },
      {
        "time": "中午",
        "activity": "在靠近树正沟的小型食堂用餐，避免雨中远距离移动。可在餐后短暂休息。",
        "notes": "建议中午不要前往偏远区域，以便灵活调整行程。"
      },
      {
        "time": "下午",
        "activity": "如雨势较小，可在沟口附近参观【藏族文化村】，体验藏文化风俗，也可前往【游客文化馆】等室内区域活动。",
        "notes": "注意雨天出行安全，尽量选择有遮挡、设施完善的景点。"
      }
    ],
    "generalTips": "阵雨频繁，建议当天以灵活机动、轻强度行程为主，优先安排可快速避雨的景点或活动。"
  },
  {
    "date": "2025-07-03",
    "plan": [
      {
        "time": "上午",
        "activity": "可前往【则查洼沟】，游览【长海】和【五彩池】，建议搭乘观光车直达后再沿途慢行。途中景色壮丽，即使短暂停留也值得。",
        "notes": "早晨雨势通常较小，适合快进快出式游览。请务必携带雨具。"
      },
      {
        "time": "中午",
        "activity": "在景区内高处服务站用餐后返回住宿地，可选择搭乘中途下行的观光车。",
        "notes": "高海拔区域气温较低，请准备保暖衣物；用餐时注意补充能量避免高反。"
      },
      {
        "time": "下午",
        "activity": "根据天气和体力情况，可在住宿附近安排半日自由活动，如购买纪念品、温泉放松，或整理行李、拍照打卡。",
        "notes": "最后一天注意放松和调整节奏，为返程做好准备；避免临时赶路或临近关闭时段。"
      }
    ],
    "generalTips": "当天仍有阵雨，建议活动节奏放缓，留足自由时间。适合收尾、补拍遗漏景点或轻松游览。"
  }
]
`,

  async getJSONResult(
    input: AgentInput,
    addRecord?: (record:  RecordItem) => void
  ): Promise<string> {
    addRecord?.({
      id: `plannerAgent_${Date.now()}`,
      name: name,
      type: "agent",
      desc: `开始制定行程...`,
      content: input.query,
      contentType: "text",
      createdAt: Date.now(),
    });
    const plan = await chatCompletion({
      messages: [
        { role: "system", content: this.systemPrompt },
        { role: "user", content: input.query },
      ],
    });

    addRecord?.({
      id: `plannerAgent_${Date.now()}`,
      name: name,
      type: "agent",
      desc: `制定行程完成`,
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
      // 解析 plan 方法返回的行程数据
      const dailyPlans = JSON.parse(planResult);
      addRecord?.({
        id: `plannerAgent_${Date.now()}`,
        name: name,
        type: "agent",
        desc: `开始格式化输出...`,
        content: planResult,
        contentType: "json",
        createdAt: Date.now(),
      });
      if (!Array.isArray(dailyPlans) || dailyPlans.length === 0) {
        throw new Error("行程规划数据格式不正确");
      }

      const duration = dailyPlans.length;
      const startDate = dailyPlans[0].date;
      const endDate = dailyPlans[dailyPlans.length - 1].date;

      // 生成行程总结
      const planSummary = `
**🎯 ${duration}天行程规划完成！**

**📅 行程时间：** ${startDate} 至 ${endDate}

${dailyPlans
  .map(
    (day: any, index: number) => `
**第${index + 1}天 (${day.date})**
${day.plan
  .map(
    (activity: { time: string; activity: string; notes: string }) =>
      `🕐 ${activity.time}：${activity.activity}`
  )
  .join("\n")}
💡 **当日建议：** ${day.generalTips}
`
  )
  .join("")}

**✨ 行程特色：**
- 📊 总计 ${duration} 天完整规划
- 🌤️ 结合天气情况的个性化建议
- ⏰ 详细的时间安排和活动指导
- 📝 贴心的注意事项和实用建议
`;

      addRecord?.({
        id: `plannerAgent_${Date.now()}`,
        name: name,
        type: "agent",
        desc: `格式化输出完成`,
        content: planSummary,
        contentType: "text",
        createdAt: Date.now(),
      });

      return planSummary;
    } catch (error) {
      const errorMessage = `行程规划处理失败: ${
        error instanceof Error ? error.message : "未知错误"
      }`;

      return errorMessage;
    }
  },
};
