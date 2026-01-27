/**
 * TypeScript типы для Categories Feature
 */

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description?: string;
  order?: number;
  parentId?: string | null;
  tests?: {
    id: string;
    title: string;
    difficulty: string;
    questionsCount: number;
  }[];
  children?: Category[];
  _count?: {
    tests: number;
  };
}
