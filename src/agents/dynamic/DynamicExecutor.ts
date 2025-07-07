import { 
  TaskPlan, 
  PlanStep, 
  ExecutionContext, 
  AgentExecutionResult,
  AgentStatus,
  ExpertAgent
} from "./types";

/**
 * 简化版串行执行引擎
 * 只支持按顺序执行Agent任务
 */
export class SimpleExecutor {
  private agents: Map<string, ExpertAgent> = new Map();

  constructor(agents: ExpertAgent[]) {
    agents.forEach(agent => {
      this.agents.set(agent.name, agent);
    });
  }

  /**
   * 串行执行任务计划
   */
  async executePlan(plan: TaskPlan): Promise<ExecutionContext> {
    const context: ExecutionContext = {
      plan,
      currentStep: 0,
      completedSteps: [],
      failedSteps: [],
      agentResults: {},
      reactHistory: [],
      globalState: {}
    };

    console.log(`🚀 开始串行执行计划，共 ${plan.steps.length} 个步骤`);

    // 按顺序执行每个步骤
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      context.currentStep = i;

      console.log(`📋 执行步骤 ${i + 1}/${plan.steps.length}: ${step.title}`);

      try {
        const result = await this.executeStep(step, context);
        
        if (result.success) {
          context.completedSteps.push(step.id);
          console.log(`✅ 步骤 ${step.title} 执行成功 (${result.duration}ms)`);
          
          // 将结果存储到全局状态中，供后续步骤使用
          if (result.result) {
            context.globalState[step.agentName] = result.result;
          }
        } else {
          context.failedSteps.push(step.id);
          console.log(`❌ 步骤 ${step.title} 执行失败: ${result.error}`);
          
          // 如果是必需步骤失败，决定是否继续
          if (step.required) {
            console.log(`⚠️ 必需步骤失败，停止执行`);
            break;
          }
        }

        context.agentResults[step.id] = result;

      } catch (error) {
        const errorResult: AgentExecutionResult = {
          agentName: step.agentName,
          stepId: step.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: 0,
          observations: [`执行异常: ${error}`]
        };

        context.agentResults[step.id] = errorResult;
        context.failedSteps.push(step.id);

        console.error(`💥 步骤 ${step.title} 执行异常:`, error);

        // 必需步骤异常时停止执行
        if (step.required) {
          console.log(`⚠️ 必需步骤异常，停止执行`);
          break;
        }
      }
    }

    const stats = this.getExecutionStats(context);
    console.log(`📊 执行完成: 成功 ${stats.completedSteps}/${stats.totalSteps}, 失败 ${stats.failedSteps}, 总时长 ${stats.totalDuration}ms`);

    return context;
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(step: PlanStep, context: ExecutionContext): Promise<AgentExecutionResult> {
    const agent = this.agents.get(step.agentName);
    
    if (!agent) {
      throw new Error(`未找到Agent: ${step.agentName}`);
    }

    // 准备输入数据
    const input = {
      query: context.plan.query,
      step: step,
      context: context.globalState,
      previousResults: this.getPreviousResults(context),
      ...step.inputs
    };

    console.log(`🔄 调用 ${agent.name}...`);
    
    // 执行Agent
    const result = await agent.execute(input, context);
    
    return result;
  }

  /**
   * 获取之前步骤的执行结果
   */
  private getPreviousResults(context: ExecutionContext): string[] {
    return context.completedSteps.map(stepId => {
      const result = context.agentResults[stepId];
      return result?.result ? JSON.stringify(result.result) : '';
    }).filter(Boolean);
  }

  /**
   * 获取执行统计信息
   */
  getExecutionStats(context: ExecutionContext): {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    totalDuration: number;
    successRate: number;
  } {
    const totalSteps = context.plan.steps.length;
    const completedSteps = context.completedSteps.length;
    const failedSteps = context.failedSteps.length;
    const totalDuration = Object.values(context.agentResults)
      .reduce((sum, result) => sum + result.duration, 0);
    const successRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return {
      totalSteps,
      completedSteps,
      failedSteps,
      totalDuration,
      successRate
    };
  }

  /**
   * 重新执行失败的步骤
   */
  async retryFailedSteps(context: ExecutionContext): Promise<ExecutionContext> {
    console.log(`🔄 重试失败的步骤，共 ${context.failedSteps.length} 个`);

    for (const stepId of context.failedSteps) {
      const step = context.plan.steps.find(s => s.id === stepId);
      if (!step) continue;

      console.log(`🔄 重试步骤: ${step.title}`);

      try {
        const result = await this.executeStep(step, context);
        
        if (result.success) {
          // 从失败列表移除，加入成功列表
          context.failedSteps = context.failedSteps.filter(id => id !== stepId);
          context.completedSteps.push(stepId);
          
          // 更新全局状态
          if (result.result) {
            context.globalState[step.agentName] = result.result;
          }
          
          console.log(`✅ 重试成功: ${step.title}`);
        } else {
          console.log(`❌ 重试仍然失败: ${step.title}`);
        }

        context.agentResults[stepId] = result;

      } catch (error) {
        console.error(`💥 重试异常: ${step.title}`, error);
      }
    }

    return context;
  }

  /**
   * 检查是否所有必需步骤都已完成
   */
  isAllRequiredStepsCompleted(context: ExecutionContext): boolean {
    const requiredSteps = context.plan.steps.filter(step => step.required);
    return requiredSteps.every(step => context.completedSteps.includes(step.id));
  }

  /**
   * 获取下一个可执行的步骤
   */
  getNextExecutableStep(context: ExecutionContext): PlanStep | null {
    const currentStepIndex = context.currentStep;
    
    if (currentStepIndex >= context.plan.steps.length) {
      return null;
    }

    return context.plan.steps[currentStepIndex];
  }
} 