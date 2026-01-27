/**
 * TypeScript типы для User Lists Feature
 */

export interface UserTestList {
  id: string;
  name: string;
  description?: string | null;
  icon?: string;
  color?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items?: UserTestListItem[];
  _count?: {
    items: number;
  };
}

export interface UserTestListItem {
  id: string;
  listId: string;
  testId: string;
  order: number;
  test?: {
    id: string;
    title: string;
    difficulty: string;
    questionsCount: number;
  };
}

export interface CreateListDto {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateListDto {
  name?: string;
  description?: string;
}

export interface AddTestToListDto {
  testId: string;
}
