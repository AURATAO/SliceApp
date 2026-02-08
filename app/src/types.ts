export type PlanDayStep = {
  title: string;
  minutes: number;
  deliverable?: string;
  done_definition: string;
};

export type PlanDay = {
  day_number: number;
  focus: string;
  steps: PlanDayStep[];
  is_done: boolean;
};

export type PlanListItem = {
  id: string;
  title: string;
  days: number;
  daily_minutes: number;
  created_at: string;
};

export type PlanDetail = {
  id: string;
  title: string;
  days: number;
  daily_minutes: number;
  created_at: string;
  items: PlanDay[];
};

export type SplitterMeta = {
  splitter_quote: string;
  mode: "normal" | "de_scope";
  goal_type: "Learn" | "Build" | "Create" | "Improve" | "Organize" | "Social";
  original_goal: string;
  final_goal: string;
  changed: boolean;
  why_this_adjustment: string;
  success_rule: string;
  assumptions: string[];
  risk_notes: string[];
};

export type CreatePlanResponse = {
  meta: SplitterMeta;
  plan: PlanDetail;
};


