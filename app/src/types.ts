export type PlanDayStep = {
  title: string;
  minutes: number;
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
