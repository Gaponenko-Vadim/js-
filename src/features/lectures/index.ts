// Components
export { LectureContent } from './components/LectureContent';
export { LectureTabs } from './components/LectureTabs';
export { LectureTasks } from './components/LectureTasks';
export { TaskModals } from './components/TaskModals';

// RTK Query API & Hooks
export {
  lecturesApi,
  useGetLecturesQuery,
  useGetLectureByIdQuery,
  useGetLectureByQuestionIdQuery,
  useUpdateTaskProgressMutation,
  useGetTaskProgressQuery,
} from './api/lecturesApi';

// Utils
export { parseTasksContent } from './utils/parseTasksContent';

// Types
export type {
  Lecture,
  LectureTab,
  TaskItem,
  ParsedTasks
} from './types';
