import type { Priority, Temperature } from '../types';
import type { BoardStatus } from './model';

export type BoardView = 'kanban' | 'table';

export interface BoardFilters {
  search: string;
  status: BoardStatus | 'all';
  owner: string;
  priority: Priority | 'all';
  temperature: Temperature | 'all';
  tag: string;
}

export const EMPTY_FILTERS: BoardFilters = { search: '', status: 'all', owner: 'all', priority: 'all', temperature: 'all', tag: 'all' };
