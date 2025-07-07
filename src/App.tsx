import { useEffect, useState } from "react";
import { AgentResults } from "./types";
import { AgentCoordinator } from "./agents/coordinator";
import { SmartSupervisor } from "./agents/dynamic/SmartSupervisor";
import PlannerForm from "./components/PlannerForm";
import AgentStatus from "./components/AgentStatus";
import PlanResult from "./components/PlanResult";
import { Card } from "./components/ui/card";
import { useStore } from "./model";

function App() {
  const [isPlanning, setIsPlanning] = useState(false);
  const [travelPlan, setTravelPlan] = useState<AgentResults | null>(null);
  const [showReport, setShowReport] = useState(false);
  const addRecord = useStore((state: any) => state.addRecord);
  const clearRecord = useStore((state: any) => state.clearRecord);
  const records = useStore((state: any) => state.records);
  const [smartMode, setSmartMode] = useState(false);  

  const handlePlanningSubmit = async (input: string) => {
    setIsPlanning(true);
    setTravelPlan(null);
    setShowReport(false);
    clearRecord();

    let result: AgentResults | null = null;
    if (smartMode) {
      const smartSupervisor = new SmartSupervisor(addRecord);
      result = await smartSupervisor.execute(input);
    } else {
      const simpleSupervisor = new AgentCoordinator(addRecord);
      result = await simpleSupervisor.execute(input);
    }

    if (result) {
      setTravelPlan(result);
    }
    setIsPlanning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 绝对定位在右上角的Checkbox元素 */}
      <div className="absolute top-4 right-4">
        <input
          type="checkbox"
          checked={smartMode}
          onChange={(e) => setSmartMode(e.target.checked)}
        />
        <span className="text-sm text-gray-500 ml-2">智能编排</span>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 表单区域 - 上方 */}
        <div className="mb-8">
          <Card className="p-4 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <PlannerForm
              onSubmit={handlePlanningSubmit}
              isLoading={isPlanning}
              onShowReport={() => setShowReport(true)}
              hasReport={!!travelPlan}
            />
          </Card>
        </div>

        {/* AI状态区域 - 下方 */}
        <div>
          <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm min-h-[500px]">
            <AgentStatus isPlanning={isPlanning} records={records} />
          </Card>
        </div>

        {/* 报告Modal */}
        {showReport && travelPlan && (
          <PlanResult
            plan={travelPlan}
            open={showReport}
            onOpenChange={setShowReport}
          />
        )}
      </div>
    </div>
  );
}

export default App;
