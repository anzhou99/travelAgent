// 简化版智能编排系统类型定义

// Agent状态
export enum AgentStatus {
  IDLE = "idle",
  PLANNING = "planning",
  EXECUTING = "executing",
  COMPLETED = "completed",
  ERROR = "error"
}

// 任务优先级
export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

// 计划步骤
export interface PlanStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  observeDone: boolean;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  error?: any;
}

// 简化的任务计划
export interface TaskPlan {
  id: string;
  steps: PlanStep[];
  originalInput: string;
  createdAt: number;
}

// Agent执行结果
export interface AgentExecutionResult {
  agentName: string;
  stepId: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  observations: string[];
  nextRecommendation?: string;
}

// 主管Agent的决策
export interface SupervisorDecision {
  action: "execute" | "adjust" | "complete" | "delegate";
  reasoning: string;
  targetAgent?: string;
  parameters?: Record<string, any>;
  confidence: number;
}

// ReAct循环状态
export interface ReactState {
  thought: string;
  action: string;
  observation: string;
  iteration: number;
}

// 执行上下文
export interface ExecutionContext {
  plan: TaskPlan;
  currentStep: number;
  completedSteps: string[];
  failedSteps: string[];
  agentResults: Record<string, AgentExecutionResult>;
  reactHistory: ReactState[];
  globalState: Record<string, any>;
}

// 主管Agent接口
export interface SupervisorAgent {
  name: string;
  status: AgentStatus;
  executePlan(plan: TaskPlan): Promise<ExecutionContext>;
  adjustPlan(context: ExecutionContext, feedback: string): Promise<TaskPlan>;
  makeDecision(context: ExecutionContext): Promise<SupervisorDecision>;
  delegateToAgent(agentName: string, input: any): Promise<AgentExecutionResult>;
}

// 专家Agent接口
export interface ExpertAgent {
  name: string;
  description: string;
  capabilities: string[];
  execute(input: any, context?: ExecutionContext): Promise<AgentExecutionResult>;
  canHandle(task: string): boolean;
  estimateDuration(task: string): number;
}

// 简化的协调器配置
export interface SmartCoordinatorConfig {
  maxIterations: number;
  timeoutMs: number;
  enableReactMode: boolean;
  fallbackToStaticMode: boolean;
} 