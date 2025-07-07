import { RecordItem } from "@/model";

// Agent 相关类型
export interface Tool {
  schema: ToolSchema;
  execute: (
    params?: any,
    onCallback?: (executionProgress: Partial<AgentExecution>) => void
  ) => Promise<any> | any;
}
export interface ToolSchema {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface Agent {
  name: string;
  description: string;
  inputPrompt: string;
  inputExample: string;
  systemPrompt: string;
  getJSONResult: (
    input: AgentInput,
    addRecord?: (record: RecordItem) => void
  ) => Promise<string>;
  makeTextResult: (
    jsonResult: string,
    addRecord?: (record: RecordItem) => void
  ) => Promise<string>;
}

export interface AgentInput {
  query: string;
  context?: Record<string, any>;
  previousResults?: string[];
}

export interface ToolDetails {
  toolName: string;
  toolDescription: string;
  toolParameters: Record<string, any>;
  systemPrompt: string;
  userPrompt: string;
}

export interface AgentExecution {
  agentName: string;
  step: string;
  thought?: string;
  action?: string;
  observation?: string;
  result: string;
  status: "running" | "completed" | "error";
  startTime: number;
  endTime?: number;
  systemPrompt?: string;
  userPrompt?: string;
  toolDetails?: ToolDetails;
}

// 旅行规划相关类型
export interface TravelPlan {
  destination: string;
  duration: number;
  preferences: string[];
  startDate?: string;
  days: DayPlan[];
  weather?: WeatherInfo;
  transportation?: TransportationInfo;
}

// 包含所有Agent原始结果的完整数据结构
export interface AgentResults {
  analysis: {
    text: string;
    json: any;
  };
  weather: {
    text: string;
    json: any;
  };
  planner: {
    text: string;
    json: any;
  };
}

export interface DayPlan {
  day: number;
  date: string;
  activities: Activity[];
  meals: Meal[];
  notes?: string;
}

export interface Activity {
  id: string;
  name: string;
  type: "sightseeing" | "shopping" | "entertainment" | "outdoor" | "cultural";
  description: string;
  location: string;
  duration: string;
  time: string;
  cost?: string;
}

export interface Meal {
  id: string;
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  cuisine: string;
  location: string;
  time: string;
  speciality?: string;
  cost?: string;
}

// 住宿信息接口已移除

export interface WeatherInfo {
  forecast: DailyWeather[];
  recommendations: string[];
}

export interface DailyWeather {
  date: string;
  temperature: {
    high: number;
    low: number;
  };
  condition: string;
  precipitation: number;
  humidity: number;
}

export interface TransportationInfo {
  type: "flight" | "train" | "bus" | "car";
  routes: Route[];
  recommendations: string[];
}

export interface Route {
  from: string;
  to: string;
  method: string;
  duration: string;
  cost?: string;
  schedule?: string;
}

// 表单相关类型
export interface TravelFormData {
  destination: string;
  duration: number;
  startDate?: string;
  preferences: string[];
  extraRequirements?: string;
}
