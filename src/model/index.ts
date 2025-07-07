import { create } from "zustand";

export interface RecordItem {
  id: string;
  name: string;
  type: "supervisor" | "agent" | "tool";
  desc: string;
  content: string;
  contentType: "json" | "text" | "";
  createdAt: number;
}

export const useStore = create<{
  records: RecordItem[];
  addRecord: (record: RecordItem) => void;
  clearRecord: () => void;
}>((set, get) => ({
  records: [] as RecordItem[],
  addRecord: (record: RecordItem) => {
    const records = get().records;
    set(() => ({ records: [...records, record] }));
  },
  clearRecord: () => set({ records: [] }),
}));
