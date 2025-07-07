import OpenAI from 'openai';

const modelParams = {
  model: 'qwen-turbo',
  temperature: 0.7,
};

// 配置阿里云兼容的OpenAI客户端
const client = new OpenAI({
  apiKey: '', // 自行填充ApiKey
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  dangerouslyAllowBrowser: true, // 允许在浏览器中使用
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  tools?: any[];
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

function getParams(options: ChatCompletionOptions) {
  const params: any = {
    messages: options.messages,
    ...modelParams,
  };

  if (options.tools) {
    params.tools = options.tools;
    params.tool_choice = options.toolChoice || 'auto';
  }

  return params;
}

// 基础聊天完成API调用
export async function chatCompletion(
  options: ChatCompletionOptions,
  toolCallBack?: (toolName: string, toolArgs?: Record<string, any>) => string | Promise<string>
): Promise<string> {
  try {
    const params: any = getParams(options);

    const response = await client.chat.completions.create(params);

    if (response.choices[0]?.message?.tool_calls?.length) {
      const message = response.choices[0].message;
      const toolCall = response.choices[0].message?.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);
      const toolResult = await toolCallBack?.(toolName, toolArgs);
      let toolInfo = {
        role: 'tool' as const,
        content: toolResult?.toString() || '',
      };

      const newParams: any = getParams({
        ...options,
        messages: [...options.messages, message as ChatMessage, toolInfo],
      });
      return chatCompletion(newParams, toolCallBack);
    } else {
      return response.choices[0]?.message?.content || '';
    }
  } catch (error) {
    console.error('API调用失败:', error);
    throw new Error('AI服务暂时不可用，请稍后再试');
  }
}
