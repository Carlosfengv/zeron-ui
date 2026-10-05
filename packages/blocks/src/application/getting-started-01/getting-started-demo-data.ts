import type { GettingStartedTask } from "./getting-started-types";

export const gettingStartedDemoTasks: readonly GettingStartedTask[] = [
  { id: "profile", title: "Create your profile", status: "completed" },
  { id: "campaign", title: "Add your first campaign", status: "completed" },
  { id: "budget", title: "Set budget & rules", status: "current" },
  { id: "creators", title: "Invite creators", status: "pending" },
  { id: "review", title: "Review submissions & approve", status: "pending" },
];
