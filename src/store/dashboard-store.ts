import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DashboardWidget {
	id: string;
	title: string;
	visible: boolean;
}

export const defaultWidgets: DashboardWidget[] = [
	{ id: "kpi-contacts", title: "Total Contacts", visible: true },
	{ id: "kpi-pipeline", title: "Active Pipeline", visible: true },
	{ id: "kpi-invoices", title: "Unpaid Invoices", visible: true },
	{ id: "kpi-tasks", title: "Tasks Due", visible: true },
	{ id: "chart-pipeline", title: "Pipeline Overview", visible: true },
	{ id: "table-activity", title: "Recent Activity", visible: true },
];

interface DashboardState {
	widgets: DashboardWidget[];
	toggleWidget: (id: string) => void;
	reorderWidgets: (startIndex: number, endIndex: number) => void;
	resetLayout: () => void;
}

export const useDashboardStore = create<DashboardState>()(
	persist(
		(set) => ({
			widgets: defaultWidgets,
			toggleWidget: (id) =>
				set((state) => ({
					widgets: state.widgets.map((w) =>
						w.id === id ? { ...w, visible: !w.visible } : w,
					),
				})),
			reorderWidgets: (startIndex, endIndex) =>
				set((state) => {
					const result = Array.from(state.widgets);
					const [removed] = result.splice(startIndex, 1);
					if (removed) {
						result.splice(endIndex, 0, removed);
					}
					return { widgets: result };
				}),
			resetLayout: () => set({ widgets: defaultWidgets }),
		}),
		{
			name: "dashboard-layout", // unique name for localStorage key
		},
	),
);
