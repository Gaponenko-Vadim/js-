// RTK Query API & Hooks
export {
  resultsApi,
  useGetResultsQuery,
  useGetResultByIdQuery,
  useGetCombinedResultsQuery,
  useGetResultsStatsQuery,
  useDeleteResultMutation,
} from './api/resultsApi';

// Types
export type {
  TestResult,
  CombinedTestResult,
  ResultsStats
} from './types';
