import { CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import * as React from "react";
import { RecordItem } from "@/model";

interface AgentStatusProps {
  isPlanning: boolean;
  records: RecordItem[];
}

// 获取类型对应的emoji和颜色
const getTypeConfig = (type: RecordItem["type"]) => {
  switch (type) {
    case "supervisor":
      return {
        emoji: "🎯",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        name: "主管",
      };
    case "agent":
      return {
        emoji: "🤖",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        name: "智能体",
      };
    case "tool":
      return {
        emoji: "🔧",
        color: "bg-green-100 text-green-800 border-green-200",
        name: "工具",
      };
    default:
      return {
        emoji: "📝",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        name: "未知",
      };
  }
};

// 获取Agent名称对应的emoji
const getAgentEmoji = (name: string) => {
  if (name.includes("Planner")) return "🗺️";
  if (name.includes("Weather")) return "🌤️";
  if (name.includes("Analyzer")) return "🔍";
  if (name.includes("SmartSupervisor")) return "🧠";
  if (name.includes("GateKeeper")) return "🚪";
  return "🤖";
};

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 格式化JSON内容
const formatContent = (content: string, contentType: string) => {
  if (contentType === "json" && content) {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }
  return content;
};

export default function AgentStatus({ isPlanning, records }: AgentStatusProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set()
  );

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <span className="text-lg">🚀</span>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
            AI Agent 实时状态
          </span>
          {isPlanning && (
            <div className="flex items-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500" />
            </div>
          )}
        </CardTitle>
        
        {/* 统计信息 */}
        <div className="flex space-x-2 mt-2">
          <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-50 to-blue-100 px-2 py-0.5 rounded-full">
            <span className="text-xs">📈</span>
            <span className="text-xs font-medium text-blue-700">
              总记录: {records.length}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-350px)]">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <div className="text-4xl mb-3 animate-bounce">🌟</div>
              <p className="text-base font-medium">等待AI Agent开始工作...</p>
              <p className="text-xs text-gray-400 mt-1">
                提交查询后，这里将显示实时进度
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* 时间线 */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200"></div>
              
              {records.map((record: RecordItem, index: number) => {
                const typeConfig = getTypeConfig(record.type);
                const agentEmoji = getAgentEmoji(record.name);
                const isExpanded = expandedItems.has(record.id);
                const isLatest = index === records.length - 1;
                
                return (
                  <div
                    key={record.id}
                    className={`relative pl-12 pr-3 py-2 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 rounded-lg group ${
                      isLatest && isPlanning
                        ? "animate-pulse bg-gradient-to-r from-blue-50 to-purple-50"
                        : ""
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    {/* 时间线节点 */}
                    <div
                      className={`absolute left-5 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-all duration-300 ${
                        isLatest && isPlanning
                          ? "bg-gradient-to-r from-blue-400 to-purple-400 animate-ping"
                          : "bg-gradient-to-r from-blue-300 to-purple-300"
                      }`}
                    >
                      {isLatest && isPlanning && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"></div>
                      )}
                    </div>
                    
                    {/* 内容区域 */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 ml-1 group-hover:shadow-md transition-all duration-300">
                      {/* 头部信息 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className="text-lg animate-bounce"
                            style={{ animationDelay: `${index * 200}ms` }}
                          >
                            {agentEmoji}
                          </span>
                          <div>
                            <h3 className="font-medium text-gray-800 flex items-center space-x-1 text-sm">
                              <span>{record.name}</span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${typeConfig.color}`}
                              >
                                {typeConfig.emoji} {typeConfig.name}
                              </Badge>
                            </h3>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {record.desc}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">
                            🕐 {formatTime(record.createdAt)}
                          </span>
                          {record.content && (
                            <button
                              onClick={() => toggleExpand(record.id)}
                              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full transition-colors duration-200 flex items-center space-x-0.5"
                            >
                              <span className="text-xs">{isExpanded ? "🔼" : "🔽"}</span>
                              <span>{isExpanded ? "收起" : "详情"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* 内容详情 */}
                      {record.content && isExpanded && (
                        <div className="mt-2 p-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border-l-4 border-blue-300 animate-in slide-in-from-top duration-300">
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              📄 内容详情
                            </span>
                            {record.contentType && (
                              <Badge variant="outline" className="text-xs">
                                {record.contentType === "json"
                                  ? "📊 JSON"
                                  : "📝 文本"}
                              </Badge>
                            )}
                          </div>
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-200 overflow-y-auto bg-white p-2 rounded border">
                            {formatContent(record.content, record.contentType)}
                          </pre>
                        </div>
                      )}
                      
                      {/* 进度指示器 */}
                      {isLatest && isPlanning && (
                        <div className="mt-2 flex items-center space-x-1 text-xs text-blue-600">
                          <div className="flex space-x-0.5">
                            <div
                              className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                          </div>
                          <span className="animate-pulse">正在处理...</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </div>
  );
}
