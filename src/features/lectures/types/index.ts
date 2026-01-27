/**
 * Types for Lectures Feature
 */

export interface Lecture {
  id: string;
  title: string;
  topic: string;
  content: string;
  scenariosContent?: string | null;
  exampleContent?: string | null;
  tasksContent?: string | null;
  questionsCount?: number;
  categories?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type LectureTab = 'lecture' | 'scenarios' | 'example' | 'tasks';

export interface TaskItem {
  id: string;
  title: string;
  summary: string;
  body: string;
  answer: string;
  explanation: string;
}

export interface ParsedTasks {
  intro: string;
  prep: string;
  items: TaskItem[];
}

export interface LectureContentProps {
  content: string;
}

export interface LectureTabsProps {
  activeTab: LectureTab;
  onTabChange: (tab: LectureTab) => void;
  hasScenarios: boolean;
  hasExample: boolean;
  hasTasks: boolean;
}

export interface LectureTasksProps {
  tasksContent: string;
  completedTasks: string[];
  onTaskDetailsClick: (task: TaskItem) => void;
  onTaskAnswerClick: (task: TaskItem) => void;
  onPrepClick: () => void;
}

export interface TaskModalsProps {
  selectedTask: TaskItem | null;
  showTaskWarning: boolean;
  showTaskDetails: boolean;
  showTaskAnswer: boolean;
  showTasksPrep: boolean;
  warningOptOut: boolean;
  skipTasksWarning: boolean;
  prepContent: string;
  onWarningOptOutChange: (value: boolean) => void;
  onConfirmWarning: () => void;
  onCloseTaskWarning: () => void;
  onCloseTaskDetails: () => void;
  onCloseTaskAnswer: () => void;
  onCloseTasksPrep: () => void;
  onTaskAnswerAction: (completed: boolean) => void;
  onSkipTasksWarningChange: (value: boolean) => void;
}
